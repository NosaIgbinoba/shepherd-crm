-- Supports public, no-login join-request and RSVP submission (Phase 4).
-- Both tables were empty (nothing seeded them in 0001), so these are
-- destructive-looking but safe ALTERs.

-- join_requests: member_id becomes optional (populated only when an admin
-- approves a request into a real member record); requester identity is
-- captured directly since public submitters may not exist as a Member yet.
alter table join_requests alter column member_id drop not null;
alter table join_requests drop constraint join_requests_member_id_fkey;
alter table join_requests
  add constraint join_requests_member_id_fkey
  foreign key (member_id) references members (id) on delete set null;

alter table join_requests add column requester_name text not null default '';
alter table join_requests add column requester_phone text not null default '';
alter table join_requests add column requester_email text;
alter table join_requests add column created_at timestamptz not null default now();
alter table join_requests alter column requester_name drop default;
alter table join_requests alter column requester_phone drop default;

-- rsvps: same pattern — attendee identity captured directly, member_id is an
-- optional link for future matching.
alter table rsvps alter column member_id drop not null;
alter table rsvps drop constraint rsvps_member_id_fkey;
alter table rsvps
  add constraint rsvps_member_id_fkey
  foreign key (member_id) references members (id) on delete set null;

alter table rsvps add column attendee_name text not null default '';
alter table rsvps add column attendee_phone text not null default '';
alter table rsvps add column attendee_email text;
alter table rsvps add column created_at timestamptz not null default now();
alter table rsvps alter column attendee_name drop default;
alter table rsvps alter column attendee_phone drop default;

-- events: reminder_schedule was free text; the scheduled reminder function
-- needs a structured "how long before" value.
alter table events drop column reminder_schedule;
alter table events add column reminder_hours_before integer not null default 24;

-- Public (anon) can INSERT only — never read other people's requests/RSVPs.
-- Admin's existing "full access within org" policies (authenticated role)
-- already cover the approve/reject and RSVP-review side.
create policy "anon can submit join requests" on join_requests
  for insert to anon
  with check (org_id in (select id from organizations));

create policy "anon can submit rsvps" on rsvps
  for insert to anon
  with check (org_id in (select id from organizations));

-- Public pages need to show department names and event details to choose
-- from. Nothing in either table is sensitive in a church context.
create policy "anon can read departments" on departments
  for select to anon
  using (true);

create policy "anon can read events" on events
  for select to anon
  using (true);
