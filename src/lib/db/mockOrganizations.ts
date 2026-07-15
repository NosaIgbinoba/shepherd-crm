import type { Organization } from "../../types";
import type { OrganizationRepository } from "./types";
import { SEED_ORG } from "./seed";

const STORAGE_KEY = "shepherd-crm:organizations";

function load(): Organization[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([SEED_ORG]));
    return [SEED_ORG];
  }
  return JSON.parse(raw) as Organization[];
}

function save(organizations: Organization[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(organizations));
}

const delay = () => new Promise((resolve) => setTimeout(resolve, 200));

export const mockOrganizations: OrganizationRepository = {
  async getOrganization(orgId) {
    await delay();
    const org = load().find((o) => o.id === orgId);
    if (!org) throw new Error(`Organization ${orgId} not found`);
    return org;
  },

  async updateNewcomerDepartmentMessage(orgId, message) {
    await delay();
    const organizations = load();
    const index = organizations.findIndex((o) => o.id === orgId);
    if (index === -1) throw new Error(`Organization ${orgId} not found`);
    const updated: Organization = { ...organizations[index], newcomerDepartmentMessage: message };
    organizations[index] = updated;
    save(organizations);
    return updated;
  },
};
