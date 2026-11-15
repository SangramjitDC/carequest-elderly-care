import "server-only";
import { accessiblePatients } from "./permissions";
import { createClient } from "./supabase/server";
import { isScheduled, localDate } from "./validation";
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
  const patients = accessiblePatients(profile, people, relationships);
  const ids = patients.map(p => p.id);
  const dates = patients.map(p => localDate(p.timezone)).sort();
  const [allMeds, allDoses, allAppointments] = ids.length ? await Promise.all([
    db.from("medications").select("*").in("patient_id", ids).order("scheduled_time"),
    db.from("dose_logs").select("*").in("patient_id", ids).gte("scheduled_date", dates[0]).lte("scheduled_date", dates[dates.length-1]),
    db.from("appointments").select("*").in("patient_id", ids).gte("starts_at", new Date().toISOString()).order("starts_at"),
  ]) : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }];
  if (allMeds.error || allDoses.error || allAppointments.error) throw new CareError("Care summaries could not be loaded.");
  const summaries = patients.map(person => {
    const date = localDate(person.timezone);
    const scheduled = allMeds.data!.filter(med => med.patient_id === person.id && isScheduled(med,date));
    const done = new Set(allDoses.data!.filter(d => d.patient_id === person.id && d.scheduled_date === date).map(d => d.medication_id));
    const next = scheduled.find(med => !done.has(med.id));
    const appointment = allAppointments.data!.find(a => a.patient_id === person.id);
    return { patient: person, completed: scheduled.filter(m => done.has(m.id)).length, total: scheduled.length,
      nextMedication: next ? next.name + " · " + next.scheduled_time.slice(0,5) : null,
      nextAppointment: appointment ? appointment.title + " · " + new Intl.DateTimeFormat("en", { timeZone: person.timezone, dateStyle: "medium", timeStyle: "short" }).format(new Date(appointment.starts_at)) : null };
  });
  const patient = patientId ? patients.find((p) => p.id === patientId) : patients[0];
  if (patientId && !patient) throw new CareError("You no longer have access to this care space.", 403);
  const today = localDate(patient?.timezone ?? profile.timezone);
  let medications: CareState["medications"] = [];
  let doses: CareState["doses"] = [];
  let gardenDoses: CareState["gardenDoses"] = [];
  let contacts: CareState["contacts"] = [];
  if (patient) {
    const [medResult, doseResult, gardenResult, contactResult] = await Promise.all([
      db.from("medications").select("*").eq("patient_id", patient.id).order("scheduled_time").order("name"),
      db.from("dose_logs").select("*").eq("patient_id", patient.id).eq("scheduled_date", today),
      db.from("garden_eligible_dose_logs").select("*").eq("patient_id", patient.id).eq("scheduled_date", today),
      db.from("emergency_contacts").select("*").eq("patient_id", patient.id).order("is_primary", { ascending: false }).order("name"),
    ]);
    if (medResult.error || doseResult.error || gardenResult.error || contactResult.error) throw new CareError("Care records could not be loaded. Please try again.");
    medications = medResult.data;
    doses = doseResult.data;
    gardenDoses = gardenResult.data;
    contacts = contactResult.data;
  }
  return { summaries, profile, people, relationships, patient: patient ?? null, medications, doses, gardenDoses, contacts, appointments: allAppointments.data!.filter(a => a.patient_id === patient?.id), today, fetchedAt: new Date().toISOString() };
}
