import { useEffect, useState, type FormEvent } from "react";
import { organizationsDb } from "../lib/db";
import { useAuth } from "../lib/auth/AuthContext";

export function SettingsPage() {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    organizationsDb.getOrganization(orgId).then((org) => {
      setMessage(org.newcomerDepartmentMessage);
      setLoading(false);
    });
  }, [orgId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const updated = await organizationsDb.updateNewcomerDepartmentMessage(orgId, message.trim());
      setMessage(updated.newcomerDepartmentMessage);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
        <h2 className="text-base font-semibold">Newcomer messages</h2>
        <p className="mt-1 text-sm text-ink/60">
          Sent automatically the moment a member is tagged "newcomer" (manual entry or an
          approved join request). The welcome team already greets newcomers in person, so this
          message only needs to cover getting plugged into a department — not a repeat welcome.
          A separate, fixed follow-up message goes out the same evening asking how the service
          was; that one isn't editable here.
        </p>

        {loading ? (
          <p className="mt-6 text-sm text-ink/40">Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink/60">
                Department message — use <code className="rounded bg-neutral-100 px-1">{"{name}"}</code> for the member's name
              </span>
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setSaved(false);
                }}
                rows={4}
                required
                className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest/20"
              />
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {saved && <p className="text-sm text-forest">Saved.</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-fit rounded-lg bg-forest px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
