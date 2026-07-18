import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Calendar as CalIcon,
  MapPin,
  CalendarSync,
  Repeat,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { eventsDb, rsvpsDb } from "../lib/db";
import type { ChurchEvent, EventRecurrence, RsvpStatus } from "../types";
import { useAuth } from "../lib/auth/AuthContext";
import { EventDrawer } from "../components/EventDrawer";

const RECURRENCE_LABELS: Record<EventRecurrence, string> = {
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
};

type RsvpCounts = Record<RsvpStatus, number>;

export function EventsListPage() {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [counts, setCounts] = useState<Record<string, RsvpCounts>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ChurchEvent | "new" | null>(null);

  async function refresh() {
    const eventList = await eventsDb.listEvents(orgId);
    setEvents(eventList);
    const entries = await Promise.all(
      eventList.map(async (event) => {
        const rsvps = await rsvpsDb.listRsvps(orgId, event.id);
        const eventCounts: RsvpCounts = { yes: 0, no: 0, maybe: 0 };
        rsvps.forEach((rsvp) => {
          eventCounts[rsvp.status] += 1;
        });
        return [event.id, eventCounts] as const;
      })
    );
    setCounts(Object.fromEntries(entries));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.date).getTime() >= now);
  const past = events.filter((e) => new Date(e.date).getTime() < now);

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-1 rounded-lg bg-forest px-3 py-2 text-sm text-white hover:bg-forest/90"
        >
          <Plus className="size-3.5" /> New event
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-ink/40">Loading events...</p>
      ) : (
        <div className="space-y-8">
          <EventSection
            title="Upcoming"
            events={upcoming}
            counts={counts}
            onEdit={setEditing}
          />
          <EventSection title="Past" events={past} counts={counts} onEdit={setEditing} muted />
        </div>
      )}

      {editing && (
        <EventDrawer
          event={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}

// A recurring series can generate many rows (e.g. 13 weekly instances).
// Collapsed by default to just the earliest instance per series, with a
// "+N more" toggle to expand in place — keeps the list scannable without
// hiding any occurrence permanently.
function useSeriesCollapse(events: ChurchEvent[]) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { visible, seriesCounts, seriesHeadId } = useMemo(() => {
    const seriesCounts = new Map<string, number>();
    const seriesHeadId = new Map<string, string>();
    events.forEach((event) => {
      if (!event.seriesId) return;
      seriesCounts.set(event.seriesId, (seriesCounts.get(event.seriesId) ?? 0) + 1);
      if (!seriesHeadId.has(event.seriesId)) seriesHeadId.set(event.seriesId, event.id);
    });
    const seen = new Set<string>();
    const visible = events.filter((event) => {
      if (!event.seriesId || expanded.has(event.seriesId)) return true;
      if (seen.has(event.seriesId)) return false;
      seen.add(event.seriesId);
      return true;
    });
    return { visible, seriesCounts, seriesHeadId };
  }, [events, expanded]);

  function toggle(seriesId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(seriesId)) next.delete(seriesId);
      else next.add(seriesId);
      return next;
    });
  }

  return { visible, seriesCounts, seriesHeadId, expanded, toggle };
}

function EventSection({
  title,
  events,
  counts,
  onEdit,
  muted,
}: {
  title: string;
  events: ChurchEvent[];
  counts: Record<string, RsvpCounts>;
  onEdit: (event: ChurchEvent) => void;
  muted?: boolean;
}) {
  const { visible, seriesCounts, seriesHeadId, expanded, toggle } = useSeriesCollapse(events);

  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink/40">
        {title}
      </h3>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((event) => {
          const c = counts[event.id] ?? { yes: 0, no: 0, maybe: 0 };
          const total = c.yes + c.maybe + c.no;
          const isSeriesHead = event.seriesId && seriesHeadId.get(event.seriesId) === event.id;
          const seriesCount = event.seriesId ? seriesCounts.get(event.seriesId)! : 0;
          const isExpanded = event.seriesId ? expanded.has(event.seriesId) : false;
          return (
            <div
              key={event.id}
              role="button"
              tabIndex={0}
              onClick={() => onEdit(event)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onEdit(event);
                }
              }}
              className={`rounded-xl bg-white p-5 text-left ring-1 ring-black/5 transition hover:ring-forest/30 ${
                muted ? "opacity-70" : ""
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <h4 className="font-semibold">{event.title}</h4>
                {event.source === "google" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-forest/10 px-2 py-0.5 text-[10px] font-medium text-forest">
                    <CalendarSync className="size-2.5" /> Synced from Google
                  </span>
                )}
                {event.recurrence && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-clay/10 px-2 py-0.5 text-[10px] font-medium text-amber-clay">
                    <Repeat className="size-2.5" /> {RECURRENCE_LABELS[event.recurrence]}
                  </span>
                )}
                {isSeriesHead && seriesCount > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(event.seriesId!);
                    }}
                    className="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium text-ink/50 hover:bg-neutral-100 hover:text-ink/70"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="size-2.5" /> Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="size-2.5" /> +{seriesCount - 1} more
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-ink/60">
                <span className="inline-flex items-center gap-1">
                  <CalIcon className="size-3" />
                  {new Date(event.date).toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {event.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" /> {event.location}
                  </span>
                )}
                {event.link && (
                  <a
                    href={event.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-forest hover:underline"
                  >
                    <LinkIcon className="size-3" /> Join meeting
                  </a>
                )}
              </div>
              {total > 0 && (
                <div className="mt-4">
                  <div className="mb-1 flex text-[10px] font-medium text-ink/50">
                    <span>{c.yes} going</span>
                    <span className="ml-auto">{total} RSVPs</span>
                  </div>
                  <div className="flex h-1.5 overflow-hidden rounded-full bg-neutral-100">
                    <div className="bg-forest" style={{ width: `${(c.yes / total) * 100}%` }} />
                    <div
                      className="bg-amber-clay"
                      style={{ width: `${(c.maybe / total) * 100}%` }}
                    />
                    <div
                      className="bg-neutral-300"
                      style={{ width: `${(c.no / total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {events.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-ink/40">
            None.
          </div>
        )}
      </div>
    </section>
  );
}
