import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Heart,
  HeartHandshake,
  Leaf,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

const highlights = [
  {
    icon: Heart,
    title: "Care that feels personal",
    description:
      "A calm, easy-to-use daily view designed to make every routine feel manageable.",
  },
  {
    icon: HeartHandshake,
    title: "Together, from anywhere",
    description:
      "Give family caregivers a clearer picture of the little things that matter.",
  },
  {
    icon: Leaf,
    title: "Small steps, celebrated",
    description:
      "Turn a steady medication routine into a garden that grows one day at a time.",
  },
];

const steps = [
  {
    icon: Heart,
    title: "Create Your Account",
    description: "Choose Elderly User or Caregiver when you create your CAREQUEST account.",
  },
  {
    icon: UsersRound,
    title: "Connect Your Care Circle",
    description:
      "Share your Care ID with a trusted caregiver. They request access, and you approve it before they can view your care information.",
  },
  {
    icon: MessageCircleHeart,
    title: "Manage Care Together",
    description:
      "Track medications, review appointments, ask Sunny about authorized care records, and follow daily progress.",
  },
];

const faqs = [
  {
    question: "What is CAREQUEST?",
    answer:
      "CAREQUEST is an AI-powered elderly care companion that helps older adults manage medication routines, track appointments, monitor daily progress, and stay connected with trusted caregivers.",
  },
  {
    question: "Who can use CAREQUEST?",
    answer: (
      <>
        <p><strong>Elderly Users</strong> can view medication schedules, confirm doses, track progress, manage appointments, and chat with Sunny.</p>
        <p><strong>Caregivers</strong> can support approved elderly users, manage medication schedules with permission, review prescriptions, and monitor care activities.</p>
      </>
    ),
  },
  {
    question: "How do elderly users connect with caregivers?",
    answer:
      "Every elderly user has a unique Care ID to share with a trusted caregiver. The caregiver enters the ID and requests access. The elderly user must approve the request before the caregiver can access their care information.",
  },
  {
    question: "Can one caregiver support multiple elderly people?",
    answer:
      "Yes. Caregivers can connect with multiple elderly users and manage each person’s information separately.",
  },
  {
    question: "What is Sunny, the AI Wellness Companion?",
    answer:
      "Sunny is CAREQUEST’s AI-powered assistant, built using Adaption Labs. Sunny can answer questions about recorded medications, appointments, caregiver connections, and Care Points using authorized care records. Sunny does not diagnose illnesses or prescribe medication.",
  },
  {
    question: "Who can use the AI Prescription Scanner?",
    answer:
      "Approved caregivers with medication management permission can use the scanner to upload a prescription image, review AI-extracted details, correct errors, and create a medication schedule. Always check AI-extracted information against the original prescription before saving.",
  },
  {
    question: "How does the Wellness Garden work?",
    answer:
      "Eligible confirmed doses earn Care Points once their scheduled time arrives, helping the garden grow. The garden celebrates progress in tracking medication routines; it does not measure medical recovery. Never take extra medicine to earn points.",
  },
  {
    question: "Does CAREQUEST send medication reminders?",
    answer:
      "CAREQUEST provides in-app reminders for upcoming medications and appointments while the application is open. Email, SMS, and push notifications are not currently available.",
  },
  {
    question: "Can caregivers access information without permission?",
    answer:
      "No. Caregivers must receive approval from the elderly user. Access is controlled through permissions and protected database policies.",
  },
  {
    question: "What happens during a medical emergency?",
    answer:
      "CAREQUEST provides an Emergency Support section with saved emergency contacts and calling options. The application does not automatically contact emergency services. Call your local emergency number directly when immediate assistance is needed.",
  },
];

