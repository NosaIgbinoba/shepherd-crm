import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar as CalIcon, MapPin } from "lucide-react";
import { eventsDb } from "../../lib/db";
import { PUBLIC_ORG_ID } from "../../lib/constants";
import { PublicPageShell } from "../../components/PublicPageShell";
import type { ChurchEvent } from "../../types";

export function PublicEventsPage() {
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    eventsDb.listEvents(PUBLIC_ORG_ID).then((list) => {
      if (cancelled) return;
      const now = Date.now();
      setEvents(list.filter((event) => new Date(event.date).getTime() >= now));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PublicPageShell maxWidth="max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight">Upcoming events</h1>

      {loading ? (
        <p className="mt-4 text-sm text-ink/60">Loading...</p>
      ) : events.length === 0 ? (
        <p className="mt-4 text-sm text-ink/60">No upcoming events right now.</p>
      ) : (
        <ul className="mt-6 divide-y divide-border">
          {events.map((event) => (
            <li key={event.id} className="py-4 first:pt-0 last:pb-0">
              <h4 className="font-semibold">{event.title}</h4>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink/60">
                <span className="inline-flex items-center gap-1">
                  <CalIcon className="size-3" />
                  {new Date(event.date).toLocaleString()}
                </span>
                {event.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" /> {event.location}
                  </span>
                )}
              </div>
              <Link
                to={`/rsvp/${event.id}`}
                className="mt-3 inline-block rounded-lg bg-forest px-4 py-1.5 text-sm font-medium text-white hover:bg-forest/90"
              >
                RSVP
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PublicPageShell>
  );
}
