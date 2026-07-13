import type { Announcement } from "../../types";
import type { AnnouncementRepository } from "./types";

const STORAGE_KEY = "shepherd-crm:announcements";

function load(): Announcement[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Announcement[]) : [];
}

function save(announcements: Announcement[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(announcements));
}

function nextId(announcements: Announcement[]): string {
  const max = announcements.reduce((acc, a) => {
    const n = Number(a.id.replace(/^an/, ""));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `an${max + 1}`;
}

const delay = () => new Promise((resolve) => setTimeout(resolve, 200));

export const mockAnnouncements: AnnouncementRepository = {
  async listAnnouncements(orgId) {
    await delay();
    return load()
      .filter((a) => a.orgId === orgId)
      .sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));
  },

  async createAnnouncement(orgId, data) {
    await delay();
    const announcements = load();
    const announcement: Announcement = {
      id: nextId(announcements),
      orgId,
      message: data.message,
      targetType: data.targetType,
      targetValue: data.targetValue,
      scheduledAt: data.scheduledAt,
      sentAt: null,
      createdAt: new Date().toISOString(),
      recipientCount: null,
      sentCount: null,
      skippedCount: null,
      failedCount: null,
    };
    announcements.push(announcement);
    save(announcements);
    return announcement;
  },

  async deleteAnnouncement(orgId, announcementId) {
    await delay();
    const announcements = load().filter(
      (a) => !(a.orgId === orgId && a.id === announcementId)
    );
    save(announcements);
  },
};
