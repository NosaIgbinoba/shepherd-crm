import { useEffect, useState, type FormEvent } from "react";
import { departmentsDb, joinRequestsDb } from "../../lib/db";
import { PUBLIC_ORG_ID } from "../../lib/constants";
import { useBotGuard } from "../../lib/useBotGuard";
import type { Department } from "../../types";

const emptyForm = {
  requesterName: "",
  requesterPhone: "",
  requesterEmail: "",
  departmentId: "",
};

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
      <div className="login-page">
        <div className="login-form">
          <h1>Request sent</h1>
          <p className="login-subtitle">
            Thanks! An admin will review your request to join and follow up with you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Join a department</h1>
        <p className="login-subtitle">Tell us who you are and where you'd like to serve.</p>

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

        <label htmlFor="requesterName">Name</label>
        <input
          id="requesterName"
          value={form.requesterName}
          onChange={(e) => setForm({ ...form, requesterName: e.target.value })}
          required
        />

        <label htmlFor="requesterPhone">Phone</label>
        <input
          id="requesterPhone"
          value={form.requesterPhone}
          onChange={(e) => setForm({ ...form, requesterPhone: e.target.value })}
          required
        />

        <label htmlFor="requesterEmail">Email (optional)</label>
        <input
          id="requesterEmail"
          type="email"
          value={form.requesterEmail}
          onChange={(e) => setForm({ ...form, requesterEmail: e.target.value })}
        />

        <label htmlFor="departmentId">Department</label>
        <select
          id="departmentId"
          value={form.departmentId}
          onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
          required
          disabled={loading}
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

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={submitting || loading}>
          {submitting ? "Sending..." : "Send request"}
        </button>
      </form>
    </div>
  );
}
