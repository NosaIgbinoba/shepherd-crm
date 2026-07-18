import type { EventRecurrence } from "../types";

// Fixed-window instance generation, computed once at creation time — not a
// live/rolling generator, not an RRULE engine. Weekly/biweekly stop after a
// 12-week window from the start date; monthly stops after 6 months. See
// PROJECT.md (Phase 14).
const WEEKLY_WINDOW_DAYS = 84; // 12 weeks
const MONTHLY_WINDOW_MONTHS = 6;
const DAY_MS = 24 * 60 * 60 * 1000;

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

// Generates instance start dates for a recurring series, including `start`
// itself as the first instance. Known limitation: monthly series started on
// the 29th-31st inherit JS Date's month-overflow behavior (e.g. Jan 31 ->
// Mar 3, since February has no 31st) — accepted rather than adding clamping
// logic, matching this feature's "not an RRULE engine" scope.
export function generateRecurrenceDates(start: Date, recurrence: EventRecurrence): Date[] {
  const dates: Date[] = [];

  if (recurrence === "monthly") {
    const cutoff = addMonths(start, MONTHLY_WINDOW_MONTHS).getTime();
    for (let i = 0; addMonths(start, i).getTime() <= cutoff; i++) {
      dates.push(addMonths(start, i));
    }
    return dates;
  }

  const stepDays = recurrence === "weekly" ? 7 : 14;
  const cutoff = start.getTime() + WEEKLY_WINDOW_DAYS * DAY_MS;
  for (let current = start.getTime(); current <= cutoff; current += stepDays * DAY_MS) {
    dates.push(new Date(current));
  }
  return dates;
}
