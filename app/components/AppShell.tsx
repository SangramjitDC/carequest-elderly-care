"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Flower2,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircleHeart,
  Pill,
  ScanLine,
  ShieldAlert,
  UsersRound,
} from "lucide-react";
import { useState, type ReactNode } from "react";

const mainLinks = [
  { href: "/dashboard", label: "My day", icon: LayoutDashboard },
  { href: "/medications", label: "Medications", icon: Pill },
  { href: "/scanner", label: "Prescription scanner", icon: ScanLine },
  { href: "/garden", label: "Wellness garden", icon: Flower2 },
  { href: "/companion", label: "Wellness companion", icon: MessageCircleHeart },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="portal-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <Link className="brand sidebar-brand" href="/">
          <span className="brand-mark"><Heart size={20} fill="currentColor" /></span>
          <span>carequest</span>
        </Link>
        <div className="side-label">YOUR CARE SPACE</div>
        <nav className="side-nav" aria-label="CareQuest navigation">
          {mainLinks.map(({ href, label, icon: Icon }) => (
            <Link
              className={`side-link ${pathname === href ? "active" : ""}`}
              href={href}
              key={href}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={19} strokeWidth={1.8} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="side-label side-label-lower">CARE CIRCLE</div>
        <nav className="side-nav" aria-label="Caregiver navigation">
          <Link className={`side-link ${pathname === "/caregiver" ? "active" : ""}`} href="/caregiver" onClick={() => setMobileOpen(false)}>
            <UsersRound size={19} strokeWidth={1.8} /><span>Caregiver view</span>
          </Link>
          <Link className={`side-link ${pathname === "/emergency" ? "active emergency-link" : ""}`} href="/emergency" onClick={() => setMobileOpen(false)}>
            <ShieldAlert size={19} strokeWidth={1.8} /><span>Emergency support</span>
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon"><CircleHelp size={17} /></span>
            <strong>Need a hand?</strong>
            <p>Your care circle is always close by.</p>
            <Link href="/companion">Visit your companion <span>→</span></Link>
          </div>
          <Link href="/" className="sidebar-signout"><LogOut size={17} /> Back to home</Link>
          <div className="profile-mini">
            <span className="profile-avatar">EW</span>
            <span><strong>Eleanor Williams</strong><small>Personal care space</small></span>
            <ChevronDown size={16} className="profile-chevron" />
          </div>
        </div>
      </aside>

      <div className="portal-main">
        <header className="portal-topbar">
          <button className="mobile-menu" type="button" aria-label="Open navigation" onClick={() => setMobileOpen(!mobileOpen)}>
            <Menu size={21} />
          </button>
          <div className="topbar-breadcrumb"><span>CareQuest</span><span className="breadcrumb-slash">/</span><strong>{mainLinks.find((item) => item.href === pathname)?.label ?? (pathname === "/caregiver" ? "Caregiver view" : "Care support")}</strong></div>
          <div className="topbar-right">
            <span className="demo-pill"><span /> Demo preview</span>
            <Link className="topbar-avatar" href="/caregiver" aria-label="Open caregiver view">EW</Link>
          </div>
        </header>
        <main className="portal-content">{children}</main>
      </div>
      {mobileOpen && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    </div>
  );
}
