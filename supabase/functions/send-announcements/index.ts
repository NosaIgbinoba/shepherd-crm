// Runs on a schedule (recommend every 5 min — see TWILIO_SETUP.md). Finds
// announcements whose scheduled_at has passed and haven't been sent yet,
// resolves the target audience (a tag, or a department's members), and
// WhatsApps each of them.
//
// sent_at makes this idempotent regardless of cron cadence — marked once
// per announcement after processing, even if some individual sends failed
// (those are reported in the response, not retried automatically).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getTwilioConfig, isE164, sendWhatsAppMessage } from "../_shared/twilio.ts";
import { requireCronSecret } from "../_shared/auth.ts";

interface MemberRow {
  id: string;
  name: string;
  phone: string;
}

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

  const { data: announcements, error } = await supabase
    .from("announcements")
    .select("id, org_id, message, target_type, target_value, scheduled_at")
    .is("sent_at", null)
    .lte("scheduled_at", nowIso);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const results = [];
  for (const announcement of announcements ?? []) {
    let recipients: MemberRow[] = [];

    if (announcement.target_type === "tag") {
      const { data, error: membersError } = await supabase
        .from("members")
        .select("id, name, phone")
        .eq("org_id", announcement.org_id)
        .contains("tags", [announcement.target_value]);
      if (membersError) {
        results.push({ announcement: announcement.id, error: membersError.message });
        continue;
      }
      recipients = data ?? [];
    } else {
      const { data: department, error: departmentError } = await supabase
        .from("departments")
        .select("member_ids")
        .eq("id", announcement.target_value)
        .maybeSingle();
      if (departmentError) {
        results.push({ announcement: announcement.id, error: departmentError.message });
        continue;
      }
      const memberIds: string[] = department?.member_ids ?? [];
      if (memberIds.length > 0) {
        const { data, error: membersError } = await supabase
          .from("members")
          .select("id, name, phone")
          .in("id", memberIds);
        if (membersError) {
          results.push({ announcement: announcement.id, error: membersError.message });
          continue;
        }
        recipients = data ?? [];
      }
    }

    const sent = [];
    for (const recipient of recipients) {
      if (!isE164(recipient.phone)) {
        sent.push({ recipient: recipient.name, skipped: "phone not in E.164 format" });
        continue;
      }
      const sendResult = await sendWhatsAppMessage(twilio, recipient.phone, announcement.message);
      sent.push({ recipient: recipient.name, ...sendResult });
    }

    // These counts were always computable from `sent` but never persisted —
    // an announcement that reached 0 of N recipients (e.g. every phone
    // number failing the E.164 check) looked identical to one that reached
    // all N. Both still get sent_at, preserving the existing
    // never-retry-automatically idempotency; the counts just make a silent
    // total failure visible in the admin UI instead of indistinguishable
    // from success.
    const sentCount = sent.filter((s) => "ok" in s && s.ok).length;
    const skippedCount = sent.filter((s) => "skipped" in s).length;
    const failedCount = sent.filter((s) => "ok" in s && !s.ok).length;

    await supabase
      .from("announcements")
      .update({
        sent_at: nowIso,
        recipient_count: recipients.length,
        sent_count: sentCount,
        skipped_count: skippedCount,
        failed_count: failedCount,
      })
      .eq("id", announcement.id);
    results.push({ announcement: announcement.id, recipientCount: recipients.length, sent });
  }

  return new Response(
    JSON.stringify({ announcementsChecked: announcements?.length ?? 0, results }),
    { headers: { "Content-Type": "application/json" } }
  );
});
