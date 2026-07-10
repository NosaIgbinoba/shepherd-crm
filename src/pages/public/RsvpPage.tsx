import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { eventsDb, rsvpsDb } from "../../lib/db";
import { PUBLIC_ORG_ID } from "../../lib/constants";
import type { ChurchEvent, RsvpStatus } from "../../types";

const emptyForm = {
  attendeeName: "",
  attendeePhone: "",
  attendeeEmail: "",
  status: "yes" as RsvpStatus,
};

export function RsvpPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<ChurchEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

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
      <div className="login-page">
        <p>Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="login-page">
        <div className="login-form">
          <h1>Event not found</h1>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="login-page">
        <div className="login-form">
          <h1>RSVP received</h1>
          <p className="login-subtitle">Thanks for letting us know about "{event.title}"!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>{event.title}</h1>
        <p className="login-subtitle">
          {new Date(event.date).toLocaleString()} — {event.location}
        </p>

        <label htmlFor="attendeeName">Name</label>
        <input
          id="attendeeName"
          value={form.attendeeName}
          onChange={(e) => setForm({ ...form, attendeeName: e.target.value })}
          required
        />

        <label htmlFor="attendeePhone">Phone (for WhatsApp reminders)</label>
        <input
          id="attendeePhone"
          value={form.attendeePhone}
          onChange={(e) => setForm({ ...form, attendeePhone: e.target.value })}
          required
        />

        <label htmlFor="attendeeEmail">Email (optional)</label>
        <input
          id="attendeeEmail"
          type="email"
          value={form.attendeeEmail}
          onChange={(e) => setForm({ ...form, attendeeEmail: e.target.value })}
        />

        <fieldset>
          <legend>Will you attend?</legend>
          {(["yes", "maybe", "no"] as RsvpStatus[]).map((status) => (
            <label key={status} className="checkbox-label">
              <input
                type="radio"
                name="status"
                checked={form.status === status}
                onChange={() => setForm({ ...form, status })}
              />
              {status}
            </label>
          ))}
        </fieldset>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Sending..." : "Send RSVP"}
        </button>
      </form>
    </div>
  );
}
