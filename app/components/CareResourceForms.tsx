"use client";
import { useState, useTransition } from "react";
import { useCare } from "./CareProvider";
import { canManageResource } from "@/lib/permissions";
import { addCareResource } from "@/app/actions/resources";

export function CareResourceForms() {
  const { state, refresh } = useCare();
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  if (!state.patient) return null;
  return <section className="content-card care-form"><h2>Care appointments and contacts</h2>{(["appointments", "contacts"] as const).map(resource => {
    if (state.profile.id !== state.patient!.id && !canManageResource(state.profile, state.patient!.id, state.relationships, resource)) return <p key={resource}>You have no permission to manage {resource}.</p>;
    return <form key={`${resource}-${state.patient!.id}`} onSubmit={event => {
      event.preventDefault(); const form = new FormData(event.currentTarget); const patient_id = state.patient!.id;
      start(async () => {
        try {
          const payload = resource === "appointments" ? { resource, patient_id, title: form.get("title"), starts_at: new Date(String(form.get("starts_at"))).toISOString() } : { resource, patient_id, name: form.get("name"), phone: form.get("phone") };
          const result = await addCareResource(payload); setMessage(result.message); if (result.ok) await refresh();
        } catch { setMessage("Could not save. Check your entries and connection."); }
      });
    }}><h3>{resource === "appointments" ? "Add appointment" : "Add emergency contact"}</h3><fieldset disabled={pending}>{resource === "appointments" ? <><label>Appointment title<input name="title" required maxLength={160} /></label><label>Date and time (this device’s timezone)<input name="starts_at" type="datetime-local" required /></label></> : <><label>Contact name<input name="name" required maxLength={120} /></label><label>Phone number<input name="phone" type="tel" required maxLength={25} /></label></>}<button type="submit" className="button button-primary">{pending ? "Saving…" : "Save"}</button></fieldset></form>;
  })}<p role="status">{message}</p></section>;
}
