# Connecting Shepherd CRM to a real Supabase project

The app runs fully today on a localStorage mock — this is only needed when
you're ready to switch to a real, persistent, multi-user backend.

## 1. Create the project

1. Sign in at [supabase.com](https://supabase.com) and create a new project
   (any region; note the database password it generates, you likely won't
   need it again for this app).
2. Wait for provisioning to finish (~2 minutes).

## 2. Run the schema + RLS migration

1. In the project dashboard, open **SQL Editor**.
2. Paste the full contents of `supabase/migrations/0001_init.sql` and run it.
   This creates all tables (`organizations`, `members`, `departments`,
   `join_requests`, `events`, `rsvps`, `users`), enables row-level security
   on every one, and seeds the JPD org with its 3 demo members.

## 3. Create your admin login

Supabase Auth users live in `auth.users`, which is separate from this app's
`public.users` table (the one that carries `org_id`/`role`). Both need a row,
linked by the same `id`.

1. **Authentication → Users → Add user** in the dashboard. Create
   `admin@jpd.church` with a real password (not `admin123` — that was mock-only).
2. Copy the new user's UUID from that screen.
3. Back in **SQL Editor**, run (substituting the UUID):
   ```sql
   insert into public.users (id, org_id, email, role)
   values ('paste-the-uuid-here', 'jpd', 'admin@jpd.church', 'admin');
   ```

## 4. Get your API credentials

**Project Settings → API**. Copy:
- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** key → `VITE_SUPABASE_ANON_KEY`

## 5. Point the app at it

```bash
cp .env.local.example .env.local
# fill in the two values, then:
npm run dev
```

The app detects the env vars automatically (`src/lib/supabase/client.ts`)
and switches both the data layer (`src/lib/db/index.ts`) and auth
(`src/lib/auth/index.ts`) from mock to live Supabase — no other code changes.
Restart `npm run dev` after editing `.env.local`.

## Notes

- RLS policies scope every table to `org_id = auth_org_id()`, where
  `auth_org_id()` looks up the caller's org from their `public.users` row.
  This is the direct equivalent of the org-scoped Firestore rules from the
  original design — cross-org reads/writes are rejected at the database
  level, not just filtered in the UI.
- There's no self-serve signup flow yet (matches "admin login" scope from
  Phase 1) — new admins/members are added via the SQL Editor for now.
- `.env.local` is gitignored (matches the `*.local` pattern already in
  `.gitignore`) — never commit real credentials.
