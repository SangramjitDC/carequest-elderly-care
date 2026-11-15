"use client";

import Link from "next/link";
import { MiniGarden } from "./GardenArt";
import { LiveMedicationCards as MedicationCards } from "./LiveCare";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, CalendarClock, CalendarDays, Check, CheckCircle2, CircleHelp, Clock3, Flower2, Heart, HeartHandshake, MapPin, MessageCircleHeart, Pill, Plus, ScanLine, ShieldAlert, ShieldCheck, Sparkles, Sprout, Upload, UsersRound, X } from "lucide-react";

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="page-heading">
      <div><span className="page-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
      {action}
    </div>
  );
}

function DemoNotice({ children = "Fictional demo data · Nothing here is saved or sent." }: { children?: ReactNode }) {
  return <div className="demo-notice"><Sparkles size={15} /><span>{children}</span></div>;
}

function SectionTitle({ title, link, href }: { title: string; link?: string; href?: string }) {
  return <div className="section-title"><h2>{title}</h2>{link && href && <Link href={href}>{link}<ArrowRight size={15} /></Link>}</div>;
}

export function PrescriptionScannerPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");

  return (
    <div className="page-stack">
      <DemoNotice>File selection preview only · No upload, scan, or data extraction occurs.</DemoNotice>
      <PageHeading eyebrow="A HELPFUL SHORTCUT" title="Prescription scanner" description="Select a prescription image to preview the frontend upload experience." />
      <div className="scanner-layout">
        <section className="content-card scanner-card">
          <span className="scanner-symbol"><ScanLine size={26} /></span><h2>Bring your prescription into view</h2><p>Choose an image or PDF from this device. In this prototype, the file is only selected locally—it isn’t uploaded or read.</p>
          <input ref={inputRef} type="file" aria-label="Choose a prescription image or PDF" tabIndex={-1} accept="image/*,.pdf" className="visually-hidden" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} />
          <button className="button button-primary button-large" type="button" onClick={() => inputRef.current?.click()}><Upload size={17} /> Choose a file</button>
          <span className="scanner-types">Image or PDF · No file is sent</span>
          {fileName && <div className="selected-file" role="status"><CheckCircle2 size={16} /><span>Selected locally: <strong>{fileName}</strong></span><button aria-label="Clear selected file" onClick={() => { setFileName(""); if (inputRef.current) inputRef.current.value = ""; }}><X size={15} /></button></div>}
        </section>
        <aside className="scanner-side">
          <div className="content-card scanner-explainer"><span className="small-overline">HOW IT COULD HELP</span><h2>Keep medication details close</h2><ul><li><Check size={15} /> Review a prescription together</li><li><Check size={15} /> Organize questions for a pharmacist</li><li><Check size={15} /> Keep your care circle informed</li></ul></div>
          <div className="info-note"><ShieldCheck size={18} /><p><strong>Your privacy matters.</strong> This prototype doesn’t upload or process files.</p></div>
        </aside>
      </div>
      <section className="content-card"><SectionTitle title="Your medication list" link="Review routine" href="/medications" /><p className="card-subtitle">Selected prescriptions won’t change this fictional list.</p><MedicationCards compact /></section>
    </div>
  );
}

export function WellnessGardenPage() {
  const [stage, setStage] = useState(3);
  const stages = ["Seed", "Sprout", "Growing", "Blooming"];
  return (
    <div className="page-stack">
      <DemoNotice>Garden progress is a visual demo and doesn’t persist after you leave this page.</DemoNotice>
      <PageHeading eyebrow="GROW AT YOUR OWN PACE" title="Your wellness garden" description="Every caring choice helps your little garden grow." action={<span className="care-point-chip"><Sparkles size={16} /> 12 care points</span>} />
      <section className="garden-showcase content-card">
        <div className="garden-showcase-copy"><span className="small-overline">ELEANOR’S GARDEN · DEMO</span><h2>Look how far you’ve grown!</h2><p>Each time you complete a routine, you nurture your garden. Little steps make a lovely difference.</p><div className="garden-stage-status" role="status"><Flower2 size={17} /><span>Your garden is <strong>{stages[stage].toLowerCase()}</strong></span></div><div className="stage-progress">{stages.map((label, index) => <div className={`stage-item ${index <= stage ? "stage-complete" : ""}`} key={label} aria-current={index === stage ? "step" : undefined}><span>{index < stage ? <Check size={12} /> : index + 1}</span><small>{label}</small></div>)}</div></div>
        <MiniGarden large />
      </section>
      <section className="content-card garden-actions-panel"><SectionTitle title="Grow a little more today" /><p className="card-subtitle">Try a demo action to preview the growth stages. This won’t save or change medication records.</p><div className="garden-action-grid"><button onClick={() => setStage(Math.min(stage + 1, 3))} className="garden-action"><span className="garden-action-icon"><Pill size={18} /></span><strong>Complete a care step</strong><small>Water your garden with one small step</small><span className="garden-action-arrow"><ArrowUpRight size={16} /></span></button><button onClick={() => setStage(Math.max(stage - 1, 0))} className="garden-action"><span className="garden-action-icon lilac"><Sprout size={18} /></span><strong>See an earlier stage</strong><small>Explore your garden’s journey</small><span className="garden-action-arrow"><ArrowDownRight size={16} /></span></button></div></section>
      <div className="garden-footnote"><Heart size={16} /> Your wellbeing matters more than a streak. Go gently, one day at a time.</div>
    </div>
  );
}

