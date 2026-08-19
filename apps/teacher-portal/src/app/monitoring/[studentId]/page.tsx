"use client";

/**
 * /monitoring/[studentId] — Detailed Student Activity Log
 *
 * Displays a paginated list of session events for a specific student.
 * Shows event types, payloads, timestamps, and module names.
 */

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";


interface Event {
  id: string;
  student_id: string;
  module_id: string;
  module_title: string;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}

interface PageProps {
  params: {
    studentId: string;
  };
}

interface StudentInfo {
  name: string;
  email: string;
  class_id: string;
}

export default function StudentActivityLogPage({ params }: PageProps) {
  const { studentId } = params;
  const [events, setEvents] = useState<Event[]>([]);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Fetch student roster info once on mount to map the name/email
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    fetch(`${API_BASE}/api/class/students`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((list) => {
        if (list) {
          const info = list.find((s: { id: string; name: string; email: string; class_id: string }) => s.id === studentId);
          if (info) {
            setStudentInfo(info);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load student profile:", err);
      });
  }, [studentId]);

  const fetchLogs = useCallback(async (currentPage: number) => {
    setLoading(true);
    setErrorMsg("");
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      setErrorMsg("No auth token found. Please authenticate first.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/class/students/${studentId}/events?page=${currentPage}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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

  // Map event type to a badge style
  const getEventBadge = (type: string) => {
    switch (type) {
      case "started":
        return {
          bg: "bg-green-50 text-green-700 border-green-200",
          icon: <Play className="w-3.5 h-3.5 text-green-600" />,
          label: "Started Module",
        };
      case "answered":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          icon: <CheckCircle className="w-3.5 h-3.5 text-blue-600" />,
          label: "Answered Quiz",
        };
      case "completed":
        return {
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          icon: <Layers className="w-3.5 h-3.5 text-purple-600" />,
          label: "Completed Module",
        };
      case "asked_tutor":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          icon: <MessageSquare className="w-3.5 h-3.5 text-amber-600" />,
          label: "Asked AI Tutor",
        };
      default:
        return {
          bg: "bg-gray-50 text-gray-700 border-gray-200",
          icon: <HelpCircle className="w-3.5 h-3.5 text-gray-600" />,
          label: type,
        };
    }
  };

  const toggleExpandEvent = (eventId: string) => {
    setExpandedEventId((prev) => (prev === eventId ? null : eventId));
  };

  return (
    <div className="space-y-8">
      {/* Back link */}
      <div>
        <Link
          href="/monitoring"
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Live Monitor
        </Link>
      </div>

      {/* Roster student info */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full blur-xl pointer-events-none" />
        <div className="space-y-1 z-10">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">
            Student Profile
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {studentInfo?.name || "Student Log"}
          </h1>
          <p className="text-sm text-gray-500 font-mono">{studentInfo?.email}</p>
        </div>
        <div className="text-xs text-gray-400 space-y-1 font-mono">
          <div>STUDENT UUID: {studentId}</div>
          <div>CLASS GROUP: {studentInfo?.class_id || "Classroom"}</div>
        </div>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-sm">
          <div className="font-bold mb-1">⚠️ Error Loading Logs</div>
          {errorMsg}
        </div>
      )}

      {/* Log Feed */}
      {!loading && events.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-base">Activity Feed</h2>
            <span className="text-xs text-gray-500 font-semibold">
              Showing {events.length} of {total} events
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {events.map((e) => {
              const badge = getEventBadge(e.event_type);
              const isExpanded = expandedEventId === e.id;

              return (
                <div key={e.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">{badge.icon}</div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="font-bold text-sm text-gray-900">
                            {e.module_title}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 font-medium">
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
                      {/* Timestamp */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(e.created_at).toLocaleString()}
                      </div>

                      {/* Expand details button */}
                      <button
                        onClick={() => toggleExpandEvent(e.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-gray-200 bg-white hover:bg-gray-50 font-bold rounded-lg shadow-sm transition-colors text-gray-600"
                      >
                        <Code className="w-3 h-3" />
                        {isExpanded ? "Hide Payload" : "Inspect"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded JSON payload details */}
                  {isExpanded && (
                    <div className="mt-4 p-4 bg-gray-900 rounded-xl font-mono text-xs text-green-400 overflow-x-auto border border-gray-800 shadow-inner">
                      <pre>{JSON.stringify(e.payload, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-bold text-xs rounded-xl shadow-sm transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-xs text-gray-500 font-semibold">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-bold text-xs rounded-xl shadow-sm transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-semibold">Loading student history logs...</p>
        </div>
      )}

      {/* Empty history state */}
      {!loading && events.length === 0 && !errorMsg && (
        <div className="flex flex-col items-center justify-center border border-gray-200 border-dashed rounded-3xl p-12 text-center bg-white max-w-md mx-auto">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">No Activity Logs</h3>
          <p className="text-xs text-gray-500">
            This student has not emitted any interactive session events yet.
          </p>
        </div>
      )}
    </div>
  );
}
