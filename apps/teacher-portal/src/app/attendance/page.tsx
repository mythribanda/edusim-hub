"use client";

/**
 * /attendance — Attendance Marking Page (Teacher Portal)
 *
 * Features:
 *  - Date picker (defaults to today, future dates disabled)
 *  - Class roster loaded from GET /api/class/students
 *  - present / absent / late toggle per student (keyboard-friendly)
 *  - Optional subject field
 *  - "Save attendance" → POST /api/attendance/mark
 *  - Post-save summary: "X present, Y absent, Z late"
 *  - Edit mode: if today's attendance is already saved and the 2-hour
 *    window is still open, show an "Edit" button to re-enter the form.
 *    Once the window closes the UI shows a locked state.
 *
 * Auth: reads JWT from localStorage["token"] — same pattern as other pages.
 * API:  NEXT_PUBLIC_API_URL env var (default http://localhost:8000)
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Save,
  RefreshCw,
  Users,
  BookOpen,
  CalendarDays,
  Lock,
  Pencil,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── types ──────────────────────────────────────────────────────────────────

type AttendanceStatus = "present" | "absent" | "late";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface SavedRecord {
  student_id: string;
  status: AttendanceStatus;
  marked_by_name: string | null;
  created_at: string;
}

interface ForDateResponse {
  success: boolean;
  by_student: Record<string, SavedRecord>;
  can_edit: boolean;
}

type PageState = "idle" | "loading_roster" | "ready" | "saving" | "saved" | "error" | "locked";

// ── helpers ────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function isFutureDate(dateStr: string): boolean {
  return dateStr > todayISO();
}

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; icon: React.ReactNode; ring: string; bg: string; text: string }
> = {
  present: {
    label: "Present",
    icon: <CheckCircle2 className="w-4 h-4" />,
    ring: "ring-2 ring-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  absent: {
    label: "Absent",
    icon: <XCircle className="w-4 h-4" />,
    ring: "ring-2 ring-rose-500",
    bg: "bg-rose-50",
    text: "text-rose-700",
  },
  late: {
    label: "Late",
    icon: <AlertCircle className="w-4 h-4" />,
    ring: "ring-2 ring-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
};

// ── sub-components ─────────────────────────────────────────────────────────

function StatusToggle({
  value,
  onChange,
  disabled,
}: {
  value: AttendanceStatus;
  onChange: (s: AttendanceStatus) => void;
  disabled: boolean;
}) {
  const options: AttendanceStatus[] = ["present", "absent", "late"];
  return (
    <div className="flex gap-1.5">
      {options.map((s) => {
        const cfg = STATUS_CONFIG[s];
        const active = value === s;
        return (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onChange(s)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all
              ${active ? `${cfg.bg} ${cfg.text} ${cfg.ring} border-transparent` : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {cfg.icon}
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}

function SummaryBanner({
  counts,
  editMode,
}: {
  counts: Record<AttendanceStatus, number>;
  editMode: boolean;
}) {
  return (
    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
      <div className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4" />
        {editMode ? "Attendance updated!" : "Attendance saved!"}
      </div>
      <div className="flex gap-5 text-sm">
        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" /> {counts.present} present
        </span>
        <span className="flex items-center gap-1 text-rose-600 font-semibold">
          <XCircle className="w-3.5 h-3.5" /> {counts.absent} absent
        </span>
        <span className="flex items-center gap-1 text-amber-600 font-semibold">
          <AlertCircle className="w-3.5 h-3.5" /> {counts.late} late
        </span>
      </div>
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [subject, setSubject] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [pageState, setPageState] = useState<PageState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [savedCounts, setSavedCounts] = useState<Record<AttendanceStatus, number> | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isViewingExisting, setIsViewingExisting] = useState(false);
  const [classId, setClassId] = useState<string | null>(null);

  // ── load roster ────────────────────────────────────────────────────────
  const loadRoster = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setErrorMsg("No auth token. Please sign in at the student app first.");
      setPageState("error");
      return;
    }

    setPageState("loading_roster");
    setErrorMsg("");
    setSavedCounts(null);
    setIsViewingExisting(false);
    setIsEditMode(false);

    try {
      // 1. Fetch roster
      const rosterRes = await fetch(`${API_BASE}/api/class/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!rosterRes.ok) {
        const err = await rosterRes.json().catch(() => ({}));
        throw new Error(err.detail ?? `Failed to load roster (${rosterRes.status})`);
      }
      const roster: Student[] = await rosterRes.json();
      setStudents(roster);

      // 2. Determine class_id from the first student (all share the same class)
      //    We also need it for the mark endpoint — decode from JWT profile endpoint
      const meRes = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let teacherClassId: string | null = null;
      if (meRes.ok) {
        const me = await meRes.json();
        teacherClassId = me.class_id ?? null;
      }
      setClassId(teacherClassId);

      // 3. Default all students to "present"
      const defaultStatuses: Record<string, AttendanceStatus> = {};
      for (const s of roster) defaultStatuses[s.id] = "present";

      // 4. If date is today, check for already-saved records
      if (teacherClassId && selectedDate <= todayISO()) {
        const savedRes = await fetch(
          `${API_BASE}/api/attendance/for-date?class_id=${teacherClassId}&date=${selectedDate}${subject ? `&subject=${encodeURIComponent(subject)}` : ""}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (savedRes.ok) {
          const saved: ForDateResponse = await savedRes.json();
          // Overlay saved statuses
          for (const [sid, rec] of Object.entries(saved.by_student)) {
            if (defaultStatuses[sid] !== undefined) {
              defaultStatuses[sid] = rec.status;
            }
          }
          const hasSaved = Object.keys(saved.by_student).length > 0;
          setIsViewingExisting(hasSaved);

          if (hasSaved) {
            // Compute summary from saved data
            const counts: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0 };
            for (const rec of Object.values(saved.by_student)) counts[rec.status]++;
            setSavedCounts(counts);
            setPageState(saved.can_edit ? "saved" : "locked");
          } else {
            setPageState("ready");
          }
        } else {
          setPageState("ready");
        }
      } else {
        setPageState("ready");
      }

      setStatuses(defaultStatuses);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setPageState("error");
    }
  }, [selectedDate, subject]);

  // Load roster when date changes
  useEffect(() => {
    if (isFutureDate(selectedDate)) {
      setPageState("idle");
      setStudents([]);
      setStatuses({});
      setSavedCounts(null);
      return;
    }
    loadRoster();
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── save handler ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!classId) {
      setErrorMsg("Could not determine your class ID. Please refresh.");
      setPageState("error");
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setErrorMsg("No auth token. Please sign in first.");
      setPageState("error");
      return;
    }

    setPageState("saving");
    setErrorMsg("");

    const entries = students.map((s) => ({
      student_id: s.id,
      status: statuses[s.id] ?? "absent",
    }));

    try {
      const body: Record<string, unknown> = {
        class_id: classId,
        date: selectedDate,
        entries,
      };
      if (subject.trim()) body.subject = subject.trim();

      const res = await fetch(`${API_BASE}/api/attendance/mark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Server error (${res.status})`);
      }

      // Compute summary
      const counts: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0 };
      for (const status of Object.values(statuses)) counts[status]++;
      setSavedCounts(counts);
      setIsViewingExisting(true);
      setIsEditMode(false);
      setPageState("saved");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setPageState("error");
    }
  };

  // ── status helpers ─────────────────────────────────────────────────────
  const markAll = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {};
    for (const s of students) next[s.id] = status;
    setStatuses(next);
  };

  const presentCount  = Object.values(statuses).filter((s) => s === "present").length;
  const absentCount   = Object.values(statuses).filter((s) => s === "absent").length;
  const lateCount     = Object.values(statuses).filter((s) => s === "late").length;
  const isFormDisabled = pageState === "saving" || (pageState === "saved" && !isEditMode) || pageState === "locked";

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div className="mb-2">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-indigo-600" />
          Mark Attendance
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Select a date and mark present / absent / late for each student.
        </p>
      </div>

      {/* Date + Subject row */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Date picker */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              max={todayISO()}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {isFutureDate(selectedDate) && (
              <p className="mt-1 text-xs text-rose-600 font-medium">
                ⛔ Cannot mark attendance for a future date.
              </p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              Subject{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Physics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onBlur={() => {
                if (!isFutureDate(selectedDate) && pageState !== "loading_roster") loadRoster();
              }}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        {/* Refresh roster button */}
        <button
          type="button"
          onClick={loadRoster}
          disabled={isFutureDate(selectedDate) || pageState === "loading_roster"}
          className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-40 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${pageState === "loading_roster" ? "animate-spin" : ""}`} />
          {pageState === "loading_roster" ? "Loading roster…" : "Reload roster"}
        </button>
      </div>

      {/* Error banner */}
      {pageState === "error" && errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <div className="font-bold mb-1">⚠️ Error</div>
          {errorMsg}
        </div>
      )}

      {/* Saved summary + edit/locked state */}
      {savedCounts && (pageState === "saved" || pageState === "locked") && !isEditMode && (
        <div className="space-y-3">
          <SummaryBanner counts={savedCounts} editMode={isViewingExisting} />
          {pageState === "locked" ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <Lock className="w-4 h-4 text-gray-400" />
              The 2-hour edit window has closed. Contact an admin to make changes.
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsEditMode(true);
                setPageState("ready");
              }}
              className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit attendance (within 2-hour window)
            </button>
          )}
        </div>
      )}

      {/* Roster table */}
      {students.length > 0 && (pageState === "ready" || pageState === "saving" || (pageState === "saved" && isEditMode)) && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Table header row with bulk actions */}
          <div className="px-5 py-3.5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Users className="w-4 h-4 text-indigo-500" />
              {students.length} student{students.length !== 1 ? "s" : ""}
              <span className="ml-3 flex gap-2 text-xs font-semibold">
                <span className="text-emerald-600">{presentCount}P</span>
                <span className="text-rose-600">{absentCount}A</span>
                <span className="text-amber-600">{lateCount}L</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 font-medium">Mark all:</span>
              {(["present", "absent", "late"] as AttendanceStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={isFormDisabled}
                  onClick={() => markAll(s)}
                  className={`px-2.5 py-1 rounded-lg border font-semibold capitalize transition-all
                    ${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].text} ${STATUS_CONFIG[s].ring} border-transparent
                    ${isFormDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Student rows */}
          <div className="divide-y divide-gray-50">
            {students.map((student, idx) => {
              const current = statuses[student.id] ?? "present";
              return (
                <div
                  key={student.id}
                  className={`flex items-center justify-between px-5 py-3 transition-colors ${
                    current === "absent" ? "bg-rose-50/40" : current === "late" ? "bg-amber-50/40" : ""
                  }`}
                >
                  {/* Student info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                      current === "present" ? "bg-emerald-500" : current === "absent" ? "bg-rose-400" : "bg-amber-400"
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-gray-900 truncate">{student.name}</div>
                      <div className="text-xs text-gray-400 truncate">{student.email}</div>
                    </div>
                  </div>

                  {/* Toggle */}
                  <StatusToggle
                    value={current}
                    onChange={(s) => setStatuses((prev) => ({ ...prev, [student.id]: s }))}
                    disabled={isFormDisabled}
                  />
                </div>
              );
            })}
          </div>

          {/* Save button */}
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {isEditMode
                ? "Editing within the 2-hour window"
                : "Saved records can be edited within 2 hours."}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={pageState === "saving"}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-md cursor-pointer"
            >
              {pageState === "saving" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditMode ? "Update Attendance" : "Save Attendance"}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {pageState === "idle" && !isFutureDate(selectedDate) && (
        <div className="text-center text-gray-400 text-sm py-12">
          Click &ldquo;Reload roster&rdquo; to load students.
        </div>
      )}

      {/* Auth hint */}
      <p className="text-xs text-gray-400 text-center">
        Sign in at{" "}
        <a
          href="http://localhost:5173/login"
          target="_blank"
          rel="noreferrer"
          className="text-indigo-500 hover:underline"
        >
          the student app
        </a>{" "}
        with your teacher account to authenticate.
      </p>
    </div>
  );
}
