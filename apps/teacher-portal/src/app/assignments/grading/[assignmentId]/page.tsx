"use client";

/**
 * /assignments/grading/[assignmentId] — Submissions grading list (Teacher Portal)
 *
 * Displays all submissions for a selected assignment.
 * Allows filtering between All, Ungraded, and Graded.
 * Lets the teacher assign a score and write feedback comment for each submission.
 */

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

interface PageProps {
  params: {
    assignmentId: string;
  };
}

export default function AssignmentGradingPage({ params }: PageProps) {
  const { assignmentId } = params;
  const [moduleTitle, setModuleTitle] = useState("Interactive Physics Module");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filterType, setFilterType] = useState<"all" | "ungraded" | "graded">("ungraded");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Tracks expanding submission rows
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form input states mapped by submission_id
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingIds, setSubmittingIds] = useState<Record<string, boolean>>({});

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

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

      // Prepopulate input states
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

  // Handle grade submission
  const handleSaveGrade = async (subId: string) => {
    const scoreStr = scoreInputs[subId];
    const commentStr = commentInputs[subId];
    const score = parseFloat(scoreStr);

    if (isNaN(score)) {
      alert("Please enter a valid numeric score.");
      return;
    }

    setSubmittingIds((prev) => ({ ...prev, [subId]: true }));
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    try {
      const res = await fetch(`${API_BASE}/api/submissions/${subId}/grade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          score,
          comment: commentStr.trim() || null,
        }),
      });

      if (!res.ok) {
        throw new Error(`Grading failed (${res.status})`);
      }

      const updated = await res.json();

      // Update state inline
      setSubmissions((prev) =>
        prev.map((s) =>
          s.submission_id === subId
            ? { ...s, score: updated.score, comment: updated.comment, graded_at: updated.graded_at }
            : s
        )
      );

      // Close expanding row
      setExpandedId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to grade submission.");
    } finally {
      setSubmittingIds((prev) => ({ ...prev, [subId]: false }));
    }
  };

  // Filter list
  const filteredSubmissions = submissions.filter((s) => {
    if (filterType === "ungraded") return !s.graded_at;
    if (filterType === "graded") return !!s.graded_at;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Back navigation */}
      <div>
        <Link
          href="/assignments/grading"
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Grading Center
        </Link>
      </div>

      {/* Assignment info */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full blur-xl pointer-events-none" />
        <div className="space-y-1 z-10">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">
            Assignment Submissions Review
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {moduleTitle}
          </h1>
          <p className="text-xs text-gray-500 font-mono">
            ASSIGNMENT UUID: {assignmentId}
          </p>
        </div>
        <button
          onClick={fetchSubmissions}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-xl shadow-sm transition-colors z-10"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Submissions
        </button>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-sm">
          <div className="font-bold mb-1">⚠️ Error Loading Submissions</div>
          {errorMsg}
        </div>
      )}

      {/* Filter Tabs */}
      {!loading && submissions.length > 0 && (
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType("ungraded")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                filterType === "ungraded"
                  ? "bg-amber-50 text-amber-700 border-amber-300 shadow-sm"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Ungraded (
              {submissions.filter((s) => !s.graded_at).length}
              )
            </button>
            <button
              onClick={() => setFilterType("graded")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                filterType === "graded"
                  ? "bg-green-50 text-green-700 border-green-300 shadow-sm"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Graded (
              {submissions.filter((s) => !!s.graded_at).length}
              )
            </button>
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                filterType === "all"
                  ? "bg-indigo-50 text-indigo-700 border-indigo-300 shadow-sm"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              All ({submissions.length})
            </button>
          </div>
        </div>
      )}

      {/* Roster & submissions table */}
      {!loading && filteredSubmissions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden divide-y divide-gray-100">
          {filteredSubmissions.map((s) => {
            const isExpanded = expandedId === s.submission_id;
            const isSubmitting = submittingIds[s.submission_id] || false;
            const scoreVal = scoreInputs[s.submission_id] ?? "";
            const commentVal = commentInputs[s.submission_id] ?? "";

            return (
              <div key={s.submission_id} className="p-5 hover:bg-gray-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 shrink-0">
                      <GraduationCap className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900">
                        {s.student_name}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono">
                        {s.student_email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    {/* Submission status badge */}
                    <div className="text-right">
                      {s.graded_at ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                          <CheckCircle className="w-2.5 h-2.5" /> Graded: {s.score}/100
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <HelpCircle className="w-2.5 h-2.5 animate-pulse" /> Awaiting Grade
                        </span>
                      )}
                      <span className="block text-[10px] text-gray-400 mt-1 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {s.completed_at
                          ? new Date(s.completed_at).toLocaleString()
                          : "Unknown"}
                      </span>
                    </div>

                    {/* Expand row details */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : s.submission_id)}
                      className="inline-flex items-center gap-0.5 px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-bold text-xs rounded-xl shadow-sm transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          Close <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          Grade / Inspect <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expandable Grade / Inspect Section */}
                {isExpanded && (
                  <div className="mt-5 pt-5 border-t border-dashed border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left side: Inspect answers & JSON payload */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <FileCode className="w-4 h-4 text-gray-400" />
                        Student Answers & Payload
                      </div>
                      <div className="p-4 bg-gray-900 rounded-xl font-mono text-[11px] text-green-400 overflow-x-auto max-h-64 border border-gray-800 shadow-inner">
                        <pre>{JSON.stringify(s.answers, null, 2)}</pre>
                      </div>
                    </div>

                    {/* Right side: Grading Form */}
                    <div className="space-y-4 bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="text-xs font-bold text-gray-700">
                          Assign Final Grade
                        </div>

                        {/* Score Input */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Score (0 - 100)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={scoreVal}
                            onChange={(e) =>
                              setScoreInputs((prev) => ({
                                ...prev,
                                [s.submission_id]: e.target.value,
                              }))
                            }
                            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:outline-none"
                          />
                        </div>

                        {/* Comment Input */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                            Feedback Comment
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Write constructive feedback for the student..."
                            value={commentVal}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [s.submission_id]: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-3 justify-end pt-3 border-t border-gray-200/50 mt-4">
                        <button
                          onClick={() => setExpandedId(null)}
                          className="px-3.5 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveGrade(s.submission_id)}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 px-4 py-2 border border-transparent bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
                        >
                          {isSubmitting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                            </>
                          ) : (
                            <>
                              Save Grade
                            </>
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

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-semibold">Loading student submissions...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredSubmissions.length === 0 && (
        <div className="flex flex-col items-center justify-center border border-gray-200 border-dashed rounded-3xl p-12 text-center bg-white max-w-md mx-auto">
          <Layers className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-sm font-bold text-gray-900 mb-1">No submissions found</h3>
          <p className="text-xs text-gray-500">
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
