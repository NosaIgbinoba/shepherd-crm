import { mockDb } from "./mockDb";
import type { MemberRepository } from "./types";

// Swap this for a SupabaseDb implementing the same MemberRepository interface
// when the Postgres/Supabase backend lands.
export const db: MemberRepository = mockDb;

export type { MemberRepository } from "./types";
