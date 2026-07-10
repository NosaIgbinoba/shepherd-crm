// Runs daily (scheduled via Supabase Cron — see TWILIO_SETUP.md). Finds
// members whose dob matches today's month/day and sends each a WhatsApp
// birthday message via Twilio.
//
// Uses the service role key deliberately: this runs with no authenticated
// user, so RLS (which only grants narrow anon INSERT/SELECT policies)
// would otherwise block reading every member's dob across the org.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getTwilioConfig, isE164, sendWhatsAppMessage } from "../_shared/twilio.ts";

Deno.serve(async () => {
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
    .select("id, name, phone, dob")
    .not("dob", "is", null);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const today = new Date();
  const todayMonth = today.getUTCMonth() + 1;
  const todayDate = today.getUTCDate();

  const birthdayMembers = (members ?? []).filter((member) => {
    const dob = new Date(member.dob as string);
    return dob.getUTCMonth() + 1 === todayMonth && dob.getUTCDate() === todayDate;
  });

  const results = [];
  for (const member of birthdayMembers) {
    if (!isE164(member.phone)) {
      results.push({ member: member.name, skipped: "phone not in E.164 format" });
      continue;
    }
    const sendResult = await sendWhatsAppMessage(
      twilio,
      member.phone,
      `Happy birthday, ${member.name}! 🎉 Wishing you a wonderful day from all of us at church.`
    );
    results.push({ member: member.name, ...sendResult });
  }

  return new Response(
    JSON.stringify({ checked: members?.length ?? 0, birthdaysToday: results }),
    { headers: { "Content-Type": "application/json" } }
  );
});
