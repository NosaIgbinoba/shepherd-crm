import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../lib/db";
import type { Member, MemberTag } from "../types";
import { useAuth } from "../lib/auth/AuthContext";

const ALL_TAGS: MemberTag[] = ["newcomer", "worker", "leader"];

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  dob: "",
  tags: [] as MemberTag[],
  joinedAt: new Date().toISOString().slice(0, 10),
};

type FormState = typeof emptyForm;

export function MemberFormPage() {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const { memberId } = useParams();
  const isEditing = Boolean(memberId) && memberId !== "new";
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing) return;
    let cancelled = false;
    db.getMember(orgId, memberId!).then((member) => {
      if (cancelled) return;
      if (!member) {
        setError("Member not found");
        setLoading(false);
        return;
      }
      setForm({
        name: member.name,
        phone: member.phone,
        email: member.email,
        dob: member.dob ?? "",
        tags: member.tags,
        joinedAt: member.joinedAt,
      });
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isEditing, memberId, orgId]);

  function toggleTag(tag: MemberTag) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload: Omit<Member, "id" | "orgId"> = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      dob: form.dob || null,
      tags: form.tags,
      departmentIds: [],
      joinedAt: form.joinedAt,
    };

    try {
      if (isEditing) {
        await db.updateMember(orgId, memberId!, payload);
      } else {
        await db.createMember(orgId, payload);
      }
      navigate("/members");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save member");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="member-form-page">
      <h1>{isEditing ? "Edit member" : "Add member"}</h1>

      <form className="member-form" onSubmit={handleSubmit}>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <label htmlFor="phone">Phone</label>
        <input
          id="phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        <label htmlFor="dob">Date of birth</label>
        <input
          id="dob"
          type="date"
          value={form.dob}
          onChange={(e) => setForm({ ...form, dob: e.target.value })}
        />

        <label htmlFor="joinedAt">Joined</label>
        <input
          id="joinedAt"
          type="date"
          value={form.joinedAt}
          onChange={(e) => setForm({ ...form, joinedAt: e.target.value })}
          required
        />

        <fieldset>
          <legend>Tags</legend>
          {ALL_TAGS.map((tag) => (
            <label key={tag} className="checkbox-label">
              <input
                type="checkbox"
                checked={form.tags.includes(tag)}
                onChange={() => toggleTag(tag)}
              />
              {tag}
            </label>
          ))}
        </fieldset>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate("/members")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
