import { useState, type FormEvent } from "react";
import { CalendarSync } from "lucide-react";
import { Sheet, SheetContent } from "./ui/sheet";
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

export function EventDrawer({
  event,
  onClose,
  onSaved,
}: {
  event: ChurchEvent | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const isGoogleSynced = event?.source === "google";
  const [form, setForm] = useState(
    event
      ? {
          title: event.title,
          date: toDatetimeLocal(event.date),
          location: event.location,
          reminderHoursBefore: event.reminderHoursBefore,
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    // For synced events, Google Calendar owns title/date/location — only
    // reminderHoursBefore is admin-editable, so the rest is carried over
    // from the existing event rather than taken from (disabled) form state.
    const payload: Omit<ChurchEvent, "id" | "orgId"> = isGoogleSynced
      ? {
          title: event!.title,
          date: event!.date,
          location: event!.location,
          reminderHoursBefore: form.reminderHoursBefore,
          source: event!.source,
          googleEventId: event!.googleEventId,
        }
      : {
          title: form.title.trim(),
          date: new Date(form.date).toISOString(),
          location: form.location.trim(),
          reminderHoursBefore: form.reminderHoursBefore,
          source: "manual",
          googleEventId: null,
        };
    try {
      if (event) {
        await eventsDb.updateEvent(orgId, event.id, payload);
      } else {
        await eventsDb.createEvent(orgId, payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full max-w-md flex-col gap-0 p-0">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">{event ? "Edit event" : "New event"}</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-6">
          {isGoogleSynced && (
            <div className="flex items-center gap-2 rounded-lg bg-forest/10 px-3 py-2 text-xs text-forest">
              <CalendarSync className="size-3.5" />
              Synced from Google Calendar — title, date, and location are
              managed there and can't be edited here.
            </div>
          )}

          <Field label="Title">
            {isGoogleSynced ? (
              <ReadOnlyValue>{event!.title}</ReadOnlyValue>
            ) : (
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20"
              />
            )}
          </Field>
          <Field label="Date & time">
            {isGoogleSynced ? (
              <ReadOnlyValue>
                {new Date(event!.date).toLocaleString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </ReadOnlyValue>
            ) : (
              <input
                required
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20"
              />
            )}
          </Field>
          <Field label="Location">
            {isGoogleSynced ? (
              <ReadOnlyValue>{event!.location || "—"}</ReadOnlyValue>
            ) : (
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20"
              />
            )}
          </Field>

          <div className="rounded-lg border border-dashed border-border p-3">
            <div className="mb-2 text-sm font-medium">Send WhatsApp reminder</div>
            <label className="flex items-center gap-2 text-xs text-ink/60">
              Hours before event
              <input
                type="number"
                min={1}
                value={form.reminderHoursBefore}
                onChange={(e) =>
                  setForm({ ...form, reminderHoursBefore: Number(e.target.value) || 0 })
                }
                required
                className="w-20 rounded-lg border border-border bg-canvas px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-forest/20"
              />
            </label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-forest px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save event"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink/60">{label}</span>
      {children}
    </label>
  );
}

function ReadOnlyValue({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full rounded-lg border border-border bg-neutral-50 px-3 py-2 text-sm text-ink/70">
      {children}
    </div>
  );
}
