import { useState, type FormEvent } from "react";
import { Sheet, SheetContent } from "./ui/sheet";
import { attendanceDb } from "../lib/db";
import { KNOWN_SERVICES } from "../lib/constants";
import { useAuth } from "../lib/auth/AuthContext";

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  serviceName: KNOWN_SERVICES[0]?.value ?? "",
  date: today(),
  headcount: "",
};

// Create-only — no edit/list UI exists for attendance records, just this
// one form triggered by "Log attendance" on AttendancePage. See PROJECT.md.
export function AttendanceDrawer({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await attendanceDb.createAttendanceRecord(orgId, {
        serviceName: form.serviceName,
        date: form.date,
        headcount: Number(form.headcount),
        submittedBy: "admin",
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log attendance");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 md:max-w-md">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Log attendance</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-6">
          <Field label="Service">
            <select
              required
              value={form.serviceName}
              onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20"
            >
              {KNOWN_SERVICES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Date">
            <input
              required
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20"
            />
          </Field>

          <Field label="Headcount">
            <input
              required
              type="number"
              min={0}
              value={form.headcount}
              onChange={(e) => setForm({ ...form, headcount: e.target.value })}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20"
            />
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-forest px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Log attendance"}
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
