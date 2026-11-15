import { afterEach, describe, expect, it, vi } from "vitest";
import { answerFromFacts, evaluateCare, gardenPoints, urgentQuestion } from "../lib/ai/decisions";
import { prescriptionSchema, verifiedImage } from "../lib/ai/prescription";
import { planReminders } from "../lib/reminders";
import { boundedJSON, sameOrigin } from "../lib/ai/http";
import type { CareState, Medication, DoseLog } from "../lib/types";

const patient = { id: "11111111-1111-4111-8111-111111111111", display_name: "Patient", role: "elderly" as const, timezone: "Asia/Kolkata", created_at: "" };
const now = new Date("2026-11-15T04:30:00Z"); // 10:00 local
const med = (id: string, time: string): Medication => ({ id, patient_id: patient.id, name: id, dosage: "Prescribed dose", instructions: "", scheduled_time: time, starts_on: "2026-11-15", ends_on: null, active: true, created_by: "", version: 1, created_at: "", updated_at: "" });
const dose = (id: string, scheduled_at: string): DoseLog => ({ id, patient_id: patient.id, medication_id: id, scheduled_date: "2026-11-15", scheduled_time: "", scheduled_at, medication_name: id, dosage: "", taken_at: now.toISOString(), recorded_by: patient.id });
const state = (): CareState => ({ profile: patient, patient, people: [], relationships: [], medications: [med("morning", "08:00"), med("now", "10:00"), med("later", "12:00")], doses: [], gardenDoses: [], today: "2026-11-15", fetchedAt: now.toISOString(), summaries: [], appointments: [], contacts: [] });
afterEach(() => vi.unstubAllEnvs());
describe("Verified care decision engine", () => {
  it("distinguishes unconfirmed past, due-now, and future using the patient's timezone", () => {
    const facts = evaluateCare(state(), [], now);
    expect(facts.medications.map(m => m.status)).toEqual(["overdue_unconfirmed", "pending", "upcoming"]);
    expect(answerFromFacts(facts, "overdue")).toContain("does not mean you skipped");
    expect(answerFromFacts(facts, "next_medication")).toContain("now, Prescribed dose, at 10:00");
  });
  it("does not count another patient's confirmations and ignores out-of-date records", () => {
    const s = state(); s.doses = [{ ...dose("morning", now.toISOString()), patient_id: "other" }, { ...dose("now", now.toISOString()), scheduled_date: "2026-11-14" }];
    expect(evaluateCare(s, [], now).completed).toBe(0);
    s.doses.push(dose("morning", now.toISOString()));
    expect(evaluateCare(s, [], now).medications[0].status).toBe("completed");
  });
  it("distinguishes today's and upcoming appointments and excludes past/foreign records", () => {
    const visits = [{ id: "1", patient_id: patient.id, title: "Today", starts_at: "2026-11-15T05:00:00Z" }, { id: "2", patient_id: patient.id, title: "Tomorrow", starts_at: "2026-11-16T05:00:00Z" }, { id: "3", patient_id: "other", title: "Private", starts_at: "2026-11-15T05:00:00Z" }];
    const facts = evaluateCare(state(), visits, now);
    expect(facts.appointments.map(a => a.status)).toEqual(["today", "upcoming"]);
    expect(answerFromFacts(facts, "appointments")).toContain("Today");
    expect(JSON.stringify(facts)).not.toContain("Private");
  });
  it("states missing records without inventing adherence, appointments, or caregivers", () => {
    const s = state(); s.medications = []; const facts = evaluateCare(s, [], now);
    expect(answerFromFacts(facts, "progress")).toContain("No medication is scheduled");
    expect(answerFromFacts(facts, "appointments")).toContain("No upcoming appointment");
    expect(answerFromFacts(facts, "caregivers")).toContain("No approved caregiver");
  });
  it("uses local calendar day across UTC midnight", () => {
    const facts = evaluateCare(state(), [], new Date("2026-11-14T20:00:00Z"));
    expect(facts.day).toBe("2026-11-15"); expect(facts.medications.every(m => m.status === "upcoming")).toBe(true);
  });
  it("keeps garden points patient-specific, deduplicated and unavailable before the due time", () => {
    const d = dose("morning", "2026-11-15T02:30:00Z");
    expect(gardenPoints([d, d, { ...d, patient_id: "other" }, dose("later", "2026-11-15T06:30:00Z")], patient.id, "2026-11-15", now)).toBe(1);
  });
  it("routes urgent and unwell messages without relying on AI", () => {
    expect(urgentQuestion("I feel unwell")).toBe(true); expect(urgentQuestion("I cannot breathe")).toBe(true); expect(urgentQuestion("Have I taken my medicine?")).toBe(false);
  });
});
describe("Prescription and request validation", () => {
  it("preserves unknown fields as null and rejects invented schema fields or excessive output", () => {
    expect(prescriptionSchema.safeParse({ medications: [{ name: null, dosage: null, frequency: null, timing: null, instructions: null, duration: null, confidence: "low", warnings: ["Unreadable"] }], warnings: [] }).success).toBe(true);
    expect(prescriptionSchema.safeParse({ medications: [], warnings: [], autoSave: true }).success).toBe(false);
    expect(prescriptionSchema.safeParse({ medications: [], warnings: ["x".repeat(301)] }).success).toBe(false);
  });
  it("rejects mismatched MIME signatures, invalid base64, and oversized images", () => {
    expect(verifiedImage(Buffer.from("not an image at all").toString("base64"), "image/png")).toBe(false);
    expect(verifiedImage("!!!", "image/jpeg")).toBe(false);
    expect(verifiedImage(Buffer.alloc(2097153).toString("base64"), "image/png")).toBe(false);
    expect(verifiedImage("iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB", "image/png")).toBe(true);
  });
  it("rejects cross-origin requests and oversized streamed JSON", async () => {
    expect(() => sameOrigin(new Request("https://care.test/api/companion", { headers: { origin: "https://evil.test" } }))).toThrow();
    await expect(boundedJSON(new Request("https://care.test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "x".repeat(30) }) }), 20)).rejects.toThrow("too large");
  });
});
describe("Reminder scheduling", () => {
  it("produces stable unique event keys for retries and excludes confirmed and unrelated doses", () => {
    const s = state(); const visit = { id: "visit", patient_id: patient.id, title: "Review", starts_at: "2026-11-15T06:00:00Z" };
    const events = planReminders(patient, [...s.medications, s.medications[0]], [dose("now", now.toISOString())], [visit, visit], now);
    expect(events).toHaveLength(2); expect(events[0].label).toContain("confirmation is not recorded");
    expect(planReminders(patient, s.medications, [dose("now", now.toISOString())], [visit], now)).toEqual(events);
    expect(events.every(e => e.recipient_id === patient.id)).toBe(true);
  });
});
