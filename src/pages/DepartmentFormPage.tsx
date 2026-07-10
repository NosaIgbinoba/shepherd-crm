import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { departmentsDb, db } from "../lib/db";
import type { Department, Member } from "../types";
import { useAuth } from "../lib/auth/AuthContext";

const emptyForm = {
  name: "",
  leaderId: "" as string | "",
  memberIds: [] as string[],
};

type FormState = typeof emptyForm;

export function DepartmentFormPage() {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const { departmentId } = useParams();
  const isEditing = Boolean(departmentId) && departmentId !== "new";
  const navigate = useNavigate();

  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      db.listMembers(orgId),
      isEditing ? departmentsDb.getDepartment(orgId, departmentId!) : Promise.resolve(null),
    ]).then(([memberList, department]) => {
      if (cancelled) return;
      setMembers(memberList);
      if (isEditing) {
        if (!department) {
          setError("Department not found");
        } else {
          setForm({
            name: department.name,
            leaderId: department.leaderId ?? "",
            memberIds: department.memberIds,
          });
        }
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isEditing, departmentId, orgId]);

  function toggleMember(memberId: string) {
    setForm((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(memberId)
        ? prev.memberIds.filter((id) => id !== memberId)
        : [...prev.memberIds, memberId],
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload: Omit<Department, "id" | "orgId"> = {
      name: form.name.trim(),
      leaderId: form.leaderId || null,
      memberIds: form.memberIds,
    };

    try {
      if (isEditing) {
        await departmentsDb.updateDepartment(orgId, departmentId!, payload);
      } else {
        await departmentsDb.createDepartment(orgId, payload);
      }
      navigate("/departments");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save department");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="member-form-page">
      <h1>{isEditing ? "Edit department" : "Add department"}</h1>

      <form className="member-form" onSubmit={handleSubmit}>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <label htmlFor="leaderId">Leader</label>
        <select
          id="leaderId"
          value={form.leaderId}
          onChange={(e) => setForm({ ...form, leaderId: e.target.value })}
        >
          <option value="">No leader assigned</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>

        <fieldset>
          <legend>Members</legend>
          {members.length === 0 && <p>No members yet.</p>}
          {members.map((member) => (
            <label key={member.id} className="checkbox-label">
              <input
                type="checkbox"
                checked={form.memberIds.includes(member.id)}
                onChange={() => toggleMember(member.id)}
              />
              {member.name}
            </label>
          ))}
        </fieldset>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate("/departments")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
