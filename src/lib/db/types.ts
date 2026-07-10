import type { Member } from "../../types";

// Every method is org-scoped by a required orgId, matching the row-level
// security boundary Supabase/Postgres will enforce later. Swapping MockDb
// for a SupabaseDb means implementing this same interface.
export interface MemberRepository {
  listMembers(orgId: string): Promise<Member[]>;
  getMember(orgId: string, memberId: string): Promise<Member | null>;
  createMember(orgId: string, data: Omit<Member, "id" | "orgId">): Promise<Member>;
  updateMember(
    orgId: string,
    memberId: string,
    data: Omit<Member, "id" | "orgId">
  ): Promise<Member>;
  deleteMember(orgId: string, memberId: string): Promise<void>;
}
