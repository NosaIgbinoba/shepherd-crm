import { useEffect, useMemo, useState } from "react";
import { Plus, Copy, TrendingUp, TrendingDown, Sparkles, Trash2 } from "lucide-react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { attendanceDb } from "../lib/db";
import { isSupabaseConfigured } from "../lib/supabase/client";
import { KNOWN_SERVICES } from "../lib/constants";
import { useAuth } from "../lib/auth/AuthContext";
import { AttendanceDrawer } from "../components/AttendanceDrawer";
import {
  computeAttendanceSeries,
  attendanceInsight,
  periodPhrase,
  type Granularity,
} from "../lib/attendanceAggregation";
import { seedDemoAttendanceData, clearDemoAttendanceData } from "../lib/db/mockAttendance";
import type { AttendanceRecord } from "../types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "../components/ui/chart";

// Same chart-safe brand variants as the dashboard's newcomer-rate donut —
// re-validated for this use via the dataviz skill's validate_palette.js
// rather than assumed. See PROJECT.md "Dashboard chart".
const SERVICE_COLORS = ["#25855b", "#ec7c0e"];

const chartConfig = Object.fromEntries(
  KNOWN_SERVICES.map((s, i) => [s.value, { label: s.label, color: SERVICE_COLORS[i % SERVICE_COLORS.length] }])
) satisfies ChartConfig;

const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

type RangePreset = "3m" | "6m" | "12m" | "year" | "all";

const RANGE_PRESETS: { value: RangePreset; label: string }[] = [
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "12m", label: "Last 12 months" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" },
];

export function AttendancePage() {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const [rangePreset, setRangePreset] = useState<RangePreset>("12m");
  const [copiedService, setCopiedService] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  async function refresh() {
    const list = await attendanceDb.listAttendanceRecords(orgId);
    setRecords(list);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  // Mock-mode-only dev convenience — never available against the live
  // Supabase project (isSupabaseConfigured gates the buttons that call
  // these). See PROJECT.md.
  function handleSeedDemoData() {
    seedDemoAttendanceData(orgId);
    refresh();
  }

  function handleClearDemoData() {
    clearDemoAttendanceData();
    refresh();
  }

  async function handleCopyLink(serviceValue: string) {
    const link = `${window.location.origin}/attendance/submit?service=${serviceValue}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedService(serviceValue);
      setCopyError(null);
      setTimeout(() => setCopiedService(null), 2000);
    } catch {
      setCopyError("Couldn't copy automatically — select the link text and copy manually.");
    }
  }

  const rangeEnd = useMemo(() => new Date(), []);
  const rangeStart = useMemo(() => {
    const now = new Date();
    if (rangePreset === "3m") return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    if (rangePreset === "6m") return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    if (rangePreset === "12m") return new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
    if (rangePreset === "year") return new Date(now.getFullYear(), 0, 1);
    if (records.length === 0) return now;
    const earliestDateStr = records.reduce(
      (earliest, r) => (r.date < earliest ? r.date : earliest),
      records[0].date
    );
    return new Date(`${earliestDateStr}T00:00:00`);
  }, [rangePreset, records]);

  const seriesByService = useMemo(
    () =>
      Object.fromEntries(
        KNOWN_SERVICES.map((s) => [
          s.value,
          computeAttendanceSeries(records, s.value, granularity, rangeStart, rangeEnd),
        ])
      ),
    [records, granularity, rangeStart, rangeEnd]
  );

  // Merge each service's points into one array of { label, [serviceValue]: value }
  // rows for recharts — all services share the same bucket sequence since
  // they're built from the same rangeStart/rangeEnd/granularity.
  const chartData = useMemo(() => {
    const first = seriesByService[KNOWN_SERVICES[0]?.value ?? ""];
    if (!first) return [];
    return first.points.map((point, i) => {
      const row: Record<string, string | number | null> = { label: point.label };
      for (const service of KNOWN_SERVICES) {
        row[service.value] = seriesByService[service.value]?.points[i]?.value ?? null;
      }
      return row;
    });
  }, [seriesByService]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        {!isSupabaseConfigured && (
          <>
            <button
              onClick={handleSeedDemoData}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-ink/60 hover:bg-neutral-50"
            >
              <Sparkles className="size-3.5" /> Seed demo data
            </button>
            <button
              onClick={handleClearDemoData}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-ink/60 hover:bg-neutral-50"
            >
              <Trash2 className="size-3.5" /> Clear demo data
            </button>
          </>
        )}
        <button
          onClick={() => setLogging(true)}
          className="inline-flex items-center gap-1 rounded-lg bg-forest px-3 py-2 text-sm text-white hover:bg-forest/90"
        >
          <Plus className="size-3.5" /> Log attendance
        </button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {KNOWN_SERVICES.map((service) => (
          <button
            key={service.value}
            onClick={() => handleCopyLink(service.value)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-neutral-50"
          >
            <Copy className="size-3" />
            {copiedService === service.value ? "Copied!" : `Copy ${service.label} link`}
          </button>
        ))}
      </div>
      {copyError && <p className="mb-4 text-sm text-destructive">{copyError}</p>}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border bg-white p-1">
          {GRANULARITIES.map((g) => (
            <button
              key={g.value}
              onClick={() => setGranularity(g.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                granularity === g.value ? "bg-forest text-white" : "text-ink/60 hover:bg-neutral-50"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        <select
          value={rangePreset}
          onChange={(e) => setRangePreset(e.target.value as RangePreset)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-forest/20"
        >
          {RANGE_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-ink/40">Loading attendance...</p>
      ) : (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            {KNOWN_SERVICES.map((service, i) => {
              const stats = seriesByService[service.value]?.stats;
              return (
                <div key={service.value} className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: SERVICE_COLORS[i % SERVICE_COLORS.length] }}
                    />
                    <h3 className="text-sm font-semibold">{service.label}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat label="Average" value={stats?.average} />
                    <Stat label="Highest" value={stats?.highest} />
                    <Stat label="Lowest" value={stats?.lowest} />
                    <PercentStat value={stats?.percentChange} />
                  </div>
                  <p className="mt-3 border-t border-border pt-3 text-xs text-ink/60">
                    {attendanceInsight(
                      service.label,
                      periodPhrase(granularity),
                      stats?.percentChange ?? null
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
            {chartData.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-ink/40">
                No attendance data yet.
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
                <LineChart data={chartData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                    interval="preserveStartEnd"
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={11} width={32} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {KNOWN_SERVICES.map((service, i) => (
                    <Line
                      key={service.value}
                      dataKey={service.value}
                      name={service.label}
                      type="monotone"
                      stroke={SERVICE_COLORS[i % SERVICE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ChartContainer>
            )}
          </div>
        </>
      )}

      {logging && (
        <AttendanceDrawer onClose={() => setLogging(false)} onSaved={refresh} />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-widest text-ink/40">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tracking-tight">
        {value === null || value === undefined ? "—" : Math.round(value)}
      </div>
    </div>
  );
}

function PercentStat({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) {
    return (
      <div>
        <div className="text-[10px] font-medium uppercase tracking-widest text-ink/40">vs. prior</div>
        <div className="mt-0.5 text-lg font-semibold tracking-tight text-ink/40">—</div>
      </div>
    );
  }
  const isUp = value >= 0;
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-widest text-ink/40">vs. prior</div>
      <div
        className={`mt-0.5 flex items-center gap-1 text-lg font-semibold tracking-tight ${
          isUp ? "text-forest" : "text-destructive"
        }`}
      >
        {isUp ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
        {Math.abs(Math.round(value))}%
      </div>
    </div>
  );
}
