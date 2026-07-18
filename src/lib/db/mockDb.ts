import type { Member } from "../../types";
import type { MemberRepository } from "./types";
import { SEED_MEMBERS } from "./seed";

const STORAGE_KEY = "shepherd-crm:members";

function load(): Member[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_MEMBERS));
    return [...SEED_MEMBERS];
  }
  return JSON.parse(raw) as Member[];
}

function save(members: Member[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

function nextId(members: Member[]): string {
  const max = members.reduce((acc, m) => {
    const n = Number(m.id.replace(/^m/, ""));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `m${max + 1}`;
}

// Simulates network latency so loading states are visible during development.
const delay = () => new Promise((resolve) => setTimeout(resolve, 200));

export const mockDb: MemberRepository = {
  async listMembers(orgId) {
    await delay();
    return load()
      .filter((m) => m.orgId === orgId)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async getMember(orgId, memberId) {
    await delay();
    return load().find((m) => m.orgId === orgId && m.id === memberId) ?? null;
  },

  async createMember(orgId, data) {
    await delay();
    const members = load();
    const member: Member = { ...data, id: nextId(members), orgId };
    members.push(member);
    save(members);
    return member;
  },

  async createMembers(orgId, data) {
    await delay();
    const members = load();
    let nextNum = Number(nextId(members).replace(/^m/, ""));
    const created = data.map((row) => {
      const member: Member = { ...row, id: `m${nextNum}`, orgId };
      nextNum += 1;
      return member;
    });
    save([...members, ...created]);
    return created;
  },

  async updateMember(orgId, memberId, data) {
    await delay();
    const members = load();
    const index = members.findIndex((m) => m.orgId === orgId && m.id === memberId);
    if (index === -1) throw new Error(`Member ${memberId} not found in org ${orgId}`);
    const updated: Member = { ...data, id: memberId, orgId };
    members[index] = updated;
    save(members);
    return updated;
  },

  async deleteMember(orgId, memberId) {
    await delay();
    const members = load().filter((m) => !(m.orgId === orgId && m.id === memberId));
    save(members);
  },
};
