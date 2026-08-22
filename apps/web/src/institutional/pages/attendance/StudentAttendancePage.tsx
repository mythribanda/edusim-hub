/**
 * StudentAttendancePage
 * ─────────────────────
 * Port of apps/web/src/institutional/pages/attendance/StudentAttendance.tsx
 * with all mock data replaced by real TanStack Query API calls.
 *
 * Endpoints consumed:
 *   GET /api/attendance/student/:id   — full history for the logged-in student
 *   (parent RBAC handled server-side; this component is student-facing only)
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Target,
  FileText,
  Search,
  Filter,
  CalendarDays,
  Users,
} from "lucide-react";

// ── types ─────────────────────────────────────────────────────────────────────

interface AttendanceRecord {
  id: string;
  student_id: string;
  subject: string | null;
  faculty_id: string | null;
  date: string;
  status: "present" | "absent" | "late";
  marked_by: string | null;
  marked_by_name: string | null;
  class_id: string | null;
  created_at: string;
}

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-800 border-emerald-200",
  absent:  "bg-rose-100 text-rose-800 border-rose-200",
  late:    "bg-amber-100 text-amber-800 border-amber-200",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  present: <CheckCircle2 className="w-3.5 h-3.5" />,
  absent:  <XCircle className="w-3.5 h-3.5" />,
  late:    <AlertCircle className="w-3.5 h-3.5" />,
};

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_COLORS[s] ?? "bg-secondary text-secondary-foreground border-border"}`}
    >
      {STATUS_ICON[s]}
      {s}
    </span>
  );
}

function computeSubjectSummary(records: AttendanceRecord[]) {
  const map: Record<string, { held: number; attended: number; late: number; faculty: string }> = {};
  for (const r of records) {
    const subj = r.subject || "General";
    if (!map[subj]) map[subj] = { held: 0, attended: 0, late: 0, faculty: r.marked_by_name ?? "—" };
    map[subj].held++;
    if (r.status === "present") map[subj].attended++;
    if (r.status === "late") { map[subj].attended++; map[subj].late++; }
  }
  return Object.entries(map).map(([subject, v]) => ({
    subject,
    faculty: v.faculty,
    held: v.held,
    attended: v.attended,
    late: v.late,
    percentage: Math.round((v.attended / v.held) * 100),
  }));
}

// ── component ─────────────────────────────────────────────────────────────────

export function StudentAttendancePage() {
  const { user, token } = useAuthStore();
  const API_BASE = (import.meta as any).env.VITE_API_URL || "http://localhost:8001";

  // filters
  const [searchTerm, setSearchTerm]           = useState("");
  const [filterSubject, setFilterSubject]     = useState("all");
  const [filterStatus, setFilterStatus]       = useState("all");
  const [activeTab, setActiveTab]             = useState<"overview" | "records" | "calendar">("overview");

  // ── data fetch ───────────────────────────────────────────────────────────────
  const { data: records = [], isLoading, isError } = useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", "student", user?.id, token],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/attendance/student/${user!.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load attendance");
      return res.json();
    },
    enabled: !!token && !!user?.id,
    staleTime: 60_000,
  });

  // ── derived stats ─────────────────────────────────────────────────────────
  const total   = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const late    = records.filter((r) => r.status === "late").length;
  const absent  = records.filter((r) => r.status === "absent").length;
  const pct     = total ? Math.round(((present + late) / total) * 100) : 0;
  const atRisk  = pct < 75;

  const subjectSummary = useMemo(() => computeSubjectSummary(records), [records]);

  const subjects = useMemo(
    () => Array.from(new Set(records.map((r) => r.subject ?? "General"))),
    [records]
  );

  // weekly trend: last 7 days %
  const weeklyTrend = useMemo(() => {
    const days: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayRecs = records.filter((r) => r.date === dateStr);
      const dayPct = dayRecs.length
        ? Math.round((dayRecs.filter((r) => r.status !== "absent").length / dayRecs.length) * 100)
        : 0;
      days.push(dayPct);
    }
    return days;
  }, [records]);

  // calendar: date → status colour
  const calendarDates = useMemo(() => {
    const map: Record<string, "present" | "absent" | "late"> = {};
    for (const r of records) {
      const prev = map[r.date];
      // worst-case wins: absent > late > present
      if (!prev) { map[r.date] = r.status; continue; }
      if (r.status === "absent") map[r.date] = "absent";
      else if (r.status === "late" && prev !== "absent") map[r.date] = "late";
    }
    return map;
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const subj = r.subject ?? "General";
      if (filterSubject !== "all" && subj !== filterSubject) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!subj.toLowerCase().includes(q) && !(r.marked_by_name ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [records, filterSubject, filterStatus, searchTerm]);

  // ── loading / error states ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent animate-spin rounded-full" />
          <span className="text-sm">Loading attendance records…</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <XCircle className="w-12 h-12 text-destructive mx-auto" />
          <p className="font-semibold">Failed to load attendance</p>
          <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="glass rounded-3xl p-6 border border-border bg-card shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Attendance</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{user?.name} · {user?.email}</p>
              <span
                className={`inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${atRisk ? "bg-rose-100 text-rose-800 border-rose-200" : "bg-emerald-100 text-emerald-800 border-emerald-200"}`}
              >
                {atRisk ? "⚠ At Risk" : "✓ Good Standing"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-extrabold text-primary">{pct}%</div>
            <div className="text-xs text-muted-foreground">Overall Attendance</div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Classes", value: total,   icon: <BookOpen className="w-5 h-5 text-primary" />,         bg: "bg-primary/10" },
          { label: "Present",        value: present, icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />, bg: "bg-emerald-100" },
          { label: "Late",           value: late,    icon: <AlertCircle className="w-5 h-5 text-amber-600" />,    bg: "bg-amber-100" },
          { label: "Absent",         value: absent,  icon: <XCircle className="w-5 h-5 text-rose-600" />,         bg: "bg-rose-100" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>{s.icon}</div>
            <div>
              <div className="text-2xl font-extrabold">{s.value}</div>
              <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tab Nav ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-secondary/40 rounded-2xl p-1 w-fit">
        {(["overview", "records", "calendar"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all cursor-pointer ${activeTab === tab ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          {/* Weekly trend sparkline */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> 7-Day Trend
            </h3>
            <div className="flex items-end gap-1 h-12">
              {weeklyTrend.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-sm transition-all ${v >= 75 ? "bg-emerald-400" : v > 0 ? "bg-amber-400" : "bg-rose-300"}`}
                    style={{ height: `${Math.max(v, 4)}%`, maxHeight: "100%" }}
                  />
                  <span className="text-[9px] text-muted-foreground">{["M","T","W","T","F","S","S"][i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subject-wise table */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">Subject-wise Breakdown</h3>
            </div>
            {subjectSummary.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No records yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/30 text-left">
                      <th className="px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">Subject</th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">Faculty</th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase text-muted-foreground text-center">Held</th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase text-muted-foreground text-center">Attended</th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">Attendance %</th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectSummary.map((s, i) => (
                      <tr key={i} className="border-t border-border/50 hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 font-semibold">{s.subject}</td>
                        <td className="px-4 py-3 text-muted-foreground">{s.faculty}</td>
                        <td className="px-4 py-3 text-center">{s.held}</td>
                        <td className="px-4 py-3 text-center">{s.attended}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold w-10">{s.percentage}%</span>
                            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden max-w-[80px]">
                              <div
                                className={`h-full rounded-full ${s.percentage >= 75 ? "bg-emerald-500" : s.percentage >= 60 ? "bg-amber-400" : "bg-rose-500"}`}
                                style={{ width: `${s.percentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${s.percentage >= 75 ? "bg-emerald-100 text-emerald-800 border-emerald-200" : s.percentage >= 60 ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-rose-100 text-rose-800 border-rose-200"}`}>
                            {s.percentage >= 75 ? "Good" : s.percentage >= 60 ? "Warning" : "At Risk"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Records Tab ─────────────────────────────────────────────────────── */}
      {activeTab === "records" && (
        <div className="bg-card border border-border rounded-2xl shadow-sm">
          {/* Filter bar */}
          <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search subject or faculty…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 w-full text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="text-xs bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
            </select>
            <span className="text-xs text-muted-foreground ml-auto">{filtered.length} record(s)</span>
          </div>

          {/* Records list */}
          <div className="divide-y divide-border/50">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No records match your filters.</div>
            ) : (
              filtered.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/15 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{r.subject ?? "General"}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(r.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                        {r.marked_by_name ? ` · ${r.marked_by_name}` : ""}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Calendar Tab ────────────────────────────────────────────────────── */}
      {activeTab === "calendar" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Mini colour key */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 lg:col-span-1">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" /> Legend
            </h3>
            {(["present", "late", "absent"] as const).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full border ${STATUS_COLORS[s].split(" ").slice(0, 1).join("")}`} />
                <span className="capitalize text-sm">{s}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-border/60 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Present days</span><span className="font-bold text-emerald-600">{Object.values(calendarDates).filter(v => v === "present").length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Late days</span><span className="font-bold text-amber-600">{Object.values(calendarDates).filter(v => v === "late").length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Absent days</span><span className="font-bold text-rose-600">{Object.values(calendarDates).filter(v => v === "absent").length}</span></div>
            </div>
          </div>

          {/* Calendar grid — current month */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm lg:col-span-2">
            <CalendarGrid calendarDates={calendarDates} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── CalendarGrid sub-component ────────────────────────────────────────────────

function CalendarGrid({ calendarDates }: { calendarDates: Record<string, "present" | "absent" | "late"> }) {
  const now = new Date();
  const [viewYear, setViewYear]   = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const prev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const next = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const DOT_COLORS = { present: "bg-emerald-500", late: "bg-amber-500", absent: "bg-rose-500" };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={prev} className="w-7 h-7 rounded-xl border border-border hover:bg-secondary transition-colors text-sm cursor-pointer">‹</button>
        <span className="font-bold text-sm">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button onClick={next} className="w-7 h-7 rounded-xl border border-border hover:bg-secondary transition-colors text-sm cursor-pointer">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
          <div key={d} className="text-[10px] font-bold text-muted-foreground pb-1">{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const s = calendarDates[dateStr];
          const isToday = dateStr === now.toISOString().split("T")[0];
          return (
            <div
              key={day}
              className={`relative h-8 w-full rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${isToday ? "ring-2 ring-primary ring-offset-1" : ""} ${s ? "text-foreground" : "text-muted-foreground"}`}
            >
              {day}
              {s && (
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${DOT_COLORS[s]}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
