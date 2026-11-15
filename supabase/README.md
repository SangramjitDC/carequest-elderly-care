# CAREQUEST database setup

The application uses Supabase Auth and PostgreSQL for care profiles, caregiver consent, medications, dose confirmations, appointments, and emergency contacts. Adaption processes companion questions and prescription images through server-only endpoints. Existing design and navigation are retained.

## 1. Apply the migration

Back up any existing project data first. This migration creates new CAREQUEST tables and is intended to be applied once. If your project already has tables with these names, reconcile the existing schema before applying it; do not drop tables to work around a conflict.

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the entire contents of [`migrations/202611150001_carequest.sql`](migrations/202611150001_carequest.sql).
3. Run the query as the project administrator. It runs in one transaction and enables RLS on all nine tables before committing.
4. Confirm the tables appear in the Table Editor with RLS enabled. Keep the `private` schema **out of** the Data API’s exposed schemas.

Alternatively, if you use the Supabase CLI, link the intended project and run `supabase db push` from this repository. Review the target project before pushing. Never place an admin database password or service-role credential in application source or a `NEXT_PUBLIC_*` variable.

The configured publishable key intentionally cannot execute migrations. Interactive care and AI features use the authenticated session and RLS, never a service-role key. The optional reminder worker alone accepts a server-only service credential. Applying SQL requires your Supabase dashboard or an authorized database/CLI session. The user has reported applying this migration successfully; do not apply it again to that project. No further migration is required for the AI features.

## 2. Configure authentication

In Supabase **Authentication**:

- Enable email/password sign-in and **Confirm email**.
- Configure the password minimum to **12 characters**, matching the signup form. Enable compromised-password protection if available for your plan.
- Set **Site URL** to the actual application origin, such as `http://localhost:3000` for local development. Add the exact development and production `/auth/callback` URLs to the redirect allowlist; use HTTPS in production.
- Use this confirmation-link URL in the **Confirm signup** email template (keep the surrounding email content):

  ```html
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your email</a>
  ```

  The token-hash route supports opening the email on a different device. The application also supports PKCE callbacks at `/auth/callback` for the default signup redirect flow. Neither endpoint accepts an arbitrary destination parameter.
- Configure SMTP and Supabase Auth rate limits for your deployment. Signup/sign-in errors are intentionally generic to reduce account enumeration. Password recovery and MFA UI are not included in this core workflow.

Session cookies are HttpOnly, SameSite=Lax, and Secure in production. All Supabase calls run on the Next.js server with the signed-in user’s identity. No API credentials or auth tokens are passed as React props or included in browser application code. The proxy refreshes sessions; each protected data read and Server Action independently validates the user with `getUser()`. Private API responses are `no-store` and vary by cookie. Server Actions retain Next.js’s same-origin checks.

