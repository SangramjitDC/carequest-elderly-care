import { describe, expect, it } from "vitest";
import { dateSchema, doseSchema, isScheduled, localDate, medicationSchema, signupSchema, timeSchema } from "../lib/validation";

const med = { patient_id: "11111111-1111-4111-8111-111111111111", name: "Vitamin D", dosage: "1 tablet", instructions: "With food", scheduled_time: "08:00", starts_on: "2026-11-15", ends_on: null, active: true };
describe("Care input validation", () => {
  it("validates dates and times including leap years", () => {
    expect(dateSchema.safeParse("2028-02-29").success).toBe(true);
    for (const value of ["2026-02-29", "2026-13-01", "15-11-2026"]) expect(dateSchema.safeParse(value).success).toBe(false);
    for (const value of ["24:00", "12:60", "8:00"]) expect(timeSchema.safeParse(value).success).toBe(false);
  });
  it("rejects empty medication details, invalid ranges, extra fields and stale edit payloads", () => {
    expect(medicationSchema.safeParse(med).success).toBe(true);
    for (const changes of [{ name: " " }, { dosage: "" }, { ends_on: "2026-11-14" }, { created_by: med.patient_id }, { id: med.patient_id }, { instructions: "x".repeat(501) }]) expect(medicationSchema.safeParse({ ...med, ...changes }).success).toBe(false);
  });
  it("validates authentication roles, timezone and password length", () => {
    const signup = { email: "test@example.com", password: "a-long-test-password", display_name: "Test", role: "elderly", timezone: "Asia/Kolkata" };
    expect(signupSchema.safeParse(signup).success).toBe(true);
    for (const changes of [{ role: "admin" }, { timezone: "Not/AZone" }, { password: "short" }, { display_name: "" }]) expect(signupSchema.safeParse({ ...signup, ...changes }).success).toBe(false);
  });
  it("uses the patient timezone at UTC midnight and across DST boundaries", () => {
    expect(localDate("Asia/Kolkata", new Date("2026-11-14T20:00:00Z"))).toBe("2026-11-15");
    expect(localDate("America/Los_Angeles", new Date("2026-11-15T02:00:00Z"))).toBe("2026-11-14");
    expect(localDate("America/New_York", new Date("2026-11-01T06:30:00Z"))).toBe("2026-11-01");
  });
  it("includes end dates and excludes archived or future schedules", () => {
    expect(isScheduled({ ...med, ends_on: "2026-11-15" }, "2026-11-15")).toBe(true);
    expect(isScheduled(med, "2026-11-14")).toBe(false);
    expect(isScheduled({ ...med, active: false }, "2026-11-15")).toBe(false);
    expect(doseSchema.safeParse({ medication_id: med.patient_id, scheduled_date: "2026-11-15", patient_id: med.patient_id }).success).toBe(false);
  });
});
