# Shepherd CRM — Project Doc

Living plan for JPD Church's CRM. Read this before starting a phase; update it
before ending one. This is the source of truth for scope and decisions —
more current than any individual conversation.

## Current phase

**Phase 1: Frontend scaffold with mock data — DONE.**
Next up: Phase 2, decide and wire the real backend (see "Open decisions").

## Stack decisions (and why)

- **Frontend**: React + Vite + TypeScript, `react-router-dom` for routing.
- **Backend**: Not Firebase. Target is **Supabase** (Postgres + Auth + Storage),
  but that integration is deliberately deferred — see Open decisions below.
- **File/media storage**: mentioned AWS S3 as an option; unresolved, see below.
- **Version control**: local git only. No GitHub remote/push yet — that's a
  later, explicit step.
- **Data layer is abstracted on purpose**: `src/lib/db/types.ts` defines a
  `MemberRepository` interface. `src/lib/db/mockDb.ts` implements it against
  `localStorage` so the app is fully usable today. When Supabase is wired up,
  write a `SupabaseDb` implementing the same interface and swap the export in
  `src/lib/db/index.ts` — no changes needed in pages/components.
- **Auth is similarly mocked**: `src/lib/auth/AuthContext.tsx` checks
  credentials against a hardcoded list in `src/lib/auth/mockUsers.ts`
  (admin@jpd.church / admin123) and stores a session in `localStorage`. This
  is NOT secure and must be replaced by Supabase Auth (or equivalent) before
  any real user data or deployment. Treat it as a UI-flow placeholder only.

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

TypeScript types mirroring this live in `src/types.ts`.

## Open decisions (need your input before Phase 2)

1. **Backend target is ambiguous in the brief**: Supabase (Postgres) was
   named as the eventual choice, but "AWS S3 bucket and PostgreSQL in the
   cloud, keep it in the backend for now" was also said. These aren't
   mutually exclusive (Supabase = managed Postgres + its own object storage,
   which could replace a separate S3 bucket) but it's not yet confirmed
   whether:
   - Supabase Storage is enough, or S3 is wanted specifically (e.g. for
     existing AWS infra, cost, or a non-Supabase Postgres instance), and
   - "keep it in the backend for now" means a custom API server sitting
     between the React app and Postgres, vs. the React app talking to
     Supabase directly (Supabase's client SDK + RLS policies is the more
     common pattern and avoids writing/hosting a backend at all).
2. **Row-level security**: once real Postgres lands, org-scoping must be
   enforced with Supabase RLS policies keyed on `org_id` (the direct
   equivalent of the Firestore security rules originally requested) — not
   just filtered client-side like the current mock does.
3. **Real auth**: Supabase Auth (email/password to start, matching the
   original plan) needs to replace `mockUsers.ts` before any real member
   data is entered.

## Phase log

- **2026-07-10** — Phase 1 complete. Scaffolded `shepherd-crm` (Vite + React +
  TS), built org-scoped types, mock `MemberRepository` (localStorage-backed,
  seeded with 3 JPD members), mock auth context (1 seeded admin), admin
  login page, member list page (search by name/email), add/edit member form.
  `npx tsc --noEmit` clean. Local git initialized, no remote.

## How to run

```
cd ~/shepherd-crm
npm run dev
```

Log in with `admin@jpd.church` / `admin123`.
