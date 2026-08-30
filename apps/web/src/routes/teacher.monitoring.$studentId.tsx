import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code,
  Layers,
  HelpCircle,
  Play,
  CheckCircle,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface Event {
  id: string;
  student_id: string;
  module_id: string;
  module_title: string;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

interface StudentInfo {
  name: string;
  email: string;
  class_id: string;
}

function StudentActivityLogPage() {
  const { studentId } = useParams({ from: "/teacher/monitoring/$studentId" });
  const [events, setEvents] = useState<Event[]>([]);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("teacher_token") : null;
    if (!token) return;

    fetch(`${API_BASE}/api/class/students`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((list) => {
        if (list) {
          const info = list.find((s: { id: string; name: string; email: string; class_id: string }) => s.id === studentId);
          if (info) setStudentInfo(info);
        }
      })
      .catch((err) => console.error("Failed to load student profile:", err));
  }, [studentId]);

  const fetchLogs = useCallback(async (currentPage: number) => {
    setLoading(true);
    setErrorMsg("");
    const token = typeof window !== "undefined" ? localStorage.getItem("teacher_token") : null;

    if (!token) {
      setErrorMsg("No auth token found. Please authenticate first.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/class/students/${studentId}/events?page=${currentPage}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("You are not authorized to view this student's activity logs.");
        }
        throw new Error(`Failed to load activity logs (${res.status})`);
      }

      const data = await res.json();
      setEvents(data.events || []);
      setTotal(data.total || 0);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred while loading activity logs.");
    } finally {
      setLoading(false);
    }
  }, [studentId, limit]);

  useEffect(() => {
    fetchLogs(page);
  }, [page, fetchLogs]);

  const totalPages = Math.ceil(total / limit) || 1;

  const getEventBadge = (type: string) => {
    switch (type) {
      case "started":
        return { bg: "bg-green-500/10 text-green-400 border-green-500/20", icon: <Play className="w-3.5 h-3.5 text-green-400" />, label: "Started Module" };
      case "answered":
        return { bg: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: <CheckCircle className="w-3.5 h-3.5 text-blue-400" />, label: "Answered Quiz" };
      case "completed":
        return { bg: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: <Layers className="w-3.5 h-3.5 text-purple-400" />, label: "Completed Module" };
      case "asked_tutor":
        return { bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: <MessageSquare className="w-3.5 h-3.5 text-amber-400" />, label: "Asked AI Tutor" };
      default:
        return { bg: "bg-secondary text-foreground border-border", icon: <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />, label: type };
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <Link
          to="/teacher/monitoring"
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Live Monitor
        </Link>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full blur-xl pointer-events-none" />
        <div className="space-y-1 z-10">
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Student Profile</span>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{studentInfo?.name || "Student Log"}</h1>
          <p className="text-sm text-muted-foreground font-mono">{studentInfo?.email}</p>
        </div>
        <div className="text-xs text-muted-foreground space-y-1 font-mono">
          <div>STUDENT UUID: {studentId}</div>
          <div>CLASS GROUP: {studentInfo?.class_id || "Classroom"}</div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
          <div className="font-bold mb-1">Error Loading Logs</div>
          {errorMsg}
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-foreground text-base">Activity Feed</h2>
            <span className="text-xs text-muted-foreground font-semibold">Showing {events.length} of {total} events</span>
          </div>

          <div className="divide-y divide-border">
            {events.map((e) => {
              const badge = getEventBadge(e.event_type);
              const isExpanded = expandedEventId === e.id;

              return (
                <div key={e.id} className="p-5 hover:bg-secondary/20 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">{badge.icon}</div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="font-bold text-sm text-foreground">{e.module_title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                          {typeof e.payload?.question === "string"
                            ? e.payload.question
                            : typeof e.payload?.scenario === "string"
                            ? e.payload.scenario
                            : typeof e.payload?.action === "string"
                            ? e.payload.action
                            : "Performed learning action"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(e.created_at).toLocaleString()}
                      </div>
                      <button
                        onClick={() => setExpandedEventId(isExpanded ? null : e.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-border bg-card hover:bg-secondary font-bold rounded-lg shadow-sm transition-colors text-foreground cursor-pointer"
                      >
                        <Code className="w-3 h-3" />
                        {isExpanded ? "Hide Payload" : "Inspect"}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 p-4 bg-black rounded-xl font-mono text-xs text-green-400 overflow-x-auto border border-border shadow-inner">
                      <pre>{JSON.stringify(e.payload, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="p-4 bg-secondary/20 border-t border-border flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border bg-card hover:bg-secondary disabled:opacity-50 text-foreground font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-xs text-muted-foreground font-semibold">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border bg-card hover:bg-secondary disabled:opacity-50 text-foreground font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-semibold">Loading student history logs...</p>
        </div>
      )}

      {!loading && events.length === 0 && !errorMsg && (
        <div className="flex flex-col items-center justify-center border border-border border-dashed rounded-3xl p-12 text-center bg-card max-w-md mx-auto">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-sm font-bold text-foreground mb-1">No Activity Logs</h3>
          <p className="text-xs text-muted-foreground">This student has not emitted any interactive session events yet.</p>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/teacher/monitoring/$studentId")({
  component: StudentActivityLogPage,
});