Keep `.env.local` ignored. Required variable names (never their values) are:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ADAPTION_API_KEY
```

Despite the existing `NEXT_PUBLIC_` names, this implementation reads Supabase configuration exclusively from server-only modules. It rejects privileged keys. `ADAPTION_API_KEY` is reserved and unused.

## 3. Verify the core workflow

1. Run `npm run verify:supabase`. This makes read-only requests and reports only HTTP status codes. A 404 for profiles means the migration is not available; 401/403 anonymous access is expected after migration. This probe is not a substitute for signed-in workflow testing.
2. Run `npm test`, `npm run lint`, and `npm run build`.
3. Start with `npm run dev`.
4. Create two test accounts, one **older adult** and one **caregiver**, and confirm both emails. Use an IANA timezone appropriate for the older adult. Roles and timezone are fixed at signup; changes require administrator review.
5. On the older adult’s dashboard, copy the care ID from **Your care circle**. Share it privately with the caregiver.
6. In a separate browser profile/private session, sign in as the caregiver. Submit the care ID under **Your care circle**. No health data is visible while approval is pending.
7. The older adult chooses **Approve caregiver**. The caregiver can then select that care space and add or edit medications from **Medications**.
8. Add a medication beginning today. The older adult sees the scheduled dose and chooses **Mark as taken**. The button stays confirmed after refresh/sign-in; the caregiver sees the same record within 15 seconds or immediately after choosing **Refresh**.
9. Repeat the same confirmation request: the unique daily dose constraint prevents a duplicate. Disable a medication to archive it; dose history is retained.
10. The older adult chooses **Revoke access**. New caregiver reads/writes are denied immediately by RLS. An open caregiver screen clears its records on the next poll/focus refresh, within 15 seconds while visible. Revocation cannot erase information already viewed by a person.

Local automated tests execute the **unaltered migration** using PGlite (embedded PostgreSQL), with minimal Supabase auth schema/role fixtures. They verify RLS, consent, revocation, cross-patient isolation, immutable roles, immutable dose records, duplicate prevention, invalid doses, view-only access, and optimistic medication version conflicts. Additional tests cover validators, timezone/date boundaries, Server Action authorization, and private API errors. They do not exercise the hosted Supabase email delivery, session cookies, or browser interaction; run the signed-in steps above against your project after migration.

## Data and permissions

| Table | Reads | Writes |
| --- | --- | --- |
| `profiles` | Self; approved care recipients; caregivers whose request the older adult can review | Name only by self; role/timezone controlled at signup/admin |
| `caregiver_relationships` | Both participants | Caregiver creates pending request; older adult approves, limits, or revokes |
| `medications` | Older adult and active caregivers | Approved caregivers with management permission; no hard deletes |
| `dose_logs` | Older adult and active caregivers | Older adult records today’s scheduled dose; no update/delete |
| `appointments` | Older adult and active caregivers | Older adult and caregivers with management permission |
| `emergency_contacts` | Older adult and active caregivers | Older adult and caregivers with management permission |
| `wellness_check_ins` | Older adult and active caregivers | Older adult creates; historical entries are immutable |
| `notification_logs` | Recipient only | Reserved for trusted backend workers; no authenticated-client writes |
| `sos_events` | Older adult and active caregivers | Older adult creates; managing caregiver updates status |

Every medication row represents **one daily dose time**. For multiple doses per day, create separate rows. Start/end dates are inclusive in the care recipient’s timezone. Arbitrary weekly, interval, or as-needed schedules are not implemented. A dose confirmation records the database time and snapshots the medication name/dosage so future edits do not rewrite history. There is intentionally no “undo taken” action; correction/audit workflows need a separate reviewed feature. Only the older adult can confirm their own dose.

Concurrent edits use a version check; stale edits are rejected. Database constraints are authoritative even if requests bypass the frontend. Database access is never cached across users. Cross-session synchronization uses authenticated polling every 15 seconds, refresh-on-focus, and refresh after writes; Realtime publication configuration is not required.

The UI currently approves medication-management access. The schema also supports view-only access through `can_manage_medications = false`; appointment and contact management now use their own independent permission flags. The older adult remains in control of consent.

Appointments and contacts support creation, viewing, editing, and deletion with independent permissions. The Garden counts unique timing-eligible dose records for the selected patient's current day. Emergency support opens phone links; it does not dispatch help or claim that SOS events were sent. Wellness check-in entry and an SOS acknowledgement workflow remain unimplemented.

## References

- [Supabase SSR client/session guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Next.js 16 documentation bundled in `node_modules/next/dist/docs/`, especially authentication with Cache Components, Server Actions, cookies, and Proxy.

## Many-to-many care update

The migration includes primary/supporting/viewer roles, an active-primary unique index, and separate viewing, medication, appointment, and contact permissions. Only the older adult can change these fields. Viewers cannot have management permissions; management requires viewing. Revoke or change an existing primary role before assigning a new one. The care-circle form exposes all permissions; the caregiver dashboard shows a separate summary per authorized older adult. Summary queries are batched and grouped by patient and local date.

Existing timestamp-based early/late labels, delayed garden reward eligibility, and unique notification event keys are retained. Timing labels compare actual timestamps exactly, not a clinical grace window. The assistant has not executed a hosted migration.

Each resource action checks the current relationship and resource-specific permission; RLS remains authoritative. Appointment inputs explicitly use the device timezone and are stored as UTC timestamps; lists and summaries display the patient's timezone. To replace a primary emergency contact, first edit the existing primary contact and uncheck its primary flag, then select the new primary.

## Adaption companion and prescription scanning

Set `ADAPTION_API_KEY` as a **server-only** variable in the Vercel project, alongside the existing public Supabase URL and publishable key. Local credentials were not changed. Native fetch uses the [official Responses API](https://docs.adaptionlabs.ai/inference-stacks/generate-a-model-response) and [documented models](https://docs.adaptionlabs.ai/inference-stacks/models). Account discovery selects `qwen3.8-27b`, then `qwen3.5-397b`, `gemma-4-26b-a4b-it`, or `gemma-4-31b-it` if the preferred model is unavailable. Only documented text/image models are eligible. There is no Gemini integration.

The companion sends a bounded question and the selected patient's verified care facts to Adaption for intent classification. Deterministic server code produces factual answers from those records; the model cannot calculate adherence, fabricate a schedule, or perform writes. This is a bounded care-record assistant, not an unrestricted medical chatbot. Emergencies bypass the model. AI failures return clearly labeled verified-record answers where possible.

Scanner images are JPEG/PNG/WebP, at most 2 MB, checked for MIME/signature on the server. Images are not persisted by CAREQUEST. Provider requests disable response storage, agentic memory and tools. Extracted fields are schema-validated and remain untrusted until an authorized caregiver checks the prescription and explicitly confirms the editable daily-dose form. Dates and dose times are intentionally not inferred. Weekly/interval/as-needed prescriptions require a separate supported workflow and must not be converted into daily schedules.

Requests require same-origin POSTs, authenticated sessions, current patient permissions, bounded input and provider timeouts. Model output is rendered as plain text. The per-user AI rate limiter is per server instance; production-wide abuse protection should be configured at the deployment gateway. Conversation history is local to the open page, resets on patient change, and is not persisted or forwarded. Provider discovery caches model IDs only, never health context.

Run `node --env-file=.env.local scripts/verify-adaption.mjs --vision` for a synthetic text/image/JSON smoke test. It prints model identifiers and status only, never keys or health records.

## Reminders

Dashboards show in-app medication reminders (due within 30 minutes or earlier but unconfirmed) and appointments within 24 hours. They refresh with care records and do not imply a dose was skipped.

Optional queueing uses `POST /api/reminders`, protected by `Authorization: Bearer <CRON_SECRET>`. It remains disabled unless all of these are configured server-side:

- `CRON_SECRET`: at least 32 characters, used only by the trusted scheduler.
- `SUPABASE_SERVICE_ROLE_KEY`: backend-only credential; never prefix with `NEXT_PUBLIC_`.
- `CAREQUEST_REMINDER_PATIENT_IDS`: comma-separated, explicitly opted-in elderly profile IDs (maximum 100).

No scheduler is installed automatically. No test patients are implicitly enrolled. A trusted scheduler can call the POST endpoint periodically after configuration and authorization. Each planned event is inserted into `notification_logs` with `onConflict: event_key` and `ignoreDuplicates: true`; retries cannot create duplicate events. The worker only queues records and never marks them sent. **Email/push delivery is unavailable**; no delivery provider or worker is implemented. Supabase authentication email is not used for reminders. The service credential is restricted in code to allowlisted patients and this worker; interactive routes retain RLS.
