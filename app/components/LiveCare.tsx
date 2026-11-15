"use client";

import Link from "next/link";
import { useId, useState, useTransition, type FormEvent } from "react";
import { ArrowRight, Check, CheckCircle2, Clock3, Flower2, Heart, MessageCircleHeart, Pill, Plus, ShieldAlert, Sparkles, UsersRound } from "lucide-react";
import { markDoseTaken, requestCareAccess, saveMedication, setCareConsent } from "@/app/actions/care";
import { useCare } from "./CareProvider";
import { MiniGarden } from "./GardenArt";
import { isScheduled } from "@/lib/validation";
import type { ActionResult, Medication } from "@/lib/types";

const emptyResult: ActionResult = { ok: false, message: "" };
function Result({ result }: { result: ActionResult }) {
  return result.message ? <div className={`auth-message ${result.ok ? "" : "form-error"}`} role={result.ok ? "status" : "alert"}>{result.message}{result.fields && <ul>{Object.entries(result.fields).flatMap(([name, errors]) => errors.map((error) => <li key={`${name}-${error}`}>{name.replaceAll("_", " ")}: {error}</li>))}</ul>}</div> : null;
}
export function SyncStatus() {
  const { state, error, refreshing, refresh } = useCare();
  return <div className="care-sync"><span role={error ? "alert" : undefined}>{error || `Saved care records · ${state.patient?.timezone ?? state.profile.timezone} · Refreshes every 15 seconds`}</span><button type="button" className="button button-outline" disabled={refreshing} onClick={() => void refresh()}>{refreshing ? "Refreshing…" : "Refresh"}</button></div>;
}
export function PatientSelector() {
  const { state, refreshing, refresh } = useCare();
  if (state.profile.role !== "caregiver") return null;
  const patients = state.people.filter((p) => p.role === "elderly" && state.relationships.some((r) => r.elderly_id === p.id && r.status === "active"));
  return <div className="content-card care-form"><label htmlFor="care-patient">Care space<select id="care-patient" disabled={refreshing || !patients.length} value={state.patient?.id ?? ""} onChange={(e) => void refresh(e.target.value)}>{!patients.length && <option value="">No approved care spaces yet</option>}{patients.map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}</select></label></div>;
}
function useRoutine() {
  const { state } = useCare();
  const scheduled = state.medications.filter((med) => isScheduled(med, state.today));
  const taken = new Set(state.doses.map((dose) => dose.medication_id));
  const completed = scheduled.filter((med) => taken.has(med.id)).length;
  return { scheduled, taken, completed, total: scheduled.length, percent: scheduled.length ? Math.round(completed / scheduled.length * 100) : 0 };
}
function Progress() {
  const { completed, total, percent } = useRoutine();
  return <section className="progress-card"><div className="progress-main"><div><span className="small-overline">DAILY MEDICATION ROUTINE</span><h2>Your routine, one step at a time</h2><p>{total ? `${completed} of ${total} scheduled doses confirmed today` : "No doses are scheduled today."}</p></div><span className="progress-count">{percent}<small>%</small></span></div><div className="wide-progress" role="progressbar" aria-label="Today’s confirmed doses" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={`${completed} of ${total} doses confirmed`}><span style={{ width: `${percent}%` }} /></div></section>;
}
function MedicationEditor({ medication, onClose }: { medication?: Medication; onClose: () => void }) {
  const { state, refresh } = useCare();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState(emptyResult);
  const prefix = useId();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const response = await saveMedication({ ...(medication ? { id: medication.id, version: medication.version } : {}), patient_id: state.patient?.id,
          name: form.get("name"), dosage: form.get("dosage"), instructions: form.get("instructions"), scheduled_time: form.get("scheduled_time"), starts_on: form.get("starts_on"), ends_on: form.get("ends_on") || null, active: form.get("active") === "on" });
        setResult(response);
        if (response.ok) { await refresh(); onClose(); }
      } catch { setResult({ ok: false, message: "Could not save. Check your connection and try again." }); }
    });
  }
  const fields = [
    { name: "name", label: "Medication name", value: medication?.name ?? "", required: true, maxLength: 120 },
    { name: "dosage", label: "Prescribed dosage", value: medication?.dosage ?? "", required: true, maxLength: 120 },
    { name: "scheduled_time", label: "Daily dose time", value: medication?.scheduled_time.slice(0, 5) ?? "08:00", type: "time", required: true },
    { name: "starts_on", label: "Start date", value: medication?.starts_on ?? state.today, type: "date", required: true },
    { name: "ends_on", label: "End date (optional)", value: medication?.ends_on ?? "", type: "date" },
  ];
  return <form className="care-form medication-editor" onSubmit={submit} aria-label={medication ? "Edit medication" : "Add medication"}>
    <h3>{medication ? "Edit medication" : "Add a scheduled medication"}</h3><p>Enter the prescribed instructions. Each entry is one daily dose in {state.patient?.timezone}. For multiple daily doses, add a separate entry for each time.</p>
    <fieldset disabled={pending}><div className="care-form-grid">{fields.map((field) => <label key={field.name} htmlFor={`${prefix}-${field.name}`}>{field.label}<input id={`${prefix}-${field.name}`} name={field.name} type={field.type ?? "text"} defaultValue={field.value} required={field.required} maxLength={field.maxLength} aria-invalid={!!result.fields?.[field.name]} aria-describedby={result.fields?.[field.name] ? `${prefix}-${field.name}-error` : undefined} />{result.fields?.[field.name] && <span className="field-error" id={`${prefix}-${field.name}-error`}>{result.fields[field.name].join(" ")}</span>}</label>)}</div>
    <label htmlFor={`${prefix}-instructions`}>Instructions (optional)<textarea id={`${prefix}-instructions`} name="instructions" maxLength={500} rows={3} defaultValue={medication?.instructions ?? ""} /></label>
    <label className="checkbox-label"><input type="checkbox" name="active" defaultChecked={medication?.active ?? true} /> Active medication</label><p className="card-subtitle">Turn off “Active medication” to archive this schedule. Existing dose records are retained.</p>
    <div className="care-form-actions"><button className="button button-primary" type="submit">{pending ? "Saving…" : "Save medication"}</button><button className="button button-outline" type="button" onClick={onClose}>Cancel</button></div></fieldset><Result result={result} />
  </form>;
}
export function LiveMedicationCards({ compact = false, manage = false }: { compact?: boolean; manage?: boolean }) {
  const { state, error, refresh } = useCare();
  const { scheduled, taken } = useRoutine();
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState(emptyResult);
  const canManage = state.profile.role === "caregiver" && state.relationships.some((r) => r.elderly_id === state.patient?.id && r.status === "active" && r.can_manage_medications);
  const meds = manage && canManage ? state.medications : scheduled;
  return <div className={`medication-list ${compact ? "medication-list-compact" : ""}`}>
    {!meds.length && <p className="empty-state">{state.patient ? "No medications are scheduled. An approved caregiver can add your prescribed routine." : "Connect to an older adult’s care space to view their medications."}</p>}
    {meds.map((med) => <article className={`medication-row ${taken.has(med.id) ? "medication-is-taken" : ""}`} key={med.id}>
      <span className="medication-symbol blue"><Pill size={26} /></span><div className="medication-detail"><div className="med-name-line"><h3>{med.name}</h3>{taken.has(med.id) && <span className="status-taken"><Check size={18} /> Taken today</span>}</div><p>{med.dosage}</p><span className="med-instruction"><Clock3 size={22} /> {med.scheduled_time.slice(0, 5)}{med.instructions && ` · ${med.instructions}`}</span>{!isScheduled(med, state.today) && <p>{med.active ? `Scheduled ${med.starts_on}${med.ends_on ? ` through ${med.ends_on}` : " onward"}` : "Archived"}</p>}</div>
      {state.profile.role === "elderly" && <button className={`button ${taken.has(med.id) ? "button-complete" : "button-primary"}`} disabled={pending || taken.has(med.id) || !!error} aria-label={`${taken.has(med.id) ? "Taken" : "Mark as taken"}: ${med.name}`} onClick={() => startTransition(async () => {
        try { const response = await markDoseTaken({ medication_id: med.id, scheduled_date: state.today }); setResult(response); await refresh(); }
        catch { setResult({ ok: false, message: "Could not confirm the dose. Refresh before trying again." }); }
      })}>{taken.has(med.id) ? <><Check size={24} /> Taken</> : <><CheckCircle2 size={24} /> {pending ? "Saving…" : "Mark as taken"}</>}</button>}
      {manage && canManage && <button className="button button-outline" onClick={() => setEditing(editing === med.id ? null : med.id)}>Edit medication<span className="visually-hidden">: {med.name}</span></button>}
      {editing === med.id && <MedicationEditor key={`${med.id}-${med.version}`} medication={med} onClose={() => setEditing(null)} />}
    </article>)}<Result result={result} />
  </div>;
}
export function CareCircle() {
  const { state, refresh } = useCare();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState(emptyResult);
  return <section className="content-card care-form"><div className="section-title"><h2>Your care circle</h2></div>
    {state.profile.role === "elderly" ? <p>Your care ID: <strong className="care-id">{state.profile.id}</strong> Share it privately with your caregiver. A request grants no access until you approve it.</p> : <form onSubmit={(event) => { event.preventDefault(); const id = new FormData(event.currentTarget).get("careId"); startTransition(async () => { try { setResult(await requestCareAccess(id)); await refresh(); } catch { setResult({ ok: false, message: "Could not send the request. Please try again." }); } }); }}><label htmlFor="care-id">Older adult’s care ID<input id="care-id" name="careId" required maxLength={36} placeholder="Care ID shared with you" /></label><button className="button button-primary" disabled={pending} type="submit">Request access</button></form>}
    {!state.relationships.length && <p>No caregiver connections yet.</p>}
    {state.relationships.map((relation) => {
      const otherId = state.profile.role === "elderly" ? relation.caregiver_id : relation.elderly_id;
      const person = state.people.find((p) => p.id === otherId);
      return <div className="care-relationship" key={relation.id}><div><strong>{person?.display_name ?? "Care connection"}</strong><p>{relation.status === "active" ? (relation.can_manage_medications ? "Approved · Medication management" : "Approved · View only") : relation.status === "pending" ? "Awaiting approval" : "Access revoked"}</p></div>
        {state.profile.role === "elderly" && <div className="care-form-actions">{relation.status !== "active" && <button className="button button-primary" disabled={pending} onClick={() => startTransition(async () => { try { setResult(await setCareConsent({ id: relation.id, status: "active", can_manage_medications: true })); await refresh(); } catch { setResult({ ok: false, message: "Could not approve access." }); } })}>Approve caregiver</button>}{relation.status === "active" && <button className="button button-outline" disabled={pending} onClick={() => startTransition(async () => { try { setResult(await setCareConsent({ id: relation.id, status: "revoked", can_manage_medications: false })); await refresh(); } catch { setResult({ ok: false, message: "Could not revoke access." }); } })}>Revoke access</button>}</div>}</div>;
    })}<Result result={result} />
  </section>;
}
export function LiveMedicationsPage() {
  const { state } = useCare();
  const [adding, setAdding] = useState(false);
  const canManage = state.profile.role === "caregiver" && state.relationships.some((r) => r.elderly_id === state.patient?.id && r.status === "active" && r.can_manage_medications);
  return <div className="page-stack"><SyncStatus /><div className="page-heading"><div><span className="page-eyebrow">YOUR DAILY ROUTINE</span><h1>Medications</h1><p>{state.patient ? `${state.patient.display_name}’s prescribed routine` : "Your care circle’s prescribed routines"}</p></div>{canManage && <button className="button button-primary" onClick={() => setAdding(!adding)}><Plus size={24} /> Add medication</button>}</div><PatientSelector /><Progress />{adding && canManage && <section className="content-card"><MedicationEditor key={state.patient?.id} onClose={() => setAdding(false)} /></section>}<section className="content-card full-medication-panel"><div className="section-title"><h2>{canManage ? "Medication schedules" : "Today’s schedule"}</h2></div><p className="card-subtitle">Follow your prescriber’s instructions. Each dose confirmation is saved and shared with your approved care circle.</p><LiveMedicationCards manage /></section></div>;
}
export function LiveElderlyDashboard() {
  const { state } = useCare();
  const { completed } = useRoutine();
  return <div className="page-stack"><SyncStatus /><div className="page-heading"><div><span className="page-eyebrow">{state.today}</span><h1>Hello, {state.profile.display_name} ☀️</h1><p>A fresh day is a fresh start. You’re doing great.</p></div></div><PatientSelector /><Progress /><div className="dashboard-grid"><section className="content-card meds-panel"><div className="section-title"><h2>Today’s medications</h2><Link href="/medications">View schedule <ArrowRight size={24} /></Link></div><LiveMedicationCards compact /></section><section className="garden-card"><div className="garden-card-head"><Flower2 size={24} /> YOUR WELLNESS GARDEN</div><MiniGarden /><div className="garden-card-bottom"><div><strong>{completed} care points today</strong><span>One point for each scheduled dose confirmed.</span></div><Link href="/garden">Visit garden <ArrowRight size={24} /></Link></div></section></div><div className="dashboard-grid lower-grid"><section className="content-card companion-teaser"><div className="teaser-icon"><MessageCircleHeart size={24} /></div><div className="teaser-copy"><h2>A listening ear, anytime.</h2><p>Explore the companion preview. AI is not connected yet.</p><Link className="button button-primary" href="/companion">Chat with your companion <ArrowRight size={24} /></Link></div></section><section className="content-card next-appointment"><div className="section-title"><h2>Coming up</h2><Link href="/appointments">Appointments <ArrowRight size={24} /></Link></div><p>Appointment management is not connected yet. Confirm appointments with your clinic.</p></section></div><CareCircle /><Link className="emergency-banner" href="/emergency"><span className="emergency-banner-icon"><ShieldAlert size={28} /></span><span><strong>Need urgent help?</strong><small>Open your emergency support options.</small></span><span className="emergency-banner-cta">Emergency support <ArrowRight size={24} /></span></Link></div>;
}
export function LiveCaregiverDashboard() {
  const { state } = useCare();
  const { completed, total, percent } = useRoutine();
  return <div className="page-stack caregiver-page"><SyncStatus /><div className="page-heading"><div><span className="page-eyebrow">YOUR CARE CIRCLE</span><h1>A little peace of mind.</h1><p>{state.patient ? `A clear view of ${state.patient.display_name}’s day.` : "Connect with an older adult to support their routine."}</p></div></div><PatientSelector /><div className="caregiver-profile content-card"><span className="large-avatar"><UsersRound size={28} /></span><div className="caregiver-person"><h2>{state.patient?.display_name ?? "Your care circle"}</h2><p>{state.patient ? `Schedule timezone: ${state.patient.timezone}` : "Access requires the older adult’s approval."}</p></div></div><div className="metric-grid"><article className="metric-card"><span className="metric-icon teal"><Pill size={24} /></span><span className="small-overline">DOSES TODAY</span><strong>{completed} <small>/ {total}</small></strong><span className="metric-note">confirmed by the older adult</span></article><article className="metric-card"><span className="metric-icon green"><Heart size={24} /></span><span className="small-overline">TODAY’S PROGRESS</span><strong>{percent}<small>%</small></strong><span className="metric-note">of scheduled doses confirmed</span></article><article className="metric-card"><span className="metric-icon violet"><Sparkles size={24} /></span><span className="small-overline">CARE POINTS TODAY</span><strong>{completed}</strong><span className="metric-note">one per confirmed scheduled dose</span></article></div><section className="content-card"><div className="section-title"><h2>Today’s medication routine</h2><Link href="/medications">Manage medications <ArrowRight size={24} /></Link></div><LiveMedicationCards /></section><CareCircle /></div>;
}
