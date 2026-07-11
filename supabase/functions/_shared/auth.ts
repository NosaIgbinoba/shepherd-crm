// The anon key used to invoke these functions is public by design (it's in
// the deployed frontend bundle), so without this check, anyone could
// directly invoke birthday-check / event-reminder / newcomer-welcome /
// send-announcements at will — each call costs a Twilio send and an Edge
// Function invocation. CRON_SECRET is a Supabase secret known only to the
// scheduled cron job's net.http_post call, never exposed to the frontend.
export function requireCronSecret(req: Request): Response | null {
  const expected = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  return null;
}
