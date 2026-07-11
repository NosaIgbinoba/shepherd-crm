# Shepherd CRM — Project Doc

Living plan for JPD Church's CRM. Read this before starting a phase; update it
before ending one. This is the source of truth for scope and decisions —
more current than any individual conversation.

## Current phase

**Phase 4: Departments, join requests, events/RSVP, WhatsApp reminders —
DONE, fully live.** Migrations 0002/0003 applied, both Edge Functions
deployed, Twilio Sandbox connected, real WhatsApp messages confirmed
delivered for both flows, and both are scheduled in production via
`pg_cron`:
- `birthday-check-daily` — `0 8 * * *` UTC (9am Irish Summer Time; see
  "Known limitations" for the DST caveat)
- `event-reminder-hourly` — `0 * * * *` UTC

**Phase 5: Frontend deployed publicly — DONE.** Live at
[shepherd-crm-six.vercel.app](https://shepherd-crm-six.vercel.app),
connected to the GitHub repo for auto-deploy on every push to `main`.
`vercel.json` rewrites all paths to `index.html` — without it, direct
loads of client-side routes like `/upcoming` or `/rsvp/:eventId` 404,
since Vercel's static file server doesn't know React Router's routes
exist. `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are set as Vercel
production env vars (separately from local `.env.local`).

Next up: real data entry, or extending departments/join-requests/events
further (e.g. member-facing polish, dedupe on `/join`).

## Stack decisions (and why)

- **Frontend**: React + Vite + TypeScript, `react-router-dom` for routing.
- **Backend**: Not Firebase. **Supabase (Postgres + Auth), no S3** — decided
  2026-07-10. The app talks to Supabase directly via `@supabase/supabase-js`;
  no custom API server in between. Connected to a real project as of
  2026-07-10 — see `SUPABASE_SETUP.md` for how it was set up, and
  "How to run" below for how the app decides mock vs. live.
- **Version control**: git, pushed to
  [github.com/NosaIgbinoba/shepherd-crm](https://github.com/NosaIgbinoba/shepherd-crm)
  as of 2026-07-11 (public repo). Push auth needed a Personal Access Token
  with the fine-grained **Contents: Read and write** permission — the
  default "Read" setting 403s on push even with every other permission
  granted; worth remembering if a token needs regenerating later.
- **Data layer is abstracted on purpose**: `src/lib/db/types.ts` defines a
  `MemberRepository` interface. Two implementations exist:
  `src/lib/db/mockDb.ts` (localStorage) and `src/lib/db/supabaseDb.ts`
  (real Postgres via Supabase). `src/lib/db/index.ts` picks automatically
  based on whether `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are set —
  no changes needed in pages/components either way.
- **Auth follows the same pattern**: `src/lib/auth/types.ts` defines
  `AuthRepository`, implemented by `src/lib/auth/mockAuth.ts`
  (admin@jpd.church / admin123, NOT secure, placeholder only) and
  `src/lib/auth/supabaseAuth.ts` (real Supabase Auth + the `public.users`
  table for org/role). `src/lib/auth/index.ts` picks the same way as the
  data layer. `AuthContext.tsx` only ever talks to the picked
  `authRepository`, not to either implementation directly.
- **Member access model ("Option A")**: decided 2026-07-11. Only admins
  log in. Join requests and event RSVPs are **public, no-login forms**
  (`/join`, `/upcoming` + `/rsvp/:eventId`) — the common pattern for church
  tools (Planning Center, ChurchTrac work this way). Rejected alternatives:
  real member self-service accounts (bigger build, matches
  `users.role='member'` in the schema but not needed for v1) and
  admin-only with no public surface at all (doesn't satisfy "members
  request, admins approve"). Consequence: `join_requests`/`rsvps` capture
  requester identity (`requester_name`/`phone`/`email`,
  `attendee_name`/`phone`/`email`) directly rather than assuming a
  pre-existing `Member` row, since public submitters may not have one.
  `member_id` on both tables is optional, populated only when an admin
  approves a join request into a real `Member`.
  **Known limitation**: an existing member using the public `/join` form
  isn't matched against their existing record — it always creates a new
  one on approval. No dedupe yet.
- **Scheduled jobs run as Supabase Edge Functions** (Deno), not Firebase
  Cloud Functions — decided 2026-07-11, consistent with the earlier
  Supabase-only backend decision. `supabase/functions/birthday-check`
  (daily) and `supabase/functions/event-reminder` (hourly) both use the
  **service role key** (bypasses RLS — there's no logged-in user in a
  cron job) and a shared Twilio WhatsApp helper
  (`supabase/functions/_shared/twilio.ts`). `event-reminder` is idempotent
  via `events.reminder_sent_at`, safe at any cron cadence. Both require
  phone numbers in **E.164** format (`+2348012345678`) — anything else is
  skipped, not sent. Twilio integration built against the **WhatsApp
  Sandbox** (no account existed yet as of this writing) — same code works
  once a production WhatsApp sender is approved. See `TWILIO_SETUP.md`.

## Data model

Org-scoped from day one (JPD is `orgId: "jpd"` today; multi-tenant later
needs no schema change, only new org rows). Original design was Firestore
document-shaped; now targeting Postgres tables of the same shape. Array
columns (`tags`, `departmentIds`, `memberIds`) are a reasonable Postgres
starting point (`text[]` / `uuid[]`), but consider join tables
(`member_departments`) once department-scoped queries or RLS get more
detailed.

```
organizations(id, name, address, created_at)
members(id, org_id, name, phone, email, dob, tags[], department_ids[], joined_at)
departments(id, org_id, name, leader_id, member_ids[])
join_requests(id, org_id, department_id, requester_name, requester_phone,
              requester_email, member_id?, status, created_at)
events(id, org_id, title, date, location, reminder_hours_before, reminder_sent_at)
rsvps(id, org_id, event_id, attendee_name, attendee_phone, attendee_email,
      member_id?, status, created_at)
users(id, org_id, email, role, member_ref)
```

TypeScript types mirroring this live in `src/types.ts`. The Postgres schema
(snake_case columns, same shape) is spread across three migrations:
- `0001_init.sql` — original tables + RLS scoping every table to
  `org_id = auth_org_id()` (the direct equivalent of the org-scoped
  Firestore rules from the original brief; only applies to authenticated
  users).
- `0002_public_flows.sql` — `join_requests`/`rsvps` gain requester/attendee
  fields and optional `member_id` (see "Member access model" above);
  `events.reminder_schedule` (free text) replaced with
  `reminder_hours_before` (integer); new `anon`-role policies: INSERT-only
  on `join_requests`/`rsvps`, SELECT on `departments`/`events`.
- `0003_event_reminders.sql` — `events.reminder_sent_at`, so the reminder
  Edge Function never double-sends.

## Open decisions

- ~~Backend target~~ — resolved 2026-07-10: Supabase, no S3.
- ~~Departments/join-requests/events/RSVP UI~~ — resolved 2026-07-11, see
  Phase 4.
- ~~Member access model~~ — resolved 2026-07-11: public no-login forms
  (Option A), see "Stack decisions" above.
- ~~Scheduled jobs platform~~ — resolved 2026-07-11: Supabase Edge
  Functions + Cron, not Firebase.
- **No self-serve signup**: admins are added via Supabase SQL Editor for
  now (see `SUPABASE_SETUP.md`). Fine for JPD-only single-admin use;
  revisit before onboarding org #2.
- **No dedupe for existing members using `/join`** — see "Member access
  model" limitation above.
- ~~Twilio connection~~ — resolved 2026-07-11: Sandbox connected, both
  functions deployed and scheduled, real WhatsApp delivery confirmed for
  both birthday and reminder messages.
- **Timezone handling is naive**: birthday matching uses UTC month/day, and
  the cron schedule is a fixed UTC time chosen to match Ireland's *current*
  offset (UTC+1, Irish Summer Time). `pg_cron` doesn't auto-adjust for DST,
  so `birthday-check-daily` will quietly drift an hour earlier once Ireland
  falls back to GMT in autumn. Fine for a single-timezone congregation
  where an hour of drift twice a year doesn't matter; if it does, nudge
  `0 8 * * *` → `0 9 * * *` at the autumn changeover and back in spring, or
  build real timezone handling later.

## Phase log

- **2026-07-10** — Phase 1 complete. Scaffolded `shepherd-crm` (Vite + React +
  TS), built org-scoped types, mock `MemberRepository` (localStorage-backed,
  seeded with 3 JPD members), mock auth context (1 seeded admin), admin
  login page, member list page (search by name/email), add/edit member form.
  `npx tsc --noEmit` clean. Local git initialized, no remote.
- **2026-07-10** — Phase 2 complete. Backend decision made: Supabase, no S3.
  Wrote `supabase/migrations/0001_init.sql` (full schema + org-scoped RLS
  policies + seed data). Added `supabaseDb.ts` and `supabaseAuth.ts`
  implementing the existing `MemberRepository`/`AuthRepository` interfaces.
  `src/lib/db/index.ts` and `src/lib/auth/index.ts` auto-pick mock vs. live
  based on `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` presence — app still
  runs on the mock with zero env vars set. Not yet connected to a real
  project; `SUPABASE_SETUP.md` has the steps for when you're ready.
- **2026-07-10** — Phase 3 complete. User created Supabase project
  `fslqsdggabmtysvbcgvi`, ran the migration, created the `admin@jpd.church`
  auth user and its `public.users` row. `.env.local` set with the project
  URL + publishable key (gitignored, verified via `git check-ignore`).
  Fixed `LoginPage.tsx` to only show the mock demo-credentials hint when
  `isSupabaseConfigured` is false — it was showing stale
  `admin@jpd.church / admin123` text even in live mode. User manually
  tested login and adding a member in their own browser — both confirmed
  working against the real database.
- **2026-07-11** — Pushed to GitHub:
  [github.com/NosaIgbinoba/shepherd-crm](https://github.com/NosaIgbinoba/shepherd-crm)
  (public). Hit a stored-Keychain-credential mismatch (git was authenticating
  as a different GitHub account than the repo owner) and then a fine-grained
  PAT missing **Contents: Read and write** — both resolved. `.env.local`
  confirmed never committed (`git check-ignore`).
- **2026-07-11** — Phase 4 built. Department CRUD with leader/member
  assignment (admin). Public no-login `/join` form + admin
  `JoinRequestsPage` approve/reject queue (approve creates a real
  `Member` + assigns to the department). Admin event CRUD
  (`EventsListPage`/`EventFormPage`, shows RSVP yes/maybe/no counts) +
  public `/upcoming` event list + `/rsvp/:eventId` form. Schema updates in
  `0002_public_flows.sql`/`0003_event_reminders.sql`. Two Supabase Edge
  Functions written (`birthday-check` daily, `event-reminder` hourly) with
  a shared Twilio WhatsApp helper — built against the WhatsApp Sandbox
  since no Twilio account existed yet. Verified the entire new surface
  end-to-end in mock mode via headless browser (department creation →
  public join submission → admin approval → real member created → event
  creation → public RSVP → count reflected on admin list), zero console
  errors. **Not yet applied/deployed to the live project** — migrations
  0002/0003 need running, Edge Functions need deploying + scheduling, see
  `SUPABASE_SETUP.md`/`TWILIO_SETUP.md`.
- **2026-07-11** — Phase 4 taken fully live. User applied migrations
  0002/0003, created a Twilio account + WhatsApp Sandbox, set the
  `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_WHATSAPP_FROM` secrets,
  and deployed both functions (`supabase functions deploy`, worked without
  Docker running). Along the way: `supabase secrets set` rejects any name
  starting with `SUPABASE_` — `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`
  are auto-injected already, no manual step needed (see `TWILIO_SETUP.md`,
  corrected). Test-invoked both functions directly via `curl` before
  scheduling anything (safe — no real data matched, so nothing sent).
  Verified `pg_cron` + `pg_net` scheduling actually fires autonomously: set
  up a temporary every-minute test job against a throwaway event, watched
  `reminder_sent_at` flip from `null` on its own within a minute, then
  cleaned up. Sent real test WhatsApp messages for both flows to the
  user's own phone (after they joined the Twilio Sandbox) — both
  delivered successfully. Scheduled production cron jobs:
  `birthday-check-daily` (`0 8 * * *` UTC = 9am Irish Summer Time) and
  `event-reminder-hourly` (`0 * * * *`), confirmed via
  `select * from cron.job`. All test data reverted/deleted, confirmed via
  the `events` table (anon-readable) coming back empty; `members` isn't
  anon-readable so that revert relies on the `UPDATE` having run in SQL
  Editor rather than an independent check.
- **2026-07-11** — Phase 5: deployed the frontend to Vercel. Linked via
  `npx vercel link` (auto-connected the GitHub repo for deploy-on-push),
  set `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` as production env vars,
  deployed with `npx vercel --prod`. First deploy 404'd on any direct
  route load other than `/` (e.g. `/upcoming`) — added `vercel.json` with
  a catch-all rewrite to `index.html` so React Router handles routing
  client-side; redeployed, confirmed 200 + zero console errors via
  headless browser on both `/` and `/upcoming`.

## How to run

**Live**: [shepherd-crm-six.vercel.app](https://shepherd-crm-six.vercel.app)
— auto-deploys on every push to `main`.

**Local**:
```
cd ~/shepherd-crm
npm run dev
```

Currently running in **live Supabase mode** (`.env.local` is set) — log in
with the `admin@jpd.church` account and password created in the dashboard.

To go back to mock mode: delete/rename `.env.local` and restart. Mock
credentials: `admin@jpd.church` / `admin123`.
