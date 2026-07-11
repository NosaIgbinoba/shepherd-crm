import { useState, type FormEvent } from "react";
import { Sheet, SheetContent } from "./ui/sheet";
import { departmentsDb } from "../lib/db";
import type { Department, Member } from "../types";
import { useAuth } from "../lib/auth/AuthContext";

const emptyForm = {
  name: "",
  leaderId: "" as string | "",
  memberIds: [] as string[],
};

export function DepartmentDrawer({
  department,
  members,
  onClose,
  onSaved,
}: {
  department: Department | null;
  members: Member[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const [form, setForm] = useState(
    department
      ? {
          name: department.name,
          leaderId: department.leaderId ?? "",
          memberIds: department.memberIds,
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (department) {
        await departmentsDb.updateDepartment(orgId, department.id, payload);
      } else {
        await departmentsDb.createDepartment(orgId, payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save department");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full max-w-md flex-col gap-0 p-0">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">
            {department ? "Edit department" : "Add department"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-6">
          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20"
            />
          </Field>

          <Field label="Leader">
            <select
              value={form.leaderId}
              onChange={(e) => setForm({ ...form, leaderId: e.target.value })}
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20"
            >
              <option value="">No leader assigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </Field>

          <div>
            <div className="mb-1 text-xs font-medium text-ink/60">Members</div>
            {members.length === 0 && <p className="text-xs text-ink/40">No members yet.</p>}
            <div className="flex flex-wrap gap-2">
              {members.map((member) => {
                const active = form.memberIds.includes(member.id);
                return (
                  <button
                    type="button"
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    className={`rounded-full px-3 py-1 text-xs ${
                      active ? "bg-forest/10 text-forest" : "bg-neutral-100 text-ink/70"
                    }`}
                  >
                    {member.name}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-forest px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save department"}
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
