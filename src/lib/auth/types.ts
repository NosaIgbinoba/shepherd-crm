import type { AppUser } from "../../types";

// Implemented by both mockAuth (localStorage) and supabaseAuth
// (supabase.auth + the `users` table). AuthContext depends only on this.
export interface AuthRepository {
  getSession(): Promise<AppUser | null>;
  login(email: string, password: string): Promise<AppUser>;
  logout(): Promise<void>;
}
