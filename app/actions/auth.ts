"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";
import { z } from "zod";

export async function signIn(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: "Check your email address and password.", fields: z.flattenError(parsed.error).fieldErrors };
  let destination = "/dashboard";
  try {
    const db = await createClient();
    const { data, error } = await db.auth.signInWithPassword(parsed.data);
    if (error || !data.user) return { ok: false, message: "Sign-in failed. Check your details and confirm your email before trying again." };
    const { data: profile, error: profileError } = await db.from("profiles").select("role").eq("id", data.user.id).single();
    if (profileError || !profile) return { ok: false, message: "Your care profile is unavailable. Please check the database setup." };
    destination = profile.role === "caregiver" ? "/caregiver" : "/dashboard";
  } catch { return { ok: false, message: "Sign-in is temporarily unavailable. Please try again." }; }
  redirect(destination);
}
export async function signUp(_previous: ActionResult, form: FormData): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: "Please correct the highlighted details.", fields: z.flattenError(parsed.error).fieldErrors };
  try {
    const db = await createClient();
    const { email, password, ...metadata } = parsed.data;
    const origin = (await headers()).get("origin");
    const { error } = await db.auth.signUp({ email, password, options: {
      data: metadata,
      ...(origin ? { emailRedirectTo: new URL("/auth/callback", origin).toString() } : {}),
    } });
    if (error) return { ok: false, message: "We could not complete signup. Please try again later or sign in if you already have an account." };
    // Do not disclose whether an email already belongs to an account.
    return { ok: true, message: "Check your email for a confirmation link if signup is available for this address. Then sign in to your care space." };
  } catch { return { ok: false, message: "Signup is temporarily unavailable. Please try again." }; }
}
export async function signOut() {
  let failed = false;
  try { const db = await createClient(); const { error } = await db.auth.signOut({ scope: "local" }); failed = !!error; }
  catch { failed = true; }
  redirect(failed ? "/auth/error" : "/login");
}
