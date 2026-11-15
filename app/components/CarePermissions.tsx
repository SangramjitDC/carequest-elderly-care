"use client";
import { useState, useTransition } from "react";
import { setCareConsent } from "@/app/actions/care";
import { useCare } from "./CareProvider";
import type { Relationship } from "@/lib/types";

export function CarePermissions({ relationship }: { relationship: Relationship }) {
  const { refresh } = useCare();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  return <form className="care-form" onSubmit={event => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const viewer = form.get("caregiver_role") === "viewer";
    const view = form.get("can_view_health") === "on";
    start(async () => {
      try {
        const result = await setCareConsent({ id: relationship.id, status: "active", caregiver_role: form.get("caregiver_role"), can_view_health: view,
          can_manage_medications: !viewer && view && form.get("can_manage_medications") === "on",
          can_manage_appointments: !viewer && view && form.get("can_manage_appointments") === "on",
          can_manage_contacts: !viewer && view && form.get("can_manage_contacts") === "on" });
        setMessage(result.message); if (result.ok) await refresh();
      } catch { setMessage("Permissions could not be saved. Please try again."); }
    });
  }}><fieldset disabled={pending}><legend>Caregiver role and permissions</legend>
    <label>Role<select name="caregiver_role" defaultValue={relationship.caregiver_role}><option value="primary">Primary caregiver</option><option value="supporting">Supporting caregiver</option><option value="viewer">Viewer</option></select></label>
    {([ ["can_view_health", "View healthcare information"], ["can_manage_medications", "Manage medications"], ["can_manage_appointments", "Manage appointments"], ["can_manage_contacts", "Manage emergency contacts"] ] as const).map(([key, label]) => <label className="checkbox-label" key={key}><input type="checkbox" name={key} defaultChecked={relationship[key]} />{label}</label>)}
    <p>Viewer roles always have management disabled. Only one approved primary caregiver is allowed.</p><button className="button button-primary" type="submit">{pending ? "Saving…" : "Approve and save permissions"}</button></fieldset><p role="status">{message}</p></form>;
}
export function PeopleInCare() {
  const { state, refresh, refreshing } = useCare();
  if (state.profile.role !== "caregiver") return null;
  return <section className="content-card"><div className="section-title"><h2>People in Your Care</h2></div><div className="care-form-grid">{state.summaries.map(summary => <article className="content-card" key={summary.patient.id}><h3>{summary.patient.display_name}</h3><p>Medication adherence today: {summary.completed} of {summary.total} confirmed</p><p>Next unconfirmed dose: {summary.nextMedication ?? "None scheduled today"}</p><p>Upcoming appointment: {summary.nextAppointment ?? "None recorded"}</p><p>Care status: Approved · {state.relationships.find(r => r.elderly_id === summary.patient.id)?.caregiver_role}</p><button className="button button-outline" disabled={refreshing} aria-pressed={state.patient?.id === summary.patient.id} onClick={() => void refresh(summary.patient.id)}>View {summary.patient.display_name}’s care</button></article>)}</div>{!state.summaries.length && <p>No approved healthcare access yet.</p>}</section>;
}
