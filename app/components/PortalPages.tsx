"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Flower2,
  Heart,
  HeartHandshake,
  MapPin,
  MessageCircleHeart,
  MoreHorizontal,
  Pill,
  Plus,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  Upload,
  UsersRound,
  X,
} from "lucide-react";

type Medication = {
  id: string;
  name: string;
  dose: string;
  time: string;
  instruction: string;
  color: string;
  status?: "taken" | "upcoming";
};

const demoMeds: Medication[] = [
  { id: "vitamin", name: "Vitamin D3", dose: "1 softgel · 1000 IU", time: "8:00 AM", instruction: "With breakfast", color: "gold", status: "taken" },
  { id: "metoprolol", name: "Metoprolol", dose: "1 tablet · 25 mg", time: "12:00 PM", instruction: "After lunch", color: "blue", status: "upcoming" },
  { id: "calcium", name: "Calcium supplement", dose: "1 tablet · 500 mg", time: "6:00 PM", instruction: "With dinner", color: "lavender" },
];

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

function MedicationCards({ compact = false }: { compact?: boolean }) {
  const [taken, setTaken] = useState(() => new Set(demoMeds.filter((med) => med.status === "taken").map((med) => med.id)));

  return (
    <div className={`medication-list ${compact ? "medication-list-compact" : ""}`}>
      {demoMeds.map((med) => {
        const isTaken = taken.has(med.id);
        return (
          <article className={`medication-row ${isTaken ? "medication-is-taken" : ""}`} key={med.id}>
            <span className={`medication-symbol ${med.color}`}><Pill size={19} /></span>
            <div className="medication-detail">
              <div className="med-name-line"><h3>{med.name}</h3>{isTaken && <span className="status-taken"><Check size={12} /> Taken</span>}</div>
              <p>{med.dose}</p>
              <span className="med-instruction"><Clock3 size={13} /> {med.time} <span>·</span> {med.instruction}</span>
            </div>
            <button
              className={`button ${isTaken ? "button-complete" : "button-outline"}`}
              type="button"
              onClick={() => setTaken((previous) => {
                const next = new Set(previous);
                if (next.has(med.id)) next.delete(med.id);
                else next.add(med.id);
                return next;
              })}
            >
              {isTaken ? <><Check size={15} /> Taken</> : <><CheckCircle2 size={15} /> Mark taken</>}
            </button>
          </article>
        );
      })}
    </div>
  );
}

function DashboardProgress({ complete = 2 }: { complete?: number }) {
  return (
    <div className="progress-card">
      <div className="progress-main">
        <div><span className="small-overline">DAILY MEDICATION ROUTINE</span><h3>You&apos;re building a lovely rhythm</h3><p>{complete} of 3 moments completed today</p></div>
        <span className="progress-count">{Math.round((complete / 3) * 100)}<small>%</small></span>
      </div>
      <div className="wide-progress"><span style={{ width: `${Math.round((complete / 3) * 100)}%` }} /></div>
      <div className="progress-foot"><span><Check size={13} /> Morning</span><span className={complete < 2 ? "progress-pending" : ""}><Check size={13} /> Midday</span><span className="progress-pending"><Clock3 size={13} /> Evening</span></div>
    </div>
  );
}

function MiniGarden({ large = false }: { large?: boolean }) {
  return (
    <div className={`mini-garden ${large ? "mini-garden-large" : ""}`}>
      <div className="garden-sun"><Sun size={large ? 24 : 18} /></div>
      <span className="garden-cloud cloud-one" /><span className="garden-cloud cloud-two" />
      <div className="garden-hill hill-back" />
      <div className="garden-hill hill-front" />
      <div className="garden-plant plant-left"><span className="stem" /><span className="leaflet leaf-left" /><span className="leaflet leaf-right" /><Flower2 className="blossom" size={large ? 33 : 26} /></div>
      <div className="garden-plant plant-mid"><span className="stem" /><span className="leaflet leaf-left" /><span className="leaflet leaf-right" /><Flower2 className="blossom" size={large ? 42 : 30} /></div>
      <div className="garden-plant plant-right"><span className="stem" /><span className="leaflet leaf-left" /><span className="leaflet leaf-right" /><Flower2 className="blossom" size={large ? 30 : 23} /></div>
      <span className="garden-ground-flower flower-dot-one">✿</span><span className="garden-ground-flower flower-dot-two">✿</span>
      <div className="garden-quote"><span>✦</span> Every small step helps something grow.</div>
    </div>
  );
}

