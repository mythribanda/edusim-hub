"use client";

/**
 * /assignments/grading — Assignments Grading Overview (Teacher Portal)
 *
 * Lists all assignments created by the logged-in teacher.
 * Fetches all submissions for each assignment to display the count of ungraded submissions.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  RefreshCw,
  FolderOpen,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

export default function GradingOverviewPage() {
  const [assignments, setAssignments] = useState<AssignmentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg("");
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      setErrorMsg("No auth token found. Please sign in at the student web app first to authenticate.");
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch all modules to map titles
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

      // 2. Fetch all assignments
      const assignmentsRes = await fetch(`${API_BASE}/api/assignments/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!assignmentsRes.ok) {
        throw new Error(`Failed to load assignments (${assignmentsRes.status})`);
      }
      const assignmentsData = await assignmentsRes.json();
      const rawAssignments: Assignment[] = assignmentsData.assignments ?? [];

      // 3. For each assignment, fetch its submissions to count ungraded
      const statsList: AssignmentStats[] = await Promise.all(
        rawAssignments.map(async (a) => {
          try {
            const subsRes = await fetch(`${API_BASE}/api/assignments/${a.assignment_id}/submissions`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (subsRes.ok) {
              const subsData = await subsRes.json();
              const submissions = subsData.submissions ?? [];
              const totalSubmissions = submissions.length;
              const ungradedCount = submissions.filter((s: { graded_at: string | null }) => !s.graded_at).length;
              return {
                ...a,
                moduleTitle: moduleMap[a.module_id] || subsData.module_title || "Interactive Physics Module",
                totalSubmissions,
                ungradedCount,
              };
            }
          } catch (err) {
            console.error(`Error loading stats for assignment ${a.assignment_id}:`, err);
          }
          return {
            ...a,
            moduleTitle: moduleMap[a.module_id] || "Interactive Physics Module",
            totalSubmissions: 0,
            ungradedCount: 0,
          };
        })
      );

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-indigo-600" />
            Grading Center
          </h1>
          <p className="text-sm text-gray-500">
            Review student submissions, assign scores, and submit comments.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-xl shadow-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Assignments
        </button>
      </div>

      {/* Errors */}
      {errorMsg && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm">
          <div className="font-bold mb-1">Authentication Required</div>
          {errorMsg}
        </div>
      )}

      {/* Roster list */}
      {!loading && assignments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((a) => {
            const hasUngraded = a.ungradedCount > 0;

            return (
              <div
                key={a.assignment_id}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div>
                  {/* Title and class info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {a.moduleTitle}
                      </h3>
                      <p className="text-xs text-gray-400 font-mono">
                        CLASS ID: {a.class_id}
                      </p>
                    </div>
                    {hasUngraded ? (
                      <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        {a.ungradedCount} Ungraded
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                        All Graded
                      </span>
                    )}
                  </div>

                  {/* Submission and date stats */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-4 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider block">
                        Submissions
                      </span>
                      <span className="font-semibold text-gray-800 flex items-center gap-1 mt-0.5">
                        <Layers className="w-3.5 h-3.5 text-gray-400" />
                        {a.totalSubmissions} total
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider block">
                        Due Date
                      </span>
                      <span className="font-semibold text-gray-800 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {a.due_date
                          ? new Date(a.due_date).toLocaleDateString()
                          : "No due date"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer link to grade */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
                  <span className="text-[10px] text-gray-400 font-mono">
                    ASSIGNMENT ID: {a.assignment_id.slice(0, 8)}...
                  </span>
                  <Link
                    href={`/assignments/grading/${a.assignment_id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:translate-x-0.5 transition-all"
                  >
                    Grade Submissions <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-semibold">Loading assignments...</p>
        </div>
      )}

      {/* Empty assignments list */}
      {!loading && assignments.length === 0 && !errorMsg && (
        <div className="flex flex-col items-center justify-center border border-gray-200 border-dashed rounded-3xl p-12 text-center bg-white max-w-md mx-auto">
          <FolderOpen className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-sm font-bold text-gray-900 mb-1">No assignments created yet</h3>
          <p className="text-xs text-gray-500 mb-4">
            Create your first class assignment using the module builder form.
          </p>
          <Link
            href="/assignments"
            className="inline-flex items-center gap-1 px-4 py-2 border border-transparent bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            Create Assignment
          </Link>
        </div>
      )}
    </div>
  );
}
