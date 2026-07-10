import type { AuthRepository } from "./types";
import { SEED_USERS } from "./mockUsers";

const SESSION_KEY = "shepherd-crm:session";

export const mockAuth: AuthRepository = {
  async getSession() {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  async login(email, password) {
    const match = SEED_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!match) throw new Error("Invalid email or password");
    const { password: _password, ...appUser } = match;
    localStorage.setItem(SESSION_KEY, JSON.stringify(appUser));
    return appUser;
  },

  async logout() {
    localStorage.removeItem(SESSION_KEY);
  },
};
