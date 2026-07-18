import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { Link as LinkIcon } from "lucide-react";
import { eventsDb, rsvpsDb } from "../../lib/db";
import { PUBLIC_ORG_ID } from "../../lib/constants";
import { useBotGuard } from "../../lib/useBotGuard";
import { PublicPageShell } from "../../components/PublicPageShell";
import type { ChurchEvent, RsvpStatus } from "../../types";

const emptyForm = {
  attendeeName: "",
  attendeePhone: "",
  attendeeEmail: "",
  status: "yes" as RsvpStatus,
};

const inputClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20";
const labelClass = "mb-1 block text-xs font-medium text-ink/60";

export function RsvpPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<ChurchEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { honeypot, setHoneypot, isLikelyBot } = useBotGuard();

  useEffect(() => {
    let cancelled = false;
    eventsDb.getEvent(PUBLIC_ORG_ID, eventId!).then((result) => {
      if (cancelled) return;
      setEvent(result);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isLikelyBot()) {
      setSubmitted(true);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await rsvpsDb.createRsvp(PUBLIC_ORG_ID, {
        eventId: eventId!,
        attendeeName: form.attendeeName.trim(),
        attendeePhone: form.attendeePhone.trim(),
        attendeeEmail: form.attendeeEmail.trim() || null,
        status: form.status,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit RSVP");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <PublicPageShell>
        <p className="text-sm text-ink/60">Loading...</p>
      </PublicPageShell>
    );
  }

  if (!event) {
    return (
      <PublicPageShell>
        <h1 className="text-2xl font-semibold tracking-tight">Event not found</h1>
      </PublicPageShell>
    );
  }

  if (submitted) {
    return (
      <PublicPageShell>
        <h1 className="text-2xl font-semibold tracking-tight">RSVP received</h1>
        <p className="mt-1 text-sm text-ink/60">
          Thanks for letting us know about "{event.title}"!
        </p>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell>
      <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
      <p className="mt-1 text-sm text-ink/60">
        {new Date(event.date).toLocaleString()} — {event.location}
      </p>
      {event.link && (
        <a
          href={event.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-forest hover:underline"
        >
          <LinkIcon className="size-3.5" /> Join meeting
        </a>
      )}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
        <input
          type="text"
          name="company"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="honeypot"
        />

        <label className="block">
          <span className={labelClass}>Name</span>
          <input
            value={form.attendeeName}
            onChange={(e) => setForm({ ...form, attendeeName: e.target.value })}
            required
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Phone (for WhatsApp reminders)</span>
          <input
            value={form.attendeePhone}
            onChange={(e) => setForm({ ...form, attendeePhone: e.target.value })}
            required
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Email (optional)</span>
          <input
            type="email"
            value={form.attendeeEmail}
            onChange={(e) => setForm({ ...form, attendeeEmail: e.target.value })}
            className={inputClass}
          />
        </label>

        <div>
          <div className={labelClass}>Will you attend?</div>
          <div className="flex flex-wrap gap-2">
            {(["yes", "maybe", "no"] as RsvpStatus[]).map((status) => (
              <button
                type="button"
                key={status}
                onClick={() => setForm({ ...form, status })}
                className={`rounded-full px-3 py-1 text-xs capitalize ${
                  form.status === status ? "bg-forest text-white" : "bg-neutral-100 text-ink/70"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? "Sending..." : "Send RSVP"}
        </button>
      </form>
    </PublicPageShell>
  );
}
