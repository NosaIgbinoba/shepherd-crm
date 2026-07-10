import type { Rsvp } from "../../types";
import type { RsvpRepository } from "./types";

const STORAGE_KEY = "shepherd-crm:rsvps";

function load(): Rsvp[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Rsvp[]) : [];
}

function save(rsvps: Rsvp[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rsvps));
}

function nextId(rsvps: Rsvp[]): string {
  const max = rsvps.reduce((acc, r) => {
    const n = Number(r.id.replace(/^rs/, ""));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `rs${max + 1}`;
}

const delay = () => new Promise((resolve) => setTimeout(resolve, 200));

export const mockRsvps: RsvpRepository = {
  async listRsvps(orgId, eventId) {
    await delay();
    return load().filter((r) => r.orgId === orgId && r.eventId === eventId);
  },

  async createRsvp(orgId, data) {
    await delay();
    const rsvps = load();
    const rsvp: Rsvp = {
      id: nextId(rsvps),
      orgId,
      eventId: data.eventId,
      attendeeName: data.attendeeName,
      attendeePhone: data.attendeePhone,
      attendeeEmail: data.attendeeEmail,
      memberId: null,
      status: data.status,
      createdAt: new Date().toISOString(),
    };
    rsvps.push(rsvp);
    save(rsvps);
    return rsvp;
  },
};
