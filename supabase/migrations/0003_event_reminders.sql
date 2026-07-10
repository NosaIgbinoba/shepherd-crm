-- Tracks whether the scheduled reminder Edge Function has already sent for
-- an event, so re-running the cron job (any cadence) never double-sends.
alter table events add column reminder_sent_at timestamptz;
