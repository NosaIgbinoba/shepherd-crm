import type { AttendanceRecord } from "../types";

export type Granularity = "weekly" | "monthly" | "quarterly";

export interface AttendancePoint {
  bucketKey: string;
  label: string;
  value: number | null; // null = no submitted record in this bucket, a real gap
}

export interface AttendanceStats {
  average: number | null;
  highest: number | null;
  lowest: number | null;
  percentChange: number | null; // null when there's no data to compare against
}

// Monday-anchored weeks, matching CalendarPage's convention.
function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - weekday);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfQuarter(date: Date): Date {
  const quarterMonth = Math.floor(date.getMonth() / 3) * 3;
  return new Date(date.getFullYear(), quarterMonth, 1);
}

function bucketStart(date: Date, granularity: Granularity): Date {
  if (granularity === "weekly") return startOfWeek(date);
  if (granularity === "monthly") return startOfMonth(date);
  return startOfQuarter(date);
}

function stepBucket(date: Date, granularity: Granularity, steps: number): Date {
  if (granularity === "weekly") {
    const d = new Date(date);
    d.setDate(d.getDate() + steps * 7);
    return d;
  }
  if (granularity === "monthly") {
    return new Date(date.getFullYear(), date.getMonth() + steps, 1);
  }
  return new Date(date.getFullYear(), date.getMonth() + steps * 3, 1);
}

function bucketKey(date: Date, granularity: Granularity): string {
  const start = bucketStart(date, granularity);
  const y = start.getFullYear();
  if (granularity === "weekly") {
    const m = String(start.getMonth() + 1).padStart(2, "0");
    const d = String(start.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (granularity === "monthly") {
    return `${y}-${String(start.getMonth() + 1).padStart(2, "0")}`;
  }
  return `${y}-Q${Math.floor(start.getMonth() / 3) + 1}`;
}

function bucketLabel(date: Date, granularity: Granularity): string {
  const start = bucketStart(date, granularity);
  if (granularity === "weekly") {
    return start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  if (granularity === "monthly") {
    return start.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  }
  return `Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}`;
}

// Buckets every record for the service across all of history (not clipped
// to any visible date range) and averages headcount within each bucket —
// mean, not sum, since e.g. "monthly attendance" should read as a
// comparable average Sunday headcount, not an inflated total of however
// many services happened that month.
function buildBucketMeans(
  records: AttendanceRecord[],
  serviceName: string,
  granularity: Granularity
): Map<string, { start: Date; mean: number }> {
  const groups = new Map<string, { start: Date; values: number[] }>();
  for (const record of records) {
    if (record.serviceName !== serviceName) continue;
    const date = new Date(`${record.date}T00:00:00`);
    const key = bucketKey(date, granularity);
    const existing = groups.get(key);
    if (existing) existing.values.push(record.headcount);
    else groups.set(key, { start: bucketStart(date, granularity), values: [record.headcount] });
  }
  const means = new Map<string, { start: Date; mean: number }>();
  for (const [key, { start, values }] of groups) {
    means.set(key, { start, mean: values.reduce((sum, v) => sum + v, 0) / values.length });
  }
  return means;
}

// points cover only [rangeStart, rangeEnd] (what gets charted); stats are
// computed from those points, except percentChange, which compares the
// latest bucket with data against its immediately preceding calendar
// bucket using the full (unclipped) bucket map — so a bucket just before
// rangeStart still counts as a real predecessor instead of being missing.
export function computeAttendanceSeries(
  records: AttendanceRecord[],
  serviceName: string,
  granularity: Granularity,
  rangeStart: Date,
  rangeEnd: Date
): { points: AttendancePoint[]; stats: AttendanceStats } {
  const bucketMeans = buildBucketMeans(records, serviceName, granularity);

  const points: AttendancePoint[] = [];
  let cursor = bucketStart(rangeStart, granularity);
  const end = bucketStart(rangeEnd, granularity);
  while (cursor.getTime() <= end.getTime()) {
    const key = bucketKey(cursor, granularity);
    const bucket = bucketMeans.get(key);
    points.push({ bucketKey: key, label: bucketLabel(cursor, granularity), value: bucket?.mean ?? null });
    cursor = stepBucket(cursor, granularity, 1);
  }

  const values = points.filter((p): p is AttendancePoint & { value: number } => p.value !== null);
  const average = values.length > 0 ? values.reduce((sum, p) => sum + p.value, 0) / values.length : null;
  const highest = values.length > 0 ? Math.max(...values.map((p) => p.value)) : null;
  const lowest = values.length > 0 ? Math.min(...values.map((p) => p.value)) : null;

  let percentChange: number | null = null;
  const latestWithData = [...points].reverse().find((p) => p.value !== null);
  if (latestWithData) {
    const latestBucket = bucketMeans.get(latestWithData.bucketKey)!;
    const previousStart = stepBucket(latestBucket.start, granularity, -1);
    const previousBucket = bucketMeans.get(bucketKey(previousStart, granularity));
    if (previousBucket) {
      percentChange =
        previousBucket.mean === 0
          ? latestBucket.mean === 0
            ? 0
            : null
          : ((latestBucket.mean - previousBucket.mean) / previousBucket.mean) * 100;
    }
  }

  return { points, stats: { average, highest, lowest, percentChange } };
}

// Dashboard-only: compares the two most recent raw submissions for a
// service directly (no bucketing/averaging) — the dashboard has no
// granularity toggle, so "latest headcount vs. prior period" is simplest
// read record-over-record.
export function latestAttendanceChange(
  records: AttendanceRecord[],
  serviceName: string
): { latest: AttendanceRecord | null; percentChange: number | null } {
  const serviceRecords = records
    .filter((r) => r.serviceName === serviceName)
    .sort((a, b) => a.date.localeCompare(b.date));
  const latest = serviceRecords[serviceRecords.length - 1] ?? null;
  const previous = serviceRecords[serviceRecords.length - 2] ?? null;
  if (!latest) return { latest: null, percentChange: null };
  if (!previous) return { latest, percentChange: null };
  if (previous.headcount === 0) {
    return { latest, percentChange: latest.headcount === 0 ? 0 : null };
  }
  return {
    latest,
    percentChange: ((latest.headcount - previous.headcount) / previous.headcount) * 100,
  };
}
