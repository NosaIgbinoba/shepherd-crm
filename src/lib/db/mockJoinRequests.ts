import type { JoinRequest } from "../../types";
import type { JoinRequestRepository } from "./types";

const STORAGE_KEY = "shepherd-crm:join-requests";

function load(): JoinRequest[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as JoinRequest[]) : [];
}

function save(requests: JoinRequest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

function nextId(requests: JoinRequest[]): string {
  const max = requests.reduce((acc, r) => {
    const n = Number(r.id.replace(/^jr/, ""));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `jr${max + 1}`;
}

const delay = () => new Promise((resolve) => setTimeout(resolve, 200));

export const mockJoinRequests: JoinRequestRepository = {
  async listJoinRequests(orgId) {
    await delay();
    return load()
      .filter((r) => r.orgId === orgId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async createJoinRequest(orgId, data) {
    await delay();
    const requests = load();
    const request: JoinRequest = {
      id: nextId(requests),
      orgId,
      departmentId: data.departmentId,
      requesterName: data.requesterName,
      requesterPhone: data.requesterPhone,
      requesterEmail: data.requesterEmail,
      dob: data.dob,
      memberId: null,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    requests.push(request);
    save(requests);
    return request;
  },

  async updateJoinRequestStatus(orgId, requestId, status, memberId) {
    const requests = load();
    const index = requests.findIndex((r) => r.orgId === orgId && r.id === requestId);
    if (index === -1) throw new Error(`Join request ${requestId} not found in org ${orgId}`);
    const updated: JoinRequest = { ...requests[index], status, memberId };
    requests[index] = updated;
    save(requests);
    return updated;
  },
};
