import { z } from "zod";

export const idSchema = z.string().uuid("Enter a valid care ID.");
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.").refine((v) => {
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
}, "Enter a valid date.");
export const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Enter a time between 00:00 and 23:59.");
export const timezoneSchema = z.string().min(1).max(100).refine((v) => {
  try { new Intl.DateTimeFormat("en", { timeZone: v }).format(); return true; } catch { return false; }
}, "Enter a valid timezone, such as Asia/Kolkata.");
export const loginSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128) });
export const signupSchema = loginSchema.extend({
  password: z.string().min(12, "Use at least 12 characters.").max(128),
  display_name: z.string().trim().min(1, "Enter your name.").max(100),
  role: z.enum(["elderly", "caregiver"]), timezone: timezoneSchema,
});
export const medicationSchema = z.object({
  id: idSchema.optional(), version: z.number().int().positive().optional(), patient_id: idSchema,
  name: z.string().trim().min(1, "Enter a medication name.").max(120),
  dosage: z.string().trim().min(1, "Enter the prescribed dosage.").max(120),
  instructions: z.string().trim().max(500), scheduled_time: timeSchema,
  starts_on: dateSchema, ends_on: dateSchema.nullable(), active: z.boolean(),
}).strict().refine((v) => !v.ends_on || v.ends_on >= v.starts_on, { path: ["ends_on"], message: "End date must be on or after the start date." })
  .refine((v) => !v.id || !!v.version, { path: ["version"], message: "Reload this medication before editing." });
export const doseSchema = z.object({ medication_id: idSchema, scheduled_date: dateSchema }).strict();
export const consentSchema = z.object({ id: idSchema, status: z.enum(["active", "revoked"]), can_manage_medications: z.boolean(), caregiver_role: z.enum(["primary", "supporting", "viewer"]).default("supporting"), can_view_health: z.boolean().default(true), can_manage_appointments: z.boolean().default(false), can_manage_contacts: z.boolean().default(false) }).strict().refine(v => (v.caregiver_role !== "viewer" && v.can_view_health) || !(v.can_manage_medications || v.can_manage_appointments || v.can_manage_contacts), "Viewers cannot manage care records.");

export function localDate(timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function isScheduled(med: { active: boolean; starts_on: string; ends_on: string | null }, date: string) {
  return med.active && med.starts_on <= date && (!med.ends_on || med.ends_on >= date);
}
