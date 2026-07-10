import { supabase } from "../supabase/client";
import type { Rsvp, RsvpStatus } from "../../types";
import type { NewRsvp, RsvpRepository } from "./types";

interface RsvpRow {
  id: string;
  org_id: string;
  event_id: string;
  attendee_name: string;
  attendee_phone: string;
  attendee_email: string | null;
  member_id: string | null;
  status: RsvpStatus;
  created_at: string;
}

function rowToRsvp(row: RsvpRow): Rsvp {
  return {
    id: row.id,
    orgId: row.org_id,
    eventId: row.event_id,
    attendeeName: row.attendee_name,
    attendeePhone: row.attendee_phone,
    attendeeEmail: row.attendee_email,
    memberId: row.member_id,
    status: row.status,
    createdAt: row.created_at,
  };
}

export const supabaseRsvps: RsvpRepository = {
  async listRsvps(orgId, eventId) {
    const { data, error } = await supabase!
      .from("rsvps")
      .select("*")
      .eq("org_id", orgId)
      .eq("event_id", eventId);
    if (error) throw error;
    return (data as RsvpRow[]).map(rowToRsvp);
  },

  async createRsvp(orgId, data: NewRsvp) {
    const { data: inserted, error } = await supabase!
      .from("rsvps")
      .insert({
        org_id: orgId,
        event_id: data.eventId,
        attendee_name: data.attendeeName,
        attendee_phone: data.attendeePhone,
        attendee_email: data.attendeeEmail,
        status: data.status,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToRsvp(inserted as RsvpRow);
  },
};
