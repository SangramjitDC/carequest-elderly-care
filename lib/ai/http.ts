import "server-only";
import { CareError } from "../care";
export const privateHeaders = { "Cache-Control": "private, no-store", Vary: "Cookie" };
export function sameOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) throw new CareError("Please send this request from CAREQUEST.", 403);
}
export async function boundedJSON(request: Request, max = 8192): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new CareError("Expected JSON.", 400);
  const reader = request.body?.getReader(); if (!reader) throw new CareError("Missing request.", 400);
  let size = 0; const chunks: Uint8Array[] = [];
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > max) { await reader.cancel(); throw new CareError("Request is too large.", 413); } chunks.push(value); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new CareError("Invalid JSON.", 400); }
}
// Per-instance abuse guard; no healthcare records are retained. Distributed limits belong at the deployment gateway.
const limits = new Map<string, { count: number; until: number }>();
export function limitAI(user: string) {
  const now = Date.now(); for (const [key, item] of limits) if (item.until < now) limits.delete(key);
  const item = limits.get(user) ?? { count: 0, until: now + 60000 };
  if (item.count >= 8 || limits.size > 10000) throw new CareError("Please wait a minute before sending another AI request.", 429);
  item.count++; limits.set(user, item);
}
export function safeFailure(error: unknown) { return Response.json({ error: error instanceof CareError ? error.message : "The AI service is unavailable. Try again or use manual care tools." }, { status: error instanceof CareError ? error.status : 503, headers: privateHeaders }); }
