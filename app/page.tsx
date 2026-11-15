import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Heart,
  HeartHandshake,
  Leaf,
  ShieldCheck,
  Sparkles,
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

export default function Home() {
  return (
    <main className="landing">
      <header className="landing-nav">
        <Link className="brand" href="/">
          <span className="brand-mark"><Heart size={20} fill="currentColor" /></span>
          <span>carequest</span>
        </Link>
        <nav className="landing-links" aria-label="Main navigation">
          <a href="#how-it-helps">How it helps</a>
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
          <div className="hero-trust"><ShieldCheck size={17} /> A friendly frontend preview · fictional demo data</div>
        </div>

        <div className="hero-visual" aria-label="Preview of the CareQuest daily care dashboard">
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />
          <div className="preview-card">
            <div className="preview-top">
              <div>
                <span className="preview-kicker">MONDAY, OCTOBER 21</span>
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

      <section className="closing-cta">
        <div><span className="eyebrow">Your next chapter starts here</span><h2>Let&apos;s make care feel a little easier.</h2></div>
        <Link href="/dashboard" className="button button-primary button-large">Take a look around <ArrowRight size={18} /></Link>
      </section>

      <footer className="landing-footer">
        <Link className="brand" href="/"><span className="brand-mark"><Heart size={18} fill="currentColor" /></span><span>carequest</span></Link>
        <span>Every Dose Counts. Every Day Matters.</span>
        <span>Frontend prototype · Fictional demonstration data</span>
      </footer>
    </main>
  );
}
