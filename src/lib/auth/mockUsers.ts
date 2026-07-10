import type { AppUser } from "../../types";

// Mock credential store only. NOT secure — passwords are plaintext and
// live in this file. Replace with Supabase Auth before any real deployment.
interface SeedUser extends AppUser {
  password: string;
}

export const SEED_USERS: SeedUser[] = [
  {
    id: "u1",
    orgId: "jpd",
    email: "admin@jpd.church",
    password: "admin123",
    role: "admin",
    memberRef: null,
  },
];
