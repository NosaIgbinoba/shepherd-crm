// Runs once daily in the evening (recommend 6pm Irish time — see
// TWILIO_SETUP.md). Finds members tagged "newcomer" whose newcomer tag was
// set today (joined_at = today) and who haven't had this evening follow-up
// sent yet, and WhatsApps them a check-in about the service.
//
// Deliberately separate from newcomer-welcome (which fires immediately on
// tagging, asking about departments): this one is a same-day follow-up
// about the service itself, not a repeat welcome — the welcome team
// already greets newcomers in person, and newcomer-welcome already covers
// the department ask. Fixed copy, not admin-editable (unlike
// newcomer-welcome's organizations.newcomer_department_message).
//
// newcomer_followup_sent_at makes this idempotent regardless of cron
// cadence. joined_at defaults to the DB's current_date at insert time
// (manual entry or an approved join request), so comparing it to
// current_date here stays consistent as long as both evaluate in the same
// server timezone (UTC) on the same calendar day.
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

  const today = new Date().toISOString().slice(0, 10);

  const { data: members, error } = await supabase
    .from("members")
    .select("id, name, phone, tags, joined_at")
    .is("newcomer_followup_sent_at", null)
    .eq("joined_at", today)
    .contains("tags", ["newcomer"]);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const results = [];
  for (const member of members ?? []) {
    if (!isE164(member.phone)) {
      results.push({ member: member.name, skipped: "phone not in E.164 format" });
      continue;
    }
    const sendResult = await sendWhatsAppMessage(
      twilio,
      member.phone,
      `Hey ${member.name}, thanks again for joining us today — hope you were blessed by the service! Feel free to reach out anytime.`
    );
    if (sendResult.ok) {
      await supabase
        .from("members")
        .update({ newcomer_followup_sent_at: new Date().toISOString() })
        .eq("id", member.id);
    }
    results.push({ member: member.name, ...sendResult });
  }

  return new Response(JSON.stringify({ checked: members?.length ?? 0, followedUp: results }), {
    headers: { "Content-Type": "application/json" },
  });
});
