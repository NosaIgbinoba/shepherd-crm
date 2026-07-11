-- Rate limiting for the public, no-login forms (/join, /rsvp/:eventId).
-- Enforced as a BEFORE INSERT trigger rather than client-side checks,
-- because anyone can call the Supabase REST API directly with the public
-- anon key, bypassing the React app entirely — client-side throttling
-- alone is not real protection.

create or replace function enforce_join_request_rate_limit() returns trigger
language plpgsql
as $$
begin
  if (
    select count(*) from join_requests
    where requester_phone = new.requester_phone
      and created_at > now() - interval '1 hour'
  ) >= 3 then
    raise exception 'Too many join requests from this phone number recently. Please try again later.';
  end if;
  return new;
end;
$$;

create trigger join_requests_rate_limit
  before insert on join_requests
  for each row execute function enforce_join_request_rate_limit();

create or replace function enforce_rsvp_rate_limit() returns trigger
language plpgsql
as $$
begin
  if (
    select count(*) from rsvps
    where attendee_phone = new.attendee_phone
      and created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'Too many RSVPs from this phone number recently. Please try again later.';
  end if;
  return new;
end;
$$;

create trigger rsvps_rate_limit
  before insert on rsvps
  for each row execute function enforce_rsvp_rate_limit();
