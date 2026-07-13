import type { AttendanceRecord } from "../../types";
import type { AttendanceRepository } from "./types";

const STORAGE_KEY = "shepherd-crm:attendance-records";

function load(): AttendanceRecord[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as AttendanceRecord[]) : [];
}

function save(records: AttendanceRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function nextId(records: AttendanceRecord[]): string {
  const max = records.reduce((acc, r) => {
    const n = Number(r.id.replace(/^att/, ""));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `att${max + 1}`;
}

const delay = () => new Promise((resolve) => setTimeout(resolve, 200));

export const mockAttendance: AttendanceRepository = {
  async listAttendanceRecords(orgId) {
    await delay();
    return load()
      .filter((r) => r.orgId === orgId)
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  async createAttendanceRecord(orgId, data) {
    await delay();
    const records = load();
    const duplicate = records.find(
      (r) => r.orgId === orgId && r.serviceName === data.serviceName && r.date === data.date
    );
    if (duplicate) {
      throw new Error("Attendance for this service and date has already been submitted.");
    }
    const record: AttendanceRecord = {
      id: nextId(records),
      orgId,
      serviceName: data.serviceName,
      date: data.date,
      headcount: data.headcount,
      submittedBy: data.submittedBy,
      createdAt: new Date().toISOString(),
    };
    records.push(record);
    save(records);
    return record;
  },
};

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function firstSundayOnOrAfter(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return d;
}

function weeklySundays(start: Date, end: Date): Date[] {
  const sundays: Date[] = [];
  let cursor = firstSundayOnOrAfter(start);
  while (cursor.getTime() <= end.getTime()) {
    sundays.push(cursor);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7);
  }
  return sundays;
}

function randomInt1To(max: number): number {
  return Math.floor(Math.random() * max) + 1;
}

// Dev/demo-only convenience for populating realistic mock data — never
// called against the live Supabase project (no supabaseAttendance
// equivalent exists, deliberately). Seeded rows are marked via an
// "seed-" id prefix rather than overloading submitted_by, since that
// field has real meaning elsewhere (admin vs. public-link submission)
// and this is a mock-mode-only demo marker, not a schema concept. See
// PROJECT.md.
export function seedDemoAttendanceData(orgId: string): AttendanceRecord[] {
  const today = new Date();
  const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 12, today.getDate());
  const startOfQ3ThisYear = new Date(today.getFullYear(), 6, 1);
  const youthServiceStart =
    startOfQ3ThisYear.getTime() > twelveMonthsAgo.getTime() ? startOfQ3ThisYear : twelveMonthsAgo;

  const seeded: AttendanceRecord[] = [
    ...weeklySundays(twelveMonthsAgo, today).map((sunday) => ({
      id: `seed-fs-${toDateOnly(sunday)}`,
      orgId,
      serviceName: "first_service",
      date: toDateOnly(sunday),
      headcount: randomInt1To(50),
      submittedBy: "admin" as const,
      createdAt: new Date().toISOString(),
    })),
    ...weeklySundays(youthServiceStart, today).map((sunday) => ({
      id: `seed-ys-${toDateOnly(sunday)}`,
      orgId,
      serviceName: "youth_service",
      date: toDateOnly(sunday),
      headcount: randomInt1To(200),
      submittedBy: "admin" as const,
      createdAt: new Date().toISOString(),
    })),
  ];

  const merged = [...load().filter((r) => !r.id.startsWith("seed-")), ...seeded];
  save(merged);
  return merged;
}

export function clearDemoAttendanceData(): AttendanceRecord[] {
  const records = load().filter((r) => !r.id.startsWith("seed-"));
  save(records);
  return records;
}
