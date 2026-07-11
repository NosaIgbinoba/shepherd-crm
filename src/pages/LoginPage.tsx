import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase/client";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? "/members";
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/members", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 md:grid-cols-2">
        <div className="hidden flex-col justify-between border-r border-border bg-forest p-10 text-white md:flex">
          <span className="text-sm font-bold uppercase tracking-[0.18em] text-white/90">
            Shepherd CRM
          </span>
          <div className="max-w-sm">
            <h2 className="text-2xl font-semibold leading-snug">
              Members, departments, events, and WhatsApp automations — all in one place.
            </h2>
          </div>
          <div className="text-xs text-white/50">JPD Church</div>
        </div>

        <div className="flex flex-col justify-center px-6 py-16 md:px-12">
          <div className="mx-auto w-full max-w-sm">
            <span className="mb-8 inline-block text-sm font-bold uppercase tracking-[0.18em] text-forest md:hidden">
              Shepherd CRM
            </span>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-ink/60">Sign in to manage JPD Church.</p>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink/60">Email</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/30"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink/60">Password</span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/30"
                />
              </label>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            {!isSupabaseConfigured && (
              <p className="mt-6 text-center text-xs text-ink/40">
                Demo admin: admin@jpd.church / admin123
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
