import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AppUser } from "../../types";
import { authRepository } from "./index";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authRepository.getSession().then((session) => {
      setUser(session);
      setLoading(false);
    });
  }, []);

  async function login(email: string, password: string) {
    const appUser = await authRepository.login(email, password);
    setUser(appUser);
  }

  async function logout() {
    await authRepository.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
