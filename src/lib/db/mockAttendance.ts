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