export default function Home() {
  return (
    <main className="landing">
      <header className="landing-nav">
        <Link className="brand" href="/">
          <span className="brand-mark"><Heart size={20} fill="currentColor" /></span>
          <span>carequest</span>
        </Link>
        <nav className="landing-links" aria-label="Main navigation">
          <a href="#how-carequest-works">How it works</a>
          <a href="#how-it-helps">Features</a>
          <a href="#faq">FAQs</a>
          <a href="#for-families">For families</a>
        </nav>
        <div className="landing-actions">
          <Link className="text-link" href="/login">Log in</Link>
          <Link className="button button-primary nav-cta" href="/signup">
            Get started <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> A little more care, every day</div>
          <h1>Feel good about<br /><span>every day.</span></h1>
          <p className="hero-tagline">Every Dose Counts. Every Day Matters.</p>
          <p className="hero-description">
            A kinder way to stay on top of medications, wellness, and the people
            who care about you.
          </p>
          <div className="hero-actions">
            <Link href="/dashboard" className="button button-primary button-large">
              Explore the dashboard <ArrowRight size={18} />
            </Link>
            <Link href="/caregiver" className="button button-soft button-large">
              Caregiver view
            </Link>
          </div>
          <div className="hero-trust"><ShieldCheck size={17} /> Medication routines, appointments, and caregiver support—connected.</div>
        </div>

        <div className="hero-visual" aria-label="Illustrative dashboard preview">
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />
          <div className="preview-card">
            <div className="preview-top">
              <div>
                <span className="preview-kicker">ILLUSTRATIVE DASHBOARD PREVIEW</span>
                <h2>Good morning, Eleanor <span>☀️</span></h2>
                <p>You&apos;re doing wonderfully. Let&apos;s make today count.</p>
              </div>
              <div className="avatar">EW</div>
            </div>
            <div className="preview-progress">
              <div className="progress-label"><span>Today&apos;s progress</span><strong>2 of 3</strong></div>
              <div className="progress-track"><span style={{ width: "67%" }} /></div>
            </div>
            <div className="preview-meds">
              <div className="preview-med taken">
                <span className="med-icon"><Check size={17} /></span>
                <span><strong>Vitamin D3</strong><small>8:00 AM · with breakfast</small></span>
                <span className="taken-label">Taken</span>
              </div>
              <div className="preview-med">
                <span className="med-icon blue"><Heart size={17} /></span>
                <span><strong>Metoprolol</strong><small>12:00 PM · after lunch</small></span>
                <span className="due-label">Up next</span>
              </div>
            </div>
            <div className="garden-preview">
              <div className="garden-icon"><Leaf size={22} /></div>
              <div><strong>Your garden is growing</strong><small>2 care steps complete today</small></div>
              <div className="garden-flowers">🌱 🌼</div>
            </div>
          </div>
          <div className="float-note note-top"><span className="note-icon"><Sparkles size={16} /></span><span><strong>One step at a time</strong><small>You&apos;re right on track</small></span></div>
          <div className="float-note note-bottom"><span className="note-heart">♡</span><span><strong>Care, connected</strong><small>Made for you and your family</small></span></div>
        </div>
      </section>

      <section className="stat-strip" id="for-families">
        <div><span className="stat-icon"><Heart size={18} /></span><strong>Made with care</strong><small>Thoughtfully designed for every generation</small></div>
        <div><span className="stat-icon mint"><ShieldCheck size={18} /></span><strong>Peace of mind</strong><small>A helpful view for your whole care circle</small></div>
        <div><span className="stat-icon lavender"><CalendarDays size={18} /></span><strong>One day at a time</strong><small>Simple routines that fit real life</small></div>
      </section>

      <section className="steps-section" id="how-carequest-works" aria-labelledby="how-works-title">
        <div className="section-intro">
          <span className="eyebrow">A simple way to stay connected</span>
          <h2 id="how-works-title">How CAREQUEST Works</h2>
          <p>Three clear steps bring older adults and their trusted care circle together.</p>
        </div>
        <ol className="steps-grid">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <li className="step-card" key={title}>
              <span className="step-number">STEP {index + 1}</span>
              <span className="step-icon"><Icon size={25} aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="features-section" id="how-it-helps">
        <div className="section-intro">
          <span className="eyebrow">A brighter kind of care</span>
          <h2>Here for the moments<br />that make a difference.</h2>
          <p>CareQuest brings daily routines and family support together in one gentle space.</p>
        </div>
        <div className="feature-grid">
          {highlights.map(({ icon: Icon, title, description }, index) => (
            <article className={`feature-card feature-card-${index + 1}`} key={title}>
              <span className="feature-icon"><Icon size={22} /></span>
              <h3>{title}</h3>
              <p>{description}</p>
              <ArrowUpRight size={18} className="feature-arrow" />
            </article>
          ))}
        </div>
      </section>

      <section className="faq-section" id="faq" aria-labelledby="faq-title">
        <div className="faq-intro">
          <span className="eyebrow">Clear answers, all in one place</span>
          <h2 id="faq-title">Frequently Asked Questions</h2>
          <p>Learn how CAREQUEST supports older adults and their care circle.</p>
        </div>
        <div className="faq-list">
          {faqs.map(({ question, answer }, index) => (
            <details className="faq-item" key={question}>
              <summary className="faq-question">
                <span className="faq-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <span>{question}</span>
                <span className="faq-toggle" aria-hidden="true">+</span>
              </summary>
              <div className="faq-answer">
                {typeof answer === "string" ? <p>{answer}</p> : answer}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="closing-cta">
        <div><span className="eyebrow">Your next chapter starts here</span><h2>Let&apos;s make care feel a little easier.</h2></div>
        <Link href="/dashboard" className="button button-primary button-large">Take a look around <ArrowRight size={18} /></Link>
      </section>

      <footer className="landing-footer">
        <Link className="brand" href="/"><span className="brand-mark"><Heart size={18} fill="currentColor" /></span><span>carequest</span></Link>
        <span>Every Dose Counts. Every Day Matters.</span>
        <span>Built with Next.js, Supabase and Adaption AI</span>
      </footer>
    </main>
  );
}
