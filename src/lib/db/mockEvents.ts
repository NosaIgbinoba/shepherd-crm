import type { ChurchEvent } from "../../types";
import type { EventRepository } from "./types";

const STORAGE_KEY = "shepherd-crm:events";

function load(): ChurchEvent[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as ChurchEvent[]) : [];
}

function save(events: ChurchEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function nextId(events: ChurchEvent[]): string {
  const max = events.reduce((acc, e) => {
    const n = Number(e.id.replace(/^ev/, ""));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `ev${max + 1}`;
}

const delay = () => new Promise((resolve) => setTimeout(resolve, 200));

export const mockEvents: EventRepository = {
  async listEvents(orgId) {
    await delay();
    return load()
      .filter((e) => e.orgId === orgId)
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  async getEvent(orgId, eventId) {
    await delay();
    return load().find((e) => e.orgId === orgId && e.id === eventId) ?? null;
  },

  async createEvent(orgId, data) {
    await delay();
    const events = load();
    const event: ChurchEvent = { ...data, id: nextId(events), orgId };
    events.push(event);
    save(events);
    return event;
  },

  async updateEvent(orgId, eventId, data) {
    await delay();
    const events = load();
    const index = events.findIndex((e) => e.orgId === orgId && e.id === eventId);
    if (index === -1) throw new Error(`Event ${eventId} not found in org ${orgId}`);
    const updated: ChurchEvent = { ...data, id: eventId, orgId };
    events[index] = updated;
    save(events);
    return updated;
  },

  async deleteEvent(orgId, eventId) {
    await delay();
    const events = load().filter((e) => !(e.orgId === orgId && e.id === eventId));
    save(events);
  },
};
