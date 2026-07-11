import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { announcementsDb, departmentsDb } from "../lib/db";
import type { Announcement, Department } from "../types";
import { useAuth } from "../lib/auth/AuthContext";

export function AnnouncementsListPage() {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function refresh() {
    const [announcementList, departmentList] = await Promise.all([
      announcementsDb.listAnnouncements(orgId),
      departmentsDb.listDepartments(orgId),
    ]);
    setAnnouncements(announcementList);
    setDepartments(departmentList);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  function targetLabel(announcement: Announcement): string {
    if (announcement.targetType === "tag") return `Tag: ${announcement.targetValue}`;
    const department = departments.find((d) => d.id === announcement.targetValue);
    return `Department: ${department?.name ?? "Unknown"}`;
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await announcementsDb.deleteAnnouncement(orgId, id);
      await refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="members-page">
      <div className="members-page-header">
        <h1>Announcements</h1>
        <Link to="/announcements/new" className="btn btn-primary">
          New announcement
        </Link>
      </div>

      {loading ? (
        <p>Loading announcements...</p>
      ) : announcements.length === 0 ? (
        <p>No announcements yet.</p>
      ) : (
        <table className="members-table">
          <thead>
            <tr>
              <th>Message</th>
              <th>Target</th>
              <th>Scheduled</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {announcements.map((announcement) => (
              <tr key={announcement.id}>
                <td>{announcement.message}</td>
                <td>{targetLabel(announcement)}</td>
                <td>{new Date(announcement.scheduledAt).toLocaleString()}</td>
                <td>
                  <span className={`tag tag-${announcement.sentAt ? "sent" : "pending"}`}>
                    {announcement.sentAt ? "sent" : "pending"}
                  </span>
                </td>
                <td>
                  {!announcement.sentAt && (
                    <button
                      className="btn btn-ghost"
                      disabled={deletingId === announcement.id}
                      onClick={() => handleDelete(announcement.id)}
                    >
                      Cancel
                    </button>
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
