# Shepherd CRM — Project Doc

Living plan for JPD Church's CRM. Read this before starting a phase; update it
before ending one. This is the source of truth for scope and decisions —
more current than any individual conversation.

## Current phase

**Phase 2: Supabase integration prepped, not yet connected — DONE.**
Next up: Phase 3 — you create the actual Supabase project and flip it on
(steps in `SUPABASE_SETUP.md`), then come back for real member data / any
remaining features (departments, events/RSVPs, join requests are modeled in
the schema but have no UI yet).

## Stack decisions (and why)

- **Frontend**: React + Vite + TypeScript, `react-router-dom` for routing.
- **Backend**: Not Firebase. **Supabase (Postgres + Auth), no S3** — decided
  2026-07-10. The app talks to Supabase directly via `@supabase/supabase-js`;
  no custom API server in between. Not yet connected to a real project — see
  `SUPABASE_SETUP.md` for the connection steps, and "How to run" below for
  how the app decides mock vs. live.
- **Version control**: local git only. No GitHub remote/push yet — that's a
  later, explicit step.
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
join_requests(id, org_id, member_id, department_id, status)
events(id, org_id, title, date, location, reminder_schedule)
rsvps(id, org_id, event_id, member_id, status)
users(id, org_id, email, role, member_ref)
```

TypeScript types mirroring this live in `src/types.ts`. The Postgres schema
(snake_case columns, same shape) is `supabase/migrations/0001_init.sql`,
with RLS policies scoping every table to `org_id = auth_org_id()` — the
direct equivalent of the org-scoped Firestore rules from the original brief.

## Open decisions

- ~~Backend target~~ — resolved 2026-07-10: Supabase, no S3.
- **No UI yet for**: departments, events/RSVPs, join requests. Schema and
  types exist for all of them; only `members` has a repository + pages.
- **No self-serve signup**: admins/members are added via Supabase SQL Editor
  for now (see `SUPABASE_SETUP.md`). Fine for JPD-only single-admin use;
  revisit before onboarding org #2.

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

## How to run

```
cd ~/shepherd-crm
npm run dev
```

Mock mode (default, no setup): log in with `admin@jpd.church` / `admin123`.

Live Supabase mode: follow `SUPABASE_SETUP.md`, then set `.env.local` and
restart `npm run dev`.
