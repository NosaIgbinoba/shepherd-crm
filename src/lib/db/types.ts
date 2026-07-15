import type {
  Announcement,
  AttendanceRecord,
  AttendanceSubmittedBy,
  ChurchEvent,
  Department,
  JoinRequest,
  JoinRequestStatus,
  Member,
  Organization,
  Rsvp,
  RsvpStatus,
} from "../../types";

// Every method is org-scoped by a required orgId, matching the row-level
// security boundary Supabase/Postgres will enforce later. Swapping MockDb
// for a SupabaseDb means implementing this same interface.
export interface MemberRepository {
  listMembers(orgId: string): Promise<Member[]>;
  getMember(orgId: string, memberId: string): Promise<Member | null>;
  createMember(orgId: string, data: Omit<Member, "id" | "orgId">): Promise<Member>;
  updateMember(
    orgId: string,
    memberId: string,
    data: Omit<Member, "id" | "orgId">
  ): Promise<Member>;
  deleteMember(orgId: string, memberId: string): Promise<void>;
}

export interface DepartmentRepository {
  listDepartments(orgId: string): Promise<Department[]>;
  getDepartment(orgId: string, departmentId: string): Promise<Department | null>;
  createDepartment(orgId: string, data: Omit<Department, "id" | "orgId">): Promise<Department>;
  updateDepartment(
    orgId: string,
    departmentId: string,
    data: Omit<Department, "id" | "orgId">
  ): Promise<Department>;
  deleteDepartment(orgId: string, departmentId: string): Promise<void>;
}

export interface NewJoinRequest {
  departmentId: string;
  requesterName: string;
  requesterPhone: string;
  requesterEmail: string | null;
  dob: string;
}

// createJoinRequest runs unauthenticated from the public /join page (no
// login) — RLS grants `anon` INSERT only, so admin-side actions
// (list/approve/reject) are separate methods that require an authenticated
// session. Approving into a real Member is orchestrated by the caller
// (create the Member, then call updateJoinRequestStatus with its id) rather
// than inside this repository, to keep each repository single-purpose.
export interface JoinRequestRepository {
  listJoinRequests(orgId: string): Promise<JoinRequest[]>;
  createJoinRequest(orgId: string, data: NewJoinRequest): Promise<JoinRequest>;
  updateJoinRequestStatus(
    orgId: string,
    requestId: string,
    status: JoinRequestStatus,
    memberId: string | null
  ): Promise<JoinRequest>;
}

export interface EventRepository {
  listEvents(orgId: string): Promise<ChurchEvent[]>;
  getEvent(orgId: string, eventId: string): Promise<ChurchEvent | null>;
  createEvent(orgId: string, data: Omit<ChurchEvent, "id" | "orgId">): Promise<ChurchEvent>;
  updateEvent(
    orgId: string,
    eventId: string,
    data: Omit<ChurchEvent, "id" | "orgId">
  ): Promise<ChurchEvent>;
  deleteEvent(orgId: string, eventId: string): Promise<void>;
}

export interface NewRsvp {
  eventId: string;
  attendeeName: string;
  attendeePhone: string;
  attendeeEmail: string | null;
  status: RsvpStatus;
}

// createRsvp runs unauthenticated from the public /rsvp/:eventId page, same
// anon-INSERT-only pattern as join requests.
export interface RsvpRepository {
  listRsvps(orgId: string, eventId: string): Promise<Rsvp[]>;
  createRsvp(orgId: string, data: NewRsvp): Promise<Rsvp>;
}

export interface NewAnnouncement {
  message: string;
  targetType: Announcement["targetType"];
  targetValue: string;
  scheduledAt: string;
}

// Admin-only, unlike JoinRequest/Rsvp — announcements have no public
// submission path. Delivery is handled entirely by the send-announcements
// Edge Function; this repository only manages the record.
export interface AnnouncementRepository {
  listAnnouncements(orgId: string): Promise<Announcement[]>;
  createAnnouncement(orgId: string, data: NewAnnouncement): Promise<Announcement>;
  deleteAnnouncement(orgId: string, announcementId: string): Promise<void>;
}

export interface NewAttendanceRecord {
  serviceName: string;
  date: string;
  headcount: number;
  submittedBy: AttendanceSubmittedBy;
}

// createAttendanceRecord runs from both the admin AttendanceDrawer and the
// public /attendance/submit page (anon INSERT-only, same pattern as
// join requests/rsvps) — submittedBy distinguishes which. No
// update/delete: this is a create-only form, no edit UI exists. See
// PROJECT.md.
export interface AttendanceRepository {
  listAttendanceRecords(orgId: string): Promise<AttendanceRecord[]>;
  createAttendanceRecord(orgId: string, data: NewAttendanceRecord): Promise<AttendanceRecord>;
}

// Only newcomerDepartmentMessage is editable via /settings today — name/
// address have no UI yet, so this stays narrow rather than a general
// updateOrganization(data: Partial<Organization>).
export interface OrganizationRepository {
  getOrganization(orgId: string): Promise<Organization>;
  updateNewcomerDepartmentMessage(orgId: string, message: string): Promise<Organization>;
}
