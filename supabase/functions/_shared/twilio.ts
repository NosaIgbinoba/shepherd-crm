export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromWhatsApp: string; // e.g. "whatsapp:+14155238886" (sandbox number)
}

export function getTwilioConfig(): TwilioConfig | null {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromWhatsApp = Deno.env.get("TWILIO_WHATSAPP_FROM");
  if (!accountSid || !authToken || !fromWhatsApp) return null;
  return { accountSid, authToken, fromWhatsApp };
}

// Twilio/WhatsApp requires E.164 (e.g. +2348012345678). Member/attendee
// phone numbers aren't validated at entry time, so anything else is
// skipped here rather than sent to Twilio, which would just reject it.
export function isE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

export async function sendWhatsAppMessage(
  config: TwilioConfig,
  toPhone: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
  const auth = btoa(`${config.accountSid}:${config.authToken}`);
  const params = new URLSearchParams({
    To: `whatsapp:${toPhone}`,
    From: config.fromWhatsApp,
    Body: body,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    return { ok: false, error: `Twilio ${response.status}: ${text}` };
  }
  return { ok: true };
}
