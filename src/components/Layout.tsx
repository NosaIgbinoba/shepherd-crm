import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth/AuthContext";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/members" className="app-title">
          Shepherd CRM
        </Link>
        {user && (
          <nav className="app-nav">
            <Link to="/members">Members</Link>
            <Link to="/departments">Departments</Link>
            <Link to="/join-requests">Join requests</Link>
            <Link to="/events">Events</Link>
          </nav>
        )}
        {user && (
          <div className="app-header-actions">
            <span className="app-user-email">{user.email}</span>
            <button onClick={logout} className="btn btn-ghost">
              Log out
            </button>
          </div>
        )}
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
