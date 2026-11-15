"use server";
import { z } from "zod";
import { authenticated, CareError } from "@/lib/care";
import { canManageResource } from "@/lib/permissions";
import { idSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

const resourceSchema = z.discriminatedUnion("resource", [
  z.object({ resource: z.literal("appointments"), id: idSchema.optional(), patient_id: idSchema, title: z.string().trim().min(1).max(160), starts_at: z.string().datetime({ offset: true }) }).strict(),
  z.object({ resource: z.literal("contacts"), id: idSchema.optional(), patient_id: idSchema, name: z.string().trim().min(1).max(120), phone: z.string().regex(/^\+?[0-9 ()-]{7,25}$/), is_primary: z.boolean().default(false) }).strict(),
]);
async function resourceAccess(patient_id: string, resource: "appointments" | "contacts") {
  const { db, profile } = await authenticated();
  if (profile.id !== patient_id || profile.role !== "elderly") {
    const { data, error } = await db.from("caregiver_relationships").select("*").eq("caregiver_id", profile.id).eq("elderly_id", patient_id);
    if (error || !canManageResource(profile, patient_id, data ?? [], resource)) throw new CareError("You do not have permission to manage this information.", 403);
  }
  return db;
}
export async function addCareResource(input: unknown): Promise<ActionResult> {
  const parsed = resourceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Check all fields, including the date or phone number." };
  try {
    const { resource, patient_id, id, ...values } = parsed.data;
    const db = await resourceAccess(patient_id, resource);
    const table = resource === "appointments" ? "appointments" : "emergency_contacts";
    const result = id ? await db.from(table).update(values).eq("id", id).eq("patient_id", patient_id).select("id").maybeSingle() : await db.from(table).insert({ patient_id, ...values });
    if (result.error?.code === "23505") return { ok: false, message: "A primary contact already exists. Uncheck the current primary contact before choosing another." };
    if (id && !result.data) return { ok: false, message: "The record changed or your access expired. Refresh and try again." };
    if (result.error) return { ok: false, message: "The record could not be saved. Refresh and check your access." };
    return { ok: true, message: "Saved to this care space." };
  } catch (error) { return { ok: false, message: error instanceof CareError ? error.message : "The record could not be saved. Please try again." }; }
}
export async function deleteCareResource(input: unknown): Promise<ActionResult> {
  const parsed = z.object({ id: idSchema, patient_id: idSchema, resource: z.enum(["appointments", "contacts"]) }).strict().safeParse(input);
  if (!parsed.success) return { ok: false, message: "Choose a valid record." };
  try {
    const { id, patient_id, resource } = parsed.data;
    const db = await resourceAccess(patient_id, resource);
    const result = await db.from(resource === "appointments" ? "appointments" : "emergency_contacts").delete().eq("id", id).eq("patient_id", patient_id).select("id").maybeSingle();
    return result.error || !result.data ? { ok: false, message: "Could not delete the record. Refresh and check your permission." } : { ok: true, message: "Record deleted." };
  } catch (error) { return { ok: false, message: error instanceof CareError ? error.message : "Could not delete the record. Please try again." }; }
}
