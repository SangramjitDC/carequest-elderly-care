import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "../components/AppShell";
import { CareProvider } from "../components/CareProvider";
import { CareError, getCareState } from "@/lib/care";

async function ProtectedPortal({ children }: { children: ReactNode }) {
  let state;
  try { state = await getCareState(); }
  catch (error) {
    if (error instanceof CareError && error.status === 401) redirect("/login");
    return <main className="portal-content page-stack"><h1>Your care space is unavailable</h1><p role="alert">We couldn’t load your care records. Check your connection and confirm the database migration has been applied.</p><a href="/dashboard" className="button button-primary">Try again</a><Link href="/login" className="button button-outline">Return to sign in</Link></main>;
  }
  return <CareProvider initial={state}><AppShell>{children}</AppShell></CareProvider>;
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<main className="portal-content"><p role="status">Loading your care space…</p></main>}><ProtectedPortal>{children}</ProtectedPortal></Suspense>;
}
