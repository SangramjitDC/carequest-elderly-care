"use client";
import Link from "next/link";
import { useCare } from "./CareProvider";
import { planReminders } from "@/lib/reminders";
export function Reminders() {
  const { state } = useCare(); if (!state.patient) return null;
  const events = planReminders(state.patient, state.medications, state.doses, state.appointments, new Date(state.fetchedAt));
  return <section className="content-card care-form"><h2>Care reminders</h2><p>Updates while CAREQUEST is open. No email or push notification has been sent.</p>{events.length ? events.map(event => <p key={event.event_key}>{event.label} <Link href={event.href}>View details</Link></p>) : <p>No medication reminders or appointments within the next 24 hours.</p>}</section>;
}
