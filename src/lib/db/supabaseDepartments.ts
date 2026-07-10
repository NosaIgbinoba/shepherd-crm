import { supabase } from "../supabase/client";
import type { Department } from "../../types";
import type { DepartmentRepository } from "./types";

interface DepartmentRow {
  id: string;
  org_id: string;
  name: string;
  leader_id: string | null;
  member_ids: string[];
}

function rowToDepartment(row: DepartmentRow): Department {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    leaderId: row.leader_id,
    memberIds: row.member_ids,
  };
}

function departmentToRow(orgId: string, data: Omit<Department, "id" | "orgId">) {
  return {
    org_id: orgId,
    name: data.name,
    leader_id: data.leaderId,
    member_ids: data.memberIds,
  };
}

export const supabaseDepartments: DepartmentRepository = {
  async listDepartments(orgId) {
    const { data, error } = await supabase!
      .from("departments")
      .select("*")
      .eq("org_id", orgId)
      .order("name");
    if (error) throw error;
    return (data as DepartmentRow[]).map(rowToDepartment);
  },

  async getDepartment(orgId, departmentId) {
    const { data, error } = await supabase!
      .from("departments")
      .select("*")
      .eq("org_id", orgId)
      .eq("id", departmentId)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToDepartment(data as DepartmentRow) : null;
  },

  async createDepartment(orgId, data) {
    const { data: inserted, error } = await supabase!
      .from("departments")
      .insert(departmentToRow(orgId, data))
      .select()
      .single();
    if (error) throw error;
    return rowToDepartment(inserted as DepartmentRow);
  },

  async updateDepartment(orgId, departmentId, data) {
    const { data: updated, error } = await supabase!
      .from("departments")
      .update(departmentToRow(orgId, data))
      .eq("org_id", orgId)
      .eq("id", departmentId)
      .select()
      .single();
    if (error) throw error;
    return rowToDepartment(updated as DepartmentRow);
  },

  async deleteDepartment(orgId, departmentId) {
    const { error } = await supabase!
      .from("departments")
      .delete()
      .eq("org_id", orgId)
      .eq("id", departmentId);
    if (error) throw error;
  },
};
