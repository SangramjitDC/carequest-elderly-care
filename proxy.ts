import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "./lib/supabase/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");
  try {
    const { url, key } = supabaseConfig();
    const db = createServerClient(url, key, {
      cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          response.headers.set("Cache-Control", "private, no-store");
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    await db.auth.getUser();
  } catch { /* Every page, action and API authenticates independently and fails closed. */ }
  return response;
}
export const config = {
  matcher: ["/dashboard/:path*", "/caregiver/:path*", "/medications/:path*", "/scanner/:path*", "/garden/:path*", "/companion/:path*", "/appointments/:path*", "/emergency/:path*", "/api/care/:path*", "/login", "/signup"],
};
