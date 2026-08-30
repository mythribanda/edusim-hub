import React, { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
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

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

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
    bg: "bg-emerald-500/10",
    text: "text-emerald-450 text-emerald-400",
  },
  absent: {
    label: "Absent",
    icon: <XCircle className="w-4 h-4" />,
    ring: "ring-2 ring-destructive",
    bg: "bg-destructive/10",
    text: "text-destructive",
  },
  late: {
    label: "Late",
    icon: <AlertCircle className="w-4 h-4" />,
    ring: "ring-2 ring-amber-500",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
  },
};

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
              ${active ? `${cfg.bg} ${cfg.text} ${cfg.ring} border-transparent` : "bg-card text-muted-foreground border-border hover:border-muted-foreground/50"}
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
    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm">
      <div className="font-bold text-emerald-400 mb-2 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4" />
        {editMode ? "Attendance updated!" : "Attendance saved!"}
      </div>
      <div className="flex gap-5 text-sm">
        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" /> {counts.present} present
        </span>
        <span className="flex items-center gap-1 text-destructive font-semibold">
          <XCircle className="w-3.5 h-3.5" /> {counts.absent} absent
        </span>
        <span className="flex items-center gap-1 text-amber-400 font-semibold">
          <AlertCircle className="w-3.5 h-3.5" /> {counts.late} late
        </span>
      </div>
    </div>
  );
}

function AttendancePage() {
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
  const [savedRecords, setSavedRecords] = useState<Record<string, any>>({});

  const loadRoster = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("teacher_token") : null;
    if (!token) {
      setErrorMsg("No auth token. Please sign in first.");
      setPageState("error");
      return;
    }

    setPageState("loading_roster");
    setErrorMsg("");
    setSavedCounts(null);
    setIsViewingExisting(false);
    setIsEditMode(false);
    setSavedRecords({});

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

      // 2. Determine class_id from user profile
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

      // 4. If date is today or in the past, check for already-saved records
      if (teacherClassId && selectedDate <= todayISO()) {
        const savedRes = await fetch(
          `${API_BASE}/api/attendance/for-date?class_id=${teacherClassId}&date=${selectedDate}${subject ? `&subject=${encodeURIComponent(subject)}` : ""}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (savedRes.ok) {
          const saved: ForDateResponse = await savedRes.json();
          setSavedRecords(saved.by_student);
          // Overlay saved statuses
          for (const [sid, rec] of Object.entries(saved.by_student)) {
            if (defaultStatuses[sid] !== undefined) {
              defaultStatuses[sid] = rec.status;
            }
          }
          const hasSaved = Object.keys(saved.by_student).length > 0;
          setIsViewingExisting(hasSaved);

          if (hasSaved) {
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

  useEffect(() => {
    if (isFutureDate(selectedDate)) {
      setPageState("idle");
      setStudents([]);
      setStatuses({});
      setSavedCounts(null);
      return;
    }
    loadRoster();
  }, [selectedDate, loadRoster]);

  const handleSave = async () => {
    if (!classId) {
      setErrorMsg("Could not determine your class ID. Please refresh.");
      setPageState("error");
      return;
    }
    const token = typeof window !== "undefined" ? localStorage.getItem("teacher_token") : null;
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

  const markAll = (status: AttendanceStatus) => {
    const next = { ...statuses };
    for (const s of students) {
      const isLocked = savedRecords[s.id] && !savedRecords[s.id].can_edit;
      if (!isLocked) {
        next[s.id] = status;
      }
    }
    setStatuses(next);
  };

  const presentCount  = Object.values(statuses).filter((s) => s === "present").length;
  const absentCount   = Object.values(statuses).filter((s) => s === "absent").length;
  const lateCount     = Object.values(statuses).filter((s) => s === "late").length;
  const isFormDisabled = pageState === "saving" || (pageState === "saved" && !isEditMode) || pageState === "locked";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-primary" />
          Mark Attendance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select a date and mark present / absent / late for each student.
        </p>
      </div>

      {/* Date + Subject row */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Date picker */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              max={todayISO()}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-border bg-background rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {isFutureDate(selectedDate) && (
              <p className="mt-1 text-xs text-destructive font-medium">
                ⛔ Cannot mark attendance for a future date.
              </p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">
              Subject{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Physics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onBlur={() => {
                if (!isFutureDate(selectedDate) && pageState !== "loading_roster") loadRoster();
              }}
              className="w-full border border-border bg-background rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Refresh roster button */}
        <button
          type="button"
          onClick={loadRoster}
          disabled={isFutureDate(selectedDate) || pageState === "loading_roster"}
          className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-40 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${pageState === "loading_roster" ? "animate-spin" : ""}`} />
          {pageState === "loading_roster" ? "Loading roster…" : "Reload roster"}
        </button>
      </div>

      {/* Error banner */}
      {pageState === "error" && errorMsg && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
          <div className="font-bold mb-1">⚠️ Error</div>
          {errorMsg}
        </div>
      )}

      {/* Saved summary + edit/locked state */}
      {savedCounts && (pageState === "saved" || pageState === "locked") && !isEditMode && (
        <div className="space-y-3">
          <SummaryBanner counts={savedCounts} editMode={isViewingExisting} />
          {pageState === "locked" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary border border-border rounded-xl px-4 py-3">
              <Lock className="w-4 h-4 text-muted-foreground" />
              The 2-hour edit window has closed. Contact an admin to make changes.
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsEditMode(true);
                setPageState("ready");
              }}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit attendance (within 2-hour window)
            </button>
          )}
        </div>
      )}

      {/* Roster table */}
      {students.length > 0 && (pageState === "ready" || pageState === "saving" || (pageState === "saved" && isEditMode)) && (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {/* Table header row with bulk actions */}
          <div className="px-5 py-3.5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="w-4 h-4 text-primary" />
              {students.length} student{students.length !== 1 ? "s" : ""}
              <span className="ml-3 flex gap-2 text-xs font-semibold">
                <span className="text-emerald-400">{presentCount}P</span>
                <span className="text-destructive">{absentCount}A</span>
                <span className="text-amber-400">{lateCount}L</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium">Mark all:</span>
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
          <div className="divide-y divide-border/40">
            {students.map((student, idx) => {
              const current = statuses[student.id] ?? "present";
              return (
                <div
                  key={student.id}
                  className={`flex items-center justify-between px-5 py-3 transition-colors ${
                    current === "absent" ? "bg-destructive/5" : current === "late" ? "bg-amber-500/5" : ""
                  }`}
                >
                  {/* Student info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                      current === "present" ? "bg-emerald-500" : current === "absent" ? "bg-destructive/80" : "bg-amber-500"
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-foreground truncate">{student.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{student.email}</div>
                    </div>
                  </div>

                  {/* Toggle */}
                  <StatusToggle
                    value={current}
                    onChange={(s) => setStatuses((prev) => ({ ...prev, [student.id]: s }))}
                    disabled={isFormDisabled || (savedRecords[student.id] && !savedRecords[student.id].can_edit)}
                  />
                </div>
              );
            })}
          </div>

          {/* Save button */}
          <div className="px-5 py-4 border-t border-border bg-secondary/30 flex items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {isEditMode
                ? "Editing within the 2-hour window"
                : "Saved records can be edited within 2 hours."}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={pageState === "saving"}
              className="flex items-center gap-2 bg-primary hover:bg-primary/95 disabled:opacity-60 text-primary-foreground font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-md cursor-pointer"
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
        <div className="text-center text-muted-foreground text-sm py-12">
          Click &ldquo;Reload roster&rdquo; to load students.
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/teacher/attendance")({
  component: AttendancePage,
});
