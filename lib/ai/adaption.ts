import "server-only";

const base = "https://api.prod.adaptionlabs.ai/api/v1";
const supported = ["qwen3.8-27b", "qwen3.5-397b", "gemma-4-26b-a4b-it", "gemma-4-31b-it"];
let cached: { model: string; until: number } | undefined;
export class AIUnavailable extends Error { constructor() { super("Sunny is temporarily unavailable. Your saved records have not changed. Please try again or use your care pages."); } }
export async function modelResponse(instructions: string, input: unknown, tokens = 600): Promise<string> {
  try {
    const key = process.env.ADAPTION_API_KEY;
    if (!key) throw new AIUnavailable();
    const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
    if (!cached || cached.until < Date.now()) {
      const response = await fetch(`${base}/models?type=hosted`, { headers, cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new AIUnavailable();
      const models = await response.json();
      const model = supported.find(id => Array.isArray(models.data) && models.data.some((m: { id?: string }) => m.id === id));
      if (!model) throw new AIUnavailable();
      cached = { model, until: Date.now() + 300000 };
    }
    const response = await fetch(`${base}/responses`, { method: "POST", headers, cache: "no-store", signal: AbortSignal.timeout(35000), body: JSON.stringify({ model: cached.model, instructions, input, max_output_tokens: tokens, store: false, agentic_memory: false, tools: [] }) });
    if (!response.ok) throw new AIUnavailable();
    const result = await response.json();
    if (result.status !== "completed" || result.error || typeof result.output_text !== "string" || !result.output_text.trim() || result.output_text.length > 24000) throw new AIUnavailable();
    return result.output_text;
  } catch { throw new AIUnavailable(); }
}
export function parseModelJSON(text: string): unknown {
  return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
}
