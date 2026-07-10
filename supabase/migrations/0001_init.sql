-- Shepherd CRM schema + row-level security.
-- Mirrors src/types.ts. RLS policies are the Postgres equivalent of the
-- org-scoped Firestore security rules from the original design: every
-- table's rows are only visible/writable to users whose `public.users.org_id`
-- matches the row's `org_id`.

create table organizations (
  id text primary key,
  name text not null,
  address text not null default '',
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id text not null references organizations (id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member')),
  member_ref uuid
);

create table members (
  id uuid primary key default gen_random_uuid(),
  org_id text not null references organizations (id) on delete cascade,
  name text not null,
  phone text not null default '',
  email text not null default '',
  dob date,
  tags text[] not null default '{}',
  department_ids uuid[] not null default '{}',
  joined_at date not null default current_date
);

create table departments (
  id uuid primary key default gen_random_uuid(),
  org_id text not null references organizations (id) on delete cascade,
  name text not null,
  leader_id uuid references members (id) on delete set null,
  member_ids uuid[] not null default '{}'
);

create table join_requests (
  id uuid primary key default gen_random_uuid(),
  org_id text not null references organizations (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  department_id uuid not null references departments (id) on delete cascade,
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending'
);

create table events (
  id uuid primary key default gen_random_uuid(),
  org_id text not null references organizations (id) on delete cascade,
  title text not null,
  date timestamptz not null,
  location text not null default '',
  reminder_schedule text
);

create table rsvps (
  id uuid primary key default gen_random_uuid(),
  org_id text not null references organizations (id) on delete cascade,
  event_id uuid not null references events (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  status text not null check (status in ('yes', 'no', 'maybe')) default 'maybe'
);

alter table users add constraint users_member_ref_fkey
  foreign key (member_ref) references members (id) on delete set null;

-- Looks up the caller's org_id without re-triggering RLS on `users`
-- (querying users from inside a users-table policy would recurse).
create or replace function auth_org_id() returns text
language sql
stable
security definer
set search_path = public
as $$
  select org_id from users where id = auth.uid()
$$;

alter table organizations enable row level security;
alter table users enable row level security;
alter table members enable row level security;
alter table departments enable row level security;
alter table join_requests enable row level security;
alter table events enable row level security;
alter table rsvps enable row level security;

create policy "read own org" on organizations
  for select using (id = auth_org_id());

create policy "read own user row" on users
  for select using (id = auth.uid());

create policy "org members: full access within org" on members
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());

create policy "org departments: full access within org" on departments
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());

create policy "org join_requests: full access within org" on join_requests
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());

create policy "org events: full access within org" on events
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());

create policy "org rsvps: full access within org" on rsvps
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());

-- Seed JPD org + demo members so the app has data to show immediately.
insert into organizations (id, name, address) values
  ('jpd', 'JPD Church', '1 Cathedral Way');

insert into members (org_id, name, phone, email, dob, tags, joined_at) values
  ('jpd', 'Grace Adeyemi', '555-0101', 'grace.adeyemi@example.com', '1990-04-12', array['leader', 'worker'], '2022-03-01'),
  ('jpd', 'Samuel Okafor', '555-0102', 'samuel.okafor@example.com', '1985-11-02', array['worker'], '2023-06-15'),
  ('jpd', 'Faith Nwosu', '555-0103', 'faith.nwosu@example.com', null, array['newcomer'], '2026-06-20');
