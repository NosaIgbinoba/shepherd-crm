# WhatsApp automations: Twilio + Edge Function setup

**Status as of 2026-07-11: fully live.** This doc is the reference for how
it was set up and how to redeploy/rotate things later — not a pending
checklist anymore.

Four scheduled WhatsApp flows exist:
- `birthday-check` (daily) — birthday messages
- `event-reminder` (hourly) — reminders to everyone who RSVP'd "yes"
- `newcomer-welcome` (every 15 min) — welcome message for members tagged "newcomer"
- `send-announcements` (every 5 min) — admin-composed broadcasts to a tag or department

## 1. Schema

Run, in order, in **SQL Editor** (already done):
- `supabase/migrations/0002_public_flows.sql`
- `supabase/migrations/0003_event_reminders.sql`
- `supabase/migrations/0004_automations.sql`
- `supabase/migrations/0005_security_hardening.sql`

## 2. Twilio account + WhatsApp Sandbox

1. Sign up at [twilio.com](https://twilio.com) (free trial works).
2. Console → **Messaging → Try it out → Send a WhatsApp message** — activates
   the **Sandbox** (shared number, usually `+14155238886`), instant, no
   approval wait.
3. **Sandbox limitation**: every recipient must first WhatsApp the sandbox
   the join code shown on that page before they can receive anything from
   it. Fine for testing, not for real congregation-wide sends — see
   "Going to production" below.
4. Copy your **Account SID** and **Auth Token** from the Console home page.

## 3. Supabase CLI

```bash
brew install supabase/tap/supabase
supabase login
cd ~/shepherd-crm
supabase link --project-ref fslqsdggabmtysvbcgvi
```

## 4. Secrets

```bash
supabase secrets set \
  TWILIO_ACCOUNT_SID=your_account_sid \
  TWILIO_AUTH_TOKEN=your_auth_token \
  TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

supabase secrets set CRON_SECRET=$(openssl rand -hex 24)
```

`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are auto-injected — the CLI
rejects any secret name starting with `SUPABASE_` anyway.

`CRON_SECRET` gates all four functions (`supabase/functions/_shared/auth.ts`)
— without it, anyone holding the public anon key could invoke them
directly, each call costing a real Twilio send. Every function requires an
`x-cron-secret` header matching this value; only the cron job's SQL knows
it. **If you ever rotate this secret**, you must also update the four
`net.http_post` calls in the cron jobs (step 7) with the new value, or
they'll start getting 401s.

## 5. Deploy

```bash
supabase functions deploy birthday-check
supabase functions deploy event-reminder
supabase functions deploy newcomer-welcome
supabase functions deploy send-announcements
```

## 6. Test manually before scheduling

```bash
curl "https://fslqsdggabmtysvbcgvi.supabase.co/functions/v1/birthday-check" \
  -H "Authorization: Bearer <anon-key>" \
  -H "x-cron-secret: <your CRON_SECRET>"
```

Should return 200 with a JSON summary. Omitting `x-cron-secret` should
return 401. `birthday-check`/`newcomer-welcome` need a matching `dob`/tag
and an **E.164** phone (`+2348012345678`, not `555-0101`) to actually send
anything — anything else is silently skipped.

## 7. Schedule (pg_cron + pg_net, run in SQL Editor)

Dashboard's Cron Jobs UI works too, but here's the SQL equivalent (what
was actually used) — each job POSTs to the function URL with both the
anon key and the cron secret:

```sql
select cron.schedule(
  '<job-name>',
  '<cron-expression>',
  $$
  select net.http_post(
    url := 'https://fslqsdggabmtysvbcgvi.supabase.co/functions/v1/<function-name>',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <anon-key>',
      'x-cron-secret', '<your CRON_SECRET>'
    )
  );
  $$
);
```

Current live schedule (`select jobid, jobname, schedule from cron.job;` to
verify):
- `birthday-check-daily` — `0 8 * * *` (9am Irish Summer Time; drifts an
  hour when Ireland falls back to GMT — `pg_cron` doesn't adjust for DST)
- `event-reminder-hourly` — `0 * * * *`
- `newcomer-welcome-15min` — `*/15 * * * *`
- `send-announcements-5min` — `*/5 * * * *`

To change a job's schedule or command: `select cron.unschedule('<job-name>');`
then `cron.schedule` again — there's no direct "alter".

## Going to production (real WhatsApp, no sandbox join step)

Apply for a WhatsApp Business sender via Twilio (Console → Messaging →
Senders → WhatsApp senders). Requires Meta Business verification and
pre-approved message templates for anything sent outside a 24-hour window
of the recipient messaging first — which all four flows here always are.
Takes real review days, not minutes; the sandbox is the right way to build
and test up to that point.
