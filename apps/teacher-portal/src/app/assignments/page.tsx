"use client";

/**
 * /assignments — Create Assignment page (Teacher Portal)
 *
 * Allows a logged-in teacher to:
 *  - Pick a Module UUID (or title lookup)
 *  - Enter a Class UUID
 *  - Set an optional due date
 *  - Write optional instructions
 *  - Submit → POST /api/assignments on the FastAPI backend
 *
 * Auth: reads the JWT from localStorage["token"] (set when the teacher
 * signs in via apps/web, which syncs the token to the same localStorage key).
 */

import React, { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface AssignmentResult {
  assignment_id: string;
  module_id: string;
  class_id: string;
  due_date: string | null;
  instructions: string | null;
}

type SubmitState = "idle" | "loading" | "success" | "error";

export default function CreateAssignmentPage() {
  const [moduleId, setModuleId] = useState("");
  const [classId, setClassId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [instructions, setInstructions] = useState("");

  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [result, setResult] = useState<AssignmentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch available modules from the backend to populate the module picker
  const [modules, setModules] = useState<{ id: string; title: string; subject: string }[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    setLoadingModules(true);
    fetch(`${API_BASE}/api/modules`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => setModules(data.modules ?? []))
      .catch(() => {
        // Silently ignore — fallback to manual UUID input
      })
      .finally(() => setLoadingModules(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState("loading");
    setErrorMsg("");
    setResult(null);

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!token) {
      setErrorMsg(
        "No auth token found. Please sign in at the student web app first, then return here."
      );
      setSubmitState("error");
      return;
    }

    if (!moduleId.trim() || !classId.trim()) {
      setErrorMsg("Module ID and Class ID are required.");
      setSubmitState("error");
      return;
    }

    try {
      const body: Record<string, string> = {
        module_id: moduleId.trim(),
        class_id: classId.trim(),
      };
      if (dueDate) body.due_date = new Date(dueDate).toISOString();
      if (instructions.trim()) body.instructions = instructions.trim();

      const res = await fetch(`${API_BASE}/api/assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let detail = `Server error (${res.status})`;
        try {
          detail = JSON.parse(text)?.detail ?? detail;
        } catch {}
        throw new Error(detail);
      }

      const json = await res.json();
      setResult(json);
      setSubmitState("success");

      // Reset form on success
      setModuleId("");
      setClassId("");
      setDueDate("");
      setInstructions("");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setSubmitState("error");
    }
  };

  return (
    <div className="max-w-xl">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
          ➕ Create Assignment
        </h1>
        <p className="text-sm text-gray-500">
          Link a module to a class and optionally set a due date and instructions.
          Students will see this on their dashboard immediately.
        </p>
      </div>

      {/* Success banner */}
      {submitState === "success" && result && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
          <div className="font-bold mb-1">✅ Assignment created!</div>
          <div className="font-mono text-xs break-all">
            ID: {result.assignment_id}
          </div>
          {result.due_date && (
            <div className="mt-1 text-xs text-green-700">
              Due: {new Date(result.due_date).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Error banner */}
      {submitState === "error" && errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <div className="font-bold mb-1">⚠️ Error</div>
          {errorMsg}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5"
      >
        {/* Module picker */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
            Module <span className="text-red-500">*</span>
          </label>
          {modules.length > 0 ? (
            <select
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">— Select a module —</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.subject})
                </option>
              ))}
            </select>
          ) : (
            <>
              <input
                type="text"
                placeholder={
                  loadingModules ? "Loading modules…" : "Paste Module UUID"
                }
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <p className="mt-1 text-xs text-gray-400">
                e.g. 550e8400-e29b-41d4-a716-446655440000
              </p>
            </>
          )}
        </div>

        {/* Class ID */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
            Class UUID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Paste Class UUID"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <p className="mt-1 text-xs text-gray-400">
            The UUID of the class from your school&apos;s admin panel.
          </p>
        </div>

        {/* Due date */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
            Due Date <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
            Instructions <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            placeholder="E.g. Complete the projectile motion simulation and note down your observations."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitState === "loading"}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-xl transition-colors shadow-md"
        >
          {submitState === "loading" ? "Creating…" : "Create Assignment"}
        </button>
      </form>

      {/* Auth hint */}
      <p className="mt-4 text-xs text-gray-400 text-center">
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
