-- Replaces newcomer-welcome's hardcoded message with an admin-editable
-- per-org template (edited via /settings), and adds a second, distinct
-- evening follow-up flow. Previously the same message doubled as both a
-- "welcome" and a department-recruitment ask, but the welcome team already
-- greets newcomers in person — see PROJECT.md.

alter table organizations
  add column newcomer_department_message text not null default
    'Hi {name}! If you''d like to get plugged into a department, reply to this message or ask an admin.';

-- organizations previously had no UPDATE policy — only "read own org" — so
-- admins couldn't edit this without one.
create policy "org: update own org" on organizations
  for update using (id = auth_org_id()) with check (id = auth_org_id());

-- Idempotency marker for the new newcomer-followup Edge Function, same
-- pattern as newcomer_welcome_sent_at.
alter table members
  add column newcomer_followup_sent_at timestamptz;
