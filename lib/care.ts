import "server-only";
import { createClient } from "./supabase/server";
import { localDate } from "./validation";
import type { CareState } from "./types";

export class CareError extends Error {
  constructor(message: string, public status = 503) { super(message); }
}
export async function authenticated() {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) throw new CareError("Please sign in again.", 401);
  const { data: profile, error: profileError } = await db.from("profiles").select("*").eq("id", user.id).single();
  if (profileError || !profile) throw new CareError("Your care profile is unavailable. Check the database setup or contact support.");
  return { db, user, profile };
}
export async function getCareState(patientId?: string): Promise<CareState> {
  const { db, profile } = await authenticated();
  const [peopleResult, relationshipsResult] = await Promise.all([
    db.from("profiles").select("*").order("display_name"),
    db.from("caregiver_relationships").select("*").order("created_at", { ascending: false }),
  ]);
  if (peopleResult.error || relationshipsResult.error) throw new CareError("Your care circle could not be loaded. Please try again.");
  const people = peopleResult.data;
  const relationships = relationshipsResult.data;
  const patients = profile.role === "elderly" ? [profile] : people.filter((p) => p.role === "elderly" && relationships.some((r) => r.elderly_id === p.id && r.status === "active"));
  const patient = patientId ? patients.find((p) => p.id === patientId) : patients[0];
  if (patientId && !patient) throw new CareError("You no longer have access to this care space.", 403);
  const today = localDate(patient?.timezone ?? profile.timezone);
  let medications: CareState["medications"] = [];
  let doses: CareState["doses"] = [];
  if (patient) {
    const [medResult, doseResult] = await Promise.all([
      db.from("medications").select("*").eq("patient_id", patient.id).order("scheduled_time").order("name"),
      db.from("dose_logs").select("*").eq("patient_id", patient.id).eq("scheduled_date", today),
    ]);
    if (medResult.error || doseResult.error) throw new CareError("Medication records could not be loaded. Please try again.");
    medications = medResult.data;
    doses = doseResult.data;
  }
  return { profile, people, relationships, patient: patient ?? null, medications, doses, today, fetchedAt: new Date().toISOString() };
}
