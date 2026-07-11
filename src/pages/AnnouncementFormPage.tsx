import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { announcementsDb, departmentsDb } from "../lib/db";
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

export function AnnouncementFormPage() {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<AnnouncementTargetType>("tag");
  const [targetValue, setTargetValue] = useState<string>(ALL_TAGS[0]);
  const [scheduledAt, setScheduledAt] = useState(nowAsDatetimeLocal());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    departmentsDb.listDepartments(orgId).then((list) => {
      if (cancelled) return;
      setDepartments(list);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [orgId]);

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
      navigate("/announcements");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule announcement");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="member-form-page">
      <h1>New announcement</h1>

      <form className="member-form" onSubmit={handleSubmit}>
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          required
        />

        <fieldset>
          <legend>Send to</legend>
          <label className="checkbox-label">
            <input
              type="radio"
              name="targetType"
              checked={targetType === "tag"}
              onChange={() => handleTargetTypeChange("tag")}
            />
            A tagged group
          </label>
          <label className="checkbox-label">
            <input
              type="radio"
              name="targetType"
              checked={targetType === "department"}
              onChange={() => handleTargetTypeChange("department")}
            />
            A department
          </label>
        </fieldset>

        {targetType === "tag" ? (
          <>
            <label htmlFor="targetValue">Tag</label>
            <select
              id="targetValue"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
            >
              {ALL_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </>
        ) : (
          <>
            <label htmlFor="targetValue">Department</label>
            <select
              id="targetValue"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              required
              disabled={departments.length === 0}
            >
              {departments.length === 0 && <option value="">No departments yet</option>}
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </>
        )}

        <label htmlFor="scheduledAt">Send at</label>
        <input
          id="scheduledAt"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          required
        />

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Scheduling..." : "Schedule"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate("/announcements")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
