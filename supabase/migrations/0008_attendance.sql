-- Phase 12: aggregate service attendance tracking (headcounts per service,
-- not individual check-in — see PROJECT.md). service_name is deliberately
-- free text, not an enum: current usage is 'first_service'/'youth_service',
-- but more services can be added later without a migration.

create table attendance_records (
  id uuid primary key default gen_random_uuid(),
  org_id text not null references organizations (id) on delete cascade,
  service_name text not null,
  date date not null,
  headcount integer not null check (headcount >= 0),
  submitted_by text not null check (submitted_by in ('admin', 'link')),
  created_at timestamptz not null default now()
);

alter table attendance_records enable row level security;

create policy "org attendance_records: full access within org" on attendance_records
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());

-- Public (anon) can INSERT only — same pattern as join_requests/rsvps. No
-- anon SELECT: the public /attendance/submit page never reads anything,
-- since the service is locked from the URL query param rather than chosen
-- from a fetched list.
create policy "anon can submit attendance records" on attendance_records
  for insert to anon
  with check (org_id in (select id from organizations));

-- Exact-match dedup, not a rolling count like the join_requests/rsvps rate
-- limits — the goal here is specifically "stop the same service+date being
-- submitted twice" (e.g. two ushers both logging the same Sunday), not
-- general throttling.
create or replace function enforce_attendance_record_dedup() returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from attendance_records
    where service_name = new.service_name
      and date = new.date
  ) then
    raise exception 'Attendance for this service and date has already been submitted.';
  end if;
  return new;
end;
$$;

create trigger attendance_records_dedup
  before insert on attendance_records
  for each row execute function enforce_attendance_record_dedup();
