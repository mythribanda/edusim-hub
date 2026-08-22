import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Users, 
  UserPlus, 
  Mail, 
  Calendar, 
  Atom, 
  Brain, 
  FlaskConical, 
  AlertCircle,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  LogOut
} from "lucide-react";

interface Homework {
  id: string;
  module_title: string;
  due_date: string | null;
  status: "completed" | "pending" | "overdue";
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
}

interface ChildMetrics {
  child_id: string;
  name: string;
  email: string;
  age_tier: string;
  modules_completed_this_week: number;
  time_spent_seconds: number;
  homework_assignments: Homework[];
  ai_tutor_topics: string[];
  show_attendance: boolean;
  attendance: AttendanceRecord[];
}

export function ParentDashboard() {
  const { token, logout, user: parentUser } = useAuthStore();
  const [emailInput, setEmailInput] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  const API_BASE = (import.meta as any).env.VITE_API_URL || "http://localhost:8001";

  // Fetch children metrics
  const { data: metricsData, refetch: refetchMetrics, isLoading } = useQuery({
    queryKey: ["parent-metrics", token],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/parents/metrics`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load metrics");
      const json = await res.json();
      return json.metrics as ChildMetrics[];
    },
    enabled: !!token,
  });

  const childrenMetrics = metricsData || [];

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsLinking(true);
    try {
      const res = await fetch(`${API_BASE}/api/parents/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ student_email: emailInput.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Child account linked successfully!");
        setEmailInput("");
        refetchMetrics();
      } else {
        toast.error(data.detail || data.message || "Failed to link child account.");
      }
    } catch {
      toast.error("An error occurred while linking the account.");
    } finally {
      setIsLinking(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return "No due date";
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-6 sm:p-8">
      {/* Header */}
      <header className="flex justify-between items-center pb-6 border-b border-border/60 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Users className="w-5.5 h-5.5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Parent Portal</h1>
            <p className="text-xs text-muted-foreground">Monitor and track your children's educational progress</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-sm font-semibold block">{parentUser?.name || "Parent"}</span>
            <span className="text-xs text-muted-foreground">{parentUser?.email}</span>
          </div>
          <button
            onClick={() => logout()}
            className="p-2.5 rounded-xl border border-border hover:bg-secondary hover:text-destructive transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Onboarding / Account Link Form if no children are linked yet */}
      {childrenMetrics.length === 0 && !isLoading && (
        <div className="max-w-md mx-auto py-12 space-y-6">
          <div className="glass rounded-3xl p-8 border border-border bg-card shadow-sm text-center">
            <AlertCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Welcome to EduSim!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Enter your child's student email address below to link their account and start viewing their progress, homework, and activity reports.
            </p>
            <form onSubmit={handleLinkStudent} className="space-y-4">
              <div className="relative text-left">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="student.email@school.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={isLinking}
                  required
                  className="w-full text-sm bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>
              <button
                type="submit"
                disabled={isLinking || !emailInput.trim()}
                className="w-full bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground font-semibold text-sm py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLinking ? "Linking Account..." : "Link Child"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid: Card per child */}
      {childrenMetrics.length > 0 && (
        <div className="space-y-8">
          {/* Option to link another child at the top */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-secondary/35 border border-border/80 rounded-2xl p-4">
            <span className="text-xs text-muted-foreground font-semibold">
              Linked Accounts: {childrenMetrics.length} student(s)
            </span>
            <form onSubmit={handleLinkStudent} className="flex gap-2 w-full sm:w-auto">
              <input
                type="email"
                placeholder="Link another child email..."
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                disabled={isLinking}
                required
                className="text-xs bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/40 text-foreground w-full sm:w-60"
              />
              <button
                type="submit"
                disabled={isLinking || !emailInput.trim()}
                className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap"
              >
                {isLinking ? "Linking..." : "Link"}
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {childrenMetrics.map((child) => (
              <div key={child.child_id} className="glass rounded-3xl border border-border bg-card shadow-sm p-6 space-y-6">
                {/* Child Header Card */}
                <div className="flex justify-between items-start border-b border-border/60 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{child.name}</h2>
                    <p className="text-xs text-muted-foreground">{child.email}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary/80 text-secondary-foreground border border-border px-2.5 py-1 rounded-full shrink-0">
                    {child.age_tier.replace("_", " ")}
                  </span>
                </div>

                {/* Quick stats row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-secondary/25 border border-border/65 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Completed This Week</span>
                      <span className="text-xl font-bold">{child.modules_completed_this_week} module(s)</span>
                    </div>
                  </div>

                  <div className="bg-secondary/25 border border-border/65 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Time Spent</span>
                      <span className="text-xl font-bold">{formatDuration(child.time_spent_seconds)}</span>
                    </div>
                  </div>
                </div>

                {/* AI Tutor Topics asked this week */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <Atom className="w-4 h-4 text-purple-500" />
                    AI Tutor Topics Asked This Week
                  </h3>
                  {child.ai_tutor_topics.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic bg-secondary/15 rounded-xl p-3 border border-border/50">
                      No tutor topics asked this week.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 bg-secondary/15 rounded-xl p-3 border border-border/50">
                      {child.ai_tutor_topics.map((topic, idx) => (
                        <span key={idx} className="text-[11px] font-semibold bg-background border border-border px-2.5 py-1 rounded-lg">
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current Homework Assignments */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    Homework Assignments
                  </h3>
                  {child.homework_assignments.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic bg-secondary/15 rounded-xl p-3 border border-border/50">
                      No assignments currently due.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {child.homework_assignments.map((homework) => (
                        <div key={homework.id} className="flex justify-between items-center p-3 rounded-xl border border-border bg-secondary/20">
                          <div className="min-w-0 flex-1 pr-3">
                            <span className="text-xs font-bold text-foreground block truncate">{homework.module_title}</span>
                            <span className="text-[10px] text-muted-foreground">Due: {formatDueDate(homework.due_date)}</span>
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${
                            homework.status === "completed" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                            homework.status === "overdue" ? "bg-rose-100 text-rose-800 border-rose-200" :
                            "bg-amber-100 text-amber-800 border-amber-200"
                          }`}>
                            {homework.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Attendance (Middle/High School only) */}
                {child.show_attendance && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      Attendance Records
                    </h3>
                    {child.attendance.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic bg-secondary/15 rounded-xl p-3 border border-border/50">
                        No recent attendance records found.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {child.attendance.map((rec) => (
                          <div key={rec.id} className="p-2 rounded-xl border border-border/80 bg-secondary/15 text-center flex flex-col gap-0.5">
                            <span className="text-[9px] text-muted-foreground">
                              {new Date(rec.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                            <span className={`text-[10px] font-extrabold uppercase ${
                              rec.status === "present" ? "text-emerald-600" :
                              rec.status === "late" ? "text-amber-600" :
                              "text-rose-600"
                            }`}>
                              {rec.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}