"use client";
import Link from "next/link";
import { useState } from "react";
import { MessageCircleHeart, ShieldAlert } from "lucide-react";
import { useCare } from "./CareProvider";
import { PatientSelector, SyncStatus } from "./LiveCare";
import { emergencyMessage, urgentQuestion } from "@/lib/ai/decisions";

type Message = { from: "you" | "companion"; text: string; source?: string };
function Conversation({ patientId }: { patientId: string | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState(""); const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function send(message: string) {
    if (pending || !message.trim()) return;
    setText(""); setError("");
    setMessages(current => [...current.slice(-38), { from: "you", text: message }]);
    if (urgentQuestion(message)) { setMessages(current => [...current, { from: "companion", text: emergencyMessage, source: "Emergency guidance" }]); return; }
    setPending(true);
    try {
      const response = await fetch("/api/companion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patient_id: patientId, message }), signal: AbortSignal.timeout(55000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Sunny could not load your care records.");
      setMessages(current => [...current, { from: "companion", text: result.text, source: result.source }]);
    } catch (cause) { setError(cause instanceof Error && cause.name !== "TimeoutError" ? cause.message : "Sunny took too long to respond. Please try again."); }
    finally { setPending(false); }
  }
  return <section className="chat-card content-card"><div className="chat-header"><MessageCircleHeart size={32} /><div><h2>Sunny</h2><p>Your records, explained simply</p></div></div>
    <div className="chat-messages" role="log" aria-label="Conversation with Sunny" aria-live="polite"><div className="chat-bubble companion-bubble"><p>Ask about today’s medication confirmations, appointments, care circle, or Care Points. Each question checks the selected care space again.</p></div>{messages.map((m,i) => <div key={i} className={`chat-message-row ${m.from === "you" ? "message-you" : ""}`}><div className={`chat-bubble ${m.from === "you" ? "you-bubble" : "companion-bubble"}`}><span className="visually-hidden">{m.from === "you" ? "You: " : "Sunny: "}</span><p>{m.text}</p>{m.source && <small>{m.source}</small>}</div></div>)}{pending && <p role="status">Sunny is checking your records…</p>}</div>
    <div className="suggested-questions"><span>YOU CAN ASK</span><div>{["Have I taken all my medicines today?", "What medication is scheduled next?", "When is my next appointment?", "How many Care Points have I earned?"].map(q => <button key={q} disabled={pending || !patientId} onClick={() => void send(q)}>{q}</button>)}</div></div>
    <form className="chat-input-form" onSubmit={e => { e.preventDefault(); void send(text); }}><label htmlFor="sunny-message">Message Sunny</label><input id="sunny-message" maxLength={1200} value={text} onChange={e => setText(e.target.value)} required aria-describedby="sunny-privacy" /><button className="button button-primary" disabled={pending || !text.trim()}>{pending ? "Checking…" : "Send"}</button></form>
    {error && <p role="alert" className="form-error">{error}</p>}<div className="care-form-actions"><Link className="button button-outline" href="/medications">View medications</Link><Link className="button button-outline" href="/appointments">View appointments</Link><Link className="button button-danger" href="/emergency"><ShieldAlert size={24} /> Emergency support / contacts</Link></div>
    <p id="sunny-privacy" className="chat-disclaimer">Your question and selected care context are processed by Adaption. Chats are not saved by CAREQUEST. Sunny cannot diagnose, prescribe, change records, or dispatch help. For symptoms, contact your healthcare professional.</p>
  </section>;
}
export function CompanionPage() {
  const { state } = useCare();
  return <div className="page-stack"><SyncStatus /><div className="page-heading"><div><span className="page-eyebrow">A FRIENDLY FACE IN YOUR CORNER</span><h1>Your wellness companion</h1><p>{state.patient ? `Care space: ${state.patient.display_name}` : "Choose an approved care space to ask about saved records."}</p></div></div><PatientSelector /><Conversation key={state.patient?.id ?? "none"} patientId={state.patient?.id ?? null} /></div>;
}
