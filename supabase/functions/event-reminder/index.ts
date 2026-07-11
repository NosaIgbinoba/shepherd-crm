// Runs on a schedule (recommend hourly — see TWILIO_SETUP.md). Finds events
// whose reminder window has opened (date - reminder_hours_before <= now),
// haven't happened yet, and haven't already had a reminder sent, then
// WhatsApps everyone who RSVP'd "yes".
//
// reminder_sent_at makes this idempotent regardless of cron cadence — safe
// to run as often as you like without double-sending.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getTwilioConfig, isE164, sendWhatsAppMessage } from "../_shared/twilio.ts";
import { requireCronSecret } from "../_shared/auth.ts";

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

  const twilio = getTwilioConfig();
  if (!twilio) {
    return new Response(
      JSON.stringify({
        error:
          "Twilio not configured — set TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_FROM secrets",
      }),
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const nowIso = new Date().toISOString();

  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, date, location, reminder_hours_before")
    .is("reminder_sent_at", null)
    .gt("date", nowIso);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const due = (events ?? []).filter((event) => {
    const reminderAt =
      new Date(event.date).getTime() - event.reminder_hours_before * 60 * 60 * 1000;
    return reminderAt <= Date.now();
  });

  const results = [];
  for (const event of due) {
    const { data: rsvps, error: rsvpError } = await supabase
      .from("rsvps")
      .select("attendee_name, attendee_phone")
      .eq("event_id", event.id)
      .eq("status", "yes");

    if (rsvpError) {
      results.push({ event: event.title, error: rsvpError.message });
      continue;
    }

    const sent = [];
    for (const rsvp of rsvps ?? []) {
      if (!isE164(rsvp.attendee_phone)) {
        sent.push({ attendee: rsvp.attendee_name, skipped: "phone not in E.164 format" });
        continue;
      }
      const sendResult = await sendWhatsAppMessage(
        twilio,
        rsvp.attendee_phone,
        `Reminder: "${event.title}" is coming up at ${event.location} on ${new Date(
          event.date
        ).toLocaleString()}. See you there!`
      );
      sent.push({ attendee: rsvp.attendee_name, ...sendResult });
    }

    await supabase.from("events").update({ reminder_sent_at: nowIso }).eq("id", event.id);
    results.push({ event: event.title, sentTo: sent });
  }

  return new Response(JSON.stringify({ eventsChecked: events?.length ?? 0, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
