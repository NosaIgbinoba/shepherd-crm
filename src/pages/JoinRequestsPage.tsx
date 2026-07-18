import { useEffect, useState } from "react";
import { db, departmentsDb, joinRequestsDb } from "../lib/db";
import type { Department, JoinRequest, JoinRequestStatus, Member } from "../types";
import { useAuth } from "../lib/auth/AuthContext";
import { JoinRequestDrawer } from "../components/JoinRequestDrawer";

const statusStyles: Record<JoinRequestStatus, string> = {
  pending: "bg-amber-clay/15 text-amber-clay",
  approved: "bg-forest/10 text-forest",
  rejected: "bg-neutral-100 text-ink/70",
};

export function JoinRequestsPage() {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<JoinRequest | null>(null);

  async function refresh() {
    const [requestList, departmentList, memberList] = await Promise.all([
      joinRequestsDb.listJoinRequests(orgId),
      departmentsDb.listDepartments(orgId),
      db.listMembers(orgId),
    ]);
    setRequests(requestList);
    setDepartments(departmentList);
    setMembers(memberList);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  function departmentName(departmentId: string): string {
    return departments.find((d) => d.id === departmentId)?.name ?? "Unknown";
  }

  async function handleApprove(request: JoinRequest) {
    const confirmed = window.confirm(
      `Approve "${request.requesterName}" (${request.requesterPhone})?\n\n` +
        "This creates a real member record and — once the newcomer-welcome " +
        "job runs — sends a WhatsApp message to this phone number. Only " +
        "approve if you recognize this request as legitimate."
    );
    if (!confirmed) return;

    setError(null);
    setActioningId(request.id);
    try {
      const member = await db.createMember(orgId, {
        name: request.requesterName,
        phone: request.requesterPhone,
        email: request.requesterEmail ?? "",
        dob: request.dob,
        tags: ["newcomer"],
        departmentIds: [request.departmentId],
        joinedAt: new Date().toISOString().slice(0, 10),
      });

      const department = departments.find((d) => d.id === request.departmentId);
      if (department) {
        await departmentsDb.updateDepartment(orgId, department.id, {
          name: department.name,
          leaderId: department.leaderId,
          memberIds: [...department.memberIds, member.id],
        });
      }

      await joinRequestsDb.updateJoinRequestStatus(orgId, request.id, "approved", member.id);
      await refresh();
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve request");
    } finally {
      setActioningId(null);
    }
  }

  async function handleReject(request: JoinRequest) {
    setError(null);
    setActioningId(request.id);
    try {
      await joinRequestsDb.updateJoinRequestStatus(orgId, request.id, "rejected", null);
      await refresh();
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject request");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left">
              <tr>
                <Th>Name</Th>
                <Th>Contact</Th>
                <Th>Department</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-sm text-ink/40">
                    Loading join requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-sm text-ink/40">
                    No join requests yet.
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr
                    key={request.id}
                    onClick={() => setSelected(request)}
                    className="cursor-pointer border-t border-border hover:bg-neutral-50"
                  >
                    <td className="px-6 py-3 font-medium">{request.requesterName}</td>
                    <td className="px-6 py-3 text-ink/70">
                      {request.requesterPhone}
                      {request.requesterEmail ? ` / ${request.requesterEmail}` : ""}
                    </td>
                    <td className="px-6 py-3 text-ink/70">
                      {departmentName(request.departmentId)}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusStyles[request.status]}`}
                      >
                        {request.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <JoinRequestDrawer
          request={selected}
          departments={departments}
          members={members}
          actioning={actioningId === selected.id}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={handleReject}
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
