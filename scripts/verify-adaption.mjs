// No healthcare records are read or sent. Print only availability and test status.
import { deflateSync } from "node:zlib";
function syntheticImage() {
  const chunk = (name, data) => {
    const body = Buffer.concat([Buffer.from(name), data]); let crc = 0xffffffff;
    for (const byte of body) { crc ^= byte; for (let bit=0; bit<8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
    const size = Buffer.alloc(4); size.writeUInt32BE(data.length); const checksum = Buffer.alloc(4); checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
    return Buffer.concat([size, body, checksum]);
  };
  const header = Buffer.alloc(13); header.writeUInt32BE(64,0); header.writeUInt32BE(64,4); header[8]=8; header[9]=2;
  const pixels = Buffer.alloc(64 * (64*3+1)); for(let row=0; row<64; row++) for(let col=0; col<64; col++) pixels[row*193+1+col*3]=255;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",header),chunk("IDAT",deflateSync(pixels)),chunk("IEND",Buffer.alloc(0))]).toString("base64");
}
const key = process.env.ADAPTION_API_KEY;
if (!key) { console.log("ADAPTION_API_KEY is missing."); process.exitCode = 1; }
else {
  try {
    const response = await fetch("https://api.prod.adaptionlabs.ai/api/v1/models?type=hosted", { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) { console.log(`Model discovery failed: HTTP ${response.status}`); process.exitCode = 1; }
    else {
      const body = await response.json();
      const ids = body.data?.map(m => m.id) ?? [];
      const supported = ["qwen3.8-27b", "qwen3.5-397b", "gemma-4-26b-a4b-it", "gemma-4-31b-it"].filter(id => ids.includes(id));
      console.log("Available documented text/image models:", supported.join(", ") || "none");
      if (supported.length) {
        const test = await fetch("https://api.prod.adaptionlabs.ai/api/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: supported[0], input: "Reply with the word ready.", store: false, agentic_memory: false, tools: [], max_output_tokens: 128 }), signal: AbortSignal.timeout(45000) });
        const output = await test.json();
        console.log(`Synthetic text smoke test: HTTP ${test.status}; completed=${output.status === "completed"}; text=${typeof output.output_text === "string" && output.output_text.length > 0}`);
        if (!test.ok || output.status !== "completed" || !output.output_text) process.exitCode = 1;
        if (process.argv.includes("--vision")) {
          const vision = await fetch("https://api.prod.adaptionlabs.ai/api/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: supported[0], instructions: 'Return only JSON {"color":"red"} if the image is red. Otherwise identify the color in that JSON field.', input: [{ type: "message", role: "user", content: [{ type: "input_text", text: "What is the solid image color?" }, { type: "input_image", image_url: `data:image/png;base64,${syntheticImage()}` }] }], store: false, agentic_memory: false, tools: [], max_output_tokens: 512 }), signal: AbortSignal.timeout(45000) });
          const visual = await vision.json();
          let verified = false; try { verified = JSON.parse(visual.output_text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")).color?.toLowerCase() === "red"; } catch {}
          console.log(`Synthetic vision/JSON smoke test: HTTP ${vision.status}; completed=${visual.status === "completed"}; correct=${verified}`);
          if (!vision.ok || visual.status !== "completed" || !verified) process.exitCode = 1;
        }
      }
    }
  } catch { console.log("Adaption connectivity test could not complete. No credentials or response bodies logged."); process.exitCode = 1; }
}
