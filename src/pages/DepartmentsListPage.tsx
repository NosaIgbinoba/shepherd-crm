import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { departmentsDb, db } from "../lib/db";
import type { Department, Member } from "../types";
import { useAuth } from "../lib/auth/AuthContext";

export function DepartmentsListPage() {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([departmentsDb.listDepartments(orgId), db.listMembers(orgId)]).then(
      ([departmentList, memberList]) => {
        if (cancelled) return;
        setDepartments(departmentList);
        setMembers(memberList);
        setLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  function memberName(memberId: string | null): string {
    if (!memberId) return "—";
    return members.find((m) => m.id === memberId)?.name ?? "Unknown";
  }

  return (
    <div className="members-page">
      <div className="members-page-header">
        <h1>Departments</h1>
        <Link to="/departments/new" className="btn btn-primary">
          Add department
        </Link>
      </div>

      {loading ? (
        <p>Loading departments...</p>
      ) : departments.length === 0 ? (
        <p>No departments yet.</p>
      ) : (
        <table className="members-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Leader</th>
              <th>Members</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((department) => (
              <tr key={department.id}>
                <td>
                  <Link to={`/departments/${department.id}`}>{department.name}</Link>
                </td>
                <td>{memberName(department.leaderId)}</td>
                <td>{department.memberIds.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
