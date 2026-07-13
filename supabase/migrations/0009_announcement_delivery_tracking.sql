-- send-announcements already computes per-recipient delivery outcomes
-- (sent/skipped/failed) but only returned them in the HTTP response body,
-- never persisted — so an announcement that reached 0 of 5 recipients
-- (e.g. all phone numbers failing the E.164 check) looked identical to one
-- that reached all 5: a plain "sent" badge, sent_at populated either way.
-- These columns let the admin UI distinguish full delivery from a silent
-- total failure. Nullable — null until send-announcements actually
-- processes the row. See PROJECT.md.
alter table announcements add column recipient_count integer;
alter table announcements add column sent_count integer;
alter table announcements add column skipped_count integer;
alter table announcements add column failed_count integer;
