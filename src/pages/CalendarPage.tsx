import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CalendarSync,
  Repeat,
} from "lucide-react";
import { eventsDb } from "../lib/db";
import type { ChurchEvent, EventRecurrence } from "../types";
import { useAuth } from "../lib/auth/AuthContext";
import { EventDrawer } from "../components/EventDrawer";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const RECURRENCE_LABELS: Record<EventRecurrence, string> = {
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
};

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function monthGrid(year: number, month: number): (Date | null)[] {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // 0 = Monday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function CalendarPage() {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState<ChurchEvent | null>(null);

  async function refresh() {
    const list = await eventsDb.listEvents(orgId);
    setEvents(list);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, ChurchEvent[]>();
    for (const event of events) {
      const key = dateKey(new Date(event.date));
      const existing = map.get(key);
      if (existing) existing.push(event);
      else map.set(key, [event]);
    }
    return map;
  }, [events]);

  const cells = monthGrid(cursor.getFullYear(), cursor.getMonth());
  const today = new Date();
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  function goToMonth(offset: number) {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  }

  function goToYear(offset: number) {
    setCursor((prev) => new Date(prev.getFullYear() + offset, prev.getMonth(), 1));
  }

  function handleJumpTo(value: string) {
    // value is "YYYY-MM" from the native month picker.
    const [year, month] = value.split("-").map(Number);
    if (!year || !month) return;
    setCursor(new Date(year, month - 1, 1));
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToYear(-1)}
            aria-label="Previous year"
            className="grid size-8 place-items-center rounded-lg text-ink/60 hover:bg-neutral-100"
          >
            <ChevronsLeft className="size-4" />
          </button>
          <button
            onClick={() => goToMonth(-1)}
            aria-label="Previous month"
            className="grid size-8 place-items-center rounded-lg text-ink/60 hover:bg-neutral-100"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink/60 hover:bg-neutral-100"
          >
            Today
          </button>
          <button
            onClick={() => goToMonth(1)}
            aria-label="Next month"
            className="grid size-8 place-items-center rounded-lg text-ink/60 hover:bg-neutral-100"
          >
            <ChevronRight className="size-4" />
          </button>
          <button
            onClick={() => goToYear(1)}
            aria-label="Next year"
            className="grid size-8 place-items-center rounded-lg text-ink/60 hover:bg-neutral-100"
          >
            <ChevronsRight className="size-4" />
          </button>
          <label className="ml-1 flex items-center">
            <span className="sr-only">Jump to month</span>
            <input
              type="month"
              value={`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`}
              onChange={(e) => handleJumpTo(e.target.value)}
              className="rounded-lg border border-border bg-canvas px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-forest/20"
            />
          </label>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-ink/40">Loading calendar...</p>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
          <div className="grid grid-cols-7 border-b border-border">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="p-2 text-center text-[10px] font-semibold uppercase tracking-widest text-ink/40"
              >
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const isToday = day && dateKey(day) === dateKey(today);
              const dayEvents = day ? eventsByDay.get(dateKey(day)) ?? [] : [];
              return (
                <div
                  key={i}
                  className={`min-h-[6.5rem] border-b border-r border-border p-1.5 [&:nth-child(7n)]:border-r-0 ${
                    day ? "" : "bg-neutral-50/50"
                  }`}
                >
                  {day && (
                    <>
                      <div
                        className={`mb-1 inline-flex size-5 items-center justify-center rounded-full text-xs ${
                          isToday ? "bg-forest font-semibold text-white" : "text-ink/60"
                        }`}
                      >
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.map((event) => (
                          <button
                            key={event.id}
                            onClick={() => setSelected(event)}
                            className={`flex w-full items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-medium ${
                              event.source === "google"
                                ? "bg-amber-clay/15 text-amber-clay"
                                : "bg-forest/10 text-forest"
                            }`}
                            title={
                              event.recurrence
                                ? `${event.title} (${RECURRENCE_LABELS[event.recurrence]})`
                                : event.title
                            }
                          >
                            {event.source === "google" && (
                              <CalendarSync className="size-2.5 shrink-0" />
                            )}
                            {event.recurrence && <Repeat className="size-2.5 shrink-0" />}
                            <span className="truncate">{event.title}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-ink/50">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-forest" /> Manual
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-amber-clay" /> Synced from Google
        </span>
      </div>

      {selected && (
        <EventDrawer event={selected} onClose={() => setSelected(null)} onSaved={refresh} />
      )}
    </div>
  );
}
