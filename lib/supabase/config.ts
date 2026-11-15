import "server-only";

export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase configuration is missing.");
  // This application never uses privileged credentials, including on the server.
  let publicKey = key.startsWith("sb_publishable_");
  if (!publicKey) {
    try { publicKey = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role === "anon"; } catch { /* Fail closed. */ }
  }
  if (!publicKey || !/^https:\/\//.test(url)) throw new Error("Supabase configuration is invalid.");
  return { url, key };
}
