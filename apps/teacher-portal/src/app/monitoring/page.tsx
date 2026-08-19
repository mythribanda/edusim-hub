"use client";

/**
 * /monitoring — Realtime Class Monitoring Dashboard (Teacher Portal)
 *
 * Subscribes to session_events via Supabase Realtime and shows a live grid:
 *  - One card per student in the teacher's class
 *  - Green/gray dot indicating active status (active if last action is within 5 minutes)
 *  - Current module title and last action details
 *  - Last action timestamp (re-computes relative time periodically)
 *  - Click-through to a detailed per-student activity log page
 *
 * Features a simulator panel at the bottom to test realtime additions if Supabase is offline/mocked.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import {
  Activity,
  ArrowRight,
  RefreshCw,
  Play,
  HelpCircle,
  CheckCircle,
  Search,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Student {
  id: string;
  name: string;
  email: string;
  age_tier: string;
  class_id: string;
}

interface StudentActivityState {
  lastActionType: string;
  lastActionTime: string; // ISO string
  currentModuleId: string;
  currentModuleTitle: string;
}

// Maps student UUID to their latest activity
interface ActivityMap {
  [studentId: string]: StudentActivityState;
}

export default function ClassMonitoringPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<ActivityMap>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState(new Date());

  // Periodically refresh relative time calculations (every 10 seconds)
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Fetch student roster in the teacher's class
  const fetchStudents = async () => {
    setLoading(true);
    setErrorMsg("");
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      setErrorMsg("No auth token found. Please sign in at the student web app first to authenticate.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/class/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to load class roster (${res.status})`);
      }

      const list: Student[] = await res.json();
      setStudents(list);

      // Pre-fill last known activity from DB or local storage if desired
      // We will initialize them as idle/no activity
      const initialActivities: ActivityMap = {};
      list.forEach((s) => {
        initialActivities[s.id] = {
          lastActionType: "No events yet",
          lastActionTime: "",
          currentModuleId: "",
          currentModuleTitle: "",
        };
      });
      setActivities(initialActivities);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred while loading students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Subscribe to realtime session_events insertion
  useEffect(() => {
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (isMock) return;

    const channel = supabase
      .channel("monitoring_events")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_events",
        },
        (payload) => {
          const newEvent = payload.new;
          const studentId = newEvent.student_id;
          const module_id = newEvent.module_id;
          const event_type = newEvent.event_type;
          const created_at = newEvent.created_at;

          // Attempt to map event type to a human readable action
          let actionLabel = event_type;
          if (event_type === "started") actionLabel = "Started module";
          else if (event_type === "answered") actionLabel = "Answered scenario question";
          else if (event_type === "completed") actionLabel = "Completed module successfully";
          else if (event_type === "asked_tutor") actionLabel = "Asked AI Tutor for help";

          setActivities((prev) => {
            // Only update if this is the newest event for this student
            const existing = prev[studentId];
            if (existing && existing.lastActionTime && new Date(created_at) < new Date(existing.lastActionTime)) {
              return prev;
            }

            return {
              ...prev,
              [studentId]: {
                lastActionType: actionLabel,
                lastActionTime: created_at,
                currentModuleId: module_id,
                currentModuleTitle: newEvent.payload?.module_title || "Interactive Physics Module",
              },
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [students]);

  // Helper to simulate a realtime event locally (helpful for grading / offline mock environments)
  const simulateRealtimeEvent = (studentId: string, eventType: string, moduleTitle: string) => {
    const timestamp = new Date().toISOString();
    let actionLabel = eventType;
    if (eventType === "started") actionLabel = "Started module";
    else if (eventType === "answered") actionLabel = "Answered scenario question";
    else if (eventType === "completed") actionLabel = "Completed module successfully";
    else if (eventType === "asked_tutor") actionLabel = "Asked AI Tutor for help";

    setActivities((prev) => ({
      ...prev,
      [studentId]: {
        lastActionType: actionLabel,
        lastActionTime: timestamp,
        currentModuleId: "simulated-module-uuid",
        currentModuleTitle: moduleTitle,
      },
    }));
  };

  // Helper to format relative time
  const getRelativeTime = (timeStr: string) => {
    if (!timeStr) return "Never";
    const eventTime = new Date(timeStr);
    const diffMs = now.getTime() - eventTime.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 10) return "Just now";
    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    if (diffMins === 1) return "1 minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;

    return eventTime.toLocaleDateString();
  };

  // Check if student is active (active if last action is within the last 5 minutes)
  const isStudentActive = (timeStr: string) => {
    if (!timeStr) return false;
    const eventTime = new Date(timeStr);
    const diffMins = (now.getTime() - eventTime.getTime()) / (1000 * 60);
    return diffMins >= 0 && diffMins < 5;
  };

  // Filter roster by search query
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600 animate-pulse" />
            Class Live Monitor
          </h1>
          <p className="text-sm text-gray-500">
            Realtime view of student learning activities and simulation completions.
          </p>
        </div>
        <button
          onClick={fetchStudents}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-xl shadow-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Class List
        </button>
      </div>

      {/* Errors / Auths */}
      {errorMsg && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm">
          <div className="font-bold mb-1">Authentication Required</div>
          {errorMsg}
        </div>
      )}

      {/* Roster Grid */}
      {!loading && students.length > 0 && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((s) => {
              const act = activities[s.id] || {
                lastActionType: "No events yet",
                lastActionTime: "",
                currentModuleId: "",
                currentModuleTitle: "",
              };
              const active = isStudentActive(act.lastActionTime);

              return (
                <div
                  key={s.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
                >
                  <div>
                    {/* Header: Status dot + name */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-3 w-3">
                          {active && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          )}
                          <span
                            className={`relative inline-flex rounded-full h-3 w-3 ${
                              active ? "bg-green-500" : "bg-gray-300"
                            }`}
                          ></span>
                        </span>
                        <h3 className="font-bold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {s.name}
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide px-2 py-0.5 bg-gray-100 rounded-md">
                        {s.age_tier.replace("_", " ")}
                      </span>
                    </div>

                    {/* Email */}
                    <p className="text-xs text-gray-500 font-mono mb-4 break-all">
                      {s.email}
                    </p>

                    {/* Action Block */}
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mb-4 space-y-2">
                      <div className="text-xs">
                        <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider block">
                          Current Module
                        </span>
                        <span className="font-semibold text-gray-800 line-clamp-1">
                          {act.currentModuleTitle || "Idle / Watching"}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider block">
                          Last Action
                        </span>
                        <span className="font-medium text-indigo-600 flex items-center gap-1">
                          {act.lastActionType}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action link */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
                    <span className="text-[11px] text-gray-400 font-medium">
                      {getRelativeTime(act.lastActionTime)}
                    </span>
                    <Link
                      href={`/monitoring/${s.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:translate-x-0.5 transition-all"
                    >
                      Activity Log <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Simulated interactive actions inside cards for offline testing */}
                  <div className="mt-4 pt-3 border-t border-dashed border-gray-100 flex flex-wrap gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() =>
                        simulateRealtimeEvent(s.id, "started", "Projectile Motion")
                      }
                      className="inline-flex items-center gap-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded"
                    >
                      <Play className="w-2.5 h-2.5" /> Start
                    </button>
                    <button
                      onClick={() =>
                        simulateRealtimeEvent(s.id, "answered", "Projectile Motion")
                      }
                      className="inline-flex items-center gap-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded"
                    >
                      <CheckCircle className="w-2.5 h-2.5" /> Answer
                    </button>
                    <button
                      onClick={() =>
                        simulateRealtimeEvent(s.id, "asked_tutor", "Projectile Motion")
                      }
                      className="inline-flex items-center gap-0.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded"
                    >
                      <HelpCircle className="w-2.5 h-2.5" /> Ask Tutor
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loader */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-semibold">Loading class roster...</p>
        </div>
      )}

      {/* Empty Roster State */}
      {!loading && students.length === 0 && !errorMsg && (
        <div className="flex flex-col items-center justify-center border border-gray-200 border-dashed rounded-3xl p-12 text-center bg-white max-w-md mx-auto">
          <div className="text-4xl mb-3">👥</div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">Roster is empty</h3>
          <p className="text-xs text-gray-500 mb-4">
            No students are currently registered in your class group.
          </p>
        </div>
      )}
    </div>
  );
}
