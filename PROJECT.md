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

**Phase 6: Automations (announcements + newcomer welcome) — DONE, fully
live.** Admin can compose a WhatsApp announcement targeted at a member tag
or a department, scheduled for later. Members tagged "newcomer" (manual
entry or an approved join request) get an automatic welcome message.
Migrations 0004/0005 applied, all four Edge Functions deployed and
scheduled:
- `birthday-check-daily` — `0 8 * * *` UTC
- `event-reminder-hourly` — `0 * * * *` UTC
- `newcomer-welcome-15min` — `*/15 * * * *` UTC
- `send-announcements-5min` — `*/5 * * * *` UTC

**Phase 6.5: Security hardening — DONE.** Prompted by a direct question
about rate limiting/brute force/abuse, since the app is now public. Four
things fixed (see "Stack decisions" for detail): DB-level rate limiting on
the public forms, a shared-secret gate so only the cron job can invoke
the WhatsApp functions (previously anyone with the public anon key
could), a confirm-before-approve step on join requests, and a honeypot +
timing check on the public forms. All verified live: functions return 401
without the secret header, 200 with it.

**Phase 7: Design system port from `~/shepherdcrm` reference — DONE.**
`~/shepherdcrm` is a separate, unrelated local project (a Supabase-based
reference UI, not part of this app) whose visual design — palette,
typography, component patterns — was ported into this app 1:1. Its
data-fetching/auth/backend logic was explicitly NOT copied; only the UI
was rebuilt against this app's existing Supabase schema and Edge
Functions. See "Stack decisions" for the full detail.

**Phase 8: Dashboard page — DONE.** The reference has a Dashboard as its
landing page; this app didn't. Added `/dashboard` (now the default landing
route post-login and at `/`) with the reference's stat cards, "This week"
(birthdays/upcoming events/pending join requests), and "Recent activity"
sections wired to real data. Its "Newcomer pipeline" drag-and-drop kanban
was deliberately replaced (per explicit request) with a donut chart
showing newcomer rate — see "Stack decisions" for the color/chart detail.

**Phase 9: DOB capture + department-scoped join links — DONE, fully
live.** Superseded an earlier department-lead-role idea: WhatsApp groups
already handle department communication, so the actual gap was smaller —
getting group-chat members into the CRM so they're covered by the
existing birthday automation, not a new in-app role. Added a required
`dob` field to `join_requests` (migration `0006_join_dob.sql`) that flows
straight into the created `Member` on approval — no more `dob: null`
backfill needed. Added `?department=<id>` support on `/join`
(pre-selects and locks the department), and a shareable-link "Copy"
control in `DepartmentDrawer` (admin can grab
`.../join?department=<id>` per department to paste into that
department's WhatsApp group). No new roles, logins, or dashboards.
Verified end-to-end via Playwright in mock mode (department link →
locked `/join` form → DOB required → submit → admin approve → member's
`dob` matches submitted value), zero console errors. Migration applied
to the live Supabase project (`supabase db push`) and frontend deployed
(pushed to `main`, Vercel auto-deploy).

**Phase 10: public homepage — DONE, code-complete, not yet deployed
live.** Previously "/" just redirected straight to `/dashboard` — no
public marketing/landing page existed. Ported a hero-section design
(sourced from 21st.dev, originally a Next.js/generic-SaaS template) into
`src/pages/public/HomePage.tsx`, adapted to this app: `next/link` →
`react-router-dom` `Link`, the template's generic gradient wordmark
swapped for the app's real brand mark (same forest "S" badge + "Shepherd
CRM / JPD Church" lockup used in `Layout.tsx`'s sidebar and
`LoginPage.tsx`), nav links pointed at real routes (`/join`,
`/upcoming`), header CTA reduced to just "Sign in" (no "Sign up" — this
app has no self-serve signup, see "Member access model"). Copy rewritten
for the church context, and revised once more after the user pointed
out the first pass read as a member-facing hub rather than a real
homepage: hero CTAs now lead with the product itself ("Sign in to your
dashboard" / "See how it works" → `#preview`), join/RSVP demoted to a
small text line rather than dropped, a `#preview` section shows a real
screenshot of the populated `/dashboard` page (not a mockup — seeded
realistic mock data, logged in, screenshotted), and a `#features`
section with 4 cards (Member records / Departments / Events & RSVPs /
WhatsApp automations, using the same lucide icons as the sidebar nav)
spells out what the product does. Dropped the source template's fake
customer-logo trust bar (Nvidia/GitHub/Nike/etc.) — no real equivalent —
consistent with the Phase 7 "no fake/non-functional UI" precedent; the
real dashboard screenshot replaces what would've been the template's
fake product-screenshot mockup. `/` now renders `HomePage` directly
(redirects to `/dashboard` if already logged in, same pattern as
`LoginPage`); the catch-all `*` route now redirects to `/` instead of
`/dashboard`, since `/` is a real public page now, not just a redirect
stub. Added `framer-motion` (for entrance animations) and
`src/components/ui/animated-group.tsx` (adapted from the source
template, `preset` prop dropped since nothing in this app uses it). No
hardcoded colors — the app's existing semantic Tailwind tokens carry the
"Warm Archival Modern" palette through automatically in both light and
dark mode, verified by screenshot both times. One real bug caught and
fixed along the way: the source template's fade-to-background gradient
overlay was sized to the whole preview container rather than just its
edge, washing out roughly the bottom two-thirds of the real dashboard
screenshot — removed, since a product screenshot's whole point is
legibility. Verified via Playwright in mock mode both times, zero
console errors each time. Live — see Phase log for commit details.

**Phase 10 expansion (2026-07-13): five new marketing sections —
code-complete, not yet deployed.** Below the existing hero/`#preview`/
`#features` (unchanged): `#how-it-works` (4 steps grounded in real
built features — join link → public request → admin approve →
automations, no invented functionality), `#why-whatsapp` (why
automating inside WhatsApp beats asking congregations to adopt a new
app/check email), `#comparison` (Shepherd vs. Planning Center/
ChurchTrac — kept to general, defensible claims like "modular,
pay-per-app pricing" rather than specific figures that could go stale
or be wrong, consistent with not disparaging competitors), `#pricing`
(3 tiers — Starter/Growth/Established, scaled by member count, not
features, since gating WhatsApp automation behind a higher tier would
undercut the product's own pitch; Monthly/Annual toggle, annual = 10×
monthly with a "2 months free" badge), and `#faq`. Pricing tiers live
as a plain `PRICING_TIERS` const in `HomePage.tsx` — no new table,
matching the existing "keep aggregation/data simple until it needs to
be a table" precedent. Reused existing patterns rather than
introducing new ones: the Monthly/Annual toggle copies
`AttendancePage`'s granularity-toggle segmented control, the
comparison table is a hand-rolled `<table>` (matching how
`JoinRequestsPage`/`EventsListPage` already hand-roll tables instead of
the installed-but-unused shadcn `table.tsx`), and the FAQ is a
hand-rolled expand/collapse (no accordion primitive exists in this
app). Asked before writing any code: every pricing/FAQ "get started"
CTA needs a real destination given there's no self-serve signup and no
contact backend — offered a `mailto:` link (needs a real address) vs.
an honestly-disabled placeholder; user chose disabled. CTAs render as
real disabled `<Button disabled>` elements (visibly muted, not a
fake-looking clickable link to nowhere), with a caption underneath —
"No self-serve signup yet — contact options are coming soon" — same
"no fake/non-functional UI" precedent as the rest of the app. FAQ
answers only state what's actually true of the built product (RLS
org-isolation for the privacy question, WhatsApp genuinely included at
every tier, manual member-add for the no-smartphone question) — no
invented capabilities. Verified via Playwright in mock mode: all four
sections render, the pricing toggle recalculates to the correct 10×
annual price and shows the "2 months free" badge, all three CTA
buttons are genuinely `disabled` (not just styled to look that way),
the FAQ accordion expands/collapses per item, and the new "Pricing"
header nav link scrolls to `#pricing`. Zero console errors.

