import { supabase } from "../supabase/client";
import type { Organization } from "../../types";
import type { OrganizationRepository } from "./types";

interface OrganizationRow {
  id: string;
  name: string;
  address: string;
  created_at: string;
  newcomer_department_message: string;
}

function rowToOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    createdAt: row.created_at,
    newcomerDepartmentMessage: row.newcomer_department_message,
  };
}

export const supabaseOrganizations: OrganizationRepository = {
  async getOrganization(orgId) {
    const { data, error } = await supabase!
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .single();
    if (error) throw error;
    return rowToOrganization(data as OrganizationRow);
  },

  async updateNewcomerDepartmentMessage(orgId, message) {
    const { data, error } = await supabase!
      .from("organizations")
      .update({ newcomer_department_message: message })
      .eq("id", orgId)
      .select()
      .single();
    if (error) throw error;
    return rowToOrganization(data as OrganizationRow);
  },
};
