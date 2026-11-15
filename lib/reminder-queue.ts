import "server-only";
import { createClient } from "@supabase/supabase-js";
import { idSchema } from "./validation";
import { planReminders } from "./reminders";
import type { Database } from "./types";
// Explicit allowlist prevents test accounts receiving reminders by default.
export async function queueConfiguredReminders() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ids = [...new Set((process.env.CAREQUEST_REMINDER_PATIENT_IDS ?? "").split(",").map(s => s.trim()).filter(Boolean))];
  if (!url || !key || !ids.length || ids.length > 100 || ids.some(id => !idSchema.safeParse(id).success)) return { configured: false, queued: 0 };
  const db = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(10000) }) } });
  const people = await db.from("profiles").select("*").in("id", ids).eq("role", "elderly");
  if (people.error) throw new Error("Reminder queue unavailable.");
  const now = new Date(); let queued = 0;
  for (const patient of people.data) {
    const [meds, doses, visits] = await Promise.all([
      db.from("medications").select("*").eq("patient_id", patient.id).eq("active", true).limit(1000),
      db.from("dose_logs").select("*").eq("patient_id", patient.id).gte("taken_at", new Date(now.getTime() - 48*3600000).toISOString()).limit(1000),
      db.from("appointments").select("*").eq("patient_id", patient.id).gte("starts_at", now.toISOString()).lte("starts_at", new Date(now.getTime()+86400000).toISOString()).limit(1000),
    ]);
    if (meds.error || doses.error || visits.error || [meds.data, doses.data, visits.data].some(rows => rows!.length >= 1000)) throw new Error("Reminder queue unavailable.");
    const events = planReminders(patient, meds.data!, doses.data!, visits.data!, now);
    if (!events.length) continue;
    // A log is queued, never marked sent. Provider delivery is deliberately separate.
    const result = await db.from("notification_logs").upsert(events.map(({ event_key, recipient_id, kind }) => ({ event_key, recipient_id, kind, status: "queued" as const })), { onConflict: "event_key", ignoreDuplicates: true }).select("id");
    if (result.error) throw new Error("Reminder queue unavailable.");
    queued += result.data.length;
  }
  return { configured: true, queued };
}
