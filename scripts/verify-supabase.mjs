// Read-only connectivity check. Never print env values, request URLs, headers or bodies.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error("Required Supabase configuration is missing.");
  process.exitCode = 1;
} else {
  try {
    const auth = await fetch(new URL("/auth/v1/settings", url), { headers: { apikey: key }, signal: AbortSignal.timeout(15000) });
    console.log(`Auth service HTTP status: ${auth.status}`);
    if (!auth.ok) process.exitCode = 1;
    const schema = await fetch(new URL("/rest/v1/profiles?select=id&limit=0", url), { headers: { apikey: key }, signal: AbortSignal.timeout(15000) });
    console.log(`Anonymous profile access HTTP status: ${schema.status}`);
    if (schema.status === 404) { console.log("Profiles are not available in the Data API. Apply the migration first."); process.exitCode = 1; }
    else if (schema.status === 401 || schema.status === 403) console.log("Anonymous profile access is denied, as expected.");
    else { console.log("Review the migration and anonymous grants before using real data."); process.exitCode = 1; }
  } catch { console.error("Connectivity verification could not complete; no credentials or provider details were logged."); process.exitCode = 1; }
}
