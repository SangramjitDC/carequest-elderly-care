import { afterEach, describe, expect, it, vi } from "vitest";
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });
describe("Adaption provider boundary", () => {
  it("fails safely without a configured server key", async () => {
    vi.stubEnv("ADAPTION_API_KEY", ""); const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    const { modelResponse } = await import("../lib/ai/adaption");
    await expect(modelResponse("test", "synthetic")).rejects.toThrow("temporarily unavailable"); expect(fetcher).not.toHaveBeenCalled();
  });
  it("uses an available documented model, disables storage/tools, and rejects provider details", async () => {
    vi.stubEnv("ADAPTION_API_KEY", "test-only-placeholder");
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ data: [{ id: "qwen3.8-27b" }] })).mockResolvedValueOnce(Response.json({ status: "completed", output_text: '{"intent":"points"}' })).mockRejectedValueOnce(new Error("PRIVATE_PROVIDER_DETAIL"));
    vi.stubGlobal("fetch", fetcher); const { modelResponse } = await import("../lib/ai/adaption");
    expect(await modelResponse("Classify", "synthetic")).toContain("points");
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toMatchObject({ model: "qwen3.8-27b", store: false, agentic_memory: false, tools: [] });
    await expect(modelResponse("Classify", "synthetic")).rejects.toThrow("temporarily unavailable");
  });
  it("rejects incomplete model output", async () => {
    vi.stubEnv("ADAPTION_API_KEY", "test-only-placeholder");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json({ data: [{ id: "qwen3.8-27b" }] })).mockResolvedValueOnce(Response.json({ status: "incomplete", output_text: "partial" })));
    const { modelResponse } = await import("../lib/ai/adaption"); await expect(modelResponse("test", "synthetic")).rejects.toThrow("temporarily unavailable");
  });
});
