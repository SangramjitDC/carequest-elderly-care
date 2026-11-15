"use client";
import { useState, useTransition } from "react";
import { Phone, ShieldAlert } from "lucide-react";
import { useCare } from "./CareProvider";
import { PatientSelector, SyncStatus } from "./LiveCare";
import { canManageResource } from "@/lib/permissions";
import { addCareResource, deleteCareResource } from "@/app/actions/resources";
import type { Appointment, EmergencyContact } from "@/lib/types";

function localInput(iso: string) {
  const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,16);
}
function ResourceForm({ resource, existing, close }: { resource: "appointments" | "contacts"; existing?: Appointment | EmergencyContact; close: () => void }) {
  const { state, refresh } = useCare(); const [pending, start] = useTransition(); const [message, setMessage] = useState("");
  const appointment = existing && "title" in existing ? existing : undefined;
  const contact = existing && "phone" in existing ? existing : undefined;
  return <form className="care-form" onSubmit={e => {
    e.preventDefault(); const data = new FormData(e.currentTarget);
    start(async () => { try {
      const common = { resource, patient_id: state.patient!.id, ...(existing ? { id: existing.id } : {}) };
      const values = resource === "appointments" ? { title: data.get("title"), starts_at: new Date(String(data.get("starts_at"))).toISOString() } : { name: data.get("name"), phone: data.get("phone"), is_primary: data.get("is_primary") === "on" };
      const result = await addCareResource({ ...common, ...values }); setMessage(result.message); if (result.ok) { await refresh(); close(); }
    } catch { setMessage("Could not save. Check your entries and try again."); } });
  }}><h3>{existing ? "Edit" : "Add"} {resource === "appointments" ? "appointment" : "emergency contact"}</h3><fieldset disabled={pending}>{resource === "appointments" ? <><label>Appointment title<input name="title" required maxLength={160} defaultValue={appointment?.title} /></label><label>Date and time in this device’s timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})<input type="datetime-local" name="starts_at" required defaultValue={appointment ? localInput(appointment.starts_at) : ""} /></label><p>Saved dates display in the patient’s timezone: {state.patient?.timezone}. Check the timezone when entering appointments.</p></> : <><label>Contact name<input name="name" required maxLength={120} defaultValue={contact?.name} /></label><label>Phone number, including country code where needed<input type="tel" name="phone" required maxLength={25} defaultValue={contact?.phone} /></label><label className="checkbox-label"><input type="checkbox" name="is_primary" defaultChecked={contact?.is_primary ?? false} /> Primary contact</label></>}<div className="care-form-actions"><button className="button button-primary" type="submit">{pending ? "Saving…" : "Save"}</button><button className="button button-outline" type="button" onClick={close}>Cancel</button></div></fieldset><p role="status">{message}</p></form>;
}
export function ResourceList({ resource }: { resource: "appointments" | "contacts" }) {
  const { state, refresh } = useCare();
  const [editing, setEditing] = useState<string | null>(null); const [deleting, setDeleting] = useState<string | null>(null);
  const [pending, start] = useTransition(); const [message, setMessage] = useState("");
  const patient = state.patient; if (!patient) return <p>Select an approved care space.</p>;
  const canEdit = state.profile.id === patient.id || canManageResource(state.profile, patient.id, state.relationships, resource);
  const items = resource === "appointments" ? state.appointments : state.contacts;
  return <section className="content-card care-form"><h2>{resource === "appointments" ? "Upcoming appointments" : "Saved emergency contacts"}</h2>{!items.length && <p>No {resource === "appointments" ? "upcoming appointments" : "emergency contacts"} recorded for {patient.display_name}.</p>}
    {items.map(item => <article className="content-card care-form" key={item.id}>{"title" in item ? <><h3>{item.title}</h3><p>{new Intl.DateTimeFormat("en", { timeZone: patient.timezone, dateStyle: "full", timeStyle: "short" }).format(new Date(item.starts_at))} ({patient.timezone})</p></> : <><h3>{item.name}{item.is_primary ? " · Primary contact" : ""}</h3><p>{item.phone}</p><a className="button button-primary button-large" href={`tel:${item.phone.replace(/[^+0-9]/g, "")}`}><Phone size={24} /> Call {item.name}</a></>}{canEdit && <div className="care-form-actions"><button className="button button-outline" onClick={() => setEditing(item.id)}>Edit<span className="visually-hidden"> {"title" in item ? item.title : item.name}</span></button><button className="button button-outline" onClick={() => setDeleting(item.id)}>Delete<span className="visually-hidden"> {"title" in item ? item.title : item.name}</span></button></div>}{deleting === item.id && <div><p>Delete this saved record? This cannot be undone.</p><div className="care-form-actions"><button className="button button-danger" disabled={pending} onClick={() => start(async () => { try { const result = await deleteCareResource({ resource, patient_id: patient.id, id: item.id }); setMessage(result.message); if (result.ok) { setDeleting(null); await refresh(); } } catch { setMessage("Could not delete. Please try again."); } })}>{pending ? "Deleting…" : "Confirm delete"}</button><button className="button button-outline" onClick={() => setDeleting(null)}>Keep record</button></div></div>}{canEdit && editing === item.id && <ResourceForm resource={resource} existing={item} close={() => setEditing(null)} />}</article>)}
    {canEdit && (editing === "new" ? <ResourceForm resource={resource} close={() => setEditing(null)} /> : <button className="button button-primary" onClick={() => setEditing("new")}>Add {resource === "appointments" ? "appointment" : "emergency contact"}</button>)}<p role="status">{message}</p></section>;
}
export function AppointmentsPage() { const { state } = useCare(); return <div className="page-stack"><SyncStatus /><div className="page-heading"><div><h1>Appointments</h1><p>Saved visits for {state.patient?.display_name ?? "your care circle"}. Confirm bookings with your clinic.</p></div></div><PatientSelector /><ResourceList key={state.patient?.id} resource="appointments" /></div>; }
export function EmergencyPage() {
  const { state } = useCare(); const [number, setNumber] = useState(""); const valid = /^\+?[0-9 ()-]{3,25}$/.test(number);
  return <div className="page-stack emergency-page"><div className="emergency-heading"><ShieldAlert size={48} /><div><h1>Emergency support</h1><p>If you may be in immediate danger, call your local emergency services now. Do not wait for this app.</p></div></div><section className="content-card care-form"><h2>Call local emergency services</h2><p>Use your phone’s emergency calling feature, or enter the emergency number for your current location.</p><label>Local emergency number<input type="tel" value={number} onChange={e => setNumber(e.target.value)} maxLength={25} /></label>{valid && <a className="button button-danger button-large" href={`tel:${number.replace(/[^+0-9]/g, "")}`}>Call {number}</a>}<p>CAREQUEST has not notified emergency services or dispatched help. Tapping a call link opens your device’s phone app.</p></section><SyncStatus /><PatientSelector /><ResourceList key={state.patient?.id} resource="contacts" /></div>;
}