Unrelated to the homepage work itself: discovered mid-session that
local `.env.local` had gone missing (empty file list, no `.bak` either)
— root cause not fully pinned down (likely a `2>/dev/null`-suppressed
`mv` failure during dev-server cleanup in an earlier session silently
no-op'ing against a file that, for whatever reason, wasn't there).
Reconstructed it from the Supabase project's own API keys
(`supabase projects api-keys`) rather than guessing — piped directly
into a small Node script that wrote `.env.local` without the actual
key value ever appearing in the visible command output, since printing
a live key to stdout is treated the same as pasting one in chat.
Verified the reconstructed file works (live-mode login page shows no
mock-credentials hint, zero console errors) before continuing.

**Phase 11: Google Calendar import — code-complete, blocked on the
user's Google Cloud setup, not yet live.** One-way sync only: Google
Calendar → CRM, never the reverse. The church's Google Calendar is
**private** and the user chose to keep it that way rather than make it
public (confirmed explicitly — see "Open decisions"), so this
authenticates as a **Google service account** via the Calendar API
(JWT bearer flow, `supabase/functions/_shared/google.ts`, RS256-signed
with `jose` via esm.sh) rather than fetching a public ICS feed — no
OAuth user-login, since this is one shared church calendar, not
per-admin personal calendars. New `supabase/functions/calendar-sync`
Edge Function (same `x-cron-secret` gate as the other four), calls
Calendar API `events.list` with `singleEvents=true` so Google expands
recurring events (e.g. weekly Sunday service) for us — no hand-rolled
RRULE expansion needed. Schema (`0007_google_calendar_sync.sql`):
`events.google_event_id` (nullable, unique — upsert key) and
`events.source` ('manual' | 'google'). Upsert logic on sync: new
`google_event_id` → insert with `reminder_hours_before` defaulted to
24 (Google Calendar has no equivalent field); existing → update
title/date/location but leave `reminder_hours_before` untouched so an
admin override survives re-syncs, and reset `reminder_sent_at` to null
if the date actually changed (so a rescheduled event still gets a
fresh reminder). Skips Google's `cancelled` events on sync.
**Known limitation, accepted for v1**: does not auto-delete CRM rows
for events removed from Google — `rsvps.event_id` cascades on delete,
so an automatic delete on every sync run could silently wipe real
RSVPs if the feed ever hiccups; stale synced events are left for an
admin to delete manually instead.

