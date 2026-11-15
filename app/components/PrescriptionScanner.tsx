"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { useCare } from "./CareProvider";
import { MedicationEditor, PatientSelector, SyncStatus } from "./LiveCare";
import { canManageResource } from "@/lib/permissions";
import { prescriptionSchema, type Prescription } from "@/lib/ai/prescription";

function ScanReview({ patientId }: { patientId: string }) {
  const file = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false); const [error, setError] = useState("");
  const [result, setResult] = useState<Prescription | null>(null);
  const [review, setReview] = useState<number | null>(null);
  const [saved, setSaved] = useState<number[]>([]);
  async function scan() {
    const selected = file.current?.files?.[0];
    setResult(null); setReview(null); setSaved([]); setError("");
    if (!selected || !["image/png", "image/jpeg", "image/webp"].includes(selected.type) || selected.size > 2 * 1024 * 1024) { setError("Choose a JPEG, PNG, or WebP image up to 2 MB."); return; }
    setPending(true);
    try {
      const dataURL = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = reject; reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(selected); });
      const response = await fetch("/api/prescription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patient_id: patientId, mime: selected.type, image: dataURL.split(",")[1] }), signal: AbortSignal.timeout(55000) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error ?? "Could not read the prescription. Please enter it manually.");
      setResult(prescriptionSchema.parse(body));
    } catch (cause) { setError(cause instanceof Error && cause.name !== "TimeoutError" ? cause.message : "The scan took too long. Please try again or enter the prescription manually."); }
    finally { setPending(false); if (file.current) file.current.value = ""; }
  }
  return <><section className="content-card care-form"><ScanLine size={32} /><h2>Bring your prescription into view</h2><p>The image is sent to Adaption for transcription. CAREQUEST does not save the image. Check every extracted detail before creating a schedule.</p><label>Prescription image (JPEG, PNG, WebP; maximum 2 MB)<input ref={file} type="file" accept="image/jpeg,image/png,image/webp" disabled={pending} /></label><button className="button button-primary" disabled={pending} onClick={() => void scan()}>{pending ? "Reading prescription…" : "Scan prescription"}</button>{pending && <p role="status">Reading the image. No medication has been saved.</p>}{error && <p role="alert" className="form-error">{error}</p>}</section>
    {result && <section className="content-card care-form"><h2>Review against the original</h2><p>AI can misread handwriting. Missing details remain blank. If anything is unclear, ask the pharmacist or prescriber. This tool supports daily schedules; do not convert as-needed or weekly prescriptions into daily doses.</p>{result.warnings.map((w,i) => <p key={i} className="form-error">{w}</p>)}{!result.medications.length && <p>No reliable medication details were found. Use manual entry.</p>}{result.medications.map((m,i) => <article key={i} className="content-card"><h3>{m.name ?? "Medication name unclear"}</h3><p>{m.confidence === "low" ? "Low confidence — verify carefully" : "AI transcription — still requires verification"}</p><dl>{(["dosage", "frequency", "timing", "instructions", "duration"] as const).map(k => <div key={k}><dt>{k[0].toUpperCase() + k.slice(1)}</dt><dd>{m[k] ?? "Not clearly recorded"}</dd></div>)}</dl>{m.warnings.map((w,j) => <p key={j} className="form-error">{w}</p>)}<button className="button button-outline" disabled={saved.includes(i)} onClick={() => setReview(i)}>{saved.includes(i) ? "Saved after review" : "Review and enter a daily schedule"}</button>{review === i && <MedicationEditor initial={{ name: m.name ?? "", dosage: m.dosage ?? "", instructions: m.instructions ?? "" }} onSaved={() => setSaved(current => [...current, i])} onClose={() => { setReview(null); }} />}</article>)}</section>}
    <Link className="button button-outline" href="/medications">Use manual medication entry</Link></>;
}
export function PrescriptionScannerPage() {
  const { state } = useCare(); const permitted = state.patient && canManageResource(state.profile, state.patient.id, state.relationships, "medications");
  return <div className="page-stack"><SyncStatus /><div className="page-heading"><div><h1>Prescription scanner</h1><p>Transcribe, check, then save your prescribed routine.</p></div></div><PatientSelector />{permitted ? <ScanReview key={state.patient!.id} patientId={state.patient!.id} /> : <section className="content-card"><p>An approved caregiver with medication management permission must review prescriptions for the selected care space.</p><Link href="/medications">View medications</Link></section>}</div>;
}
