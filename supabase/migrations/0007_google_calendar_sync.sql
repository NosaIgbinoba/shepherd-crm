-- Phase 11: one-way Google Calendar -> CRM sync (Google Calendar is the
-- source of truth for imported events; the CRM never writes back to it).
-- See PROJECT.md.

alter table events add column google_event_id text unique;
alter table events add column source text not null default 'manual';
alter table events add constraint events_source_check check (source in ('manual', 'google'));
