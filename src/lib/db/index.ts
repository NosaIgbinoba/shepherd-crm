import { isSupabaseConfigured } from "../supabase/client";
import { mockDb } from "./mockDb";
import { supabaseDb } from "./supabaseDb";
import type { MemberRepository } from "./types";

// Picks the live Supabase implementation once VITE_SUPABASE_URL /
// VITE_SUPABASE_ANON_KEY are set (see SUPABASE_SETUP.md); falls back to the
// localStorage mock otherwise so the app runs with zero setup.
export const db: MemberRepository = isSupabaseConfigured ? supabaseDb : mockDb;

export type { MemberRepository } from "./types";
