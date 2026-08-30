import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  RefreshCw,
  Clock,
  Layers,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  HelpCircle,
  FileCode,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface Submission {
  submission_id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  answers: Record<string, unknown>;
  score: number | null;
  comment: string | null;
  completed_at: string | null;
  graded_at: string | null;
}

function AssignmentGradingPage() {
  const { assignmentId } = useParams({ from: "/teacher/grading/$assignmentId" });
  const [moduleTitle, setModuleTitle] = useState("Interactive Physics Module");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filterType, setFilterType] = useState<"all" | "ungraded" | "graded">("ungraded");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingIds, setSubmittingIds] = useState<Record<string, boolean>>({});

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    const token = typeof window !== "undefined" ? localStorage.getItem("teacher_token") : null;

    if (!token) {
      setErrorMsg("No auth token found. Please authenticate first.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/assignments/${assignmentId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to load submissions (${res.status})`);
      }
      const data = await res.json();
      setModuleTitle(data.module_title || "Interactive Physics Module");
      const list: Submission[] = data.submissions ?? [];
      setSubmissions(list);

      const scores: Record<string, string> = {};
      const comments: Record<string, string> = {};
      list.forEach((s) => {
        scores[s.submission_id] = s.score !== null ? String(s.score) : "0";
        comments[s.submission_id] = s.comment ?? "";
      });
      setScoreInputs(scores);
      setCommentInputs(comments);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleSaveGrade = async (subId: string) => {
    const scoreStr = scoreInputs[subId];
    const commentStr = commentInputs[subId];
    const score = parseFloat(scoreStr);

    if (isNaN(score)) {
      alert("Please enter a valid numeric score.");
      return;
    }

    setSubmittingIds((prev) => ({ ...prev, [subId]: true }));
    const token = typeof window !== "undefined" ? localStorage.getItem("teacher_token") : null;

    try {
      const res = await fetch(`${API_BASE}/api/submissions/${subId}/grade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ score, comment: commentStr.trim() || null }),
      });

      if (!res.ok) {
        throw new Error(`Grading failed (${res.status})`);
      }

      const updated = await res.json();
      setSubmissions((prev) =>
        prev.map((s) =>
          s.submission_id === subId
            ? { ...s, score: updated.score, comment: updated.comment, graded_at: updated.graded_at }
            : s
        )
      );
      setExpandedId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to grade submission.");
    } finally {
      setSubmittingIds((prev) => ({ ...prev, [subId]: false }));
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (filterType === "ungraded") return !s.graded_at;
    if (filterType === "graded") return !!s.graded_at;
    return true;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <Link
          to="/teacher/grading"
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Grading Center
        </Link>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full blur-xl pointer-events-none" />
        <div className="space-y-1 z-10">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">
            Assignment Submissions Review
          </span>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {moduleTitle}
          </h1>
          <p className="text-xs text-muted-foreground font-mono">
            ASSIGNMENT UUID: {assignmentId}
          </p>
        </div>
        <button
          onClick={fetchSubmissions}
          className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-secondary text-foreground font-semibold text-xs rounded-xl shadow-sm transition-colors z-10 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Submissions
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
          <div className="font-bold mb-1">Error Loading Submissions</div>
          {errorMsg}
        </div>
      )}

      {!loading && submissions.length > 0 && (
        <div className="flex items-center justify-between border-b border-border pb-2">
          <div className="flex gap-2">
            {(["ungraded", "graded", "all"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-all capitalize cursor-pointer ${
                  filterType === type
                    ? "bg-primary/10 text-primary border-primary/30 shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:bg-secondary"
                }`}
              >
                {type} (
                {type === "ungraded"
                  ? submissions.filter((s) => !s.graded_at).length
                  : type === "graded"
                  ? submissions.filter((s) => !!s.graded_at).length
                  : submissions.length}
                )
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && filteredSubmissions.length > 0 && (
        <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden divide-y divide-border">
          {filteredSubmissions.map((s) => {
            const isExpanded = expandedId === s.submission_id;
            const isSubmitting = submittingIds[s.submission_id] || false;
            const scoreVal = scoreInputs[s.submission_id] ?? "";
            const commentVal = commentInputs[s.submission_id] ?? "";

            return (
              <div key={s.submission_id} className="p-5 hover:bg-secondary/20 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 shrink-0">
                      <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{s.student_name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{s.student_email}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      {s.graded_at ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          <CheckCircle className="w-2.5 h-2.5" /> Graded: {s.score}/100
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <HelpCircle className="w-2.5 h-2.5 animate-pulse" /> Awaiting Grade
                        </span>
                      )}
                      <span className="block text-[10px] text-muted-foreground mt-1 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {s.completed_at ? new Date(s.completed_at).toLocaleString() : "Unknown"}
                      </span>
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : s.submission_id)}
                      className="inline-flex items-center gap-0.5 px-3 py-1.5 border border-border bg-card hover:bg-secondary text-foreground font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                    >
                      {isExpanded ? (
                        <>Close <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <>Grade / Inspect <ChevronDown className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-5 pt-5 border-t border-dashed border-border grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-foreground flex items-center gap-1">
                        <FileCode className="w-4 h-4 text-muted-foreground" />
                        Student Answers & Payload
                      </div>
                      <div className="p-4 bg-black rounded-xl font-mono text-[11px] text-green-400 overflow-x-auto max-h-64 border border-border shadow-inner">
                        <pre>{JSON.stringify(s.answers, null, 2)}</pre>
                      </div>
                    </div>

                    <div className="space-y-4 bg-secondary/20 rounded-2xl p-5 border border-border/10 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="text-xs font-bold text-foreground">Assign Final Grade</div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                            Score (0 - 100)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={scoreVal}
                            onChange={(e) =>
                              setScoreInputs((prev) => ({ ...prev, [s.submission_id]: e.target.value }))
                            }
                            className="w-full max-w-xs px-3 py-2 border border-border rounded-xl text-sm bg-background focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                            Feedback Comment
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Write constructive feedback for the student..."
                            value={commentVal}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({ ...prev, [s.submission_id]: e.target.value }))
                            }
                            className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-end pt-3 border-t border-border/10 mt-4">
                        <button
                          onClick={() => setExpandedId(null)}
                          className="px-3.5 py-2 border border-border hover:bg-secondary text-foreground font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveGrade(s.submission_id)}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 px-4 py-2 border border-transparent bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                        >
                          {isSubmitting ? (
                            <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                          ) : (
                            "Save Grade"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-semibold">Loading student submissions...</p>
        </div>
      )}

      {!loading && filteredSubmissions.length === 0 && (
        <div className="flex flex-col items-center justify-center border border-border border-dashed rounded-3xl p-12 text-center bg-card max-w-md mx-auto">
          <Layers className="w-12 h-12 text-muted-foreground mb-3" />
          <h3 className="text-sm font-bold text-foreground mb-1">No submissions found</h3>
          <p className="text-xs text-muted-foreground">
            {filterType === "ungraded"
              ? "There are no ungraded submissions for this assignment."
              : filterType === "graded"
              ? "No submissions have been graded yet."
              : "No students have submitted this assignment yet."}
          </p>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/teacher/grading/$assignmentId")({
  component: AssignmentGradingPage,
});
