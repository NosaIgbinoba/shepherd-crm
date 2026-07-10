import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { eventsDb } from "../../lib/db";
import { PUBLIC_ORG_ID } from "../../lib/constants";
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
    <div className="login-page">
      <div className="login-form" style={{ maxWidth: 480 }}>
        <h1>Upcoming events</h1>
        {loading ? (
          <p className="login-subtitle">Loading...</p>
        ) : events.length === 0 ? (
          <p className="login-subtitle">No upcoming events right now.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {events.map((event) => (
              <li
                key={event.id}
                style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--color-border)" }}
              >
                <strong>{event.title}</strong>
                <br />
                <span className="login-subtitle">
                  {new Date(event.date).toLocaleString()} — {event.location}
                </span>
                <br />
                <Link to={`/rsvp/${event.id}`} className="btn btn-primary" style={{ marginTop: "0.5rem" }}>
                  RSVP
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
