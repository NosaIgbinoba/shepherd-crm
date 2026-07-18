import { useState, type FormEvent } from "react";
import { Tag } from "lucide-react";
import { Sheet, SheetContent } from "./ui/sheet";
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

export function MemberDrawer({
  member,
  onClose,
  onSaved,
}: {
  member: Member | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const [form, setForm] = useState(
    member
      ? {
          name: member.name,
          phone: member.phone,
          email: member.email,
          dob: member.dob ?? "",
          tags: member.tags,
          joinedAt: member.joinedAt,
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTag(tag: MemberTag) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  }

  async function save() {
    setError(null);
    setSaving(true);
    const payload: Omit<Member, "id" | "orgId"> = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      dob: form.dob || null,
      tags: form.tags,
      departmentIds: member?.departmentIds ?? [],
      joinedAt: form.joinedAt,
    };
    try {
      if (member) {
        await db.updateMember(orgId, member.id, payload);
      } else {
        await db.createMember(orgId, payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save member");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!member) return;
    if (!confirm("Delete this member?")) return;
    setSaving(true);
    try {
      await db.deleteMember(orgId, member.id);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete member");
      setSaving(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    save();
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 md:max-w-md">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">{member ? "Edit member" : "Add member"}</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-6">
          <FormField label="Full name">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Phone">
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20"
              />
            </FormField>
            <FormField label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date of birth">
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20"
              />
            </FormField>
            <FormField label="Joined">
              <input
                type="date"
                value={form.joinedAt}
                onChange={(e) => setForm({ ...form, joinedAt: e.target.value })}
                required
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20"
              />
            </FormField>
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-ink/60">Tags</div>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((tag) => {
                const active = form.tags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs capitalize ${
                      active ? "bg-forest/10 text-forest" : "bg-neutral-100 text-ink/70"
                    }`}
                  >
                    <Tag className="size-3" /> {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>

        <div className="flex items-center justify-between gap-3 border-t border-border p-4">
          {member ? (
            <button onClick={handleDelete} className="text-sm text-destructive">
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-forest px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink/60">{label}</span>
      {children}
    </label>
  );
}
