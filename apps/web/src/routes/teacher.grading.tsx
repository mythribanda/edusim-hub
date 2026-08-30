import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import {
  ClipboardCheck,
  RefreshCw,
  FolderOpen,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface Assignment {
  assignment_id: string;
  module_id: string;
  class_id: string;
  due_date: string | null;
  created_at: string;
}

interface AssignmentStats extends Assignment {
  moduleTitle: string;
  totalSubmissions: number;
  ungradedCount: number;
}

function GradingOverviewPage() {
  const [assignments, setAssignments] = useState<AssignmentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg("");
    const token = typeof window !== "undefined" ? localStorage.getItem("teacher_token") : null;

    if (!token) {
      setErrorMsg("No auth token found. Please sign in first.");
      setLoading(false);
      return;
    }

    try {
      const modulesRes = await fetch(`${API_BASE}/api/modules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const moduleMap: Record<string, string> = {};
      if (modulesRes.ok) {
        const modulesData = await modulesRes.json();
        const list = modulesData.modules ?? [];
        list.forEach((m: { id: string; title: string }) => {
          moduleMap[m.id] = m.title;
        });
      }

      const assignmentsRes = await fetch(`${API_BASE}/api/assignments/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!assignmentsRes.ok) {
        throw new Error(`Failed to load assignments (${assignmentsRes.status})`);
      }
      const assignmentsData = await assignmentsRes.json();
      const rawAssignments: Assignment[] = assignmentsData.assignments ?? [];

      let statsList: AssignmentStats[] = [];

      if (rawAssignments.length > 0) {
        const assignmentIds = rawAssignments.map((a) => a.assignment_id).join(",");
        const batchRes = await fetch(
          `${API_BASE}/api/assignments/submissions?assignment_ids=${encodeURIComponent(assignmentIds)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (batchRes.ok) {
          const batchData = await batchRes.json();
          const batchMap = batchData.submissions ?? {};
          statsList = rawAssignments.map((a) => {
            const batchInfo = batchMap[a.assignment_id] ?? {};
            const submissions = batchInfo.submissions ?? [];
            const totalSubmissions = submissions.length;
            const ungradedCount = submissions.filter((s: { graded_at: string | null }) => !s.graded_at).length;
            return {
              ...a,
              moduleTitle: moduleMap[a.module_id] || batchInfo.module_title || "Interactive Physics Module",
              totalSubmissions,
              ungradedCount,
            };
          });
        } else {
          throw new Error(`Failed to load batch submissions (${batchRes.status})`);
        }
      }

      setAssignments(statsList);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred while loading assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-primary" />
            Grading Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Review student submissions, assign scores, and submit comments.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-secondary text-foreground font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Assignments
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 text-sm">
          <div className="font-bold mb-1">Authentication Required</div>
          {errorMsg}
        </div>
      )}

      {!loading && assignments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((a) => {
            const hasUngraded = a.ungradedCount > 0;
            return (
              <div
                key={a.assignment_id}
                className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                        {a.moduleTitle}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono">
                        CLASS ID: {a.class_id}
                      </p>
                    </div>
                    {hasUngraded ? (
                      <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {a.ungradedCount} Ungraded
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                        All Graded
                      </span>
                    )}
                  </div>

                  <div className="bg-secondary/35 rounded-xl p-4 border border-border/10 mb-4 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground font-bold uppercase text-[9px] tracking-wider block">
                        Submissions
                      </span>
                      <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                        <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                        {a.totalSubmissions} total
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-bold uppercase text-[9px] tracking-wider block">
                        Due Date
                      </span>
                      <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {a.due_date ? new Date(a.due_date).toLocaleDateString() : "No due date"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/10 mt-2">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ASSIGNMENT ID: {a.assignment_id.slice(0, 8)}...
                  </span>
                  <Link
                    to="/teacher/grading/$assignmentId"
                    params={{ assignmentId: a.assignment_id }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 hover:translate-x-0.5 transition-all"
                  >
                    Grade Submissions <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-semibold">Loading assignments...</p>
        </div>
      )}

      {!loading && assignments.length === 0 && !errorMsg && (
        <div className="flex flex-col items-center justify-center border border-border border-dashed rounded-3xl p-12 text-center bg-card max-w-md mx-auto">
          <FolderOpen className="w-12 h-12 text-muted-foreground mb-3" />
          <h3 className="text-sm font-bold text-foreground mb-1">No assignments created yet</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Create your first class assignment using the module builder form.
          </p>
          <Link
            to="/teacher/assignments"
            className="inline-flex items-center gap-1 px-4 py-2 border border-transparent bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            Create Assignment
          </Link>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/teacher/grading")({
  component: GradingOverviewPage,
});
