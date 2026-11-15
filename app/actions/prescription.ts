"use server";
import { z } from "zod";
import { saveMedication } from "./care";
import { medicationSchema } from "@/lib/validation";
export async function saveReviewedPrescription(input: unknown) {
  const parsed = z.object({ reviewed: z.literal(true), medication: medicationSchema }).strict().safeParse(input);
  if (!parsed.success || parsed.data.medication.id) return { ok: false, message: "Review the original prescription and confirm every field before saving a new schedule." };
  // Existing action rechecks the authenticated caregiver and current patient-specific permission.
  return saveMedication(parsed.data.medication);
}
