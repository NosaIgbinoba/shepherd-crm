import { useState, type FormEvent } from "react";
import { Sheet, SheetContent } from "./ui/sheet";
import { announcementsDb } from "../lib/db";
import type { AnnouncementTargetType, Department, MemberTag } from "../types";
import { useAuth } from "../lib/auth/AuthContext";

const ALL_TAGS: MemberTag[] = ["newcomer", "worker", "leader"];

function nowAsDatetimeLocal(): string {
  const date = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function AnnouncementDrawer({
  departments,
  onClose,
  onSaved,
}: {
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<AnnouncementTargetType>("tag");
  const [targetValue, setTargetValue] = useState<string>(ALL_TAGS[0]);
  const [scheduledAt, setScheduledAt] = useState(nowAsDatetimeLocal());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTargetTypeChange(next: AnnouncementTargetType) {
    setTargetType(next);
    setTargetValue(next === "tag" ? ALL_TAGS[0] : departments[0]?.id ?? "");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await announcementsDb.createAnnouncement(orgId, {
        message: message.trim(),
        targetType,
        targetValue,
        scheduledAt: new Date(scheduledAt).toISOString(),
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule announcement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 md:max-w-md">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">New announcement</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-6">
          <Field label="Message">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20"
            />
          </Field>

          <div>
            <div className="mb-1 text-xs font-medium text-ink/60">Send to</div>
            <div className="flex gap-2">
              {(["tag", "department"] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => handleTargetTypeChange(type)}
                  className={`rounded-full px-3 py-1 text-xs capitalize ${
                    targetType === type ? "bg-forest text-white" : "bg-neutral-100 text-ink/70"
                  }`}
                >
                  {type === "tag" ? "A tagged group" : "A department"}
                </button>
              ))}
            </div>
          </div>

          {targetType === "tag" ? (
            <Field label="Tag">
              <select
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20"
              >
                {ALL_TAGS.map((tag) => (
                  <option key={tag} value={tag} className="capitalize">
                    {tag}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Department">
              <select
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                required
                disabled={departments.length === 0}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20"
              >
                {departments.length === 0 && <option value="">No departments yet</option>}
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Send at">
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20"
            />
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-forest px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {saving ? "Scheduling…" : "Schedule"}
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
