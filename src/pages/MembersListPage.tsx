import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Upload } from "lucide-react";
import { db, departmentsDb } from "../lib/db";
import type { Department, Member, MemberTag } from "../types";
import { useAuth } from "../lib/auth/AuthContext";
import { MemberDrawer } from "../components/MemberDrawer";
import { ImportMembersDrawer } from "../components/ImportMembersDrawer";

const ALL_TAGS: MemberTag[] = ["newcomer", "worker", "leader"];

const tagStyles: Record<MemberTag, string> = {
  newcomer: "bg-amber-clay/15 text-amber-clay",
  worker: "bg-forest/10 text-forest",
  leader: "bg-neutral-100 text-ink/70",
};

export function MembersListPage() {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const [members, setMembers] = useState<Member[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<MemberTag | "all">("all");
  const [editing, setEditing] = useState<Member | "new" | null>(null);
  const [importing, setImporting] = useState(false);

  async function refresh() {
    const [memberList, departmentList] = await Promise.all([
      db.listMembers(orgId),
      departmentsDb.listDepartments(orgId),
    ]);
    setMembers(memberList);
    setDepartments(departmentList);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (tagFilter !== "all" && !m.tags.includes(tagFilter)) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    });
  }, [members, query, tagFilter]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="w-full rounded-lg border border-border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-forest/20"
          />
        </div>
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value as MemberTag | "all")}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
        >
          <option value="all">All tags</option>
          {ALL_TAGS.map((tag) => (
            <option key={tag} value={tag} className="capitalize">
              {tag}
            </option>
          ))}
        </select>
        <button
          onClick={() => setImporting(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-neutral-50"
        >
          <Upload className="size-3.5" /> Import
        </button>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-1 rounded-lg bg-forest px-3 py-2 text-sm text-white hover:bg-forest/90"
        >
          <Plus className="size-3.5" /> Add member
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left">
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Tags</Th>
                <Th>Joined</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-sm text-ink/40">
                    Loading members...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-sm text-ink/40">
                    No members match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((member) => (
                  <tr
                    key={member.id}
                    onClick={() => setEditing(member)}
                    className="cursor-pointer border-t border-border hover:bg-neutral-50/60"
                  >
                    <td className="px-6 py-3 font-medium">{member.name}</td>
                    <td className="px-6 py-3 text-ink/70">{member.email}</td>
                    <td className="px-6 py-3 text-ink/70">{member.phone}</td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap gap-1">
                        {member.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${tagStyles[tag]}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-ink/60">{member.joinedAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-border bg-neutral-50/50 px-6 py-3 text-xs text-ink/50">
          {filtered.length} of {members.length} members
        </div>
      </div>

      {editing && (
        <MemberDrawer
          member={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={refresh}
        />
      )}

      {importing && (
        <ImportMembersDrawer
          members={members}
          departments={departments}
          onClose={() => setImporting(false)}
          onImported={refresh}
        />
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink/40">
      {children}
    </th>
  );
}
