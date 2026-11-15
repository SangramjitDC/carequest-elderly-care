import { z } from "zod";
const visibleText = z.string().trim().min(1).max(500).nullable();
export const prescriptionSchema = z.object({ medications: z.array(z.object({ name: z.string().trim().min(1).max(120).nullable(), dosage: z.string().trim().min(1).max(120).nullable(), frequency: visibleText, timing: visibleText, instructions: visibleText, duration: visibleText, confidence: z.enum(["high", "low"]), warnings: z.array(z.string().max(300)).max(8) }).strict()).max(12), warnings: z.array(z.string().max(300)).max(8) }).strict();
export type Prescription = z.infer<typeof prescriptionSchema>;
export function verifiedImage(base64: string, mime: string) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(mime) || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) return false;
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length < 12 || bytes.length > 2 * 1024 * 1024 || bytes.toString("base64") !== base64) return false;
  if (mime === "image/png") return bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (mime === "image/jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  return bytes.toString("ascii",0,4) === "RIFF" && bytes.toString("ascii",8,12) === "WEBP";
}
