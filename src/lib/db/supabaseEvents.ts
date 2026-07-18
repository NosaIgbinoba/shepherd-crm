import { supabase } from "../supabase/client";
import type { ChurchEvent, EventRecurrence, EventSource } from "../../types";
import type { EventRepository } from "./types";

interface EventRow {
  id: string;
  org_id: string;
  title: string;
  date: string;
  location: string;
  reminder_hours_before: number;
  source: EventSource;
  google_event_id: string | null;
  link: string | null;
  recurrence: EventRecurrence | null;
  series_id: string | null;
}

function rowToEvent(row: EventRow): ChurchEvent {
  return {
    id: row.id,
    orgId: row.org_id,
    title: row.title,
    date: row.date,
    location: row.location,
    reminderHoursBefore: row.reminder_hours_before,
    source: row.source,
    googleEventId: row.google_event_id,
    link: row.link,
    recurrence: row.recurrence,
    seriesId: row.series_id,
  };
}

function eventToRow(orgId: string, data: Omit<ChurchEvent, "id" | "orgId">) {
  return {
    org_id: orgId,
    title: data.title,
    date: data.date,
    location: data.location,
    reminder_hours_before: data.reminderHoursBefore,
    source: data.source,
    google_event_id: data.googleEventId,
    link: data.link,
    recurrence: data.recurrence,
    series_id: data.seriesId,
  };
}

export const supabaseEvents: EventRepository = {
  async listEvents(orgId) {
    const { data, error } = await supabase!
      .from("events")
      .select("*")
      .eq("org_id", orgId)
      .order("date");
    if (error) throw error;
    return (data as EventRow[]).map(rowToEvent);
  },

  async getEvent(orgId, eventId) {
    const { data, error } = await supabase!
      .from("events")
      .select("*")
      .eq("org_id", orgId)
      .eq("id", eventId)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToEvent(data as EventRow) : null;
  },

  async createEvent(orgId, data) {
    const { data: inserted, error } = await supabase!
      .from("events")
      .insert(eventToRow(orgId, data))
      .select()
      .single();
    if (error) throw error;
    return rowToEvent(inserted as EventRow);
  },

  async createEvents(orgId, data) {
    if (data.length === 0) return [];
    const { data: inserted, error } = await supabase!
      .from("events")
      .insert(data.map((row) => eventToRow(orgId, row)))
      .select();
    if (error) throw error;
    return (inserted as EventRow[]).map(rowToEvent);
  },

  async updateEvent(orgId, eventId, data) {
    const { data: updated, error } = await supabase!
      .from("events")
      .update(eventToRow(orgId, data))
      .eq("org_id", orgId)
      .eq("id", eventId)
      .select()
      .single();
    if (error) throw error;
    return rowToEvent(updated as EventRow);
  },

  async deleteEvent(orgId, eventId) {
    const { error } = await supabase!
      .from("events")
      .delete()
      .eq("org_id", orgId)
      .eq("id", eventId);
    if (error) throw error;
  },
};
