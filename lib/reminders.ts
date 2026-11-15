import { isScheduled, localDate } from "./validation";
import type { Appointment, DoseLog, Medication, Profile } from "./types";
export type Reminder = { event_key: string; recipient_id: string; kind: "medication" | "appointment"; label: string; href: "/medications" | "/appointments" };
export function planReminders(patient: Profile, medications: Medication[], doses: DoseLog[], appointments: Appointment[], now = new Date()): Reminder[] {
  const day = localDate(patient.timezone, now);
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: patient.timezone, hourCycle: "h23", hour: "2-digit", minute: "2-digit" }).formatToParts(now);
  const minute = Number(parts.find(p => p.type === "hour")!.value) * 60 + Number(parts.find(p => p.type === "minute")!.value);
  const done = new Set(doses.filter(d => d.patient_id === patient.id && d.scheduled_date === day).map(d => d.medication_id));
  const reminders: Reminder[] = [];
  for (const med of medications) {
    if (med.patient_id !== patient.id || !isScheduled(med, day) || done.has(med.id)) continue;
    const [hour, min] = med.scheduled_time.split(":").map(Number); const delta = hour * 60 + min - minute;
    if (delta > 30) continue;
    const phase = delta < 0 ? "unconfirmed" : "upcoming";
    reminders.push({ event_key: `medication:${patient.id}:${med.id}:${day}:${phase}`, recipient_id: patient.id, kind: "medication", label: `${med.name} at ${med.scheduled_time.slice(0,5)}: ${phase === "unconfirmed" ? "scheduled time has passed; confirmation is not recorded" : "due now or within 30 minutes"}.`, href: "/medications" });
  }
  for (const a of appointments) {
    const delta = Date.parse(a.starts_at) - now.getTime();
    if (a.patient_id !== patient.id || delta < 0 || delta > 86400000) continue;
    reminders.push({ event_key: `appointment:${patient.id}:${a.id}:${new Date(a.starts_at).toISOString()}:24h`, recipient_id: patient.id, kind: "appointment", label: `${a.title}: within the next 24 hours.`, href: "/appointments" });
  }
  return [...new Map(reminders.map(r => [r.event_key, r])).values()];
}
