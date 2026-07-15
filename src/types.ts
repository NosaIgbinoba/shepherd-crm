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
  // Sent by newcomer-welcome the moment a member is tagged "newcomer".
  // "{name}" is replaced with the member's name. Admin-editable via
  // /settings rather than hardcoded, since wording varies by church.
  newcomerDepartmentMessage: string;
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
  dob: string; // ISO date
  memberId: string | null;
  status: JoinRequestStatus;
  createdAt: string; // ISO datetime
}

export type EventSource = "manual" | "google";

// source/googleEventId track one-way Google Calendar -> CRM sync (Phase 11,
// see PROJECT.md). Google Calendar is the source of truth for
// source='google' events — title/date/location are synced in and read-only
// in the CRM UI; only reminderHoursBefore is admin-editable on them, same
// as manual events, since Google Calendar has no reminder-hours concept.
export interface ChurchEvent {
  id: string;
  orgId: string;
  title: string;
  date: string; // ISO datetime
  location: string;
  reminderHoursBefore: number;
  source: EventSource;
  googleEventId: string | null;
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
// recipientCount/sentCount/skippedCount/failedCount are null until
// send-announcements actually processes the row, then let the UI tell
// "sent to everyone" apart from a silent total delivery failure (e.g.
// every recipient's phone number failing the E.164 check) — both cases
// previously looked identical (sentAt populated either way).
export interface Announcement {
  id: string;
  orgId: string;
  message: string;
  targetType: AnnouncementTargetType;
  targetValue: string;
  scheduledAt: string; // ISO datetime
  sentAt: string | null;
  createdAt: string; // ISO datetime
  recipientCount: number | null;
  sentCount: number | null;
  skippedCount: number | null;
  failedCount: number | null;
}

export interface AppUser {
  id: string;
  orgId: string;
  email: string;
  role: UserRole;
  memberRef: string | null;
}

export type AttendanceSubmittedBy = "admin" | "link";

// Aggregate headcount per service, not individual check-in — deliberately
// no member/phone matching, no dedupe against a person. serviceName is
// free text (not an enum): more services can be added later without a
// migration, at the cost of a small KNOWN_SERVICES code edit in
// src/lib/constants.ts to teach the UI about them. See PROJECT.md.
export interface AttendanceRecord {
  id: string;
  orgId: string;
  serviceName: string;
  date: string; // ISO date (YYYY-MM-DD)
  headcount: number;
  submittedBy: AttendanceSubmittedBy;
  createdAt: string; // ISO datetime
}
