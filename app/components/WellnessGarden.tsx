"use client";
import Link from "next/link";
import { useCare } from "./CareProvider";
import { PatientSelector, SyncStatus } from "./LiveCare";
import { MiniGarden } from "./GardenArt";
import { gardenPoints } from "@/lib/ai/decisions";
export function WellnessGardenPage() {
  const { state } = useCare();
  const points = gardenPoints(state.gardenDoses, state.patient?.id ?? "", state.today, new Date(state.fetchedAt));
  const stages = ["Seed", "Sprout", "Growing", "Blooming"]; const stage = Math.min(points, 3);
  return <div className="page-stack"><SyncStatus /><div className="page-heading"><div><h1>Your wellness garden</h1><p>{state.patient?.display_name ?? "Your care circle"} · {state.today}</p></div><span className="care-point-chip">{points} Care Points today</span></div><PatientSelector /><section className="garden-showcase content-card"><div className="garden-showcase-copy"><h2>{points ? "Your caring steps are growing!" : "A new day to grow"}</h2><p>One point per confirmed dose, once its scheduled time arrives. Early confirmations wait until then. Each dose earns only once.</p><div className="garden-stage-status" role="status">Today’s stage: <strong>{stages[stage]}</strong></div><div className="stage-progress">{stages.map((label,i) => <div key={label} className={`stage-item ${i <= stage ? "stage-complete" : ""}`} aria-current={i === stage ? "step" : undefined}><span>{i}</span><small>{label}</small></div>)}</div><p>Points celebrate keeping records, not clinical recovery. Follow your prescribed schedule; never take extra medicine to earn points.</p></div><MiniGarden large /></section><Link className="button button-primary" href="/medications">View today’s medication schedule</Link></div>;
}
