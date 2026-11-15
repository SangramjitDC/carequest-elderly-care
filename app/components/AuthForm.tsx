"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Heart, ShieldCheck } from "lucide-react";
import { signIn, signUp } from "@/app/actions/auth";
import { MiniGarden } from "./GardenArt";
import type { ActionResult } from "@/lib/types";

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const signingUp = mode === "signup";
  const [result, action, pending] = useActionState(signingUp ? signUp : signIn, { ok: false, message: "" } as ActionResult);
  const fieldError = (name: string) => result.fields?.[name]?.join(" ");
  return <main className="auth-page">
    <div className="auth-art"><Link className="brand" href="/"><span className="brand-mark"><Heart size={20} fill="currentColor" /></span><span>carequest</span></Link><div className="auth-art-copy"><span className="eyebrow">A LITTLE MORE CARE, EVERY DAY</span><p className="auth-art-heading">Every Dose Counts.<br /><span>Every Day Matters.</span></p><p>Feel supported in your routine, and connected to the people who care.</p><div className="auth-art-garden"><MiniGarden large /></div></div><span className="auth-art-foot">Your care, shared only with people you approve.</span></div>
    <section className="auth-main"><Link className="auth-back" href="/">← Back to home</Link><div className="auth-form-wrap"><span className="auth-form-kicker">{signingUp ? "A WARM WELCOME" : "WELCOME BACK"}</span><h1>{signingUp ? "Create your care space" : "Good to see you again"}</h1><p className="auth-subtitle">{signingUp ? "A few details to get started." : "Sign in to your CareQuest space."}</p>
      <form className="auth-form" action={action}>
        {signingUp && <label htmlFor="auth-name">Your name<input id="auth-name" name="display_name" autoComplete="name" maxLength={100} required aria-invalid={!!fieldError("display_name")} aria-describedby={fieldError("display_name") ? "name-error" : undefined} />{fieldError("display_name") && <span id="name-error" className="field-error">{fieldError("display_name")}</span>}</label>}
        <label htmlFor="auth-email">Email address<input id="auth-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} aria-invalid={!!fieldError("email")} aria-describedby={fieldError("email") ? "email-error" : undefined} />{fieldError("email") && <span id="email-error" className="field-error">{fieldError("email")}</span>}</label>
        <label htmlFor="auth-password">Password<input id="auth-password" name="password" type="password" autoComplete={signingUp ? "new-password" : "current-password"} minLength={signingUp ? 12 : 1} maxLength={128} required aria-invalid={!!fieldError("password")} aria-describedby="password-help" /><span id="password-help" className={fieldError("password") ? "field-error" : "card-subtitle"}>{fieldError("password") || (signingUp ? "Use at least 12 characters." : "Enter your account password.")}</span></label>
        {signingUp && <><label htmlFor="auth-role">I’m joining as<select id="auth-role" name="role" defaultValue="elderly"><option value="elderly">An older adult</option><option value="caregiver">A caregiver</option></select></label><label htmlFor="auth-timezone">Schedule timezone<input id="auth-timezone" name="timezone" defaultValue="Asia/Kolkata" required maxLength={100} aria-describedby="timezone-help" aria-invalid={!!fieldError("timezone")} /><span id="timezone-help" className={fieldError("timezone") ? "field-error" : "card-subtitle"}>{fieldError("timezone") || "For example: Asia/Kolkata, Europe/London, or America/New_York. Your medication day follows this timezone."}</span></label></>}
        <button disabled={pending} type="submit" className="button button-primary button-large auth-submit">{pending ? "Please wait…" : signingUp ? "Create account" : "Sign in"} <ArrowRight size={24} /></button>
        {result.message && <p className={`auth-message ${result.ok ? "" : "form-error"}`} role={result.ok ? "status" : "alert"}>{result.message}</p>}
      </form><p className="auth-switch">{signingUp ? "Already have a care space?" : "New to CareQuest?"} <Link href={signingUp ? "/login" : "/signup"}>{signingUp ? "Log in" : "Create an account"}</Link></p><div className="auth-safety"><ShieldCheck size={20} /> Caregivers need your approval before they can access your records.</div></div></section>
  </main>;
}
