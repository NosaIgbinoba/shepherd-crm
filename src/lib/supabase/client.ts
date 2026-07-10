import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// null until VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set in .env.local
// (see SUPABASE_SETUP.md) — everything that touches this is gated behind
// isSupabaseConfigured, so db/auth fall back to the mock implementations.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;
