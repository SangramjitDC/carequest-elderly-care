# CAREQUEST database setup

The application now uses Supabase Auth and PostgreSQL for care profiles, caregiver consent, medications, and dose confirmations. The existing design and navigation are retained. AI integration is intentionally not started; the Adaption credential is neither read nor sent anywhere.

## 1. Apply the migration

Back up any existing project data first. This migration creates new CAREQUEST tables and is intended to be applied once. If your project already has tables with these names, reconcile the existing schema before applying it; do not drop tables to work around a conflict.

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the entire contents of [`migrations/202611150001_carequest.sql`](migrations/202611150001_carequest.sql).
3. Run the query as the project administrator. It runs in one transaction and enables RLS on all nine tables before committing.
4. Confirm the tables appear in the Table Editor with RLS enabled. Keep the `private` schema **out of** the Data API’s exposed schemas.

Alternatively, if you use the Supabase CLI, link the intended project and run `supabase db push` from this repository. Review the target project before pushing. Never place an admin database password or service-role credential in application source or a `NEXT_PUBLIC_*` variable.

The configured publishable key intentionally cannot execute migrations. This implementation does not use a service-role key. Applying the SQL requires your Supabase dashboard or an authorized database/CLI session.

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

The UI currently approves medication-management access. The schema also supports view-only access through `can_manage_medications = false`; that permission also prevents caregiver writes to appointments, emergency contacts and SOS status. The older adult remains in control of consent.

Appointment, emergency contact, wellness check-in, notification, and SOS tables are foundations with RLS, **not connected feature workflows yet**. Their existing preview screens remain explicitly labeled as previews. No notifications are sent or emergency assistance dispatched. The companion remains a clearly labeled canned preview; no Gemini or Adaption calls were added.

## References

- [Supabase SSR client/session guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Next.js 16 documentation bundled in `node_modules/next/dist/docs/`, especially authentication with Cache Components, Server Actions, cookies, and Proxy.
