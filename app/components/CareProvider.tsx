"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { CareState } from "@/lib/types";

type Context = { state: CareState; error: string; refreshing: boolean; refresh: (patient?: string) => Promise<void> };
const CareContext = createContext<Context | null>(null);
export function CareProvider({ initial, children }: { initial: CareState; children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const selected = useRef(initial.patient?.id);
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const refresh = useCallback(async (patient = selected.current) => {
    const request = ++sequence.current;
    controller.current?.abort();
    controller.current = new AbortController();
    setRefreshing(true);
    try {
      const response = await fetch(`/api/care${patient ? `?patient=${encodeURIComponent(patient)}` : ""}`, { cache: "no-store", signal: controller.current.signal });
      if (request !== sequence.current) return;
      if (response.status === 401) { router.replace("/login"); return; }
      if (response.status === 403) {
        selected.current = undefined;
        setState((current) => ({ ...current, patient: null, summaries: [], medications: [], doses: [], gardenDoses: [], appointments: [], contacts: [], people: [current.profile], relationships: [] }));
        throw new Error("Access changed. Your care records have been cleared. Refresh to reload your care circle.");
      }
      if (!response.ok) throw new Error("Could not refresh your care records. The displayed information may be out of date.");
      const next: CareState = await response.json();
      if (request !== sequence.current) return;
      selected.current = next.patient?.id;
      setState(next);
      setError("");
    } catch (cause) {
      if (request === sequence.current && !(cause instanceof DOMException && cause.name === "AbortError")) setError(cause instanceof Error ? cause.message : "Could not refresh your care records.");
    } finally { if (request === sequence.current) setRefreshing(false); }
  }, [router]);
  useEffect(() => {
    const visibleRefresh = () => { if (document.visibilityState === "visible") void refresh(); };
    const timer = window.setInterval(visibleRefresh, 15000);
    window.addEventListener("focus", visibleRefresh);
    document.addEventListener("visibilitychange", visibleRefresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", visibleRefresh);
      document.removeEventListener("visibilitychange", visibleRefresh);
      controller.current?.abort();
    };
  }, [refresh]);
  return <CareContext value={{ state, error, refreshing, refresh }}>{children}</CareContext>;
}
export function useCare() {
  const context = useContext(CareContext);
  if (!context) throw new Error("Care context is unavailable.");
  return context;
}
