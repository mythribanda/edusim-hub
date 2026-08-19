import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, PageWrapper } from "@/components/Card";
import { useQuery } from "@tanstack/react-query";
import { ParentDashboard } from "@/institutional/pages/parent/ParentDashboard";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CurriculumService } from "@/services/curriculumService";
import {
  getPendingAssignments,
  getMySubmissions,
  type PendingAssignment,
  type StudentSubmission,
} from "@/services/assignmentService";
import { 
  Sparkles, 
  BookOpen, 
  Atom, 
  Brain, 
  Compass,
  ArrowRight,
  User,
  GraduationCap,
  FlaskConical,
  ClipboardList,
  Calendar,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { meetsMinTier } from "@edusim/rbac";
import { getActiveReflection, replyToClassPost } from "@/services/classFeedService";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

const EMPTY_LOGIN_SEARCH = {
  verify_token: "",
  reset_token: "",
};

const EMPTY_TUTOR_SEARCH = {
  subject: undefined,
  class_name: undefined,
  chapter: undefined,
  topic: undefined,
  prompt: undefined,
};

function Dashboard() {
  const { user, logout, token } = useAuthStore();
  const navigate = useNavigate();

  if (user?.role === "parent") {
    return <ParentDashboard />;
  }

  const hasClassFeedAccess = user && (user.role !== "student" || (user.age_tier && meetsMinTier(user.age_tier, "middle")));

  // Active daily reflection prompt query
  const { data: activeReflection, refetch: refetchReflection } = useQuery({
    queryKey: ["activeReflection", token, user?.class_id],
    queryFn: () => getActiveReflection(token),
    enabled: !!token && user?.role === "student" && hasClassFeedAccess,
    refetchInterval: 15000, // Poll for reflection updates
  });

  const [reflectionText, setReflectionText] = useState("");
  const [reflectionSubmitting, setReflectionSubmitting] = useState(false);

  const handleSendReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReflection?.post || !reflectionText.trim() || !token) return;
    setReflectionSubmitting(true);
    try {
      const res = await replyToClassPost(token, activeReflection.post.id, reflectionText.trim());
      if (res?.success) {
        setReflectionText("");
        refetchReflection();
        toast.success("Reflection submitted! Thanks for sharing.");
      } else {
        toast.error("Failed to submit reflection.");
      }
    } catch {
      toast.error("Error submitting reflection.");
    } finally {
      setReflectionSubmitting(false);
    }
  };

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: CurriculumService.getClasses,
  });

  // Fetch pending assignments for student users
  const { data: pendingAssignments = [] } = useQuery<PendingAssignment[]>({
    queryKey: ["assignments", "pending", token],
    queryFn: () => getPendingAssignments(token),
    enabled: !!token && user?.role === "student",
    staleTime: 30_000,      // refresh every 30 s
    refetchOnWindowFocus: true,
  });

  // Fetch completed / graded submissions for student users
  const { data: completedSubmissions = [] } = useQuery<StudentSubmission[]>({
    queryKey: ["assignments", "completed", token],
    queryFn: () => getMySubmissions(token),
    enabled: !!token && user?.role === "student",
    staleTime: 30_000,      // refresh every 30 s
    refetchOnWindowFocus: true,
  });

  return (
    <ProtectedRoute>
      <PageWrapper>
      {/* Welcome Banner */}
      <section className="glass-strong rounded-3xl p-8 md:p-12 mb-8 relative overflow-hidden bg-card border border-border shadow-sm">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl z-0" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl z-0" />

        {/* Animated Quantum Orbit Background Illustration */}
        <div className="absolute right-16 top-1/2 -translate-y-1/2 w-[240px] h-[240px] overflow-hidden pointer-events-none hidden md:block z-0">
          <svg className="w-full h-full opacity-90 dark:opacity-60" viewBox="0 0 300 300" fill="none">
            {/* Center Core */}
            <circle cx="150" cy="150" r="6" fill="currentColor" className="text-primary" />
            <circle cx="150" cy="150" r="14" stroke="currentColor" className="text-primary/35" strokeWidth="1" />
            
            {/* Ring 1 */}
            <circle cx="150" cy="150" r="60" stroke="currentColor" className="text-primary/45" strokeWidth="1" strokeDasharray="4 4" />
            {/* Particle 1 */}
            <g>
              <circle r="4.5" fill="currentColor" className="text-primary">
                <animateMotion 
                  path="M 150,90 A 60,60 0 1,1 150,210 A 60,60 0 1,1 150,90 Z" 
                  dur="8s" 
                  repeatCount="indefinite" 
                />
              </circle>
              <circle r="9" stroke="currentColor" className="text-primary/40" strokeWidth="1">
                <animateMotion 
                  path="M 150,90 A 60,60 0 1,1 150,210 A 60,60 0 1,1 150,90 Z" 
                  dur="8s" 
                  repeatCount="indefinite" 
                />
              </circle>
            </g>

            {/* Ring 2 */}
            <circle cx="150" cy="150" r="100" stroke="currentColor" className="text-primary/30" strokeWidth="1" />
            {/* Particle 2 (Orbiting Counter-Clockwise) */}
            <circle r="5.5" fill="currentColor" className="text-primary/80">
              <animateMotion 
                path="M 250,150 A 100,100 0 1,0 50,150 A 100,100 0 1,0 250,150 Z" 
                dur="15s" 
                repeatCount="indefinite" 
              />
            </circle>

            {/* Ring 3 (First Inclined Ellipse for 3D look) */}
            <g transform="rotate(30 150 150)">
              <ellipse cx="150" cy="150" rx="130" ry="40" stroke="currentColor" className="text-primary/25" strokeWidth="1" strokeDasharray="6 3" />
              {/* Particle 3 (Orbiting Elliptical Path) */}
              <circle r="4" fill="currentColor" className="text-primary/60">
                <animateMotion 
                  path="M 280,150 A 130,40 0 1,1 20,150 A 130,40 0 1,1 280,150 Z" 
                  dur="25s" 
                  repeatCount="indefinite" 
                />
              </circle>
            </g>

            {/* Ring 4 (Second Opposing Inclined Ellipse for balanced 3D look) */}
            <g transform="rotate(-30 150 150)">
              <ellipse cx="150" cy="150" rx="130" ry="40" stroke="currentColor" className="text-primary/25" strokeWidth="1" strokeDasharray="6 3" />
              {/* Particle 4 (Orbiting Elliptical Path, counter-clockwise) */}
              <circle r="4" fill="currentColor" className="text-primary/60">
                <animateMotion 
                  path="M 280,150 A 130,40 0 1,0 20,150 A 130,40 0 1,0 280,150 Z" 
                  dur="20s" 
                  repeatCount="indefinite" 
                />
              </circle>
            </g>
          </svg>
        </div>

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-xs text-primary font-mono mb-4">
              <GraduationCap className="w-3.5 h-3.5" />
              {user?.role === "teacher" ? "TEACHER DASHBOARD" : "STUDENT DASHBOARD"}
            </div>
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold mb-3 tracking-tight text-foreground flex items-center gap-2"
            >
              Welcome back, <span className="text-primary font-extrabold">{user?.name || "Explorer"}</span>! 
              <motion.span 
                className="inline-block cursor-grab active:cursor-grabbing"
                animate={{
                  y: [0, -4, 0],
                  rotate: [0, 5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                whileHover={{ scale: 1.25, rotate: [0, 15, -10, 0] }}
              >
                🚀
              </motion.span>
            </motion.h1>
            <p className="text-muted-foreground max-w-xl text-base">
              Dive back into your simulations or ask the AI Tutor to explain complex physics concepts in real-time.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Signed in as <span className="font-semibold text-foreground">{user?.email || "unknown"}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Daily Reflection Prompt Card */}
      {user?.role === "student" && activeReflection?.active && !activeReflection?.has_replied && activeReflection.post && (
        <section className="glass rounded-3xl p-6 border border-primary/25 bg-primary/5 mb-8 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Daily Reflection Prompt</h2>
              <p className="text-xs text-muted-foreground">
                Your educator wants to hear from you! Tap below to answer.
              </p>
            </div>
          </div>
          <div className="bg-card border border-border/80 rounded-2xl p-4 mt-2">
            <p className="text-sm font-semibold text-foreground mb-3">
              "{activeReflection.post.content}"
            </p>
            <form onSubmit={handleSendReflection} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="What did you learn yesterday? Write a brief reflection..."
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                disabled={reflectionSubmitting}
                className="flex-1 text-sm bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                required
              />
              <button
                type="submit"
                disabled={reflectionSubmitting || !reflectionText.trim()}
                className="bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {reflectionSubmitting ? "Submitting..." : "Submit Reflection"}
              </button>
            </form>
          </div>
        </section>
      )}

      {/* ── Pending Assignments — student only, only shown when work is due ── */}
      {user?.role === "student" && pendingAssignments.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Pending Assignments
            </h2>
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold w-5 h-5">
              {pendingAssignments.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pendingAssignments.map((a) => {
              const isOverdue = a.due_date ? new Date(a.due_date) < new Date() : false;
              const dueSoon =
                a.due_date && !isOverdue
                  ? (new Date(a.due_date).getTime() - Date.now()) < 24 * 60 * 60 * 1000
                  : false;

              return (
                <Link
                  key={a.assignment_id}
                  to="/demo/simulation"
                  search={{ assignmentId: a.assignment_id }}
                  className="group block rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all p-5 relative overflow-hidden"
                  style={{
                    borderColor: isOverdue
                      ? "rgb(252 165 165)"
                      : dueSoon
                      ? "rgb(253 230 138)"
                      : "hsl(var(--border))",
                    background: isOverdue
                      ? "rgb(255 241 242)"
                      : dueSoon
                      ? "rgb(255 251 235)"
                      : undefined,
                  }}
                >
                  {/* Overdue / due-soon badge */}
                  {(isOverdue || dueSoon) && (
                    <div
                      className={`absolute top-3 right-3 flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                        isOverdue
                          ? "bg-red-100 text-red-600"
                          : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      <AlertCircle className="w-3 h-3" />
                      {isOverdue ? "Overdue" : "Due soon"}
                    </div>
                  )}

                  {/* Module title */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <FlaskConical className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground leading-tight group-hover:text-primary transition-colors">
                        {a.module_title}
                      </h3>
                      {a.due_date && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          Due {new Date(a.due_date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Instructions preview */}
                  {a.instructions && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {a.instructions}
                    </p>
                  )}

                  <div className="flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                    Start module <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Completed Assignments — student only ── */}
      {user?.role === "student" && completedSubmissions.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Completed Assignments
            </h2>
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold w-5 h-5">
              {completedSubmissions.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {completedSubmissions.map((s) => {
              const isGraded = s.graded_at !== null;
              return (
                <div
                  key={s.submission_id}
                  className="rounded-2xl border bg-card p-5 relative overflow-hidden shadow-sm"
                  style={{
                    borderColor: isGraded ? "rgb(187 247 208)" : "hsl(var(--border))",
                    background: isGraded ? "rgb(240 253 250)" : undefined,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground font-mono">
                      Completed on {s.completed_at ? new Date(s.completed_at).toLocaleDateString() : ""}
                    </span>
                    {isGraded ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                        Graded: {s.score}/100
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                        Awaiting Grade
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-foreground mb-2">
                    {s.module_title}
                  </h3>

                  {isGraded && s.comment && (
                    <div className="mt-3 p-3 bg-white/70 rounded-xl border border-green-100/60 text-xs text-foreground italic relative">
                      <span className="font-bold text-green-700 block not-italic text-[10px] uppercase tracking-wider mb-1">
                        Teacher Feedback
                      </span>
                      "{s.comment}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="glass rounded-3xl p-6 border border-border bg-card mb-8 shadow-sm">
        <h2 className="text-xl font-bold tracking-tight mb-5 text-foreground">Quick Access</h2>
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${hasClassFeedAccess ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-4`}>
          <Link to="/tutor" search={EMPTY_TUTOR_SEARCH} className="group rounded-2xl border border-border bg-card px-4 py-4 hover:border-primary hover:bg-secondary/40 transition-all shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors"><Brain className="w-4 h-4 text-primary" /> AI Tutor</div>
          </Link>
          <Link to="/formula-lab/$topic" params={{ topic: "new" }} className="group rounded-2xl border border-border bg-card px-4 py-4 hover:border-primary hover:bg-secondary/40 transition-all shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors"><Atom className="w-4 h-4 text-primary" /> Formula Lab</div>
          </Link>
          <Link to="/sandbox/$simulationId" params={{ simulationId: "new" }} className="group rounded-2xl border border-border bg-card px-4 py-4 hover:border-primary hover:bg-secondary/40 transition-all shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors"><FlaskConical className="w-4 h-4 text-primary" /> Simulations</div>
          </Link>
          {hasClassFeedAccess && (
            <Link to="/class-feed" className="group rounded-2xl border border-border bg-card px-4 py-4 hover:border-primary hover:bg-secondary/40 transition-all shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors"><MessageSquare className="w-4 h-4 text-primary" /> Class Feed</div>
            </Link>
          )}
          <Link to="/profile" className="group rounded-2xl border border-border bg-card px-4 py-4 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground group-hover:text-amber-600 transition-colors"><User className="w-4 h-4 text-amber-500" /> Profile</div>
          </Link>
        </div>
      </section>

      {/* Main Grid */}
      <div className="mb-10 space-y-8">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Interactive Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* AI Tutor Card */}
            <Link to="/tutor" search={EMPTY_TUTOR_SEARCH}>
              <div className="group h-full glass rounded-3xl p-6 border border-border bg-card hover:border-primary/45 hover:bg-secondary/20 transition-all duration-300 relative overflow-hidden flex flex-col justify-between shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full blur-2xl group-hover:bg-primary/10 transition-all duration-500" />
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Brain className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
                    AI Tutor
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Have questions about physics? Chat with our intelligent assistant to learn via interactive discussions.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-primary font-bold group-hover:translate-x-1.5 transition-transform">
                  Start Chatting <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>

            {/* Formula Lab Card */}
            <Link to="/formula-lab/$topic" params={{ topic: "new" }}>
              <div className="group h-full glass rounded-3xl p-6 border border-border bg-card hover:border-primary/45 hover:bg-secondary/20 transition-all duration-300 relative overflow-hidden flex flex-col justify-between shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full blur-2xl group-hover:bg-primary/10 transition-all duration-500" />
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Atom className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors">Formula Lab</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Experiment with physics variables and see how constants change parameters, plots, and motion equations instantly.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-primary font-bold group-hover:translate-x-1.5 transition-transform">
                  Explore Formulas <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>



            {/* AI Generator Card */}
            <Link to="/sandbox/$simulationId" params={{ simulationId: "new" }}>
              <div className="group h-full glass rounded-3xl p-6 border border-border bg-card hover:border-primary/45 hover:bg-secondary/20 transition-all duration-300 relative overflow-hidden flex flex-col justify-between shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500" />
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Compass className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-amber-600 transition-colors">AI Simulation Builder</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Describe a physics concept, and the Educational Intelligence synthesis engine will dynamically build a custom simulation.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold group-hover:translate-x-1.5 transition-transform">
                  Synthesize Simulation <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>

          </div>
      </div>

      {/* Curriculum Class Selector Section */}
      <section className="mt-6">
        <h2 className="text-2xl font-bold mb-6 tracking-tight font-sans text-foreground">Explore Curriculum</h2>
        {isLoading ? (
          <div className="text-muted-foreground p-4">Loading curriculum...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {classes.map((c, i) => (
              <Link key={c.id} to="/subjects/$classId" params={{ classId: String(c.id) }}>
                <Card delay={i * 0.04} className="border border-border bg-card shadow-sm hover:border-primary/50">
                  <div className="text-xs text-primary font-mono font-bold mb-2">CLASS</div>
                  <div className="text-3xl font-extrabold text-foreground mb-2">{c.id}</div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                  <div className="mt-3 text-xs text-muted-foreground font-semibold">View Subjects</div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      </PageWrapper>
    </ProtectedRoute>
  );
}
