import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  ClipboardCheck,
  Sparkles,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../lib/auth/AuthContext";
import { cn } from "../lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/members", label: "Members", icon: Users },
  { to: "/departments", label: "Departments", icon: Building2 },
  { to: "/join-requests", label: "Join requests", icon: ClipboardCheck },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/announcements", label: "Announcements", icon: Sparkles },
];

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/members": "Members",
  "/departments": "Departments",
  "/join-requests": "Join requests",
  "/events": "Events",
  "/announcements": "Announcements",
};

function pageTitle(pathname: string): string {
  if (titles[pathname]) return titles[pathname];
  const section = "/" + pathname.split("/")[1];
  return titles[section] ?? "Shepherd CRM";
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  async function signOut() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-canvas text-ink md:flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 -translate-x-full flex-col border-r border-border bg-surface transition-transform md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:translate-x-0 md:flex",
          mobileOpen ? "flex translate-x-0" : "hidden md:flex"
        )}
      >
        <Link to="/dashboard" className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="grid size-7 place-items-center rounded-md bg-forest text-[11px] font-bold text-white">
            S
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">JPD Church</div>
            <div className="text-[10px] uppercase tracking-widest text-ink/40">
              Shepherd CRM
            </div>
          </div>
        </Link>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {nav.map((item) => {
            const active = location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                  active ? "bg-forest/10 text-forest" : "text-ink/70 hover:bg-neutral-100"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <span className="block truncate px-3 pb-1 text-xs text-ink/40">{user?.email}</span>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-ink/70 hover:bg-neutral-100"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-canvas/90 px-4 backdrop-blur md:px-8">
          <button
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold">{pageTitle(location.pathname)}</h1>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
