import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { announcementsDb, departmentsDb } from "../lib/db";
import type { Announcement, Department } from "../types";
import { useAuth } from "../lib/auth/AuthContext";
import { AnnouncementDrawer } from "../components/AnnouncementDrawer";

// sent_at alone can't distinguish "delivered to everyone" from "delivered
// to no one" (e.g. every recipient's phone number failing the E.164
// check) — both used to render as a plain "sent" badge. recipientCount/
// sentCount are null for rows sent before this tracking existed (or in
// mock mode, where nothing simulates the Supabase-only cron function) —
// those fall back to the old plain "sent" label rather than showing a
// misleading "0/undefined".
function deliveryStatus(announcement: Announcement): { label: string; className: string } {
  if (!announcement.sentAt) {
    return { label: "pending", className: "bg-amber-clay/15 text-amber-clay" };
  }
  const total = announcement.recipientCount;
  const sent = announcement.sentCount;
  if (total === null || sent === null) {
    return { label: "sent", className: "bg-forest/10 text-forest" };
  }
  if (total === 0) {
    return { label: "sent (no recipients)", className: "bg-neutral-100 text-ink/60" };
  }
  if (sent === total) {
    return { label: "sent", className: "bg-forest/10 text-forest" };
  }
  if (sent === 0) {
    return { label: `sent (0/${total} delivered)`, className: "bg-destructive/10 text-destructive" };
  }
  return { label: `sent (${sent}/${total})`, className: "bg-amber-clay/15 text-amber-clay" };
}

export function AnnouncementsListPage() {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

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
    <div>
      <div className="mb-4 flex items-center justify-end">
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1 rounded-lg bg-forest px-3 py-2 text-sm text-white hover:bg-forest/90"
        >
          <Plus className="size-3.5" /> New announcement
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left">
              <tr>
                <Th>Message</Th>
                <Th>Target</Th>
                <Th>Scheduled</Th>
                <Th>Status</Th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-sm text-ink/40">
                    Loading announcements...
                  </td>
                </tr>
              ) : announcements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-sm text-ink/40">
                    No announcements yet.
                  </td>
                </tr>
              ) : (
                announcements.map((announcement) => (
                  <tr key={announcement.id} className="border-t border-border">
                    <td className="max-w-xs truncate px-6 py-3 font-medium">
                      {announcement.message}
                    </td>
                    <td className="px-6 py-3 text-ink/70">{targetLabel(announcement)}</td>
                    <td className="px-6 py-3 text-ink/60">
                      {new Date(announcement.scheduledAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      {(() => {
                        const status = deliveryStatus(announcement);
                        return (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        disabled={deletingId === announcement.id}
                        onClick={() => handleDelete(announcement.id)}
                        className="rounded-lg border border-border px-3 py-1 text-xs hover:bg-neutral-50 disabled:opacity-60"
                      >
                        {announcement.sentAt ? "Delete" : "Cancel"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {creating && (
        <AnnouncementDrawer
          departments={departments}
          onClose={() => setCreating(false)}
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
