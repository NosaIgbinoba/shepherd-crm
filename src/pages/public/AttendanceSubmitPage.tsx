import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { attendanceDb } from "../../lib/db";
import { PUBLIC_ORG_ID, serviceLabel } from "../../lib/constants";
import { useBotGuard } from "../../lib/useBotGuard";
import { PublicPageShell } from "../../components/PublicPageShell";

const today = () => new Date().toISOString().slice(0, 10);

const inputClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20";
const labelClass = "mb-1 block text-xs font-medium text-ink/60";

// Always operates "locked" to a service from ?service=<value> — there's no
// free-choice dropdown, since the intended workflow is admins handing a
// per-service link to ushers (via the "Copy link" buttons on
// AttendancePage), never a generic link with no service specified.
export function AttendanceSubmitPage() {
  const [searchParams] = useSearchParams();
  const serviceName = searchParams.get("service");
  const [date, setDate] = useState(today());
  const [headcount, setHeadcount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { honeypot, setHoneypot, isLikelyBot } = useBotGuard();

  if (!serviceName) {
    return (
      <PublicPageShell>
        <h1 className="text-2xl font-semibold tracking-tight">Missing service</h1>
        <p className="mt-1 text-sm text-ink/60">
          This link is missing a service. Ask your admin for a valid attendance link.
        </p>
      </PublicPageShell>
    );
  }
  // Re-bind: TS doesn't carry the above narrowing across the function-
  // declaration boundary into handleSubmit's closure.
  const service: string = serviceName;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isLikelyBot()) {
      setSubmitted(true);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await attendanceDb.createAttendanceRecord(PUBLIC_ORG_ID, {
        serviceName: service,
        date,
        headcount: Number(headcount),
        submittedBy: "link",
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit attendance");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <PublicPageShell>
        <h1 className="text-2xl font-semibold tracking-tight">Thanks!</h1>
        <p className="mt-1 text-sm text-ink/60">Attendance recorded.</p>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell>
      <h1 className="text-2xl font-semibold tracking-tight">Log attendance</h1>
      <p className="mt-1 text-sm text-ink/60">
        Enter the headcount for {serviceLabel(serviceName)}.
      </p>

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
          <span className={labelClass}>Service</span>
          <div className="w-full rounded-lg border border-border bg-neutral-50 px-3 py-2 text-sm text-ink/70">
            {serviceLabel(serviceName)}
          </div>
        </label>

        <label className="block">
          <span className={labelClass}>Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Headcount</span>
          <input
            type="number"
            min={0}
            value={headcount}
            onChange={(e) => setHeadcount(e.target.value)}
            required
            className={inputClass}
          />
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? "Sending..." : "Submit"}
        </button>
      </form>
    </PublicPageShell>
  );
}
