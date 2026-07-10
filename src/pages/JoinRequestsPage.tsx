import { useEffect, useState } from "react";
import { db, departmentsDb, joinRequestsDb } from "../lib/db";
import type { Department, JoinRequest } from "../types";
import { useAuth } from "../lib/auth/AuthContext";

export function JoinRequestsPage() {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [requestList, departmentList] = await Promise.all([
      joinRequestsDb.listJoinRequests(orgId),
      departmentsDb.listDepartments(orgId),
    ]);
    setRequests(requestList);
    setDepartments(departmentList);
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
    setError(null);
    setActioningId(request.id);
    try {
      const member = await db.createMember(orgId, {
        name: request.requesterName,
        phone: request.requesterPhone,
        email: request.requesterEmail ?? "",
        dob: null,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject request");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div className="members-page">
      <div className="members-page-header">
        <h1>Join requests</h1>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Loading join requests...</p>
      ) : requests.length === 0 ? (
        <p>No join requests yet.</p>
      ) : (
        <table className="members-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Department</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>{request.requesterName}</td>
                <td>
                  {request.requesterPhone}
                  {request.requesterEmail ? ` / ${request.requesterEmail}` : ""}
                </td>
                <td>{departmentName(request.departmentId)}</td>
                <td>
                  <span className={`tag tag-${request.status}`}>{request.status}</span>
                </td>
                <td>
                  {request.status === "pending" && (
                    <div className="form-actions">
                      <button
                        className="btn btn-primary"
                        disabled={actioningId === request.id}
                        onClick={() => handleApprove(request)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-ghost"
                        disabled={actioningId === request.id}
                        onClick={() => handleReject(request)}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
