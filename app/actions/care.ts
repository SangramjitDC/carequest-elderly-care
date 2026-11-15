"use server";

import { authenticated, CareError } from "@/lib/care";
import { consentSchema, doseSchema, idSchema, isScheduled, localDate, medicationSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";
import { z } from "zod";

function failure(error: unknown): ActionResult {
  return { ok: false, message: error instanceof CareError ? error.message : "The change could not be saved. Please try again." };
}
export async function saveMedication(input: unknown): Promise<ActionResult> {
  const parsed = medicationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Check the medication details.", fields: z.flattenError(parsed.error).fieldErrors };
  try {
    const { db, profile } = await authenticated();
    if (profile.role !== "caregiver") throw new CareError("Only an authorized caregiver can change medications.", 403);
    const { id, version, ...medication } = parsed.data;
    const { data: relationship, error: relationError } = await db.from("caregiver_relationships").select("id")
      .eq("caregiver_id", profile.id).eq("elderly_id", medication.patient_id).eq("status", "active").eq("can_view_health", true).neq("caregiver_role", "viewer").eq("can_manage_medications", true).maybeSingle();
    if (relationError || !relationship) throw new CareError("Medication access has not been approved or was revoked.", 403);
    if (id) {
      const { patient_id, ...changes } = medication;
      const { data, error } = await db.from("medications").update(changes).eq("id", id).eq("patient_id", patient_id).eq("version", version!).select("id").maybeSingle();
      if (error) return { ok: false, message: "Medication could not be saved. Refresh and try again." };
      if (!data) return { ok: false, message: "This medication changed or access was revoked. Refresh before editing again." };
    } else {
      const { error } = await db.from("medications").insert(medication);
      if (error) return { ok: false, message: "Medication could not be added. Refresh and check your access." };
    }
    return { ok: true, message: "Medication saved." };
  } catch (error) { return failure(error); }
}
export async function markDoseTaken(input: unknown): Promise<ActionResult> {
  const parsed = doseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "This dose is invalid. Refresh your schedule." };
  try {
    const { db, profile } = await authenticated();
    if (profile.role !== "elderly") throw new CareError("Only the person taking this medication can confirm a dose.", 403);
    const today = localDate(profile.timezone);
    if (parsed.data.scheduled_date !== today) throw new CareError("The day changed. Refresh your schedule before confirming.", 400);
    const { data: med, error: readError } = await db.from("medications").select("*").eq("id", parsed.data.medication_id).eq("patient_id", profile.id).maybeSingle();
    if (readError || !med || !isScheduled(med, today)) throw new CareError("This medication is no longer scheduled today. Refresh your schedule.", 400);
    const { error } = await db.from("dose_logs").insert({ medication_id: med.id, patient_id: profile.id, scheduled_date: today });
    if (error && error.code !== "23505") return { ok: false, message: "The dose was not confirmed. Refresh your schedule and try again." };
    return { ok: true, message: "Dose recorded as taken." };
  } catch (error) { return failure(error); }
}
export async function requestCareAccess(input: unknown): Promise<ActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Enter the care ID shared by the older adult." };
  try {
    const { db, profile } = await authenticated();
    if (profile.role !== "caregiver") throw new CareError("Only caregivers can request access.", 403);
    const { error } = await db.from("caregiver_relationships").insert({ elderly_id: parsed.data, caregiver_id: profile.id });
    if (error) return { ok: false, message: "Request could not be created. Check the care ID and whether a request already exists." };
    return { ok: true, message: "Request sent. The older adult must approve it in their care circle." };
  } catch (error) { return failure(error); }
}
export async function setCareConsent(input: unknown): Promise<ActionResult> {
  const parsed = consentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid care circle update." };
  try {
    const { db, profile } = await authenticated();
    if (profile.role !== "elderly") throw new CareError("Only the older adult can approve or revoke access.", 403);
    const { id, ...changes } = parsed.data;
    const { data, error } = await db.from("caregiver_relationships").update(changes).eq("id", id).eq("elderly_id", profile.id).select("id").maybeSingle();
    if (error || !data) return { ok: false, message: error?.code === "23505" ? "A primary caregiver already exists. Change their role before assigning another." : "Access could not be updated. Refresh and try again." };
    return { ok: true, message: changes.status === "active" ? "Caregiver access approved." : "Caregiver access revoked." };
  } catch (error) { return failure(error); }
}
