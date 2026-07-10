import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { eventsDb } from "../lib/db";
import type { ChurchEvent } from "../types";
import { useAuth } from "../lib/auth/AuthContext";

function toDatetimeLocal(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

const emptyForm = {
  title: "",
  date: "",
  location: "",
  reminderHoursBefore: 24,
};

type FormState = typeof emptyForm;

export function EventFormPage() {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const { eventId } = useParams();
  const isEditing = Boolean(eventId) && eventId !== "new";
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) return;
    let cancelled = false;
    eventsDb.getEvent(orgId, eventId!).then((event) => {
      if (cancelled) return;
      if (!event) {
        setError("Event not found");
        setLoading(false);
        return;
      }
      setForm({
        title: event.title,
        date: toDatetimeLocal(event.date),
        location: event.location,
        reminderHoursBefore: event.reminderHoursBefore,
      });
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isEditing, eventId, orgId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload: Omit<ChurchEvent, "id" | "orgId"> = {
      title: form.title.trim(),
      date: new Date(form.date).toISOString(),
      location: form.location.trim(),
      reminderHoursBefore: form.reminderHoursBefore,
    };

    try {
      if (isEditing) {
        await eventsDb.updateEvent(orgId, eventId!, payload);
      } else {
        await eventsDb.createEvent(orgId, payload);
      }
      navigate("/events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="member-form-page">
      <h1>{isEditing ? "Edit event" : "Add event"}</h1>

      <form className="member-form" onSubmit={handleSubmit}>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />

        <label htmlFor="date">Date &amp; time</label>
        <input
          id="date"
          type="datetime-local"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />

        <label htmlFor="location">Location</label>
        <input
          id="location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />

        <label htmlFor="reminderHoursBefore">Send WhatsApp reminder (hours before)</label>
        <input
          id="reminderHoursBefore"
          type="number"
          min={1}
          value={form.reminderHoursBefore}
          onChange={(e) =>
            setForm({ ...form, reminderHoursBefore: Number(e.target.value) || 0 })
          }
          required
        />

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/events")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
