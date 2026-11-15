import "server-only";
import { authenticated, CareError } from "../care";
import { idSchema, localDate } from "../validation";
import { evaluateCare } from "./decisions";

// Never select a default patient for caregiver requests. Recheck consent on every request.
export async function patientContext(patientId: unknown) {
  const parsed = idSchema.safeParse(patientId);
  if (!parsed.success) throw new CareError("Choose a care space first.", 400);
  const { db, profile } = await authenticated();
  const { data: relationships, error: relationError } = await db.from("caregiver_relationships").select("*").eq("elderly_id", parsed.data);
  if (relationError) throw new CareError("Care permissions could not be checked.");
  if (!(profile.role === "elderly" && profile.id === parsed.data) && !(profile.role === "caregiver" && relationships.some(r => r.caregiver_id === profile.id && r.status === "active" && r.can_view_health))) throw new CareError("You do not have access to this care space.", 403);
  const { data: patient, error } = await db.from("profiles").select("*").eq("id", parsed.data).eq("role", "elderly").single();
  if (error || !patient) throw new CareError("This care space is unavailable.", 403);
  return { db, profile, patient, relationships };
}
export async function companionFacts(patientId: unknown) {
  const context = await patientContext(patientId);
  const { db, patient, profile, relationships } = context;
  const now = new Date(); const day = localDate(patient.timezone, now);
  const ids = relationships.filter(r => r.status === "active").map(r => r.caregiver_id);
  const [meds, doses, garden, visits, people] = await Promise.all([
    db.from("medications").select("*").eq("patient_id", patient.id),
    db.from("dose_logs").select("*").eq("patient_id", patient.id).eq("scheduled_date", day),
    db.from("garden_eligible_dose_logs").select("*").eq("patient_id", patient.id).eq("scheduled_date", day),
    db.from("appointments").select("*").eq("patient_id", patient.id).gte("starts_at", now.toISOString()).order("starts_at").limit(20),
    ids.length ? db.from("profiles").select("*").in("id", ids) : Promise.resolve({ data: [], error: null }),
  ]);
  if (meds.error || doses.error || garden.error || visits.error || people.error) throw new CareError("Your care records could not be loaded. Try refreshing.");
  const facts = evaluateCare({ profile, patient, relationships, people: people.data!, medications: meds.data!, doses: doses.data!, gardenDoses: garden.data!, today: day, fetchedAt: now.toISOString(), summaries: [], appointments: visits.data!, contacts: [] }, visits.data!, now);
  return { ...context, facts };
}
