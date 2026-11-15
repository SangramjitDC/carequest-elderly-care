import { timingSafeEqual } from "node:crypto";
import { queueConfiguredReminders } from "@/lib/reminder-queue";
import { privateHeaders } from "@/lib/ai/http";
export const maxDuration = 60;
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32) return Response.json({ error: "Reminder scheduling is not configured." }, { status: 503, headers: privateHeaders });
  const supplied = Buffer.from(request.headers.get("authorization") ?? ""); const expected = Buffer.from(`Bearer ${secret}`);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return Response.json({ error: "Unauthorized." }, { status: 401, headers: privateHeaders });
  try {
    const result = await queueConfiguredReminders();
    return Response.json({ ...result, emailDelivery: "unavailable" }, { status: result.configured ? 200 : 503, headers: privateHeaders });
  } catch { return Response.json({ error: "Reminder scheduling could not complete. Retrying is safe." }, { status: 503, headers: privateHeaders }); }
}
