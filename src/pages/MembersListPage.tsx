import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../lib/db";
import type { Member } from "../types";
import { useAuth } from "../lib/auth/AuthContext";

export function MembersListPage() {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    db.listMembers(orgId).then((result) => {
      if (!cancelled) {
        setMembers(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
  }, [members, query]);

  return (
    <div className="members-page">
      <div className="members-page-header">
        <h1>Members</h1>
        <Link to="/members/new" className="btn btn-primary">
          Add member
        </Link>
      </div>

      <input
        type="search"
        placeholder="Search by name or email"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="members-search"
      />

      {loading ? (
        <p>Loading members...</p>
      ) : filtered.length === 0 ? (
        <p>No members found.</p>
      ) : (
        <table className="members-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Tags</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((member) => (
              <tr key={member.id}>
                <td>
                  <Link to={`/members/${member.id}`}>{member.name}</Link>
                </td>
                <td>{member.email}</td>
                <td>{member.phone}</td>
                <td>
                  {member.tags.map((tag) => (
                    <span key={tag} className={`tag tag-${tag}`}>
                      {tag}
                    </span>
                  ))}
                </td>
                <td>{member.joinedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
