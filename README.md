# CAREQUEST

**Every Dose Counts. Every Day Matters.**

CAREQUEST is an elderly-care and medication-management platform for older adults and their caregivers. It brings daily medication routines, care-circle access, appointments, prescription review, wellness progress, and a record-grounded AI companion into one responsive application.

The public landing page includes **How CAREQUEST Works** and an accessible FAQ. Sign in or create an account to use the care dashboards.

## What CAREQUEST includes

- **Separate care views:** an older-adult dashboard and a caregiver dashboard for approved care relationships.
- **Medication management:** daily medication schedules, dose history, caregiver-authorized schedule management, and timestamp-based early/on-time/late reporting.
- **Wellness Garden:** progress reflects eligible, completed medication routines; a future dose cannot earn points early.
- **Care circle:** older adults share a Care ID and approve, limit, or revoke caregiver access.
- **Appointments and emergency contacts:** record management is subject to the care relationship's permissions.
- **Prescription scanner:** extracts supported prescription details for review; a caregiver checks the original and confirms the editable schedule before saving.
- **Sunny AI companion:** answers supported questions using the selected person's verified care records. It does not change records or provide a diagnosis.
- **Emergency page:** provides emergency and caregiver call links. It does not dispatch emergency services.
- **In-app reminders:** medication and appointment reminders are shown in the app. No email, SMS, or push reminders are sent.

The dashboards and records use clearly labelled fictional demonstration data where marked. Do not enter real health information into a demo environment.

## How it works

1. **Create your account** as an older adult or caregiver.
2. **Connect your care circle** by sharing a Care ID and approving the caregiver's request.
3. **Manage care together** with medication schedules, appointments, Sunny AI, and progress tracking.

Caregivers cannot view a person's care records until that person approves the relationship. Approval and individual management permissions remain under the older adult's control.

## Technology

- Next.js App Router and React
- TypeScript and Tailwind CSS
- Supabase Auth and PostgreSQL with Row Level Security (RLS)
- Adaption AI for the server-side companion and prescription extraction
- Vitest and PGlite for automated tests

## Architecture

- App Router pages render the landing page, authentication screens, dashboards, and care tools.
- Server Actions and Route Handlers validate the signed-in user and relevant care permissions before data changes or AI requests.
- Supabase access uses the user's authenticated session; PostgreSQL RLS is the final data-access boundary.
- `proxy.ts` refreshes authentication cookies. Protected actions and data operations independently verify the user.
- AI credentials and provider requests stay server-side. The model cannot write care records or decide medication schedules.
- The existing database definition is in [`supabase/migrations/202611150001_carequest.sql`](supabase/migrations/202611150001_carequest.sql). It defines nine RLS-protected tables. Do not create a second schema or apply the migration again to a project where it has already been applied.

## Privacy and security

- Caregiver access requires approval and is checked for each protected operation.
- Roles are fixed at signup; profile updates cannot grant a higher role.
- Medication changes require the appropriate care relationship permissions.
- Dose records are timestamped, append-only, and protected against duplicates; future doses are rejected.
- AI answers are based on verified care data, and model-generated content is treated as untrusted input.
- Prescription images are validated and are not persisted by CAREQUEST.
- The optional reminder endpoint only queues explicitly allowlisted events. It does not send notifications or mark them delivered.

Do not expose secret keys in browser code, commit local credentials, or use real health records in a public demo.

## Environment variables

Set the following names in your local environment (for example, in the ignored `.env.local` file) or deployment settings. **Never commit the values.**

Required for the application:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ADAPTION_API_KEY
```

The optional reminder-queue endpoint additionally requires:

```text
CRON_SECRET
SUPABASE_SERVICE_ROLE_KEY
CAREQUEST_REMINDER_PATIENT_IDS
```

The service-role key and cron secret are server-only. Reminder queueing remains disabled unless the required values and explicit patient allowlist are configured. Queueing does not deliver email, SMS, or push notifications.

## Local development

Use Node.js 20.9 or later and npm.

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Configure the required environment variables in `.env.local`. Do not copy production secrets into a shared or public environment.
3. For a new Supabase project, review the existing migration and apply it once using the Supabase SQL Editor. Back up existing data and reconcile any table-name conflicts first. Never run it automatically or apply it a second time to an already-configured project.
4. Configure Supabase email/password authentication, email confirmation, and the local and production auth callback URLs as described in [`supabase/README.md`](supabase/README.md).
5. Start the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Tests and quality checks

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

`npm run verify:supabase` checks the configured Supabase endpoint. The tests execute the existing migration in PGlite fixtures and cover database permissions, validation, server actions, and AI request behavior. Hosted email delivery, real browser sign-in, and live third-party services are not exercised by the automated suite.

For the full database setup and signed-in care-circle walkthrough, see [`supabase/README.md`](supabase/README.md).

## Deployment

The application is designed for deployment on Vercel with the environment variables configured in the project settings. Use HTTPS, configure the exact Supabase production redirect URLs, and keep server-only credentials private.

Production site: [https://carequest-elderly-care.vercel.app/](https://carequest-elderly-care.vercel.app/)

## Current limitations and medical safety

- CAREQUEST supports daily dose times; arbitrary intervals, weekly routines, and as-needed schedules are not implemented.
- Reminders are in-app only. No notification delivery provider or background delivery worker is configured.
- The emergency page provides phone links; it does not dispatch help, monitor emergencies, or guarantee a response.
- Sunny AI is a bounded assistant for supported care-record questions, not a clinician. It does not diagnose, prescribe, or change records. Confirm medical decisions with a qualified healthcare professional.
- The prescription scanner is an aid to review, not a source of medical instructions. Always check extracted details against the original prescription before saving.
- CAREQUEST is not a substitute for professional medical care or emergency services.
