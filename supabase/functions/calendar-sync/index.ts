// Runs hourly (see PROJECT.md). One-way sync: Google Calendar -> events
// table. Google Calendar is the source of truth for source='google' rows —
// this never writes back to Google. Matches/upserts by google_event_id so
// re-running the sync is idempotent.
//
// Deliberately does NOT delete rows for events that vanish from the feed
// (cancelled or removed in Google): rsvps.event_id cascades on delete, so
// an automatic delete on every sync hiccup could silently wipe real RSVPs.
// Stale synced events are left for an admin to remove manually. See
// PROJECT.md "Open decisions" for this known limitation.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCronSecret } from "../_shared/auth.ts";
import {
  getAccessToken,
  getGoogleServiceAccountConfig,
  listCalendarEvents,
} from "../_shared/google.ts";

// Fixed single-tenant org id, same assumption the other scheduled
// functions (birthday-check, event-reminder) already make.
const ORG_ID = "jpd";

Deno.serve(async (req) => {
  const authError = requireCronSecret(req);
  if (authError) return authError;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY secrets" }),
      { status: 500 }
    );
  }

  const googleConfig = getGoogleServiceAccountConfig();
  if (!googleConfig) {
    return new Response(
      JSON.stringify({
        error:
          "Google Calendar sync not configured — set GOOGLE_SERVICE_ACCOUNT_EMAIL/GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY/GOOGLE_CALENDAR_ID secrets",
      }),
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let accessToken: string;
  let googleEvents;
  try {
    accessToken = await getAccessToken(googleConfig);
    // 30 days back covers recent past events for the /calendar view; no
    // upper bound so recurring events keep expanding into the future.
    const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    googleEvents = await listCalendarEvents(accessToken, googleConfig.calendarId, timeMin);
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }

  const { data: existingRows, error: fetchError } = await supabase
    .from("events")
    .select("id, google_event_id, date, reminder_sent_at")
    .eq("org_id", ORG_ID)
    .eq("source", "google");
  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
  }
  const existingByGoogleId = new Map(
    (existingRows ?? []).map((row) => [row.google_event_id as string, row])
  );

  let created = 0;
  let updated = 0;
  let skippedCancelled = 0;

  for (const event of googleEvents) {
    if (event.cancelled) {
      skippedCancelled++;
      continue;
    }

    const existing = existingByGoogleId.get(event.googleEventId);
    if (!existing) {
      const { error } = await supabase.from("events").insert({
        org_id: ORG_ID,
        title: event.title,
        date: event.date,
        location: event.location,
        reminder_hours_before: 24,
        source: "google",
        google_event_id: event.googleEventId,
      });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
      created++;
    } else {
      const dateChanged = existing.date !== event.date;
      const { error } = await supabase
        .from("events")
        .update({
          title: event.title,
          location: event.location,
          date: event.date,
          // A rescheduled event should be eligible for a fresh reminder.
          reminder_sent_at: dateChanged ? null : existing.reminder_sent_at,
        })
        .eq("id", existing.id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
      updated++;
    }
  }

  return new Response(
    JSON.stringify({ eventsFromGoogle: googleEvents.length, created, updated, skippedCancelled }),
    { headers: { "Content-Type": "application/json" } }
  );
});