function AppointmentCard({ detail = false }: { detail?: boolean }) {
  return (
    <article className={`appointment-card ${detail ? "appointment-card-detail" : ""}`}>
      <div className="appointment-date"><span>OCT</span><strong>28</strong></div>
      <div className="appointment-info"><h3>Dr. Maya Patel</h3><p>Primary care · Annual wellness check</p><span><Clock3 size={13} /> Tuesday, 10:30 AM <span>·</span> In person</span></div>
      <Link href="/appointments" className="appointment-arrow" aria-label="View appointment"><ChevronRight size={18} /></Link>
    </article>
  );
}

export function ElderlyDashboard() {
  return (
    <div className="page-stack">
      <DemoNotice />
      <PageHeading eyebrow="MONDAY, OCTOBER 21" title="Good morning, Eleanor ☀️" description="A fresh day is a fresh start. You’re doing great." action={<button className="icon-button" aria-label="Notifications"><Bell size={19} /><i /></button>} />
      <DashboardProgress />
      <div className="dashboard-grid">
        <section className="content-card meds-panel">
          <SectionTitle title="Today’s medications" link="View schedule" href="/medications" />
          <p className="card-subtitle">A little reminder for your daily routine.</p>
          <MedicationCards compact />
        </section>
        <section className="garden-card">
          <div className="garden-card-head"><span className="garden-badge"><Sprout size={16} /></span><span>YOUR WELLNESS GARDEN</span><Link href="/garden" aria-label="View wellness garden"><ArrowUpRight size={17} /></Link></div>
          <MiniGarden />
          <div className="garden-card-bottom"><div><strong>2 care points today</strong><span>Your garden is blooming!</span></div><Link href="/garden">Visit garden <ArrowRight size={14} /></Link></div>
        </section>
      </div>
      <div className="dashboard-grid lower-grid">
        <section className="content-card companion-teaser">
          <div className="teaser-icon"><MessageCircleHeart size={22} /></div>
          <div className="teaser-copy"><span className="small-overline">HERE FOR YOU</span><h2>A listening ear, anytime.</h2><p>Ask a wellness question or simply say hello to your companion.</p><Link className="button button-primary" href="/companion">Chat with your companion <ArrowRight size={15} /></Link></div>
          <div className="teaser-sparkle">✦</div>
        </section>
        <section className="content-card next-appointment">
          <SectionTitle title="Coming up" link="All appointments" href="/appointments" />
          <AppointmentCard />
          <div className="care-points"><span className="points-icon"><Sparkles size={17} /></span><div><strong>12 care points</strong><small>Every little step adds up.</small></div><span className="points-week">+3 this week <ArrowUpRight size={13} /></span></div>
        </section>
      </div>
      <EmergencyBanner />
    </div>
  );
}

function AdherenceChart() {
  const data = [
    { day: "M", value: 78 }, { day: "T", value: 92 }, { day: "W", value: 70 },
    { day: "T", value: 100 }, { day: "F", value: 86 }, { day: "S", value: 94 }, { day: "S", value: 58 },
  ];
  return (
    <div className="chart-area" aria-label="Weekly medication adherence chart">
      <div className="chart-y-labels"><span>100%</span><span>75%</span><span>50%</span><span>25%</span></div>
      <div className="chart-bars">{data.map(({ day, value }, i) => <div className="chart-day" key={`${day}-${i}`}><div className="bar-track"><span className={i === 6 ? "bar-current" : ""} style={{ height: `${value}%` }} /></div><small>{day}</small></div>)}</div>
    </div>
  );
}

