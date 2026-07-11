# WhatsApp reminders: Twilio + Edge Function setup

Two Supabase Edge Functions exist and are written, but **not deployed or
scheduled yet** — that needs your own Twilio account and Supabase CLI login,
neither of which I can do for you. This is the checklist for when you're
ready.

## 1. Apply the schema updates (if you haven't already)

Two migrations landed after `0001_init.sql` and haven't been run on your
live project yet. In **SQL Editor**, run, in order:
- `supabase/migrations/0002_public_flows.sql`
- `supabase/migrations/0003_event_reminders.sql`

## 2. Create a Twilio account + WhatsApp Sandbox

1. Sign up at [twilio.com](https://twilio.com) (free trial works for this).
2. Console → **Messaging → Try it out → Send a WhatsApp message**. This
   activates the **WhatsApp Sandbox** — a shared Twilio number
   (usually `+14155238886`) you can send/receive WhatsApp messages through
   immediately, no approval wait.
3. **Important sandbox limitation**: every recipient (including test
   numbers, and eventually real church members) must first send the sandbox
   a WhatsApp message with the join code shown on that page (e.g.
   `join some-word`) before they can receive anything from it. This is fine
   for testing but not viable for real congregation-wide birthday/reminder
   messages — see "Going to production" below.
4. From the Console home page, copy your **Account SID** and **Auth Token**.

## 3. Install the Supabase CLI and link this project

```bash
brew install supabase/tap/supabase
supabase login          # opens a browser, your own login
cd ~/shepherd-crm
supabase link --project-ref fslqsdggabmtysvbcgvi
```

## 4. Set function secrets

These are stored by Supabase, never committed to git, never bundled into
the frontend (unlike `VITE_...` vars, which *are* public).

```bash
supabase secrets set \
  TWILIO_ACCOUNT_SID=your_account_sid \
  TWILIO_AUTH_TOKEN=your_auth_token \
  TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected into every
Edge Function by the platform — don't try to set them yourself, the CLI
rejects any secret name starting with `SUPABASE_` (reserved) anyway. The
service role key is treated like a root password: it bypasses RLS
entirely, which is exactly why these functions need it (there's no
logged-in user in a scheduled job) — but it also means it should never be
pasted in plaintext anywhere outside Supabase's own dashboard/CLI.

## 5. Deploy

```bash
supabase functions deploy birthday-check
supabase functions deploy event-reminder
```

Done as of 2026-07-11 — both live at
`https://fslqsdggabmtysvbcgvi.supabase.co/functions/v1/`. Redeploy the same
way any time `supabase/functions/**` changes.

## 6. Test manually before scheduling

From the Supabase Dashboard: **Edge Functions → birthday-check → Invoke**
(or `curl` the function URL shown there with your anon key as a Bearer
token). Check the JSON response — it reports who was messaged/skipped and
why, per member or attendee.

Note: for `birthday-check` to have anything to find, a member's `dob` has
to match today's month/day, and their `phone` has to be in **E.164**
format (`+2348012345678`, not `555-0101`) — anything else is skipped, not
sent, since Twilio would just reject it anyway.

## 7. Schedule

Dashboard → **Database → Cron Jobs** → New cron job → type
**Supabase Edge Function**:
- `birthday-check` — daily, e.g. `0 12 * * *` (adjust the hour to your
  timezone's morning; cron runs in UTC)
- `event-reminder` — hourly, e.g. `0 * * * *` (safe to run this often —
  `reminder_sent_at` prevents double-sending regardless of cadence)

## Going to production (real WhatsApp, no sandbox join step)

Apply for a WhatsApp Business sender via Twilio (Console → Messaging →
Senders → WhatsApp senders). This requires Meta Business verification and
pre-approved message templates for anything you send outside a 24-hour
window of the recipient messaging you first — which birthday/reminder
messages always are. This takes real review time (days, not minutes); the
sandbox is the right way to build and test everything up to that point.
