// One-way Google Calendar -> CRM sync (Phase 11, see PROJECT.md). The
// calendar is private, so this authenticates as a Google service account
// (JWT bearer flow) rather than fetching a public ICS feed. The service
// account must be shared on the calendar with "See all event details".
import { SignJWT, importPKCS8 } from "https://esm.sh/jose@5";

export interface GoogleServiceAccountConfig {
  email: string;
  privateKey: string;
  calendarId: string;
}

export function getGoogleServiceAccountConfig(): GoogleServiceAccountConfig | null {
  const email = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKeyRaw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
  const calendarId = Deno.env.get("GOOGLE_CALENDAR_ID");
  if (!email || !privateKeyRaw || !calendarId) return null;
  // Supabase secrets are single-line; a pasted PEM key's newlines commonly
  // arrive as literal "\n" escape sequences rather than real line breaks.
  const privateKey = privateKeyRaw.includes("\\n")
    ? privateKeyRaw.replace(/\\n/g, "\n")
    : privateKeyRaw;
  return { email, privateKey, calendarId };
}

export async function getAccessToken(config: GoogleServiceAccountConfig): Promise<string> {
  const key = await importPKCS8(config.privateKey, "RS256");
  const now = Math.floor(Date.now() / 1000);
  const jwt = await new SignJWT({
    iss: config.email,
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })
    .setProtectedHeader({ alg: "RS256" })
    .sign(key);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.access_token as string;
}

export interface GoogleCalendarEvent {
  googleEventId: string;
  title: string;
  date: string; // ISO datetime
  location: string;
  cancelled: boolean;
}

// singleEvents=true asks Google to expand recurring events (e.g. a weekly
// Sunday service) into individual instances with their own ids, so we
// don't have to hand-roll RRULE expansion.
export async function listCalendarEvents(
  accessToken: string,
  calendarId: string,
  timeMin: string
): Promise<GoogleCalendarEvent[]> {
  const results: GoogleCalendarEvent[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
    );
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("timeMin", timeMin);
    url.searchParams.set("maxResults", "250");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error(
        `Google Calendar API failed: ${response.status} ${await response.text()}`
      );
    }
    const data = await response.json();

    for (const item of data.items ?? []) {
      const start = item.start?.dateTime ?? item.start?.date;
      if (!start || !item.id) continue;
      results.push({
        googleEventId: item.id,
        title: item.summary ?? "(untitled event)",
        date: new Date(start).toISOString(),
        location: item.location ?? "",
        cancelled: item.status === "cancelled",
      });
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return results;
}
