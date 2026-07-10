import type { Department } from "../../types";
import type { DepartmentRepository } from "./types";
import { SEED_DEPARTMENTS } from "./seed";

const STORAGE_KEY = "shepherd-crm:departments";

function load(): Department[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DEPARTMENTS));
    return [...SEED_DEPARTMENTS];
  }
  return JSON.parse(raw) as Department[];
}

function save(departments: Department[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(departments));
}

function nextId(departments: Department[]): string {
  const max = departments.reduce((acc, d) => {
    const n = Number(d.id.replace(/^d/, ""));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `d${max + 1}`;
}

const delay = () => new Promise((resolve) => setTimeout(resolve, 200));

export const mockDepartments: DepartmentRepository = {
  async listDepartments(orgId) {
    await delay();
    return load()
      .filter((d) => d.orgId === orgId)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async getDepartment(orgId, departmentId) {
    await delay();
    return load().find((d) => d.orgId === orgId && d.id === departmentId) ?? null;
  },

  async createDepartment(orgId, data) {
    await delay();
    const departments = load();
    const department: Department = { ...data, id: nextId(departments), orgId };
    departments.push(department);
    save(departments);
    return department;
  },

  async updateDepartment(orgId, departmentId, data) {
    await delay();
    const departments = load();
    const index = departments.findIndex((d) => d.orgId === orgId && d.id === departmentId);
    if (index === -1) throw new Error(`Department ${departmentId} not found in org ${orgId}`);
    const updated: Department = { ...data, id: departmentId, orgId };
    departments[index] = updated;
    save(departments);
    return updated;
  },

  async deleteDepartment(orgId, departmentId) {
    await delay();
    const departments = load().filter((d) => !(d.orgId === orgId && d.id === departmentId));
    save(departments);
  },
};
