import { useEffect, useState, type FormEvent } from "react";
import { departmentsDb, joinRequestsDb } from "../../lib/db";
import { PUBLIC_ORG_ID } from "../../lib/constants";
import { useBotGuard } from "../../lib/useBotGuard";
import { PublicPageShell } from "../../components/PublicPageShell";
import type { Department } from "../../types";

const emptyForm = {
  requesterName: "",
  requesterPhone: "",
  requesterEmail: "",
  departmentId: "",
};

const inputClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20";
const labelClass = "mb-1 block text-xs font-medium text-ink/60";

export function JoinPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { honeypot, setHoneypot, isLikelyBot } = useBotGuard();

  useEffect(() => {
    let cancelled = false;
    departmentsDb.listDepartments(PUBLIC_ORG_ID).then((list) => {
      if (cancelled) return;
      setDepartments(list);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isLikelyBot()) {
      setSubmitted(true);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await joinRequestsDb.createJoinRequest(PUBLIC_ORG_ID, {
        departmentId: form.departmentId,
        requesterName: form.requesterName.trim(),
        requesterPhone: form.requesterPhone.trim(),
        requesterEmail: form.requesterEmail.trim() || null,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <PublicPageShell>
        <h1 className="text-2xl font-semibold tracking-tight">Request sent</h1>
        <p className="mt-1 text-sm text-ink/60">
          Thanks! An admin will review your request to join and follow up with you.
        </p>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell>
      <h1 className="text-2xl font-semibold tracking-tight">Join a department</h1>
      <p className="mt-1 text-sm text-ink/60">Tell us who you are and where you'd like to serve.</p>

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
            value={form.requesterName}
            onChange={(e) => setForm({ ...form, requesterName: e.target.value })}
            required
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Phone</span>
          <input
            value={form.requesterPhone}
            onChange={(e) => setForm({ ...form, requesterPhone: e.target.value })}
            required
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Email (optional)</span>
          <input
            type="email"
            value={form.requesterEmail}
            onChange={(e) => setForm({ ...form, requesterEmail: e.target.value })}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className={labelClass}>Department</span>
          <select
            value={form.departmentId}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            required
            disabled={loading}
            className={inputClass}
          >
            <option value="" disabled>
              {loading ? "Loading departments..." : "Select a department"}
            </option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={submitting || loading}
          className="mt-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? "Sending..." : "Send request"}
        </button>
      </form>
    </PublicPageShell>
  );
}
