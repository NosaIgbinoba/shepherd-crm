-- Phase 14: recurring events + optional meeting link on manually created
-- events. A recurring series is multiple independent `events` rows sharing
-- series_id for display grouping only — not a shared entity. Does not apply
-- to source='google' synced events. See PROJECT.md.

alter table events add column link text;
alter table events add column recurrence text;
alter table events add constraint events_recurrence_check
  check (recurrence in ('weekly', 'biweekly', 'monthly'));
alter table events add column series_id uuid;
