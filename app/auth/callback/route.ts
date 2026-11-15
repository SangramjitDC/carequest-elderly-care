import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code && code.length <= 2048) {
    try {
      const db = await createClient();
      const { error } = await db.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL("/dashboard", url.origin));
    } catch { /* Never expose tokens or provider errors. */ }
  }
  return NextResponse.redirect(new URL("/auth/error", url.origin));
}
