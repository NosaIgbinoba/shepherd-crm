-- Newcomer welcome: idempotency marker, same pattern as events.reminder_sent_at.
alter table members add column newcomer_welcome_sent_at timestamptz;

-- Scheduled announcements: admin composes a message targeted at either a
-- tag (newcomer/worker/leader) or a department, for delivery at
-- scheduled_at. sent_at makes delivery idempotent regardless of cron
-- cadence, same pattern as event reminders.
create table announcements (
  id uuid primary key default gen_random_uuid(),
  org_id text not null references organizations (id) on delete cascade,
  message text not null,
  target_type text not null check (target_type in ('tag', 'department')),
  target_value text not null,
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table announcements enable row level security;

-- Admin-only feature — no public/anon access, matches the members/departments
-- pattern from 0001 (not the public-forms pattern from 0002).
create policy "org announcements: full access within org" on announcements
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());
