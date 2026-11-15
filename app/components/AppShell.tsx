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
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useCare } from "./CareProvider";
import { signOut } from "@/app/actions/auth";

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
  const { state } = useCare();
  const initials = state.profile.display_name.split(/\s+/).slice(0, 2).map((name) => name[0]).join("").toUpperCase();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const sidebar = sidebarRef.current;
    const menuButton = menuRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebar?.querySelector<HTMLButtonElement>(".sidebar-close")?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
      if (event.key !== "Tab") return;
      const links = sidebar?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (!links?.length) return;
      const first = links[0];
      const last = links[links.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    const desktop = window.matchMedia("(min-width: 1001px)");
    const closeOnDesktop = () => { if (desktop.matches) setMobileOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      desktop.removeEventListener("change", closeOnDesktop);
      menuButton?.focus();
    };
  }, [mobileOpen]);

  return (
    <div className="portal-shell">
      <a className="skip-link" href="#main-content" inert={mobileOpen}>Skip to main content</a>
      <aside id="care-navigation" ref={sidebarRef} className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`} role={mobileOpen ? "dialog" : undefined} aria-modal={mobileOpen || undefined} aria-label="CareQuest navigation">
        <button type="button" className="sidebar-close icon-button" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={24} /></button>
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
              aria-current={pathname === href ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={19} strokeWidth={1.8} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="side-label side-label-lower">CARE CIRCLE</div>
        <nav className="side-nav" aria-label="Caregiver navigation">
          <Link className={`side-link ${pathname === "/caregiver" ? "active" : ""}`} href="/caregiver" aria-current={pathname === "/caregiver" ? "page" : undefined} onClick={() => setMobileOpen(false)}>
            <UsersRound size={19} strokeWidth={1.8} /><span>Caregiver view</span>
          </Link>
          <Link className={`side-link emergency-link ${pathname === "/emergency" ? "active" : ""}`} href="/emergency" aria-current={pathname === "/emergency" ? "page" : undefined} onClick={() => setMobileOpen(false)}>
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
          <form action={signOut}><button type="submit" className="button button-outline sidebar-signout"><LogOut size={24} /> Sign out</button></form>
          <div className="profile-mini">
            <span className="profile-avatar">{initials}</span>
            <span><strong>{state.profile.display_name}</strong><small>{state.profile.role === "caregiver" ? "Caregiver" : "Personal care space"}</small></span>
            <ChevronDown size={16} className="profile-chevron" />
          </div>
        </div>
      </aside>

      <div className="portal-main" inert={mobileOpen}>
        <header className="portal-topbar">
          <button ref={menuRef} className="mobile-menu" type="button" aria-label="Open navigation" aria-expanded={mobileOpen} aria-controls="care-navigation" onClick={() => setMobileOpen(!mobileOpen)}>
            <Menu size={21} />
          </button>
          <div className="topbar-breadcrumb"><span>CareQuest</span><span className="breadcrumb-slash">/</span><strong>{mainLinks.find((item) => item.href === pathname)?.label ?? (pathname === "/caregiver" ? "Caregiver view" : "Care support")}</strong></div>
          <div className="topbar-right">
            <span className="demo-pill"><span /> Your care space</span>
            <Link className="topbar-avatar" href="/caregiver" aria-label="Open caregiver view">{initials}</Link>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="portal-content">{children}</main>
      </div>
      {mobileOpen && <div className="mobile-backdrop" aria-hidden="true" onClick={() => setMobileOpen(false)} />}
    </div>
  );
}
