import { z } from "zod";
import { isScheduled, localDate } from "../validation";
import type { Appointment, CareState, DoseLog } from "../types";

export function gardenPoints(doses: DoseLog[], patientId: string, day: string, now = new Date()) {
  return new Set(doses.filter(d => d.patient_id === patientId && d.scheduled_date === day && Date.parse(d.scheduled_at) <= now.getTime()).map(d => `${d.medication_id}:${d.scheduled_date}`)).size;
}
export function evaluateCare(state: CareState, appointments: Appointment[], now = new Date()) {
  const patient = state.patient;
  if (!patient) throw new Error("No authorized patient selected.");
  const day = localDate(patient.timezone, now);
  const clock = new Intl.DateTimeFormat("en-GB", { timeZone: patient.timezone, hourCycle: "h23", hour: "2-digit", minute: "2-digit" }).format(now);
  const confirmed = new Set(state.doses.filter(d => d.patient_id === patient.id && d.scheduled_date === day).map(d => d.medication_id));
  const medications = state.medications.filter(m => m.patient_id === patient.id && isScheduled(m, day)).sort((a,b) => a.scheduled_time.localeCompare(b.scheduled_time)).map(m => ({ name: m.name, dosage: m.dosage, time: m.scheduled_time.slice(0,5), status: confirmed.has(m.id) ? "completed" as const : m.scheduled_time.slice(0,5) < clock ? "overdue_unconfirmed" as const : m.scheduled_time.slice(0,5) === clock ? "pending" as const : "upcoming" as const }));
  const visits = appointments.filter(a => a.patient_id === patient.id && Date.parse(a.starts_at) >= now.getTime()).sort((a,b) => a.starts_at.localeCompare(b.starts_at)).map(a => ({ title: a.title, when: new Intl.DateTimeFormat("en", { timeZone: patient.timezone, dateStyle: "medium", timeStyle: "short" }).format(new Date(a.starts_at)), status: localDate(patient.timezone, new Date(a.starts_at)) === day ? "today" : "upcoming" }));
  return { name: patient.display_name, timezone: patient.timezone, day, medications, completed: medications.filter(m => m.status === "completed").length, total: medications.length, carePoints: gardenPoints(state.gardenDoses, patient.id, day, now), appointments: visits, caregivers: state.relationships.filter(r => r.elderly_id === patient.id && r.status === "active").map(r => ({ name: state.people.find(p => p.id === r.caregiver_id)?.display_name ?? "Approved caregiver", role: r.caregiver_role })) };
}
export type CareFacts = ReturnType<typeof evaluateCare>;
export const intentSchema = z.object({ intent: z.enum(["medications", "next_medication", "overdue", "appointments", "progress", "points", "caregivers", "wellness"]) }).strict();
export type Intent = z.infer<typeof intentSchema>["intent"];
export const emergencyMessage = "If you may be in immediate danger, contact local emergency services now. Do not wait for Sunny. You can open emergency support to call a saved contact. This app has not dispatched help.";
export function urgentQuestion(text: string) { return /\b(emergency|urgent|unwell|chest pain|breath|bleeding|overdos|faint|stroke|suicid|hurt myself|kill myself)/i.test(text); }
export function fallbackIntent(text: string): Intent {
  if (/appointment|doctor visit/i.test(text)) return "appointments";
  if (/caregiver|care circle/i.test(text)) return "caregivers";
  if (/point|garden/i.test(text)) return "points";
  if (/miss|overdue|forgot/i.test(text)) return "overdue";
  if (/next.*(med|dose|pill)|(med|dose|pill).*next/i.test(text)) return "next_medication";
  if (/medic|medicine|dose|pill/i.test(text)) return "medications";
  if (/progress|doing|taken all/i.test(text)) return "progress";
  return "wellness";
}
export function answerFromFacts(facts: CareFacts, intent: Intent) {
  const describe = (m: CareFacts["medications"][number]) => `${m.name}, ${m.dosage}, at ${m.time}`;
  const overdue = facts.medications.filter(m => m.status === "overdue_unconfirmed");
  const future = facts.medications.find(m => m.status === "pending" || m.status === "upcoming");
  switch (intent) {
    case "points": return `${facts.carePoints} Care Points earned today. Each confirmed dose earns one point once its scheduled time arrives. Points celebrate record keeping; they do not measure clinical recovery.`;
    case "caregivers": return facts.caregivers.length ? `Your approved care circle: ${facts.caregivers.map(c => `${c.name} (${c.role})`).join(", ")}. Open emergency support for saved phone contacts.` : "No approved caregiver connection is recorded.";
    case "appointments": return facts.appointments.length ? `Your next appointment is ${facts.appointments[0].title}, ${facts.appointments[0].when} (${facts.timezone})${facts.appointments[0].status === "today" ? ", today" : ""}. Confirm arrangements with your clinic.` : "No upcoming appointment is recorded.";
    case "next_medication": return (future ? `Next on the recorded schedule: ${describe(future)} (${facts.timezone}). ` : "No further unconfirmed doses are scheduled later today. ") + (overdue.length ? `${overdue.length} earlier scheduled dose(s) are unconfirmed. ` : "") + "Follow your prescription; ask your pharmacist if you are unsure about a delayed dose. Do not take an extra dose based on this chat.";
    case "overdue": return overdue.length ? `These scheduled doses are unconfirmed: ${overdue.slice(0,8).map(describe).join("; ")}${overdue.length > 8 ? "; see the full schedule for more" : ""}. An unconfirmed record does not mean you skipped a dose. Check your records and ask your pharmacist about any uncertain dose.` : "No earlier scheduled doses are unconfirmed today. Future doses are not counted as missed.";
    case "medications": case "progress": return facts.total ? `${facts.completed} of ${facts.total} scheduled doses are confirmed today. ${facts.completed === facts.total ? "All today's scheduled doses have a confirmation." : `${overdue.length} earlier dose(s) are unconfirmed; ${facts.total - facts.completed - overdue.length} are due now or later.`} ${facts.carePoints} Care Points earned today. Confirm only doses you actually took.` : "No medication is scheduled today. There is no adherence percentage to calculate.";
    default: return "I can help with your recorded medications, appointments, care circle, and Care Points. For symptoms or changes to your treatment, contact your healthcare professional. What would you like to check?";
  }
}
