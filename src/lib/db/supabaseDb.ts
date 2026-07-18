import { supabase } from "../supabase/client";
import type { Member, MemberTag } from "../../types";
import type { MemberRepository } from "./types";

interface MemberRow {
  id: string;
  org_id: string;
  name: string;
  phone: string;
  email: string;
  dob: string | null;
  tags: MemberTag[];
  department_ids: string[];
  joined_at: string;
}

function rowToMember(row: MemberRow): Member {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    dob: row.dob,
    tags: row.tags,
    departmentIds: row.department_ids,
    joinedAt: row.joined_at,
  };
}

function memberToRow(orgId: string, data: Omit<Member, "id" | "orgId">) {
  return {
    org_id: orgId,
    name: data.name,
    phone: data.phone,
    email: data.email,
    dob: data.dob,
    tags: data.tags,
    department_ids: data.departmentIds,
    joined_at: data.joinedAt,
  };
}

// RLS (see supabase/migrations/0001_init.sql) already scopes every query to
// the caller's org, but org_id is still passed explicitly in each `.eq()` —
// defense in depth, and it keeps this interface identical to mockDb's.
export const supabaseDb: MemberRepository = {
  async listMembers(orgId) {
    const { data, error } = await supabase!
      .from("members")
      .select("*")
      .eq("org_id", orgId)
      .order("name");
    if (error) throw error;
    return (data as MemberRow[]).map(rowToMember);
  },

  async getMember(orgId, memberId) {
    const { data, error } = await supabase!
      .from("members")
      .select("*")
      .eq("org_id", orgId)
      .eq("id", memberId)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToMember(data as MemberRow) : null;
  },

  async createMember(orgId, data) {
    const { data: inserted, error } = await supabase!
      .from("members")
      .insert(memberToRow(orgId, data))
      .select()
      .single();
    if (error) throw error;
    return rowToMember(inserted as MemberRow);
  },

  async createMembers(orgId, data) {
    if (data.length === 0) return [];
    const { data: inserted, error } = await supabase!
      .from("members")
      .insert(data.map((row) => memberToRow(orgId, row)))
      .select();
    if (error) throw error;
    return (inserted as MemberRow[]).map(rowToMember);
  },

  async updateMember(orgId, memberId, data) {
    const { data: updated, error } = await supabase!
      .from("members")
      .update(memberToRow(orgId, data))
      .eq("org_id", orgId)
      .eq("id", memberId)
      .select()
      .single();
    if (error) throw error;
    return rowToMember(updated as MemberRow);
  },

  async deleteMember(orgId, memberId) {
    const { error } = await supabase!
      .from("members")
      .delete()
      .eq("org_id", orgId)
      .eq("id", memberId);
    if (error) throw error;
  },
};
