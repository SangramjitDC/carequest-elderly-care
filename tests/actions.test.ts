import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ authenticated: vi.fn(), getCareState: vi.fn() }));
vi.mock("@/lib/care", () => ({ ...mocks, CareError: class extends Error { constructor(message: string, public status = 503) { super(message); } } }));
import { markDoseTaken, requestCareAccess, saveMedication, setCareConsent } from "../app/actions/care";
import { GET } from "../app/api/care/route";
import { CareError } from "../lib/care";

const patient = "11111111-1111-4111-8111-111111111111";
const medId = "55555555-5555-4555-8555-555555555555";
const med = { patient_id: patient, name: "Test", dosage: "1 tablet", instructions: "", scheduled_time: "08:00", starts_on: "2026-11-15", ends_on: null, active: true };
function database(results: unknown[]) {
  const queries: { table: string; eq: ReturnType<typeof vi.fn>; insert: ReturnType<typeof vi.fn> }[] = [];
  const from = vi.fn((table: string) => {
    const result = results.shift();
    const q = { table, select: vi.fn(() => q), eq: vi.fn(() => q), insert: vi.fn(() => q), update: vi.fn(() => q), single: vi.fn(async () => result), maybeSingle: vi.fn(async () => result), then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(result)) };
    queries.push(q); return q;
  });
  return { from, queries };
}
beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-15T12:00:00Z")); });
describe("Server action authorization and failures", () => {
  it("fails closed when unauthenticated", async () => {
    mocks.authenticated.mockRejectedValue(new CareError("Please sign in again.", 401));
    expect(await markDoseTaken({ medication_id: medId, scheduled_date: "2026-11-15" })).toMatchObject({ ok: false, message: "Please sign in again." });
  });
  it("rejects elderly medication changes and caregiver dose confirmations", async () => {
    const db = database([]);
    mocks.authenticated.mockResolvedValue({ db, profile: { id: patient, role: "elderly" } });
    expect((await saveMedication(med)).ok).toBe(false);
    expect(db.from).not.toHaveBeenCalled();
    mocks.authenticated.mockResolvedValue({ db, profile: { id: patient, role: "caregiver" } });
    expect((await markDoseTaken({ medication_id: medId, scheduled_date: "2026-11-15" })).ok).toBe(false);
    expect((await setCareConsent({ id: medId, status: "active", can_manage_medications: true })).ok).toBe(false);
  });
  it("checks current relationship approval before writing", async () => {
    const db = database([{ data: null, error: null }]);
    mocks.authenticated.mockResolvedValue({ db, profile: { id: medId, role: "caregiver" } });
    expect((await saveMedication(med)).ok).toBe(false);
    expect(db.from).toHaveBeenCalledTimes(1);
    expect(db.queries[0].eq).toHaveBeenCalledWith("status", "active");
  });
  it("scopes edits to patient and version and reports conflicts", async () => {
    const db = database([{ data: { id: medId }, error: null }, { data: null, error: null }]);
    mocks.authenticated.mockResolvedValue({ db, profile: { id: medId, role: "caregiver" } });
    const result = await saveMedication({ ...med, id: medId, version: 1 });
    expect(result).toMatchObject({ ok: false });
    expect(result.message).toContain("changed");
    expect(db.queries[1].eq).toHaveBeenCalledWith("patient_id", patient);
    expect(db.queries[1].eq).toHaveBeenCalledWith("version", 1);
  });
  it("binds logs to the authenticated patient and treats duplicate requests as success", async () => {
    const db = database([{ data: { ...med, id: medId }, error: null }, { error: { code: "23505" } }]);
    mocks.authenticated.mockResolvedValue({ db, profile: { id: patient, role: "elderly", timezone: "UTC" } });
    expect((await markDoseTaken({ medication_id: medId, scheduled_date: "2026-11-15" })).ok).toBe(true);
    expect(db.queries[1].insert).toHaveBeenCalledWith({ medication_id: medId, patient_id: patient, scheduled_date: "2026-11-15" });
  });
  it("rejects stale-day confirmations before touching the database", async () => {
    const db = database([]);
    mocks.authenticated.mockResolvedValue({ db, profile: { id: patient, role: "elderly", timezone: "UTC" } });
    expect((await markDoseTaken({ medication_id: medId, scheduled_date: "2026-11-14" })).ok).toBe(false);
    expect(db.from).not.toHaveBeenCalled();
  });
  it("does not serialize provider errors or credentials", async () => {
    mocks.authenticated.mockRejectedValue(new Error("PRIVATE_PROVIDER_DETAIL"));
    const result = await requestCareAccess(patient);
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain("PRIVATE_PROVIDER_DETAIL");
  });
});
describe("Private care API", () => {
  it("rejects malformed IDs and sends no-store on errors", async () => {
    const response = await GET(new Request("http://localhost/api/care?patient=invalid"));
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(mocks.getCareState).not.toHaveBeenCalled();
  });
  it("returns 401 for expired sessions and 403 for revoked access", async () => {
    for (const status of [401, 403]) {
      mocks.getCareState.mockRejectedValueOnce(new CareError("Access unavailable", status));
      const response = await GET(new Request("http://localhost/api/care?patient=" + patient));
      expect(response.status).toBe(status);
      expect(response.headers.get("vary")).toBe("Cookie");
    }
  });
});