`EventDrawer` now branches on `source`: for `source='google'` events,
title/date/location render as read-only text (Google owns them) with a
banner explaining why; `reminderHoursBefore` stays the one editable
field, same as manual events. `EventsListPage` and the new `/calendar`
page both show a "Synced from Google" badge on synced events so it's
clear why those fields are locked. New **`/calendar`** nav item
(`CalendarSync` icon, distinct from `/events`'s plain `Calendar` icon):
built as an actual month-grid calendar view (prev/next/Today
navigation, Monday-start weeks, event chips colored by source) rather
than another flat list — read as "calendar browsing is a different
mode of use" from the existing `/events` list, not a duplicate of it.
Clicking a chip opens the same `EventDrawer`. `/events` continues to
show both manual and synced events too (same `events` table, no
filtering added), now with the same source badge for consistency.

Verified via Playwright in mock mode (seeded one manual + one
Google-sourced event directly into localStorage, since there's no live
sync to test against yet): both show on `/events` with correct
badging, the google event's drawer renders read-only fields but still
saves a reminder-hours change while leaving the title alone, the
manual event's drawer stays fully editable, `/calendar` renders both
as correctly colored/positioned chips and opens the drawer on click.
Zero console errors.

**Not yet live** — blocked on the user completing the Google Cloud
Console side (create project, enable Calendar API, create a service
account + JSON key, share the calendar with its email as "See all
event details"). Have the Calendar ID already
(`c_509854ef...@group.calendar.google.com`, ends
`...dbcb4f3d1d4fddd1538a20fed3b195d@group.calendar.google.com`).
Once the service account email + private key arrive, remaining steps:
`supabase secrets set` for `GOOGLE_SERVICE_ACCOUNT_EMAIL`/
`GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`/`GOOGLE_CALENDAR_ID`, `supabase db
push` for `0007`, deploy `calendar-sync`, schedule
`calendar-sync-hourly` via `pg_cron` (same pattern as the other four
jobs), test-invoke via `curl` before scheduling, commit + push the
frontend.

**Phase 12: aggregate service attendance tracking — DONE, fully live.**
Built from scratch in one pass —
headcounts per service (First Service, Youth Service), not individual
check-in: deliberately no member/phone matching, no dedupe against a
person, matching how ushers already count. New table
`attendance_records` (`0008_attendance.sql`): `service_name` is free
text, not an enum — current usage is `'first_service'`/`'youth_service'`,
but more services can be added later without a migration (a small
`KNOWN_SERVICES` constant in `src/lib/constants.ts` is the one place the
UI needs to know what exists, for the admin dropdown, the two chart
series, and the copy-link buttons — adding a third service still means a
code edit there, just never a schema migration). Rate-limit trigger,
same `BEFORE INSERT` pattern as `join_requests`/`rsvps`
(`0005_security_hardening.sql`), but **exact-match dedup** on
`(service_name, date)` rather than a rolling per-hour count — the goal
is specifically blocking the same service+date being submitted twice
(e.g. two ushers both logging one Sunday), not general throttling.

Two submission paths, both writing to the same table/fields (no
requester identity captured — this isn't tied to an individual, unlike
`join_requests`/`rsvps`): admin form (`AttendanceDrawer`, create-only —
no edit/list UI exists, just this one form behind a "Log attendance"
button) and a public no-login link at **`/attendance/submit?service=
<value>`**, same pattern as `/join?department=<id>`. Resolved one
ambiguity in the spec myself: the instructions used `/attendance` for
both the protected admin analytics page and the public link, which
can't be the same route (one's wrapped in `Layout`+`ProtectedRoute`,
the other's bare) — split them the way this app already splits
`/join-requests` vs `/join` and `/events` vs `/upcoming`. The public
page always operates locked to a service from the query param (no
free-choice dropdown, since admins hand out per-service links via
"Copy link" buttons on `/attendance` — same clipboard pattern as
`DepartmentDrawer`, including its try/catch fallback for
clipboard-permission failures); missing `?service=` is a real error
state, not a silent default. Added the same honeypot+timing bot-guard
`/join`/`/rsvp` use, even though not explicitly requested — matches
this app's "every public form gets it" posture since Phase 6.5, and
headcount data integrity feeds directly into the analytics.

`/attendance` (new nav tab, `BarChart3` icon — separate from the
dashboard, same reasoning as `/calendar`): granularity toggle
(Weekly/Monthly/Quarterly) and a date-range preset select (default
"Last 12 months") drive a `src/lib/attendanceAggregation.ts` module —
pure, unit-tested functions, no Postgres view, fetching all records
once via the repository layer (tiny volume, matching how the dashboard
already aggregates client-side). Buckets by **mean, not sum**, at every
granularity — summing would produce a meaningless inflated number for
"monthly attendance." A period with no submitted record is `null`, never
`0`; recharts' `Line` (`connectNulls={false}`) breaks visually at the
gap, and average/highest/lowest/percent-change all explicitly filter
nulls out. "Percent change vs. immediately preceding period" is computed
from the full, unclipped bucket history, not just the visible
date-range window, so the oldest visible bucket in e.g. "last 12 months"
still has a real predecessor to compare against — verified with a
standalone logic test (transpiled the module with `esbuild`, ran outside
the browser) before ever touching the UI, specifically checking that a
gap immediately before the latest data point correctly yields `null`
rather than silently skipping back to compare against an older bucket.
Chart: one shared `recharts` `LineChart` with both services as separate
colored lines (not tabs, not side-by-side charts) — the strongest reading
of "must be comparable at a glance." Re-ran the dataviz skill's
`validate_palette.js` rather than assuming the dashboard donut's already-
validated `#25855b`/`#ec7c0e` would still pass for this use — it does
(light mode; the WARN on contrast is satisfied by the legend + visible
stat numbers, same relief the donut already relies on). Confirmed the
dark-mode question doesn't actually apply: every "soft card" in this app
(including this chart's container) is hardcoded `bg-white` with no
`dark:` variant, so the chart never actually renders on a dark surface
regardless of theme — matches the existing donut's precedent of only
validating once.

Dashboard addition, exactly as scoped (no new charts there): a 2-card
row per service showing latest raw headcount + percent change vs. that
service's immediately preceding raw record (not granularity-bucketed —
the dashboard has no granularity toggle), linking to `/attendance`.

Verified via Playwright in mock mode: dashboard cards show correct
headcount/%, link through correctly; `/attendance` renders granularity
toggle, range select, per-service stat cards, and the chart; copy-link
shows the same clipboard-permission fallback as `DepartmentDrawer`
(confirmed the fallback path specifically, not just that the happy path
worked); switching granularity re-renders cleanly; admin log-attendance
flow succeeds, and a duplicate service+date submission surfaces the
trigger's friendly error message; public submission page correctly
errors on a missing `?service=`, shows the locked service label
otherwise, and succeeds after the bot-guard delay. Screenshotted the
populated chart directly to confirm the gap renders as a real visual
break in the line (not a dip to zero). Zero console errors throughout.
Applied to the live Supabase project (`supabase db push`, which also
swept up the still-pending `0007` from Phase 11) and pushed to `main`
(commit `5ffe4c0`), confirmed via `supabase migration list`.

Next up: finish Phase 11 once Google Cloud setup lands, or extending
departments/join-requests/events further (e.g. member-facing polish,
dedupe on `/join`).

## Stack decisions (and why)

- **Frontend**: React + Vite + TypeScript, `react-router-dom` for routing.
  As of 2026-07-11, also **Tailwind CSS v4 + shadcn/ui** (added for the
  Phase 7 design port — see below). Path alias `@/*` → `./src/*`
  (`tsconfig.app.json` + `vite.config.ts`).
- **Design system ("Warm Archival Modern")** — ported 2026-07-11 from
  `~/shepherdcrm` (reference UI, see Phase 7). Palette defined in OKLCH in
  `src/index.css` (`@theme inline` block, Tailwind v4's CSS-based
  theming, no `tailwind.config.ts`): `canvas` (cream background),
  `surface`/`ink`, `forest` (primary), `amber-clay` (secondary accent).
  Font: Manrope, loaded via Google Fonts link in `index.html`. The
  dominant visual signature — used everywhere instead of the shadcn
  `Card` component — is a hand-written "soft card":
  `rounded-2xl bg-white p-5 ring-1 ring-black/5`. shadcn primitives
  installed: button, card, input, select, table, badge, sheet, label,
  textarea (`src/components/ui/`, `src/lib/utils.ts` for `cn()`).
  **Known gotcha**: `npx shadcn add` wrote files to a literal `./@/...`
  directory instead of resolving the path alias to `src/` — had to
  manually relocate them after each generation.
- **List+drawer pattern**: Members/Departments/Events/Announcements all
  follow the reference's pattern — a table or card-grid list page, with
  create/edit happening in a right-side `Sheet` drawer
  (`src/components/*Drawer.tsx`) rather than a separate route/page. This
  replaced the earlier per-entity `*FormPage.tsx` + `/entity/:id` route
  approach entirely (Join Requests stayed a plain table — no create/edit
  drawer, since requests are only approved/rejected, not authored by
  admin). shadcn's default `Sheet` overlay (`bg-black/80`) was dimmed to
  `bg-black/30` globally in `src/components/ui/sheet.tsx` to match the
  reference's lighter overlay.
- **Deliberate deviations from the reference** (matched to this app's
  actual schema/scope, not copied blindly): no fake/non-functional UI —
  skipped the reference's decorative (non-functional) header search bar
  and notification bell, and its `EventDrawer`'s fake "coming soon"
  reminder toggle was replaced with our real, working
  `reminderHoursBefore` field. No `stage`/`address`/`notes` fields on
  Members (not in our schema) — reference has them, we don't invent them.
  Skipped the reference's calendar-view toggle for Events (list view
  only) and its email/Google-OAuth signup flow on the login page (this
  app is single-admin, no self-serve signup).
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
- **Automations reuse the same repository + Edge Function pattern**:
  `announcements` table + `AnnouncementRepository` (admin-only, unlike
  join_requests/rsvps — no public submission path) targets either a
  `MemberTag` or a `Department`; `send-announcements` resolves the
  audience and messages them. Newcomer welcome reuses the existing
  `newcomer` tag rather than a new field —
  `members.newcomer_welcome_sent_at` is the idempotency marker,
  `newcomer-welcome` fires regardless of how a member got tagged.
- **Security hardening** — added 2026-07-11 after being asked directly
  about rate limiting/brute force, since the app is public:
  1. DB-level rate limiting (`0005_security_hardening.sql`) on
     `join_requests`/`rsvps` via `BEFORE INSERT` triggers keyed on phone
     number (3/hour, 5/hour). Enforced in Postgres, not the React app —
     anyone can call the Supabase REST API directly with the public anon
     key and skip client-side checks entirely.
  2. All four Edge Functions require an `x-cron-secret` header matching a
     `CRON_SECRET` Supabase secret (`supabase/functions/_shared/auth.ts`).
     Before this, anyone holding the anon key (public in the deployed
     bundle) could invoke any of them directly — each call costs a real
     Twilio send.
  3. Approving a join request now requires an explicit `confirm()`
     naming the phone number, warning it triggers a real WhatsApp
     message — guards against rubber-stamping a spam submission into an
     unwanted message to a stranger.
  4. Honeypot + minimum-fill-time check (`src/lib/useBotGuard.ts`) on
     `/join` and `/rsvp/:eventId` — a cheap deterrent for unscripted bots,
     explicitly *not* the primary defense (that's #1).

     Not addressed / accepted for now: no CAPTCHA, no custom login
     brute-force lockout beyond Supabase Auth's platform defaults, no
     IP-based throttling. Revisit if abuse is actually observed.
- **Dashboard chart**: `recharts` + shadcn's `chart.tsx` wrapper
  (`npx shadcn add chart` — hit the same `./@/...` alias-resolution glitch
  as the other shadcn installs, relocated manually). Newcomer-rate donut
  uses two colors that are **not** the literal `forest`/`amber-clay` hex
  values used elsewhere in the UI — ran the dataviz skill's
  `validate_palette.js` and our actual brand hex (`#1c4732`/`#e1791b`)
  failed the lightness/chroma checks (too dark/desaturated to read as
  color in a small chart mark). Used lighter/more-saturated variants in
  the same hue families instead (`#25855b` / `#ec7c0e`, both validated
  passing). `isAnimationActive={false}` on the `Pie` — recharts' default
  entrance animation caused a real, reproducible bug: on some render
  paths the chart would render as visibly blank for the first ~400-800ms
  and any screenshot/interaction timed during that window looked
  completely broken, even though the container was correctly sized the
  whole time. Static rendering avoids that class of flake entirely, which
  also suits a dashboard widget you revisit often (no need to re-animate
  every visit).

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
members(id, org_id, name, phone, email, dob, tags[], department_ids[], joined_at,
        newcomer_welcome_sent_at)
departments(id, org_id, name, leader_id, member_ids[])
join_requests(id, org_id, department_id, requester_name, requester_phone,
              requester_email, dob, member_id?, status, created_at)
events(id, org_id, title, date, location, reminder_hours_before, reminder_sent_at,
       google_event_id?, source)
rsvps(id, org_id, event_id, attendee_name, attendee_phone, attendee_email,
      member_id?, status, created_at)
announcements(id, org_id, message, target_type, target_value, scheduled_at,
              sent_at, created_at)
attendance_records(id, org_id, service_name, date, headcount, submitted_by,
                    created_at)
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
- `0006_join_dob.sql` (Phase 9) — `join_requests.dob`, added nullable,
  backfilled to a sentinel for any pre-existing rows, then set `not null`
  — required for the point of the field (immediate birthday-automation
  coverage), safe regardless of current row count.
- `0007_google_calendar_sync.sql` (Phase 11) — `events.google_event_id`
  (nullable, unique — sync upsert key) and `events.source` ('manual' |
  'google', default 'manual').
- `0008_attendance.sql` (Phase 12) — new `attendance_records` table.
  `service_name` is free text (no enum, no migration needed for a new
  service); exact-match dedup trigger on `(service_name, date)`.

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
- ~~Phase 9 not yet live~~ — resolved 2026-07-12: `0006_join_dob.sql`
  applied via `supabase db push`, frontend pushed to `main` (Vercel
  auto-deploy). Confirmed via `supabase migration list`.
- ~~Phase 10 not yet live~~ — resolved 2026-07-12: committed, pushed,
  live via Vercel auto-deploy (see Phase log for both commits).
- ~~Twilio connection~~ — resolved 2026-07-11: Sandbox connected, both
  functions deployed and scheduled, real WhatsApp delivery confirmed for
  both birthday and reminder messages.
- **Google Calendar sync method**: resolved 2026-07-12 — the church's
  calendar is private and the user explicitly chose to keep it that way
  (offered making it public for a simpler ICS-feed sync; declined) —
  using a Google service account + Calendar API instead. See Phase 11.
- **Phase 11 partially live**: `0007_google_calendar_sync.sql` is now
  applied (swept up in the same `db push` as `0008`, 2026-07-13) — the
  `source`/`google_event_id` columns exist live. Still blocked on the
  user's Google Cloud Console setup for the rest: `calendar-sync`
  isn't deployed, no cron job exists yet, so no actual sync is
  happening. See Phase 11 for the exact remaining steps once the
  calendar gets shared with the service account.
- **No auto-delete for events removed from Google Calendar** (Phase 11):
  accepted for v1 since deleting cascades to `rsvps`. Revisit if stale
  synced events become a real annoyance.
- ~~Phase 12 not yet live~~ — resolved 2026-07-13: `0008_attendance.sql`
  applied via `supabase db push` (alongside the still-pending `0007`),
  frontend pushed to `main` (commit `5ffe4c0`), confirmed via
  `supabase migration list`.
- **No edit/delete UI for attendance records**: create-only, matching
  the literal scope asked for. A usher typo currently has no in-app fix
  path — would need a direct SQL correction. Revisit if that's a real
  problem in practice.
- **Two live members still have bad phone data**: John Fakoyede (blank)
  and Samuel Okafor (`555-0102`, placeholder-looking) — left untouched
  per explicit instruction during the 2026-07-13 announcement-delivery
  bug fix. Both will keep silently failing the E.164 check (now at
  least visibly, via the new delivery-count badge) until real numbers
  are added.
- **WhatsApp 24-hour session window — affects all four automations, not
  fixed yet**: discovered 2026-07-13 chasing a "test announcement sent
  but never arrived" report, right after the delivery-tracking fix
  above (which correctly showed `sent_count` going up — Twilio's
  synchronous API call succeeds/queues the message). The actual failure
  is async and invisible to our code: Twilio error 63016, "outside the
  allowed window" — WhatsApp only allows free-form (non-template)
  messages within 24 hours of the recipient last messaging the
  business's WhatsApp number. Every message this app sends
  (`birthday-check`, `event-reminder`, `newcomer-welcome`,
  `send-announcements`) is business-initiated, never a reply, so in real
  use the window will almost always be closed by send time — this isn't
  a Sandbox-only quirk, it's the underlying WhatsApp Business Platform
  rule (the Sandbox's own "join" 3-day session is a separate, additional
  restriction on top of it). Explains why delivery "worked" when
  confirmed in earlier phases: those tests ran shortly after a fresh
  Sandbox join, while the window was still open. Short-term test
  workaround: send any message from the recipient's phone to the Twilio
  number to reopen the window, then send a **new** test (already-`sent_at`
  rows don't retry). **Real fix, deferred until later**: register
  WhatsApp Message Templates via Twilio's Content API, get them approved
  by WhatsApp/Meta (hours to days, outside our control), and switch all
  four Edge Functions from raw `Body` text to `ContentSid` +
  `ContentVariables`. Separately worth doing regardless: `_shared/
  twilio.ts`'s `sendWhatsAppMessage` only checks the synchronous HTTP
  response and never captures the Twilio message SID or final delivery
  status — there's currently no way to look up what actually happened to
  a "sent" message without checking Twilio Console by hand.
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
- **2026-07-11** — Phase 6: added scheduled announcements (tag- or
  department-targeted WhatsApp broadcasts) and newcomer welcome messages.
  New `announcements` table + `AnnouncementRepository`, admin
  list/form pages, `send-announcements` Edge Function (resolves audience
  by tag or `department.member_ids`). Newcomer welcome reuses the existing
  tag; `newcomer-welcome` Edge Function + `members.newcomer_welcome_sent_at`
  idempotency marker. Verified both in mock mode via headless browser
  (tag-targeted and department-targeted announcements, cancel), zero
  console errors.
- **2026-07-11** — Phase 6.5: security hardening, prompted by a direct
  question about rate limiting/brute force protection once the app went
  public. Discussed the actual gaps openly (see "Stack decisions" for the
  four fixes) rather than assuming they were covered. Deployed via
  `supabase db push` (migrations 0004+0005 together — Phase 6's deploy had
  been paused mid-way for this), `supabase secrets set CRON_SECRET=...`,
  redeployed all four Edge Functions, then rescheduled all four cron jobs
  with the new `x-cron-secret` header (had to unschedule/reschedule
  `birthday-check-daily`/`event-reminder-hourly` since `pg_cron` has no
  "alter job" for changing the command). Verified live via `curl`: every
  function now 401s without the header and 200s with it. Confirmed final
  `cron.job` state via a pasted SQL Editor screenshot (jobids 5–8).
  `supabase db push --yes` and `supabase secrets set` both required
  explicit user sign-off beyond the earlier general "run it directly"
  authorization — treated as separate, narrower grants each time.
- **2026-07-11** — Phase 7: ported the visual design from `~/shepherdcrm`
  (a separate, unrelated reference project) into this app. Explored the
  reference's structure first (design tokens, shared component library,
  page layouts) and reported back before changing anything, per explicit
  request. Installed Tailwind v4 + shadcn/ui (this app had no Tailwind
  before — decided to adopt it rather than hand-translate into the
  existing plain CSS, for a truer 1:1 match). Ported the OKLCH palette,
  Manrope font, and radius scale into `src/index.css`. Rebuilt `AppShell`
  as `Layout.tsx` (adapted from TanStack Router to `react-router-dom`).
  Converted Members/Departments/Events/Announcements from separate
  form-page routes to the reference's list+drawer pattern (new
  `*Drawer.tsx` components using shadcn `Sheet`); Join Requests stayed a
  plain table (no drawer, matches its approve/reject-only nature).
  Restyled login (split-panel) and the three public pages (centered soft
  card via new `PublicPageShell.tsx`). Deliberately did NOT port: the
  reference's non-functional header search/notification bell, its fake
  "reminder coming soon" toggle (kept our real `reminderHoursBefore`
  field instead), its calendar-view toggle, or its email/Google signup
  flow (this app is single-admin). Removed `src/App.css` and all
  `MemberFormPage`/`DepartmentFormPage`/`EventFormPage`/
  `AnnouncementFormPage` files/routes entirely — fully superseded.
  Verified every single page (admin + public) via headless browser
  screenshots with zero console errors before committing. Also caught a
  real production-build bug `tsc --noEmit` had missed: `baseUrl` is
  deprecated in this TS version (fixed by keeping only `paths`), and two
  `<Th></Th>` usages didn't satisfy a required `children` prop (swapped to
  plain `<th></th>`) — `npm run build` (what Vercel actually runs) caught
  both; confirmed the live Vercel deploy succeeded after the fix.
