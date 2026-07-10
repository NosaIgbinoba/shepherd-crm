import { supabase } from "../supabase/client";
import type { AppUser } from "../../types";
import type { AuthRepository } from "./types";

interface UserRow {
  id: string;
  org_id: string;
  email: string;
  role: AppUser["role"];
  member_ref: string | null;
}

function rowToAppUser(row: UserRow): AppUser {
  return {
    id: row.id,
    orgId: row.org_id,
    email: row.email,
    role: row.role,
    memberRef: row.member_ref,
  };
}

// Loads the public.users row for the signed-in auth user — that row is what
// carries org_id/role (see SUPABASE_SETUP.md for how it gets created).
async function loadAppUser(userId: string): Promise<AppUser | null> {
  const { data, error } = await supabase!
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToAppUser(data as UserRow) : null;
}

export const supabaseAuth: AuthRepository = {
  async getSession() {
    const {
      data: { session },
    } = await supabase!.auth.getSession();
    if (!session?.user) return null;
    return loadAppUser(session.user.id);
  },

  async login(email, password) {
    const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const appUser = await loadAppUser(data.user.id);
    if (!appUser) {
      throw new Error(
        "Signed in, but no matching organizations.users row was found — see SUPABASE_SETUP.md"
      );
    }
    return appUser;
  },

  async logout() {
    await supabase!.auth.signOut();
  },
};
