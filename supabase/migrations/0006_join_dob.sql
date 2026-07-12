-- Phase 9: capture DOB on the public /join form so approved requests are
-- immediately covered by birthday-check-daily, without an admin having to
-- backfill it manually per approval. See PROJECT.md.

alter table join_requests add column dob date;

-- Any existing pending/approved rows predate this field; backfill with a
-- clearly-fake sentinel date rather than leaving them unenforced, so the
-- NOT NULL below is safe regardless of current row count. An admin can
-- correct real DOBs for already-approved members directly if it matters.
update join_requests set dob = '1900-01-01' where dob is null;

alter table join_requests alter column dob set not null;
