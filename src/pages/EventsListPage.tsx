import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { eventsDb, rsvpsDb } from "../lib/db";
import type { ChurchEvent, RsvpStatus } from "../types";
import { useAuth } from "../lib/auth/AuthContext";

type RsvpCounts = Record<RsvpStatus, number>;

export function EventsListPage() {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [counts, setCounts] = useState<Record<string, RsvpCounts>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    eventsDb.listEvents(orgId).then(async (eventList) => {
      if (cancelled) return;
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
      if (cancelled) return;
      setCounts(Object.fromEntries(entries));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  return (
    <div className="members-page">
      <div className="members-page-header">
        <h1>Events</h1>
        <Link to="/events/new" className="btn btn-primary">
          Add event
        </Link>
      </div>

      {loading ? (
        <p>Loading events...</p>
      ) : events.length === 0 ? (
        <p>No events yet.</p>
      ) : (
        <table className="members-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Location</th>
              <th>RSVPs (yes / maybe / no)</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const c = counts[event.id] ?? { yes: 0, no: 0, maybe: 0 };
              return (
                <tr key={event.id}>
                  <td>
                    <Link to={`/events/${event.id}`}>{event.title}</Link>
                  </td>
                  <td>{new Date(event.date).toLocaleString()}</td>
                  <td>{event.location}</td>
                  <td>
                    {c.yes} / {c.maybe} / {c.no}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