type ChatMessage = { from: "companion" | "you"; text: string };
const suggestions = ["How can I sleep better?", "What medication is scheduled next?", "How am I doing this week?", "When is my next appointment?"];

function CompanionReply({ question }: { question: string }) {
  if (question.toLowerCase().includes("medication") || question.toLowerCase().includes("next")) return <>Your demo schedule shows <strong>Metoprolol at 12:00 PM</strong>. Please check the label and follow your healthcare professional’s instructions.</>;
  if (question.toLowerCase().includes("appointment")) return <>Your next demo appointment is with <strong>Dr. Maya Patel on October 28 at 10:30 AM</strong>.</>;
  if (question.toLowerCase().includes("week")) return <>Your demo routine shows <strong>12 care points</strong> and an 83% weekly adherence overview. Every small step counts.</>;
  return <>A steady bedtime, a relaxing wind-down, and limiting late-day caffeine may support better sleep. If sleep concerns persist, consider talking with your healthcare professional.</>;
}

export function CompanionPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed) return;
    setMessages((current) => [...current, { from: "you", text: trimmed }, { from: "companion", text: trimmed }]);
    setText("");
  }
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(text);
  }
  return (
    <div className="page-stack">
      <DemoNotice>Companion responses are canned frontend examples · No AI service or health record is connected.</DemoNotice>
      <PageHeading eyebrow="A FRIENDLY FACE IN YOUR CORNER" title="Your wellness companion" description="A kind place to ask everyday wellness questions." />
      <section className="chat-card content-card">
        <div className="chat-header"><span className="companion-avatar"><MessageCircleHeart size={23} /></span><div><h2>Sunny</h2><p><span /> Here with you · Demo companion</p></div><span className="chat-header-right"><ShieldCheck size={15} /> Private preview</span></div>
        <div className="chat-messages" role="log" aria-label="Conversation with Sunny" aria-live="polite" aria-relevant="additions">
          <span className="chat-time">TODAY · 9:41 AM</span>
          <div className="chat-message-row"><span className="chat-small-avatar"><Sparkles size={14} /></span><div className="chat-bubble companion-bubble"><span className="visually-hidden">Sunny says: </span><p>Good morning, Eleanor! ☀️</p><p>I’m Sunny, your friendly wellness companion. I can help you find information in this demo or just have a chat. What’s on your mind?</p><small>9:41 AM</small></div></div>
          {messages.map((message, index) => (
            <div className={`chat-message-row ${message.from === "you" ? "message-you" : ""}`} key={`${message.from}-${index}`}>
              {message.from === "companion" && <span className="chat-small-avatar"><Sparkles size={14} /></span>}
              <div className={`chat-bubble ${message.from === "you" ? "you-bubble" : "companion-bubble"}`}>
                <span className="visually-hidden">{message.from === "you" ? "You say: " : "Sunny says: "}</span>
                {message.from === "you" ? <p>{message.text}</p> : <><p><CompanionReply question={message.text} /></p><small>Sample response · Not medical advice</small></>}
              </div>
            </div>
          ))}
        </div>
        <div className="suggested-questions"><span>YOU CAN ASK</span><div>{suggestions.map((question) => <button key={question} onClick={() => sendMessage(question)}>{question}<ArrowUpRight size={13} /></button>)}</div></div>
        <form className="chat-input-form" onSubmit={handleSubmit}><label htmlFor="companion-message">Message Sunny</label><input id="companion-message" aria-describedby="companion-disclaimer" value={text} onChange={(event) => setText(event.target.value)} placeholder="Write a message..." /><button className="button button-primary" type="submit" disabled={!text.trim()}>Send <ArrowRight size={15} /></button></form>
        <p id="companion-disclaimer" className="chat-disclaimer">Sunny is a demo companion, not a medical professional. For medical advice, please contact your healthcare provider.</p>
      </section>
    </div>
  );
}

