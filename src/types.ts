// Mirrors the target Postgres/Supabase schema (organizations -> members -> departments -> ...).
// Field names and shapes are kept stable across the mock and future Supabase repositories.

export type MemberTag = "newcomer" | "worker" | "leader";
export type JoinRequestStatus = "pending" | "approved" | "rejected";
export type RsvpStatus = "yes" | "no" | "maybe";
export type UserRole = "admin" | "member";

export interface Organization {
  id: string;
  name: string;
  address: string;
  createdAt: string; // ISO date
}

export interface Member {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  email: string;
  dob: string | null; // ISO date
  tags: MemberTag[];
  departmentIds: string[];
  joinedAt: string; // ISO date
}

export interface Department {
  id: string;
  orgId: string;
  name: string;
  leaderId: string | null;
  memberIds: string[];
}

export interface JoinRequest {
  id: string;
  orgId: string;
  memberId: string;
  departmentId: string;
  status: JoinRequestStatus;
}

export interface ChurchEvent {
  id: string;
  orgId: string;
  title: string;
  date: string; // ISO date
  location: string;
  reminderSchedule: string | null;
}

export interface Rsvp {
  id: string;
  orgId: string;
  eventId: string;
  memberId: string;
  status: RsvpStatus;
}

export interface AppUser {
  id: string;
  orgId: string;
  email: string;
  role: UserRole;
  memberRef: string | null;
}
