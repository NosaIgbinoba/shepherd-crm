import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pie, PieChart, Cell } from "recharts";
import { Users, UserPlus, Calendar, Cake, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { db, eventsDb, joinRequestsDb, departmentsDb, attendanceDb } from "../lib/db";
import { useAuth } from "../lib/auth/AuthContext";
import { KNOWN_SERVICES } from "../lib/constants";
import { latestAttendanceChange } from "../lib/attendanceAggregation";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../components/ui/chart";
import type { AttendanceRecord, ChurchEvent, Department, JoinRequest, Member } from "../types";

// Chart-safe variants of our forest/amber-clay brand colors — the exact UI
// button/badge hex values fail the dataviz skill's chroma/lightness checks
// for small chart marks (too dark/desaturated to read as color). These
// passed validate_palette.js in the same hue families.
const CHART_ESTABLISHED = "#25855b";
const CHART_NEWCOMER = "#ec7c0e";

const chartConfig = {
  count: { label: "Members" },
  newcomer: { label: "Newcomers", color: CHART_NEWCOMER },
  established: { label: "Established", color: CHART_ESTABLISHED },
} satisfies ChartConfig;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function isWithinNextDays(dateStr: string | null, days: number): boolean {
  if (!dateStr) return false;
  const today = new Date();
  const target = new Date(dateStr);
  target.setFullYear(today.getFullYear());
  if (target < new Date(today.toDateString())) {
    target.setFullYear(today.getFullYear() + 1);
  }
  const diffDays = Math.round((target.getTime() - new Date(today.toDateString()).getTime()) / 86400000);
  return diffDays >= 0 && diffDays < days;
}

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date();
  const d = new Date(dateStr);
  return d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

export function DashboardPage() {
  const { user } = useAuth();
  const orgId = user!.orgId;
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      db.listMembers(orgId),
      eventsDb.listEvents(orgId),
      joinRequestsDb.listJoinRequests(orgId),
      departmentsDb.listDepartments(orgId),
      attendanceDb.listAttendanceRecords(orgId),
    ]).then(([memberList, eventList, requestList, departmentList, attendanceList]) => {
      if (cancelled) return;
      setMembers(memberList);
      setEvents(eventList);
      setJoinRequests(requestList);
      setDepartments(departmentList);
      setAttendanceRecords(attendanceList);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  if (loading) return <p className="text-sm text-ink/40">Loading dashboard...</p>;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newMembers = members.filter((m) => new Date(m.joinedAt) >= thirtyDaysAgo);

  const now = Date.now();
  const upcomingEvents = events
    .filter((e) => new Date(e.date).getTime() >= now)
    .sort((a, b) => a.date.localeCompare(b.date));

  const birthdaysToday = members.filter((m) => isToday(m.dob));
  const birthdaysThisWeek = members.filter((m) => isWithinNextDays(m.dob, 7));

  const pendingRequests = joinRequests.filter((r) => r.status === "pending");

  const recentActivity = [...members]
    .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))
    .slice(0, 6);

  const newcomerCount = members.filter((m) => m.tags.includes("newcomer")).length;
  const establishedCount = members.length - newcomerCount;
  const pieData = [
    { name: "newcomer", label: "Newcomers", value: newcomerCount, fill: CHART_NEWCOMER },
    { name: "established", label: "Established", value: establishedCount, fill: CHART_ESTABLISHED },
  ];
  const newcomerRate = members.length > 0 ? Math.round((newcomerCount / members.length) * 100) : 0;

  const stats = [
    { label: "Total members", value: members.length, icon: Users, accent: false },
    { label: "New (30 days)", value: newMembers.length, icon: UserPlus, accent: true },
    { label: "Upcoming events", value: upcomingEvents.length, icon: Calendar, accent: false },
    { label: "Birthdays today", value: birthdaysToday.length, icon: Cake, accent: true },
  ];

  function departmentName(departmentId: string): string {
    return departments.find((d) => d.id === departmentId)?.name ?? "Unknown";
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{greeting()} 👋</h2>
          <p className="text-sm text-ink/60">Here's what's happening at JPD Church this week.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-ink/50">{s.label}</div>
              <s.icon className={`size-4 ${s.accent ? "text-amber-clay" : "text-forest"}`} />
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {KNOWN_SERVICES.map((service) => {
          const { latest, percentChange } = latestAttendanceChange(attendanceRecords, service.value);
          const isUp = percentChange !== null && percentChange >= 0;
          return (
            <Link
              key={service.value}
              to="/attendance"
              className="rounded-2xl bg-white p-5 ring-1 ring-black/5 transition hover:ring-forest/30"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-ink/50">{service.label} attendance</div>
                <ArrowRight className="size-3.5 text-ink/30" />
              </div>
              <div className="mt-2 flex items-baseline gap-3">
                <div className="text-2xl font-semibold tracking-tight">
                  {latest ? latest.headcount : "—"}
                </div>
                {percentChange !== null && (
                  <div
                    className={`flex items-center gap-1 text-xs font-medium ${
                      isUp ? "text-forest" : "text-destructive"
                    }`}
                  >
                    {isUp ? (
                      <TrendingUp className="size-3.5" />
                    ) : (
                      <TrendingDown className="size-3.5" />
                    )}
                    {Math.abs(Math.round(percentChange))}%
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Newcomer rate</h3>
              <p className="text-xs text-ink/50">Newcomers as a share of total membership.</p>
            </div>
            <Link to="/members" className="text-xs font-medium text-forest hover:underline">
              View all members →
            </Link>
          </div>

          {members.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-ink/40">
              No members yet.
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-around">
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square w-56 shrink-0"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={55}
                    outerRadius={80}
                    strokeWidth={2}
                    stroke="var(--color-surface)"
                    isAnimationActive={false}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>

              <div className="space-y-3">
                <div className="text-3xl font-semibold tracking-tight">{newcomerRate}%</div>
                <p className="text-xs text-ink/50">of members are newcomers</p>
                <div className="space-y-2 text-sm">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: entry.fill }}
                      />
                      <span className="text-ink/70">{entry.label}</span>
                      <span className="ml-auto font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
            <h3 className="mb-4 text-base font-semibold">This week</h3>
            <div className="space-y-4">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink/40">
                  Birthdays
                </div>
                {birthdaysThisWeek.length === 0 ? (
                  <div className="text-sm text-ink/50">None this week.</div>
                ) : (
                  birthdaysThisWeek.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-1 text-sm">
                      <span>{m.name}</span>
                      <span className="text-ink/40">
                        {new Date(m.dob!).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink/40">
                  Upcoming events
                </div>
                {upcomingEvents.length === 0 ? (
                  <div className="text-sm text-ink/50">Nothing scheduled.</div>
                ) : (
                  upcomingEvents.slice(0, 4).map((e) => (
                    <Link
                      key={e.id}
                      to="/events"
                      className="flex items-center justify-between py-1 text-sm hover:text-forest"
                    >
                      <span>{e.title}</span>
                      <span className="text-ink/40">
                        {new Date(e.date).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </Link>
                  ))
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-ink/40">
                  <span>Pending join requests</span>
                  {pendingRequests.length > 0 && (
                    <span className="rounded-full bg-amber-clay/15 px-2 py-0.5 text-[10px] normal-case tracking-normal text-amber-clay">
                      {pendingRequests.length}
                    </span>
                  )}
                </div>
                {pendingRequests.length === 0 ? (
                  <div className="text-sm text-ink/50">All caught up.</div>
                ) : (
                  pendingRequests.slice(0, 3).map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-1 text-sm">
                      <span className="truncate">
                        {r.requesterName} → {departmentName(r.departmentId)}
                      </span>
                      <Link to="/join-requests" className="text-forest">
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
            <h3 className="mb-4 text-base font-semibold">Recent activity</h3>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-ink/50">No members yet.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {recentActivity.map((m) => (
                  <li key={m.id} className="flex items-start gap-3">
                    <div className="mt-1 size-1.5 shrink-0 rounded-full bg-forest" />
                    <div>
                      <div>
                        <span className="font-medium">{m.name}</span> was added.
                      </div>
                      <div className="text-xs text-ink/40">
                        {new Date(m.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
