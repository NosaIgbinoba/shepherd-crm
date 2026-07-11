import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { departmentsDb, db } from "../lib/db";
import type { Department, Member } from "../types";
import { useAuth } from "../lib/auth/AuthContext";
import { DepartmentDrawer } from "../components/DepartmentDrawer";

export function DepartmentsListPage() {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Department | "new" | null>(null);

  async function refresh() {
    const [departmentList, memberList] = await Promise.all([
      departmentsDb.listDepartments(orgId),
      db.listMembers(orgId),
    ]);
    setDepartments(departmentList);
    setMembers(memberList);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  function memberName(memberId: string | null): string {
    if (!memberId) return "—";
    return members.find((m) => m.id === memberId)?.name ?? "Unknown";
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-1 rounded-lg bg-forest px-3 py-2 text-sm text-white hover:bg-forest/90"
        >
          <Plus className="size-3.5" /> Add department
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left">
              <tr>
                <Th>Name</Th>
                <Th>Leader</Th>
                <Th>Members</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-10 text-center text-sm text-ink/40">
                    Loading departments...
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-10 text-center text-sm text-ink/40">
                    No departments yet.
                  </td>
                </tr>
              ) : (
                departments.map((department) => (
                  <tr
                    key={department.id}
                    onClick={() => setEditing(department)}
                    className="cursor-pointer border-t border-border hover:bg-neutral-50/60"
                  >
                    <td className="px-6 py-3 font-medium">{department.name}</td>
                    <td className="px-6 py-3 text-ink/70">{memberName(department.leaderId)}</td>
                    <td className="px-6 py-3 text-ink/70">{department.memberIds.length}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <DepartmentDrawer
          department={editing === "new" ? null : editing}
          members={members}
          onClose={() => setEditing(null)}
          onSaved={refresh}
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
