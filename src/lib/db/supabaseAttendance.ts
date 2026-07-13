import { supabase } from "../supabase/client";
import type { AttendanceRecord, AttendanceSubmittedBy } from "../../types";
import type { AttendanceRepository, NewAttendanceRecord } from "./types";

interface AttendanceRow {
  id: string;
  org_id: string;
  service_name: string;
  date: string;
  headcount: number;
  submitted_by: AttendanceSubmittedBy;
  created_at: string;
}

function rowToAttendanceRecord(row: AttendanceRow): AttendanceRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    serviceName: row.service_name,
    date: row.date,
    headcount: row.headcount,
    submittedBy: row.submitted_by,
    createdAt: row.created_at,
  };
}

export const supabaseAttendance: AttendanceRepository = {
  async listAttendanceRecords(orgId) {
    const { data, error } = await supabase!
      .from("attendance_records")
      .select("*")
      .eq("org_id", orgId)
      .order("date");
    if (error) throw error;
    return (data as AttendanceRow[]).map(rowToAttendanceRecord);
  },

  async createAttendanceRecord(orgId, data: NewAttendanceRecord) {
    const { data: inserted, error } = await supabase!
      .from("attendance_records")
      .insert({
        org_id: orgId,
        service_name: data.serviceName,
        date: data.date,
        headcount: data.headcount,
        submitted_by: data.submittedBy,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToAttendanceRecord(inserted as AttendanceRow);
  },
};
