import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  ArrowRight,
  RefreshCw,
  Play,
  HelpCircle,
  CheckCircle,
  Search,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface Student {
  id: string;
  name: string;
  email: string;
  age_tier: string;
  class_id: string;
}

interface StudentActivityState {
  lastActionType: string;
  lastActionTime: string;
  currentModuleId: string;
  currentModuleTitle: string;
}

interface ActivityMap {
  [studentId: string]: StudentActivityState;
}

function ClassMonitoringPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<ActivityMap>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setErrorMsg("");
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      setErrorMsg("No auth token found. Please sign in first.");
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

  useEffect(() => {
    const isMock = !import.meta.env.VITE_SUPABASE_URL;
    if (isMock) return;

    const channel = supabase
      .channel("monitoring_events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "session_events" },
        (payload) => {
          const newEvent = payload.new as any;
          const studentId = newEvent.student_id;
          const module_id = newEvent.module_id;
          const event_type = newEvent.event_type;
          const created_at = newEvent.created_at;

          let actionLabel = event_type;
          if (event_type === "started") actionLabel = "Started module";
          else if (event_type === "answered") actionLabel = "Answered scenario question";
          else if (event_type === "completed") actionLabel = "Completed module successfully";
          else if (event_type === "asked_tutor") actionLabel = "Asked AI Tutor for help";

          setActivities((prev) => {
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

  const isStudentActive = (timeStr: string) => {
    if (!timeStr) return false;
    const eventTime = new Date(timeStr);
    const diffMins = (now.getTime() - eventTime.getTime()) / (1000 * 60);
    return diffMins >= 0 && diffMins < 5;
  };

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary animate-pulse" />
            Class Live Monitor
          </h1>
          <p className="text-sm text-muted-foreground">
            Realtime view of student learning activities and simulation completions.
          </p>
        </div>
        <button
          onClick={fetchStudents}
          className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-secondary text-foreground font-semibold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Class List
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 text-sm">
          <div className="font-bold mb-1">Authentication Required</div>
          {errorMsg}
        </div>
      )}

      {!loading && students.length > 0 && (
        <div className="space-y-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
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
                  className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-3 w-3">
                          {active && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          )}
                          <span
                            className={`relative inline-flex rounded-full h-3 w-3 ${active ? "bg-green-500" : "bg-muted-foreground/30"}`}
                          ></span>
                        </span>
                        <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                          {s.name}
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide px-2 py-0.5 bg-secondary rounded-md">
                        {s.age_tier.replace("_", " ")}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground font-mono mb-4 break-all">
                      {s.email}
                    </p>

                    <div className="bg-secondary/20 rounded-xl p-3 border border-border/10 mb-4 space-y-2">
                      <div className="text-xs">
                        <span className="text-muted-foreground font-bold uppercase text-[9px] tracking-wider block">
                          Current Module
                        </span>
                        <span className="font-semibold text-foreground line-clamp-1">
                          {act.currentModuleTitle || "Idle / Watching"}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-muted-foreground font-bold uppercase text-[9px] tracking-wider block">
                          Last Action
                        </span>
                        <span className="font-medium text-primary flex items-center gap-1">
                          {act.lastActionType}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/10 mt-2">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {getRelativeTime(act.lastActionTime)}
                    </span>
                    <Link
                      to="/teacher/monitoring/$studentId"
                      params={{ studentId: s.id }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 hover:translate-x-0.5 transition-all"
                    >
                      Activity Log <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="mt-4 pt-3 border-t border-dashed border-border/10 flex flex-wrap gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => simulateRealtimeEvent(s.id, "started", "Projectile Motion")}
                      className="inline-flex items-center gap-0.5 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      <Play className="w-2.5 h-2.5" /> Start
                    </button>
                    <button
                      onClick={() => simulateRealtimeEvent(s.id, "answered", "Projectile Motion")}
                      className="inline-flex items-center gap-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      <CheckCircle className="w-2.5 h-2.5" /> Answer
                    </button>
                    <button
                      onClick={() => simulateRealtimeEvent(s.id, "asked_tutor", "Projectile Motion")}
                      className="inline-flex items-center gap-0.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
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

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-semibold">Loading class roster...</p>
        </div>
      )}

      {!loading && students.length === 0 && !errorMsg && (
        <div className="flex flex-col items-center justify-center border border-border border-dashed rounded-3xl p-12 text-center bg-card max-w-md mx-auto">
          <div className="text-4xl mb-3">👥</div>
          <h3 className="text-sm font-bold text-foreground mb-1">Roster is empty</h3>
          <p className="text-xs text-muted-foreground">
            No students are currently registered in your class group.
          </p>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/teacher/monitoring")({
  component: ClassMonitoringPage,
});
