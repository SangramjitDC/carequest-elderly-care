import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ authenticated: vi.fn(), modelResponse: vi.fn() }));
vi.mock("@/lib/care", () => ({ authenticated: mocks.authenticated, CareError: class extends Error { constructor(message: string, public status = 503) { super(message); } } }));
vi.mock("@/lib/ai/adaption", () => ({ modelResponse: mocks.modelResponse, parseModelJSON: JSON.parse }));
import { companionFacts, patientContext } from "../lib/ai/context";
import { POST as companion } from "../app/api/companion/route";
import { POST as scanner } from "../app/api/prescription/route";
import { POST as reminders } from "../app/api/reminders/route";
import { saveReviewedPrescription } from "../app/actions/prescription";
const patient = "11111111-1111-4111-8111-111111111111"; const caregiver = "22222222-2222-4222-8222-222222222222";
const profile = { id: patient, role: "elderly", display_name: "Patient", timezone: "UTC" };
function database(results: unknown[]) {
  const queries: { table: string; eq: ReturnType<typeof vi.fn> }[] = [];
  const from = vi.fn((table: string) => {
    const result = results.shift();
    const q = { table, select: vi.fn(() => q), eq: vi.fn(() => q), in: vi.fn(() => q), gte: vi.fn(() => q), order: vi.fn(() => q), limit: vi.fn(() => q), single: vi.fn(async () => result), then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(result)) }; queries.push(q); return q;
  }); return { from, queries };
}
const ok = (data: unknown) => ({ data, error: null });
function request(path: string, body: unknown) { return new Request(`https://care.test/api/${path}`, { method: "POST", headers: { origin: "https://care.test", "Content-Type": "application/json" }, body: JSON.stringify(body) }); }
beforeEach(() => { vi.clearAllMocks(); }); afterEach(() => vi.unstubAllEnvs());
describe("AI server authorization and safe fallback", () => {
  it("rejects unauthorized or revoked caregiver access before reading health records", async () => {
    const db = database([ok([])]); mocks.authenticated.mockResolvedValue({ db, profile: { id: caregiver, role: "caregiver" } });
    await expect(patientContext(patient)).rejects.toMatchObject({ status: 403 }); expect(db.from).toHaveBeenCalledTimes(1);
  });
  it("rejects another patient's ID for an elderly user", async () => {
    const db = database([ok([])]); mocks.authenticated.mockResolvedValue({ db, profile });
    await expect(patientContext(caregiver)).rejects.toMatchObject({ status: 403 });
  });
  it("retrieves selected patient context with explicit patient filters", async () => {
    const db = database([ok([]), ok(profile), ok([]), ok([]), ok([]), ok([])]); mocks.authenticated.mockResolvedValue({ db, profile });
    const result = await companionFacts(patient); expect(result.facts.total).toBe(0);
    for (const query of db.queries.filter(q => ["medications", "dose_logs", "garden_eligible_dose_logs", "appointments"].includes(q.table))) expect(query.eq).toHaveBeenCalledWith("patient_id", patient);
  });
  it("returns a truthful fallback without leaking provider errors", async () => {
    const db = database([ok([]), ok(profile), ok([]), ok([]), ok([]), ok([])]); mocks.authenticated.mockResolvedValue({ db, profile }); mocks.modelResponse.mockRejectedValue(new Error("SECRET_PROVIDER_ERROR"));
    const response = await companion(request("companion", { patient_id: patient, message: "Have I taken all my medicines?" }));
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toContain("no-store");
    const body = await response.json(); expect(body.text).toContain("No medication is scheduled"); expect(body.source).toContain("fallback"); expect(JSON.stringify(body)).not.toContain("SECRET_PROVIDER_ERROR");
  });
  it("sends only the user's question to the AI intent classifier", async () => {
    const privateProfile = { ...profile, display_name: "PRIVATE_PATIENT_NAME" };
    const db = database([ok([]), ok(privateProfile), ok([]), ok([]), ok([]), ok([])]);
    mocks.authenticated.mockResolvedValue({ db, profile: privateProfile });
    mocks.modelResponse.mockResolvedValue('{"intent":"next_medication"}');
    const message = "What medication is scheduled next?";
    const response = await companion(request("companion", { patient_id: patient, message }));
    expect(response.status).toBe(200);
    expect(mocks.modelResponse).toHaveBeenCalledTimes(1);
    const [, input] = mocks.modelResponse.mock.calls[0];
    expect(JSON.parse(input)).toEqual({ question: message });
    expect(input).not.toContain("PRIVATE_PATIENT_NAME");
  });
  it("does not forward emergency questions to the model or query medical records", async () => {
    const db = database([]); mocks.authenticated.mockResolvedValue({ db, profile });
    const response = await companion(request("companion", { patient_id: null, message: "I feel unwell" }));
    expect((await response.json()).emergency).toBe(true); expect(mocks.modelResponse).not.toHaveBeenCalled(); expect(db.from).not.toHaveBeenCalled();
  });
  it("rejects unreviewed prescriptions before authentication or save", async () => {
    expect((await saveReviewedPrescription({ reviewed: false, medication: {} })).ok).toBe(false); expect(mocks.authenticated).not.toHaveBeenCalled();
  });
  it("rejects viewer scanning even if health viewing is allowed", async () => {
    const db = database([ok([{ elderly_id: patient, caregiver_id: caregiver, status: "active", can_view_health: true, caregiver_role: "viewer", can_manage_medications: false }]), ok(profile)]);
    mocks.authenticated.mockResolvedValue({ db, profile: { id: caregiver, role: "caregiver" } });
    const response = await scanner(request("prescription", { patient_id: patient, mime: "image/png", image: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB" }));
    expect(response.status).toBe(403); expect(mocks.modelResponse).not.toHaveBeenCalled();
  });
  it("fails closed for unconfigured or unauthorized scheduled runs", async () => {
    vi.stubEnv("CRON_SECRET", ""); expect((await reminders(request("reminders", {}))).status).toBe(503);
    vi.stubEnv("CRON_SECRET", "x".repeat(32)); expect((await reminders(request("reminders", {}))).status).toBe(401);
  });
});
