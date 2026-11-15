import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  if (token && token.length <= 2048 && (type === "email" || type === "signup")) {
    try {
      const db = await createClient();
      const { error } = await db.auth.verifyOtp({ token_hash: token, type });
      if (!error) return NextResponse.redirect(new URL("/dashboard", url.origin));
    } catch { /* Never expose tokens or provider errors. */ }
  }
  return NextResponse.redirect(new URL("/auth/error", url.origin));
}
