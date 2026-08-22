import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface AssignmentResult {
  assignment_id: string;
  module_id: string;
  class_id: string;
  due_date: string | null;
  instructions: string | null;
}

type SubmitState = "idle" | "loading" | "success" | "error";

function CreateAssignmentPage() {
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
        "No auth token found. Please sign in first."
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
    <div className="max-w-xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-1">
          ➕ Create Assignment
        </h1>
        <p className="text-sm text-muted-foreground">
          Link a module to a class and optionally set a due date and instructions.
          Students will see this on their dashboard immediately.
        </p>
      </div>

      {/* Success banner */}
      {submitState === "success" && result && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm">
          <div className="font-bold mb-1">✅ Assignment created!</div>
          <div className="font-mono text-xs break-all">
            ID: {result.assignment_id}
          </div>
          {result.due_date && (
            <div className="mt-1 text-xs text-emerald-500">
              Due: {new Date(result.due_date).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Error banner */}
      {submitState === "error" && errorMsg && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 text-sm">
          <div className="font-bold mb-1">⚠️ Error</div>
          {errorMsg}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5"
      >
        {/* Module picker */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">
            Module <span className="text-red-500">*</span>
          </label>
          {modules.length > 0 ? (
            <select
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              required
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
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
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-mono bg-background focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                e.g. 550e8400-e29b-41d4-a716-446655440000
              </p>
            </>
          )}
        </div>

        {/* Class ID */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">
            Class UUID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Paste Class UUID"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            required
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-mono bg-background focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            The UUID of the class from your school&apos;s admin panel.
          </p>
        </div>

        {/* Due date */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">
            Due Date <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">
            Instructions <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            placeholder="E.g. Complete the projectile motion simulation and note down your observations."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            className="w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitState === "loading"}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-bold text-sm py-3 rounded-xl transition-colors shadow-md cursor-pointer"
        >
          {submitState === "loading" ? "Creating…" : "Create Assignment"}
        </button>
      </form>
    </div>
  );
}

export const Route = createFileRoute("/teacher/assignments")({
  component: CreateAssignmentPage,
});