export function CaregiverDashboard() {
  return (
    <div className="page-stack">
      <DemoNotice />
      <PageHeading eyebrow="YOUR CARE CIRCLE" title="A little peace of mind." description="A clear view of Eleanor’s week, at a glance." action={<button className="button button-outline" type="button"><CalendarDays size={16} /> This week <ChevronRight size={14} /></button>} />
      <div className="caregiver-profile content-card">
        <span className="large-avatar">EW</span><div className="caregiver-person"><span className="small-overline">ELDERLY USER · DEMO PROFILE</span><h2>Eleanor Williams</h2><p><MapPin size={14} /> Portland, Oregon <span>·</span> Your mother</p></div>
        <span className="profile-healthy"><span /> Doing well today</span>
        <Link className="profile-view" href="/dashboard">View Eleanor’s day <ArrowRight size={15} /></Link>
      </div>
      <div className="metric-grid">
        <article className="metric-card"><span className="metric-icon teal"><Pill size={18} /></span><span className="small-overline">MEDICATIONS TODAY</span><strong>2 <small>/ 3</small></strong><span className="metric-note">doses recorded in demo</span></article>
        <article className="metric-card"><span className="metric-icon green"><Activity size={18} /></span><span className="small-overline">WEEKLY ADHERENCE</span><strong>83<small>%</small></strong><span className="metric-note"><ArrowUpRight size={13} /> 6% from last week</span></article>
        <article className="metric-card"><span className="metric-icon violet"><Sparkles size={18} /></span><span className="small-overline">CARE POINTS</span><strong>12</strong><span className="metric-note">little wins this week</span></article>
      </div>
      <div className="dashboard-grid caregiver-main-grid">
        <section className="content-card adherence-card"><div className="section-title"><h2>Weekly medication adherence</h2><button className="more-button" aria-label="More chart options"><MoreHorizontal size={20} /></button></div><p className="card-subtitle">A gentle overview of this week’s routine.</p><div className="chart-legend"><span /><small>Medication routine complete</small></div><AdherenceChart /></section>
        <section className="content-card caregiver-reminders"><SectionTitle title="Quick actions" /><Link className="quick-action" href="/medications"><span className="action-icon teal"><Pill size={17} /></span><span><strong>Manage medications</strong><small>Review the daily schedule</small></span><ChevronRight size={17} /></Link><Link className="quick-action" href="/scanner"><span className="action-icon lilac"><ScanLine size={17} /></span><span><strong>Prescription scanner</strong><small>Choose a file to preview</small></span><ChevronRight size={17} /></Link><Link className="quick-action" href="/appointments"><span className="action-icon peach"><CalendarClock size={17} /></span><span><strong>Appointments</strong><small>Next visit · Oct 28</small></span><ChevronRight size={17} /></Link></section>
      </div>
      <div className="dashboard-grid lower-grid">
        <section className="content-card"><SectionTitle title="Upcoming appointment" link="See calendar" href="/appointments" /><AppointmentCard /></section>
        <section className="content-card emergency-contact-card"><SectionTitle title="Emergency contact" /><div className="contact-row"><span className="contact-avatar">JW</span><div><strong>James Williams</strong><small>Primary contact · Son</small></div><a href="tel:+15550102024" className="call-small">Call</a></div><div className="contact-phone"><span>Phone number</span><strong>+1 (555) 010-2024 <span>· Demo</span></strong></div><Link href="/emergency" className="contact-emergency-link"><ShieldAlert size={15} /> Open emergency support</Link></section>
      </div>
    </div>
  );
}

