// Runs on a schedule (recommend every 15 min — see TWILIO_SETUP.md). Finds
// members tagged "newcomer" who haven't had a welcome message sent yet and
// WhatsApps them one.
//
// newcomer_welcome_sent_at makes this idempotent regardless of cron
// cadence, and regardless of how a member ended up tagged "newcomer"
// (manual entry, or an approved join request) — anything that sets the
// tag gets picked up here.
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

  const { data: members, error } = await supabase
    .from("members")
    .select("id, name, phone, tags")
    .is("newcomer_welcome_sent_at", null)
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
      `Welcome, ${member.name}! We're so glad you joined us. If you'd like to get plugged into a department, reply to this message or ask an admin.`
    );
    if (sendResult.ok) {
      await supabase
        .from("members")
        .update({ newcomer_welcome_sent_at: new Date().toISOString() })
        .eq("id", member.id);
    }
    results.push({ member: member.name, ...sendResult });
  }

  return new Response(JSON.stringify({ checked: members?.length ?? 0, welcomed: results }), {
    headers: { "Content-Type": "application/json" },
  });
});