export function AppointmentsPage() {
  return (
    <div className="page-stack">
      <DemoNotice>Fictional appointment details · Nothing here is booked or synced.</DemoNotice>
      <PageHeading eyebrow="A MOMENT FOR YOUR WELLBEING" title="Appointments" description="Keep the next important moment in view." action={<button className="button button-primary" type="button" onClick={() => window.alert("Appointment booking is not connected in this frontend preview.")}><Plus size={17} /> Add appointment</button>} />
      <section className="content-card appointment-feature"><div className="appointment-feature-head"><span className="next-visit-label"><CalendarClock size={15} /> NEXT VISIT</span><span className="appointment-demo-tag">DEMO APPOINTMENT</span></div><div className="appointment-feature-body"><div className="appointment-big-date"><span>OCTOBER</span><strong>28</strong><small>TUESDAY</small></div><div className="appointment-feature-info"><h2>Annual wellness check</h2><p>Dr. Maya Patel · Primary care</p><span><Clock3 size={15} /> 10:30 AM <span>·</span> In person</span><span><MapPin size={15} /> Rosewood Family Clinic</span><div className="appointment-actions"><a className="button button-primary" href="https://maps.google.com/?q=Rosewood+Family+Clinic" target="_blank" rel="noreferrer"><MapPin size={15} /> View directions</a><button className="button button-outline" onClick={() => window.alert("Appointment details are fictional and not connected to a calendar.")}>Appointment details</button></div></div><div className="appointment-illustration"><CalendarDays size={52} /><Heart size={19} fill="currentColor" /></div></div></section>
      <div className="dashboard-grid lower-grid"><section className="content-card"><SectionTitle title="Your care team" /><div className="doctor-row"><span className="doctor-avatar">MP</span><div><strong>Dr. Maya Patel</strong><small>Primary care · Rosewood Family Clinic</small></div><a href="tel:+15550101300" className="call-small">Call clinic</a></div><p className="appointment-help"><CircleHelp size={15} /> Contact the clinic directly to confirm or change a real appointment.</p></section><section className="content-card appointment-prep"><SectionTitle title="A little preparation" /><ul><li><CheckCircle2 size={16} /> Bring your current medication list</li><li><CheckCircle2 size={16} /> Write down any questions</li><li><CheckCircle2 size={16} /> Ask your clinic what else to bring</li></ul></section></div>
    </div>
  );
}

function EmergencyBanner() {
  return <Link className="emergency-banner" href="/emergency"><span className="emergency-banner-icon"><ShieldAlert size={20} /></span><span><strong>Need urgent help?</strong><small>Your emergency support options are here.</small></span><span className="emergency-banner-cta">Open emergency support <ArrowRight size={15} /></span></Link>;
}

export function EmergencyPage() {
  return (
    <div className="page-stack emergency-page">
      <DemoNotice>Emergency contacts shown are fictional demo information. This page does not dispatch help.</DemoNotice>
      <div className="emergency-heading"><span className="emergency-heading-icon"><ShieldAlert size={23} /></span><div><span className="page-eyebrow">HELP IS WITHIN REACH</span><h1>Emergency support</h1><p>If you may be in immediate danger, call your local emergency number now.</p></div></div>
      <div className="emergency-callout"><span><HeartHandshake size={20} /></span><p><strong>Are you experiencing a medical emergency?</strong> Don’t wait for this app. Contact emergency services in your area immediately.</p></div>
      <div className="emergency-options">
        <article className="emergency-option emergency-option-main"><span className="emergency-option-icon"><ShieldAlert size={22} /></span><span className="emergency-option-label">IMMEDIATE HELP</span><h2>Call emergency services</h2><p>Contact the emergency service for your location. In the U.S. and Canada, call 911.</p><a className="button button-danger button-large" href="tel:911">Call 911 <ArrowUpRight size={16} /></a><small>Only use for a real emergency. Your device will place the call.</small></article>
        <article className="emergency-option"><span className="emergency-option-icon caregiver"><UsersRound size={22} /></span><span className="emergency-option-label">YOUR CARE CIRCLE</span><h2>Contact your caregiver</h2><p>Call your listed primary contact for a familiar voice and support.</p><a className="button button-primary button-large" href="tel:+15550102024"><Heart size={16} /> Call James · Demo</a><small>James Williams · +1 (555) 010-2024 (fictional)</small></article>
        <article className="emergency-option"><span className="emergency-option-icon hospital"><MapPin size={22} /></span><span className="emergency-option-label">FIND LOCAL CARE</span><h2>Nearby hospitals</h2><p>Open a map search to find emergency departments near your current location.</p><a className="button button-outline button-large" href="https://maps.google.com/?q=emergency+hospital+near+me" target="_blank" rel="noreferrer"><MapPin size={16} /> Search nearby hospitals <ArrowUpRight size={16} /></a><small>Map results depend on your device and location settings.</small></article>
      </div>
      <div className="emergency-footnote"><ShieldCheck size={17} /><span>CareQuest is a frontend demonstration and cannot monitor emergencies, contact caregivers, or dispatch services automatically.</span></div>
    </div>
  );
}

