import { supabase } from "../supabase/client";
import type { Announcement, AnnouncementTargetType } from "../../types";
import type { AnnouncementRepository, NewAnnouncement } from "./types";

interface AnnouncementRow {
  id: string;
  org_id: string;
  message: string;
  target_type: AnnouncementTargetType;
  target_value: string;
  scheduled_at: string;
  sent_at: string | null;
  created_at: string;
}

function rowToAnnouncement(row: AnnouncementRow): Announcement {
  return {
    id: row.id,
    orgId: row.org_id,
    message: row.message,
    targetType: row.target_type,
    targetValue: row.target_value,
    scheduledAt: row.scheduled_at,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  };
}

export const supabaseAnnouncements: AnnouncementRepository = {
  async listAnnouncements(orgId) {
    const { data, error } = await supabase!
      .from("announcements")
      .select("*")
      .eq("org_id", orgId)
      .order("scheduled_at", { ascending: false });
    if (error) throw error;
    return (data as AnnouncementRow[]).map(rowToAnnouncement);
  },

  async createAnnouncement(orgId, data: NewAnnouncement) {
    const { data: inserted, error } = await supabase!
      .from("announcements")
      .insert({
        org_id: orgId,
        message: data.message,
        target_type: data.targetType,
        target_value: data.targetValue,
        scheduled_at: data.scheduledAt,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToAnnouncement(inserted as AnnouncementRow);
  },

  async deleteAnnouncement(orgId, announcementId) {
    const { error } = await supabase!
      .from("announcements")
      .delete()
      .eq("org_id", orgId)
      .eq("id", announcementId);
    if (error) throw error;
  },
};