- **2026-07-11** — Phase 8: added the Dashboard page. Installed
  `recharts` + shadcn `chart.tsx` for the newcomer-rate donut (replacing
  the reference's newcomer-pipeline kanban, per explicit request). Ran
  the dataviz skill's palette validator on our actual brand colors before
  using them as chart marks — they failed (too dark/desaturated for a
  small mark) — swapped in lighter/more-saturated same-hue variants that
  passed. Made `/dashboard` the new default landing route (post-login and
  `/`), added it as the first nav item, wrapped the sidebar brand mark in
  a link back to it. Hit and fixed two real bugs during verification: the
  chart's container collapsed to 0×0 when it was a flex-row child with no
  explicit width (fixed with `w-56 shrink-0`), and recharts' default
  entrance animation caused the chart to render blank for the first
  several hundred ms on some paths — disabled via
  `isAnimationActive={false}`. (Two other apparent bugs during testing
  turned out not to be bugs: the join-request bot-guard correctly
  rejecting instant Playwright-speed form fills, and a stale test
  locator from before the Phase 7 rewrite.) Verified via headless
  browser with real populated data (an event, a pending join request)
  before committing.
- **2026-07-12** — Phase 9: dropped an earlier department-lead-role idea
  (WhatsApp groups already cover department communication better than an
  in-app dashboard would) in favor of a smaller fix — getting WhatsApp
  group members into the CRM so birthday-check-daily covers them. Added
  required `join_requests.dob` (`0006_join_dob.sql`, added
  nullable/backfilled/set-not-null to stay safe regardless of existing
  row count) that now flows into the created `Member` on approval instead
  of the previous hardcoded `dob: null`. Added `?department=<id>` support
  on `/join` (pre-selects and disables the department select) and a
  "Copy" shareable-link control in `DepartmentDrawer` for admins to paste
  into a department's WhatsApp group. Approve confirm-dialog, rate
  limiting, and bot-guard untouched. The Chrome extension (used for
  headless-browser verification in earlier phases) wasn't connected this
  session, so verification used Playwright directly instead — same
  approach (drive the real mock-mode app, check zero console errors).
  Caught and fixed one real gap during that verification:
  `DepartmentDrawer`'s copy-link handler had no error handling and threw
  an unhandled `NotAllowedError` when clipboard-write permission was
  denied (reproduced headless; also possible in real restrictive-permission
  contexts) — wrapped in try/catch with a fallback message. Confirmed
  full flow (department link → locked form → required DOB → submit →
  admin approve → member's `dob` matches) end-to-end, zero console
  errors. Applied to the live Supabase project (`supabase db push`) and
  pushed to `main` (commit `72747bb`), confirmed via
  `supabase migration list`.
- **2026-07-12** — Phase 10: added a real public homepage at `/` —
  previously it just redirected straight to `/dashboard`. Ported a
  hero-section design the user liked from 21st.dev (Next.js/generic-SaaS
  template) into `src/pages/public/HomePage.tsx`: swapped `next/link` for
  `react-router-dom`, replaced the template's generic wordmark with the
  app's real brand mark, pointed nav links at real routes (`/join`,
  `/upcoming`), cut the header CTA to just "Sign in" (no self-serve
  signup in this app), and rewrote all copy for the church context.
  Dropped two template sections that had no real equivalent — a fake
  product-screenshot mockup and a fake customer-logo trust bar — per the
  Phase 7 "no fake/non-functional UI" precedent, rather than inventing
  placeholder content for them. `/` redirects to `/dashboard` if already
  logged in (mirrors `LoginPage`'s pattern); `*` catch-all now goes to
  `/` instead of `/dashboard`. Added `framer-motion` +
  `src/components/ui/animated-group.tsx` (adapted from the source,
  unused `preset` prop system dropped). No color values were
  hardcoded — the ported component uses the app's existing semantic
  Tailwind tokens (`bg-primary`, `text-muted-foreground`, etc.)
  throughout, so the "Warm Archival Modern" palette carried over
  automatically; verified by screenshotting both light and dark mode.
  Verified via Playwright in mock mode: CTAs and header "Sign in" link to
  the right routes, logged-in visit to `/` redirects to `/dashboard`,
  mobile menu opens correctly, zero console errors. Committed and pushed
  (commit `9a829d1`), live via Vercel auto-deploy.
- **2026-07-12** — Phase 10 revision: the first version read as a
  member-facing hub (its primary CTAs were "Join a department" /
  "Upcoming events"), but the actual goal is to show off the product
  itself to first-time visitors — the user pointed out it "doesn't
  really make sense for a homepage" without that. Rewrote the hero
  copy/CTAs around the product ("Sign in to your dashboard" primary,
  "See how it works" scrolls to a `#preview` anchor); demoted
  join/RSVP to a small text line below the CTAs
  ("Part of JPD Church? Join a department or check upcoming events.")
  rather than dropping them, since real congregation members do land
  here too. Added a `#preview` section with an actual screenshot of the
  populated `/dashboard` page (seeded realistic mock members/departments/
  events/join-requests via localStorage, logged in, screenshotted at
  1400×780 — real product, not a mockup — saved to
  `public/dashboard-preview.png`), shown in a soft-card frame consistent
  with the app's existing card style. Added a `#features` section below
  it: 4 cards (Member records / Departments / Events & RSVPs / WhatsApp
  automations) using the same lucide icons as the sidebar nav, describing
  what the product actually does. Caught and fixed one real bug during
  verification: the source template's top-to-bottom gradient overlay
  (meant to fade a screenshot into the page) was sized to the full
  preview container, not just its edge, which washed out roughly the
  bottom two-thirds of the real dashboard screenshot to near-invisibility
  (confirmed via a cropped native-resolution screenshot, not just the
  downscaled full-page one) — removed it entirely, since a product
  screenshot whose whole point is legibility shouldn't fade itself out.
  Verified via Playwright: new headline renders, screenshot image loads
  (checked `naturalWidth` to catch a broken image), features section
  renders all 4 cards, join/RSVP links and the Features nav anchor still
  work, zero console errors; also re-checked dark mode — the light
  screenshot reads fine as a framed card against the dark canvas.
- **2026-07-12** — Phase 11 (code side): one-way Google Calendar import.
  Asked before building whether the church calendar was public — it's
  private, and offered making it public for a simpler ICS-feed sync;
  user chose to keep it private and use a service account instead.
  Got the Calendar ID from "Integrate calendar" in the calendar's
  settings; still waiting on the user to create the actual Google Cloud
  service account and share the calendar with it (walked them through
  the exact console steps). Built everything not blocked on those
  credentials: `0007_google_calendar_sync.sql`
  (`google_event_id`/`source`), `ChurchEvent` type additions,
  `supabaseEvents.ts` row mapping, `EventDrawer` read-only handling for
  `source='google'` (banner + read-only title/date/location, reminder
  hours stays editable), a "Synced from Google" badge on `EventsListPage`
  cards, and a new `/calendar` month-grid view (`CalendarPage.tsx`,
  Monday-start weeks, prev/next/Today nav, colored event chips, click
  to open `EventDrawer`) — deliberately a real calendar view rather than
  another flat list, to match "a different mode of use" from `/events`.
  Wrote the sync Edge Function (`supabase/functions/calendar-sync`) and
  its Google auth helper (`_shared/google.ts` — RS256 JWT bearer flow via
  `jose`, `singleEvents=true` so Google expands recurring events for us).
  Verified the UI via Playwright in mock mode by seeding one manual and
  one `source='google'` event directly into localStorage (no live sync
  exists yet to test against): both list correctly with right badging,
  the google event's drawer saves a reminder-hours change while title
  stays locked and unchanged, `/calendar` renders and colors both chips
  correctly and opens the drawer on click. Zero console errors.
  Committed and pushed (commit `57e7fd0`) — safe to ship ahead of the
  migration since every `source`/`google_event_id` check degrades to
  "treat as manual" if those columns don't exist yet, no crash.
- **2026-07-12** — Phase 11 continued: got the Google Cloud service
  account created (`shepherd-crm-calendar-sync@double-gamma-399709.iam.gserviceaccount.com`)
  and its JSON key. Set all three secrets
  (`GOOGLE_SERVICE_ACCOUNT_EMAIL`/`GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`/
  `GOOGLE_CALENDAR_ID`) via `supabase secrets set --env-file` (temp file
  deleted immediately after) — confirmed via `supabase secrets list`.
  Hit the anticipated sharing blocker: the user only has viewer-level
  access to the calendar under their own account (shared by someone
  else), which can't manage a calendar's sharing list — only the actual
  owner/manager can add the service account. User has messaged that
  person; sync deploy (`db push`, function deploy, cron schedule) is on
  hold until the share goes through. Also explained, when asked, why
  this uses a service account instead of the user's own Google login:
  matches their original explicit instruction not to build a
  per-admin OAuth flow, and a service account isn't tied to any one
  person's account lifecycle (password/2FA changes, revoked sessions,
  someone leaving the church) — acknowledged the honest trade-off that
  OAuth against the user's own account would've reused access they
  already have and skipped this sharing step entirely, at the cost of
  building a full OAuth flow and a sync that's fragile to that one
  account's status. User chose to stick with the service account.
  While waiting, improved `/calendar` navigation per explicit feedback
  that month-by-month stepping was too slow to browse far into the
  future/past: added year-jump buttons (`ChevronsLeft`/`ChevronsRight`)
  flanking the existing month buttons, plus a native `<input
  type="month">` picker for jumping directly to any month/year.
  Verified via Playwright (year jumps forward/back 12 months correctly,
  Today returns to the current month, the picker jumps straight to an
  arbitrary month 2 years out), zero console errors.
- **2026-07-13** — Phase 12: aggregate service attendance tracking,
  built from scratch in one pass (confirmed via repo/git search that no
  prior version existed, despite the request initially describing it as
  superseding one). New `attendance_records` table
  (`0008_attendance.sql`, free-text `service_name`, exact-match dedup
  trigger on `service_name`+`date`), `AttendanceRepository` following
  the existing mock/Supabase split, `AttendanceDrawer` (admin,
  create-only), public `/attendance/submit?service=<value>` (resolved a
  route-naming conflict in the spec myself — split admin vs. public the
  way `/join-requests`/`/join` already are), and `/attendance` — a new
  nav tab with a granularity toggle, date-range presets, per-service
  stat cards, and one shared two-series `recharts` line chart. Core
  logic lives in `src/lib/attendanceAggregation.ts` (pure functions,
  mean not sum per bucket, gaps as real `null`s excluded from every
  stat). Verified that logic standalone before touching any UI —
  transpiled the module with `esbuild` and ran it under plain Node,
  specifically checking that a gap immediately before the most recent
  data point yields `percentChange: null` rather than silently
  comparing against an older bucket. Re-ran the dataviz skill's
  `validate_palette.js` on the chart colors rather than assuming the
  dashboard donut's already-validated pair would still pass. Dashboard
  got exactly the scoped addition (2 cards, latest headcount + %
  change per service, linking to `/attendance`) and nothing more.
  Verified the full stack via Playwright in mock mode: dashboard cards,
  granularity/range controls, stat cards, chart rendering, copy-link
  (including its clipboard-permission fallback, not just the happy
  path), the admin log-attendance flow, the dedup trigger's error
  message on a duplicate submission, and the public page's missing-
  service error state plus a successful locked-service submission.
  Screenshotted the populated chart to visually confirm the gap breaks
  the line rather than dipping to zero. Zero console errors. Hit one
  real `tsc -b` vs. `tsc --noEmit` discrepancy (same class of gap as
  Phase 7): a variable narrowed by an early-return guard wasn't carried
  into a nested function's closure, only caught by the full project
  build — fixed with an explicit re-binding.

  Deploy: `supabase db push` hit a transient Cloudflare 502 on the
  follow-up `migration list` check (retried after backing off ~60s per
  the error's own guidance — resolved cleanly). The push itself applied
  **both** `0008_attendance.sql` and the still-pending `0007` from
  Phase 11 in one go, since `db push` always applies everything
  outstanding, not just the newest migration. Deliberately did **not**
  push the frontend in parallel with the migration this time, unlike
  Phase 9/11: those added columns to existing tables (missing columns
  just come back `undefined` — safe), but this adds a whole new table,
  and `DashboardPage`'s `Promise.all([...])` has no `.catch()` — if the
  frontend had gone live querying `attendance_records` before the table
  existed, the dashboard would have hung on "Loading dashboard..."
  forever instead of degrading gracefully. Waited for `migration list`
  to confirm both `0007`/`0008` were live before pushing (commit
  `5ffe4c0`).
- **2026-07-13** — Phase 12 refinements, all additive, no schema/repository
  changes: (1) fixed the weekly chart x-axis — `startOfWeek()` in
  `attendanceAggregation.ts` was anchoring to **Monday** (copied from
  `CalendarPage`'s unrelated month-grid convention) even though every
  real record is a Sunday, so weekly labels showed an arbitrary
  shifted-back date instead of the actual submitted date. Re-anchored to
  Sunday (fully local to this file — doesn't touch `CalendarPage`).
  Along the way, caught a second real bug via a standalone Node test
  before it ever reached the UI: `toLocaleDateString(undefined, ...)`
  follows the *browser's* locale, and this app's real users are in
  Ireland — an Irish locale renders "7 Jun" (day-first), not the "Jun 7"
  explicitly asked for. Forced `"en-US"` explicitly for the weekly label
  rather than leaving it locale-dependent. (2) Added computed/templated
  insight sentences — `attendanceInsight()` + `periodPhrase()` in
  `attendanceAggregation.ts`, strictly a phrasing wrapper around the
  `percentChange` both `computeAttendanceSeries` and
  `latestAttendanceChange` already compute — no new math, no AI/API
  call. Shown per-service inside each `/attendance` stat card
  (granularity-scoped phrasing: "this quarter compared to last quarter"
  etc.) and as a condensed line on each dashboard attendance card
  (fixed to "week-over-week", matching the dashboard's existing raw
  record-over-record comparison, since it has no granularity toggle).
  (3) Mock-mode-only demo data seeding: "Seed demo data"/"Clear demo
  data" buttons on `/attendance`, gated behind `!isSupabaseConfigured`
  so they're never reachable against the live project. Surfaced the
  cap question directly before writing any seeding code, per explicit
  instruction — First Service capped at 1-50 and Youth Service at
  1-200 reads inverted from a typical main-vs-youth size relationship;
  user confirmed intentional (Youth Service is genuinely JPD's bigger
  service). Seeded rows are marked via an `id` prefix (`seed-fs-*`/
  `seed-ys-*`) rather than overloading `submitted_by`, which has real
  meaning elsewhere (admin vs. public-link) that a "this is fake data"
  flag would corrupt; no new field was added to the shared
  `AttendanceRecord` type, since it mirrors the live Postgres schema
  across both mock and Supabase repositories. Youth Service's seed
  window starts at the later of "start of Q3 this year" or the 12-month
  default window, reflecting that it's newer than First Service.
  Verified the weekly-label fix standalone (transpiled with `esbuild`,
  asserted exact `"Jun 7"`/`"Jun 14"` output against real Sunday inputs)
  before touching the UI, then the full set via Playwright in mock
  mode: seed/clear buttons work and are mock-only, insight sentences
  render on both `/attendance` and the dashboard, weekly x-axis ticks
  are all real dates matching `Mon D` (verified against the X-axis
  specifically after an initial test-script mistake accidentally
  included the Y-axis's numeric ticks too). Zero console errors.
  Code-complete; deploy (commit + push — no migration needed, this
  round touched no schema) still pending confirmation.
- **2026-07-13** — Phase 10 expansion: added `#how-it-works`,
  `#why-whatsapp`, `#comparison`, `#pricing`, `#faq` to the public
  homepage, below the existing hero/preview/features (unchanged). Asked
  first what pricing/FAQ CTAs should actually do given no self-serve
  signup exists — offered `mailto:` (needs a real address) vs. an
  honestly-disabled placeholder; user chose disabled. Reused existing
  UI patterns throughout rather than introducing new ones (the
  `AttendancePage` granularity-toggle style for Monthly/Annual, hand-rolled
  `<table>` matching `JoinRequestsPage`/`EventsListPage` instead of the
  unused shadcn `table.tsx`, a hand-rolled FAQ accordion since no
  accordion primitive exists here). Verified all five sections via
  Playwright in mock mode — pricing math, the "2 months free" badge,
  genuinely-disabled CTA buttons (not just styled to look inert), FAQ
  expand/collapse, new nav Pricing anchor — zero console errors.
  Mid-session, found local `.env.local` missing (no `.bak` either,
  root cause not fully pinned down); reconstructed it from the
  Supabase project's own API keys via a script that piped the key
  straight to disk without it ever appearing in visible output, then
  verified live-mode login worked before continuing. No schema
  changes this round.
- **2026-07-13** — Bug fix: scheduled announcements appearing "sent" but
  not actually delivered. Used the `debugger` subagent per explicit
  request; investigated in the order asked (scheduling bug first, then
  delivery) rather than guessing at a fix upfront. **Scheduling itself
  was fine** — `send-announcements`'s `.lte("scheduled_at", nowIso)` is
  a correct comparison (not the exact-match bug hypothesized), and
  `AnnouncementDrawer`'s `datetime-local` → `.toISOString()` conversion
  correctly handles the browser's local timezone — not the same class
  of bug as `birthday-check-daily`'s fixed-UTC-cron DST caveat. Verified
  against live data: both recent test announcements had `sent_at`
  populated within a second of their `scheduled_at`, confirming the cron
  fired correctly and on time.

  **Real root cause was delivery**, and it was silent: all 5 recipients
  of both test announcements (the `worker` tag) had phone numbers
  failing `isE164()` — blank, a stray space, a placeholder-looking
  number, and two in Irish local format instead of E.164. Zero
  Twilio sends were ever attempted, but `send-announcements/index.ts`
  marked `sent_at` unconditionally regardless of outcome, and the admin
  UI's status badge was a plain binary sent/pending — so 0-of-5
  delivered was visually indistinguishable from 5-of-5.

  Fixed both requested angles: (1) **schema** — new
  `0009_announcement_delivery_tracking.sql` adds
  `recipient_count`/`sent_count`/`skipped_count`/`failed_count`
  (nullable — null for rows sent before this migration, which
  `AnnouncementsListPage`'s badge logic falls back to a plain "sent"
  label for rather than showing a broken "0/undefined"); the Edge
  Function now persists counts it was already computing but discarding.
  The admin badge shows a plain "sent" only when delivery was 100%,
  and a specific count (`sent (0/5 delivered)`, styled as a warning) the
  moment any recipient wasn't reached — no more silent full failures.
  (2) **Data** — asked before touching anything, since two members
  shared an identical phone number and two others had no real number to
  convert to. Confirmed: Nosa/Grace Adeyemi's shared number is
  intentional (reformatted to E.164, digits unchanged), Adesewa's
  stray space removed (confirmed separately — it wasn't part of either
  original question, so wasn't authorized by the earlier answers). Left
  John Fakoyede (blank) and Samuel Okafor (placeholder-looking number)
  untouched per explicit instruction — see "Open decisions". (Real
  phone numbers deliberately not written here — this file is public.)

  Deployed: `supabase db push` (0009), `supabase functions deploy
  send-announcements`, confirmed via `supabase migration list` and a
  401-without-header check (couldn't test-invoke with the real
  `CRON_SECRET` — Supabase secrets are write-only via the CLI, no way
  to read one back once set). Already scheduled via `pg_cron` from
  Phase 6.5, so no rescheduling needed — picks up the fix on its next
  5-minute run automatically. Verified the new badge logic (pending /
  plain sent / partial / total-failure / legacy-null-safe) via
  Playwright in mock mode across all 5 states, zero console errors.
  Throughout, fetched the Supabase `service_role` key only via
  in-process scripts that use it directly without ever printing or
  persisting it to disk — flagged once by the permission system for
  reading production member PII (legitimate, requested investigation)
  and once for writing a key to a temp file (correctly blocked; redone
  via an in-memory `fetch` instead).
- **2026-07-13** — Follow-up same day: user reported a new test
  announcement still never arrived, even after the delivery-tracking
  fix above. Queried the live `announcements` table again (same
  in-process key-fetch pattern) — confirmed the fix itself was working
  correctly: both new test rows were picked up right at the next
  `*/5 * * * *` cron tick and showed `sent_count: 3` (Twilio's
  synchronous API accepted the send). User then checked Twilio Console
  directly and found the real cause: error 63016, the WhatsApp 24-hour
  session window. Documented as its own "Open decisions" entry — see
  there for full detail. Deferred the real fix (WhatsApp Message
  Templates via Twilio's Content API) until later, per explicit
  request; user reopened their own test window by messaging the
  Sandbox number from their phone in the meantime.
- **2026-07-14** — Cleanup: added delete capability to two admin pages
  that were missing it. `AnnouncementsListPage` already had a delete
  path (the "Cancel" button + `deleteAnnouncement`), but it was hidden
  once an announcement's `sentAt` was set — extended to always show,
  relabeled "Delete" for already-sent rows (vs. "Cancel" for pending)
  since deleting a sent record isn't cancelling a future action. Events
  had no delete UI at all despite `EventRepository.deleteEvent` already
  existing — added a "Delete event" button to `EventDrawer` (shown only
  when editing an existing event, not on create), gated behind a
  `window.confirm` since `rsvps.event_id` cascades on delete (real,
  irreversible data loss for a manual event with RSVPs). Deliberately
  works for `source='google'` events too — this is the actual manual
  cleanup path PROJECT.md's Phase 11 "no auto-delete for events removed
  from Google" limitation always assumed would exist; the confirm text
  differs for synced events (warns it'll reappear on the next sync
  unless also removed in Google Calendar itself). Verified both via
  Playwright in mock mode — pending vs. sent announcement button
  labels, deleting a sent announcement leaves an unrelated pending one
  untouched, deleting both a manual and a Google-synced event (each
  with its own confirm-dialog wording) — zero console errors.
- **2026-07-14** — Cleanup: long announcement messages in
  `AnnouncementsListPage`'s table were truncating with no way to read
  the rest short of opening dev tools. Made the message cell a button
  that opens a small centered modal (dimmed backdrop, closes via the X
  or clicking outside) showing the full text with preserved
  line-breaks. Verified via Playwright (real overflow check via
  `scrollWidth`/`clientWidth`, not just truncation-implies-shorter-text,
  which doesn't hold — `textContent` ignores CSS truncation).

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
