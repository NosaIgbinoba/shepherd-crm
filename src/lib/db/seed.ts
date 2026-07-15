import type { Department, Member, Organization } from "../../types";

export const SEED_ORG: Organization = {
  id: "jpd",
  name: "JPD Church",
  address: "1 Cathedral Way",
  createdAt: "2024-01-01T00:00:00.000Z",
  newcomerDepartmentMessage:
    "Hi {name}! If you'd like to get plugged into a department, reply to this message or ask an admin.",
};

export const SEED_MEMBERS: Member[] = [
  {
    id: "m1",
    orgId: "jpd",
    name: "Grace Adeyemi",
    phone: "555-0101",
    email: "grace.adeyemi@example.com",
    dob: "1990-04-12",
    tags: ["leader", "worker"],
    departmentIds: [],
    joinedAt: "2022-03-01",
  },
  {
    id: "m2",
    orgId: "jpd",
    name: "Samuel Okafor",
    phone: "555-0102",
    email: "samuel.okafor@example.com",
    dob: "1985-11-02",
    tags: ["worker"],
    departmentIds: [],
    joinedAt: "2023-06-15",
  },
  {
    id: "m3",
    orgId: "jpd",
    name: "Faith Nwosu",
    phone: "555-0103",
    email: "faith.nwosu@example.com",
    dob: null,
    tags: ["newcomer"],
    departmentIds: [],
    joinedAt: "2026-06-20",
  },
];

export const SEED_DEPARTMENTS: Department[] = [
  { id: "d1", orgId: "jpd", name: "Choir", leaderId: "m1", memberIds: ["m1"] },
  { id: "d2", orgId: "jpd", name: "Ushering", leaderId: null, memberIds: [] },
];
