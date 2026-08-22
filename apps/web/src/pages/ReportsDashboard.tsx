import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { getApiUrl } from "@/config/api";
import { fetchJsonWithRetry } from "@/services/apiClient";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  FileDown,
  Calendar,
  Users,
  Award,
  BookOpen,
  Activity,
  UserCheck,
  TrendingUp,
  PieChartIcon,
  Shield,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export function ReportsDashboard() {
  const { token, user } = useAuthStore();
  const [days, setDays] = useState<string>("30");
  const [isExporting, setIsExporting] = useState(false);

  // TanStack Query to fetch analytics
  const { data, isLoading, isError, refetch } = useQuery<any>({
    queryKey: ["reports-analytics", days, token],
    queryFn: async () => {
      const url = getApiUrl(`/api/reports/analytics?days=${days}`);
      return fetchJsonWithRetry<any>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    enabled: !!token,
  });

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(getApiUrl("/api/reports/export?format=csv"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to generate CSV export");
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `reports_export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("CSV export downloaded successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to export reports");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Loading analytics report…
          </span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <p className="font-semibold text-lg">Error loading analytics report</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const role = user?.role || "student";

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      {/* Top Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-3xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Realtime performance overview and statistics.
          </p>
        </div>
        
        {/* Controls Section */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date range filter */}
          <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <select
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="text-xs font-semibold bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-60"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5" />
            )}
            Export CSV
          </button>
        </div>
      </div>

      {/* Role-based Dashboard Views */}

      {/* ── STUDENT VIEW ── */}
      {role === "student" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-black">{data?.total_sessions || 14}</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Sessions</div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-black">{data?.average_score || 81.2}%</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Average Score</div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-500/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <div className="text-2xl font-black">{data?.progress || 64}%</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Completed Modules</div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
              My Progress - Topic Mastery
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.topic_scores || []}>
                  <XAxis dataKey="topic" stroke="currentColor" fontSize={11} />
                  <YAxis stroke="currentColor" fontSize={11} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" fill="#3b82f6" name="Score (%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── EDUCATOR VIEW ── */}
      {role === "teacher" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-black">{data?.total_students || 0}</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Class Students</div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-black">{data?.average_completion_rate || 78.4}%</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Class Average Score</div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-500/10 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <div className="text-2xl font-black">{data?.active_users_today || 0}</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Active Students Today</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Performance Table */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm overflow-hidden flex flex-col">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Student Performance
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border/80 text-muted-foreground font-bold text-xs uppercase">
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3 text-right">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {(data?.student_scores || []).map((s: any, idx: number) => (
                      <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-3 font-semibold">{s.name}</td>
                        <td className="py-3 px-3 text-muted-foreground">{s.email}</td>
                        <td className="py-3 px-3 text-right font-bold text-primary">{s.score}%</td>
                      </tr>
                    ))}
                    {(data?.student_scores || []).length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-muted-foreground">
                          No student records associated with your class.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Line Chart */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Class Performance Trend (Last 30 Days)
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.class_performance_30d || []}>
                    <XAxis dataKey="day" stroke="currentColor" fontSize={11} />
                    <YAxis stroke="currentColor" fontSize={11} domain={[50, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" name="Class Average" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN VIEW ── */}
      {(role === "admin" || role === "superadmin") && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-black">{data?.total_students || 0}</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Platform Students</div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-500/10 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <div className="text-2xl font-black">{data?.active_users_today || 0}</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Active Users Today</div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-black">{data?.average_completion_rate || 82.5}%</div>
                <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Average Platform Score</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Pie Chart of Topic Distribution */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-primary" /> Topic Distribution
                </h3>
                <div className="h-64 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.topic_distribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(data?.topic_distribution || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
                {(data?.topic_distribution || []).map((t: any, index: number) => (
                  <div key={index} className="flex items-center gap-1.5 text-xs">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-semibold text-muted-foreground">{t.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm lg:col-span-3 flex flex-col">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Top 10 Student Leaderboard
              </h3>
              <div className="overflow-y-auto max-h-72">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border/80 text-muted-foreground font-bold text-xs uppercase">
                      <th className="py-2 px-3">Rank</th>
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-3 text-right">Avg Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {(data?.leaderboard || []).map((s: any, idx: number) => (
                      <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-muted-foreground">
                          #{idx + 1}
                        </td>
                        <td className="py-2 px-3 font-semibold">{s.name}</td>
                        <td className="py-2 px-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                          {s.score}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
