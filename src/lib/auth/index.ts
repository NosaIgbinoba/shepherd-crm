import { isSupabaseConfigured } from "../supabase/client";
import { mockAuth } from "./mockAuth";
import { supabaseAuth } from "./supabaseAuth";
import type { AuthRepository } from "./types";

export const authRepository: AuthRepository = isSupabaseConfigured ? supabaseAuth : mockAuth;

export type { AuthRepository } from "./types";
