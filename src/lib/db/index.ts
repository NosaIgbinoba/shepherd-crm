import { isSupabaseConfigured } from "../supabase/client";
import { mockDb } from "./mockDb";
import { supabaseDb } from "./supabaseDb";
import { mockDepartments } from "./mockDepartments";
import { supabaseDepartments } from "./supabaseDepartments";
import { mockJoinRequests } from "./mockJoinRequests";
import { supabaseJoinRequests } from "./supabaseJoinRequests";
import { mockEvents } from "./mockEvents";
import { supabaseEvents } from "./supabaseEvents";
import { mockRsvps } from "./mockRsvps";
import { supabaseRsvps } from "./supabaseRsvps";
import type {
  DepartmentRepository,
  EventRepository,
  JoinRequestRepository,
  MemberRepository,
  RsvpRepository,
} from "./types";

// Every repository below picks the live Supabase implementation once
// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set (see SUPABASE_SETUP.md);
// falls back to the localStorage mock otherwise so the app runs with zero
// setup.
export const db: MemberRepository = isSupabaseConfigured ? supabaseDb : mockDb;

export const departmentsDb: DepartmentRepository = isSupabaseConfigured
  ? supabaseDepartments
  : mockDepartments;

export const joinRequestsDb: JoinRequestRepository = isSupabaseConfigured
  ? supabaseJoinRequests
  : mockJoinRequests;

export const eventsDb: EventRepository = isSupabaseConfigured ? supabaseEvents : mockEvents;

export const rsvpsDb: RsvpRepository = isSupabaseConfigured ? supabaseRsvps : mockRsvps;

export type {
  DepartmentRepository,
  EventRepository,
  JoinRequestRepository,
  MemberRepository,
  RsvpRepository,
} from "./types";
