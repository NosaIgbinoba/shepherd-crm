// Mirrors the target Postgres/Supabase schema (organizations -> members -> departments -> ...).
// Field names and shapes are kept stable across the mock and future Supabase repositories.

export type MemberTag = "newcomer" | "worker" | "leader";
export type JoinRequestStatus = "pending" | "approved" | "rejected";
export type RsvpStatus = "yes" | "no" | "maybe";
export type UserRole = "admin" | "member";
export type AnnouncementTargetType = "tag" | "department";

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

// memberId is populated only when an admin approves the request into a real
// member record — public submitters (no login) supply requester* fields
// directly since they may not exist as a Member yet. See PROJECT.md.
export interface JoinRequest {
  id: string;
  orgId: string;
  departmentId: string;
  requesterName: string;
  requesterPhone: string;
  requesterEmail: string | null;
  memberId: string | null;
  status: JoinRequestStatus;
  createdAt: string; // ISO datetime
}

export interface ChurchEvent {
  id: string;
  orgId: string;
  title: string;
  date: string; // ISO datetime
  location: string;
  reminderHoursBefore: number;
}

// attendeeName/Phone are captured directly at RSVP time (public, no login)
// rather than requiring a pre-existing Member — see PROJECT.md.
export interface Rsvp {
  id: string;
  orgId: string;
  eventId: string;
  attendeeName: string;
  attendeePhone: string;
  attendeeEmail: string | null;
  memberId: string | null;
  status: RsvpStatus;
  createdAt: string; // ISO datetime
}

// targetValue is a MemberTag when targetType is "tag", or a Department id
// when targetType is "department". sentAt makes delivery idempotent
// regardless of how often the scheduled function runs.
export interface Announcement {
  id: string;
  orgId: string;
  message: string;
  targetType: AnnouncementTargetType;
  targetValue: string;
  scheduledAt: string; // ISO datetime
  sentAt: string | null;
  createdAt: string; // ISO datetime
}

export interface AppUser {
  id: string;
  orgId: string;
  email: string;
  role: UserRole;
  memberRef: string | null;
}
