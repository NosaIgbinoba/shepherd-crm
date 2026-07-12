import { supabase } from "../supabase/client";
import type { JoinRequest, JoinRequestStatus } from "../../types";
import type { JoinRequestRepository, NewJoinRequest } from "./types";

interface JoinRequestRow {
  id: string;
  org_id: string;
  department_id: string;
  requester_name: string;
  requester_phone: string;
  requester_email: string | null;
  dob: string;
  member_id: string | null;
  status: JoinRequestStatus;
  created_at: string;
}

function rowToJoinRequest(row: JoinRequestRow): JoinRequest {
  return {
    id: row.id,
    orgId: row.org_id,
    departmentId: row.department_id,
    requesterName: row.requester_name,
    requesterPhone: row.requester_phone,
    requesterEmail: row.requester_email,
    dob: row.dob,
    memberId: row.member_id,
    status: row.status,
    createdAt: row.created_at,
  };
}

export const supabaseJoinRequests: JoinRequestRepository = {
  async listJoinRequests(orgId) {
    const { data, error } = await supabase!
      .from("join_requests")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as JoinRequestRow[]).map(rowToJoinRequest);
  },

  async createJoinRequest(orgId, data: NewJoinRequest) {
    const { data: inserted, error } = await supabase!
      .from("join_requests")
      .insert({
        org_id: orgId,
        department_id: data.departmentId,
        requester_name: data.requesterName,
        requester_phone: data.requesterPhone,
        requester_email: data.requesterEmail,
        dob: data.dob,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToJoinRequest(inserted as JoinRequestRow);
  },

  async updateJoinRequestStatus(orgId, requestId, status, memberId) {
    const { data: updated, error } = await supabase!
      .from("join_requests")
      .update({ status, member_id: memberId })
      .eq("org_id", orgId)
      .eq("id", requestId)
      .select()
      .single();
    if (error) throw error;
    return rowToJoinRequest(updated as JoinRequestRow);
  },
};