export function MedicationsPage() {
  return (
    <div className="page-stack">
      <DemoNotice>Fictional medication list · Button changes are temporary and not saved.</DemoNotice>
      <PageHeading eyebrow="YOUR DAILY ROUTINE" title="Medications" description="Your routine, made a little easier to follow." action={<button className="button button-primary" type="button" onClick={() => window.alert("This frontend preview does not save medication changes.")}><Plus size={17} /> Add medication</button>} />
      <div className="medication-summary content-card"><div className="summary-icon"><Sun size={21} /></div><div><strong>Monday, October 21</strong><p>Take each medication as prescribed by your healthcare professional.</p></div><span className="summary-total"><strong>2 of 3</strong><small>completed today</small></span></div>
      <section className="content-card full-medication-panel"><SectionTitle title="Today’s schedule" /><p className="card-subtitle">Tap “Mark taken” to preview your daily progress. Changes stay on this page only.</p><MedicationCards /></section>
      <div className="info-note"><ShieldCheck size={18} /><p><strong>A gentle reminder</strong> Always follow the instructions provided by your doctor or pharmacist. CareQuest is a demo and doesn’t provide medical advice.</p></div>
      <section className="content-card past-routines"><SectionTitle title="Routine overview" /><div className="routine-line"><span>Morning</span><div><CheckCheck size={16} /> Vitamin D3</div><strong className="routine-done">Complete</strong></div><div className="routine-line"><span>Midday</span><div><Pill size={16} /> Metoprolol</div><strong className="routine-due">Up next</strong></div><div className="routine-line"><span>Evening</span><div><Pill size={16} /> Calcium supplement</div><strong className="routine-pending">Upcoming</strong></div></section>
    </div>
  );
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
          <input ref={inputRef} type="file" accept="image/*,.pdf" className="visually-hidden" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} />
          <button className="button button-primary button-large" type="button" onClick={() => inputRef.current?.click()}><Upload size={17} /> Choose a file</button>
          <span className="scanner-types">Image or PDF · No file is sent</span>
          {fileName && <div className="selected-file"><CheckCircle2 size={16} /><span>Selected locally: <strong>{fileName}</strong></span><button aria-label="Clear selected file" onClick={() => { setFileName(""); if (inputRef.current) inputRef.current.value = ""; }}><X size={15} /></button></div>}
        </section>
        <aside className="scanner-side">
          <div className="content-card scanner-explainer"><span className="small-overline">HOW IT COULD HELP</span><h3>Keep medication details close</h3><ul><li><Check size={15} /> Review a prescription together</li><li><Check size={15} /> Organize questions for a pharmacist</li><li><Check size={15} /> Keep your care circle informed</li></ul></div>
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
        <div className="garden-showcase-copy"><span className="small-overline">ELEANOR’S GARDEN · DEMO</span><h2>Look how far you’ve grown!</h2><p>Each time you complete a routine, you nurture your garden. Little steps make a lovely difference.</p><div className="garden-stage-status"><Flower2 size={17} /><span>Your garden is <strong>{stages[stage].toLowerCase()}</strong></span></div><div className="stage-progress">{stages.map((label, index) => <div className={`stage-item ${index <= stage ? "stage-complete" : ""}`} key={label}><span>{index < stage ? <Check size={12} /> : index + 1}</span><small>{label}</small></div>)}</div></div>
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
        <div className="chat-messages" aria-live="polite">
          <span className="chat-time">TODAY · 9:41 AM</span>
          <div className="chat-message-row"><span className="chat-small-avatar"><Sparkles size={14} /></span><div className="chat-bubble companion-bubble"><p>Good morning, Eleanor! ☀️</p><p>I’m Sunny, your friendly wellness companion. I can help you find information in this demo or just have a chat. What’s on your mind?</p><small>9:41 AM</small></div></div>
          {messages.map((message, index) => (
            <div className={`chat-message-row ${message.from === "you" ? "message-you" : ""}`} key={`${message.from}-${index}`}>
              {message.from === "companion" && <span className="chat-small-avatar"><Sparkles size={14} /></span>}
              <div className={`chat-bubble ${message.from === "you" ? "you-bubble" : "companion-bubble"}`}>
                {message.from === "you" ? <p>{message.text}</p> : <><p><CompanionReply question={message.text} /></p><small>Sample response · Not medical advice</small></>}
              </div>
            </div>
          ))}
        </div>
        <div className="suggested-questions"><span>YOU CAN ASK</span><div>{suggestions.map((question) => <button key={question} onClick={() => sendMessage(question)}>{question}<ArrowUpRight size={13} /></button>)}</div></div>
        <form className="chat-input-form" onSubmit={handleSubmit}><input aria-label="Message Sunny" value={text} onChange={(event) => setText(event.target.value)} placeholder="Write a message..." /><button className="button button-primary" type="submit" disabled={!text.trim()}>Send <ArrowRight size={15} /></button></form>
        <p className="chat-disclaimer">Sunny is a demo companion, not a medical professional. For medical advice, please contact your healthcare provider.</p>
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

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const [message, setMessage] = useState("");
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("This is a frontend preview. No account was created and no information was sent or saved.");
  }
  const signingUp = mode === "signup";
  return (
    <main className="auth-page">
      <div className="auth-art"><Link className="brand" href="/"><span className="brand-mark"><Heart size={20} fill="currentColor" /></span><span>carequest</span></Link><div className="auth-art-copy"><span className="eyebrow">A LITTLE MORE CARE, EVERY DAY</span><h1>Every Dose Counts.<br /><span>Every Day Matters.</span></h1><p>Feel supported in your routine, and connected to the people who care.</p><div className="auth-art-garden"><MiniGarden large /></div></div><span className="auth-art-foot">A thoughtful frontend demo · Fictional data</span></div>
      <section className="auth-main"><Link className="auth-back" href="/">← Back to home</Link><div className="auth-form-wrap"><span className="auth-form-kicker">{signingUp ? "A WARM WELCOME" : "WELCOME BACK"}</span><h2>{signingUp ? "Create your care space" : "Good to see you again"}</h2><p className="auth-subtitle">{signingUp ? "A few details to get started." : "Sign in to your CareQuest space."}</p><DemoNotice>Frontend preview · No accounts or data are stored.</DemoNotice>
      <form className="auth-form" onSubmit={handleSubmit}>{signingUp && <label>Your name<input name="name" autoComplete="name" placeholder="Eleanor Williams" required /></label>}<label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label><label>Password<input name="password" type="password" autoComplete={signingUp ? "new-password" : "current-password"} placeholder="At least 8 characters" minLength={8} required /></label>{signingUp && <label className="auth-role-label">I’m joining as<select defaultValue="elderly"><option value="elderly">An older adult</option><option value="caregiver">A caregiver</option></select></label>}<button type="submit" className="button button-primary button-large auth-submit">{signingUp ? "Create demo account" : "Sign in"} <ArrowRight size={16} /></button>{message && <p className="auth-message" role="status">{message}</p>}</form>
      <p className="auth-switch">{signingUp ? "Already have a care space?" : "New to CareQuest?"} <Link href={signingUp ? "/login" : "/signup"}>{signingUp ? "Log in" : "Create an account"}</Link></p><div className="auth-safety"><ShieldCheck size={16} /> This prototype doesn’t process or store account details.</div></div></section>
    </main>
  );
}
