import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { SimulationRunner } from "@edusim/ui";
import { validateScenarioConfig } from "@edusim/scenario-engine";
import type { SimulationConfig } from "@edusim/scenario-engine";
import type { AgeTier } from "@edusim/shared-types";
import { z } from "zod";
import { useAuthStore } from "@/store/useAuthStore";
import { createSubmission, getPendingAssignments } from "@/services/assignmentService";

// Load the three local JSON fixtures (Vite handles JSON imports natively)
import nearestTree    from "@edusim/scenario-engine/fixtures/nearest-tree-to-bird.json";
import farthestPlanet from "@edusim/scenario-engine/fixtures/farthest-planet-from-rocket.json";
import heaviestObject from "@edusim/scenario-engine/fixtures/heaviest-object-on-scale.json";

// ─────────────────────────────────────────────────────────────────────────────
// Route — accepts optional assignmentId search param from dashboard
// ─────────────────────────────────────────────────────────────────────────────

const searchSchema = z.object({
  assignmentId: z.string().optional(),
});

export const Route = createFileRoute("/demo/simulation")({
  validateSearch: searchSchema,
  component: SimulationDemoPage,
});

// ─────────────────────────────────────────────────────────────────────────────
// Pre-validate all fixtures at module load (throws on schema violation)
// ─────────────────────────────────────────────────────────────────────────────

function parseFixture(raw: unknown, name: string): SimulationConfig {
  const result = validateScenarioConfig(raw);
  if (!result.success) {
    throw new Error(`Fixture "${name}" failed validation:\n${result.issues.map(i => i.message).join("\n")}`);
  }
  return result.data;
}

const SCENARIOS: { id: string; label: string; config: SimulationConfig }[] = [
  { id: "nearest-tree",    label: "🌳 Nearest Tree to Bird",      config: parseFixture(nearestTree,    "nearest-tree") },
  { id: "farthest-planet", label: "🚀 Farthest Planet from Rocket", config: parseFixture(farthestPlanet, "farthest-planet") },
  { id: "heaviest-object", label: "⚖️  Heaviest Object on Scale",   config: parseFixture(heaviestObject, "heaviest-object") },
];

const TIERS: AgeTier[] = ["primary", "middle", "high_school", "university"];

// ─────────────────────────────────────────────────────────────────────────────
// Demo page
// ─────────────────────────────────────────────────────────────────────────────

function SimulationDemoPage() {
  const { assignmentId } = Route.useSearch();
  const { token } = useAuthStore();

  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0].id);
  const [tier, setTier]             = useState<AgeTier>("primary");
  const [key, setKey]               = useState(0); // remount runner on reset
  const [lastScore, setLastScore]   = useState<{ score: number; total: number } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeConfig, setActiveConfig] = useState<SimulationConfig>(SCENARIOS[0].config);
  const [savedNotification, setSavedNotification] = useState<string | null>(null);
  // Track whether we've already submitted for this assignment session
  const submittedRef = useRef(false);

  const active = SCENARIOS.find((s) => s.id === scenarioId)!;

  useEffect(() => {
    setActiveConfig(active.config);
    // Reset submitted guard when the scenario changes
    submittedRef.current = false;
  }, [scenarioId, active.config]);

  function reset() {
    setKey((k) => k + 1);
    setLastScore(null);
    setActiveConfig(active.config);
    submittedRef.current = false;
  }

  // Reset submitted guard and auto-resolve scenarioId from assignmentId
  useEffect(() => {
    submittedRef.current = false;
    if (!assignmentId || !token) return;

    getPendingAssignments(token).then((pending) => {
      const match = pending.find((a) => a.assignment_id === assignmentId);
      if (match) {
        const mid = match.module_id;
        if (mid === "c8e00111-1111-1111-1111-111111111111") {
          setScenarioId("nearest-tree");
        } else if (mid === "c8e00222-2222-2222-2222-222222222222") {
          setScenarioId("farthest-planet");
        } else if (mid === "c8e00333-3333-3333-3333-333333333333") {
          setScenarioId("heaviest-object");
        }
      }
    });
  }, [assignmentId, token]);

  const handleSaveConfig = async (configToSave: SimulationConfig) => {
    // Simulate backend / Supabase persistence to modules table
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSavedNotification(`Successfully saved updated configuration for "${active.label}" to the modules table.`);
    setTimeout(() => setSavedNotification(null), 4000);
  };

  /**
   * Called by SimulationRunner when the student answers correctly (or exhausts attempts).
   * If there's an assignmentId in the URL, records a submission to the backend.
   */
  const handleComplete = async (score: number, total: number) => {
    setLastScore({ score, total });

    if (assignmentId && token && !submittedRef.current) {
      submittedRef.current = true; // idempotency guard — prevents double-submit on re-renders
      const result = await createSubmission(token, {
        assignment_id: assignmentId,
        answers: { score, total, scenario: scenarioId, tier },
        score: total > 0 ? Math.round((score / total) * 100) / 100 : null,
        completed_at: new Date().toISOString(),
      });
      if (result?.success && !result.already_submitted) {
        setSavedNotification("✅ Assignment submitted — great work!");
        setTimeout(() => setSavedNotification(null), 5000);
      }
    }
  };

  return (
    <div style={page.root}>
      {/* ── Hero ── */}
      <div style={page.hero}>
        <span style={page.badge}>🧪 Demo</span>
        <h1 style={page.heading}>Simulation Runner</h1>
        <p style={page.sub}>
          Interactive SVG simulation canvas with live object swapping via AssetPicker and Teacher Edit Mode.
        </p>
      </div>

      {/* ── Assignment context banner (shown when opened from dashboard) ── */}
      {assignmentId && (
        <div style={{
          background: "#EEF2FF",
          border: "1.5px solid #C7D2FE",
          borderRadius: "12px",
          padding: "10px 16px",
          marginBottom: "16px",
          fontSize: "13px",
          fontWeight: 600,
          color: "#4338CA",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          📋 You're completing an assigned module. Your score will be recorded automatically when you finish.
        </div>
      )}

      {/* ── Controls ── */}
      <div style={page.controlRow}>
        {/* Scenario picker */}
        <div style={page.control}>
          <label style={page.label} htmlFor="scenario-select">Scenario</label>
          <select
            id="scenario-select"
            style={page.select}
            value={scenarioId}
            onChange={(e) => { setScenarioId(e.target.value); reset(); }}
          >
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Tier picker */}
        <div style={page.control}>
          <label style={page.label} htmlFor="tier-select">Age Tier</label>
          <select
            id="tier-select"
            style={page.select}
            value={tier}
            onChange={(e) => { setTier(e.target.value as AgeTier); reset(); }}
          >
            {TIERS.map((t) => (
              <option key={t} value={t}>{t.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        {/* Mode Toggle (Student vs Teacher Edit) */}
        <div style={page.control}>
          <label style={page.label}>User Role</label>
          <div style={page.roleToggle}>
            <button
              type="button"
              style={{
                ...page.toggleBtn,
                background: !isEditMode ? "#6C63FF" : "transparent",
                color: !isEditMode ? "#FFF" : "#666",
              }}
              onClick={() => setIsEditMode(false)}
            >
              🎓 Student
            </button>
            <button
              type="button"
              style={{
                ...page.toggleBtn,
                background: isEditMode ? "#FFAA00" : "transparent",
                color: isEditMode ? "#1A1A2E" : "#666",
                fontWeight: isEditMode ? 800 : 600,
              }}
              onClick={() => setIsEditMode(true)}
            >
              ✏️ Teacher Edit
            </button>
          </div>
        </div>

        {/* Reset */}
        <button style={page.resetBtn} onClick={reset} aria-label="Restart simulation">
          ↺ Restart
        </button>
      </div>

      {/* ── Saved / Submission Notification ── */}
      {savedNotification && (
        <div style={page.saveNotification}>
          💾 {savedNotification}
        </div>
      )}

      {/* ── Score badge (after completion) ── */}
      {lastScore && (
        <div style={page.scoreBadge}>
          ✅ Completed — {lastScore.score === 1 ? "first try! 🌟" : `${lastScore.score} of ${lastScore.total} attempts`}
        </div>
      )}

      {/* ── Feature Highlights Banner ── */}
      <div style={page.featureBanner}>
        <span style={{ fontSize: "18px" }}>💡</span>
        <div style={{ flex: 1 }}>
          <strong>Live Object Swapping:</strong> Click <em>"🔄 Swap Object"</em> to open the AssetPicker and replace any scene object (e.g. tree &rarr; ball). The underlying <code>correct_rule</code> calculation remains intact! In Teacher Edit Mode, save your customizations back to the modules table.
        </div>
      </div>

      {/* ── Runner ── */}
      <div style={page.runnerWrap}>
        <SimulationRunner
          key={`${scenarioId}-${tier}-${key}`}
          config={active.config}
          tier={tier}
          editMode={isEditMode}
          isTeacher={isEditMode}
          onConfigChange={(newCfg) => setActiveConfig(newCfg)}
          onSaveConfig={handleSaveConfig}
          onComplete={handleComplete}
          subject="Physics"
          topic={active.label}
        />
      </div>

      {/* ── Live Modified Config JSON viewer ── */}
      <details style={page.details}>
        <summary style={page.summary}>📄 View active SimulationConfig JSON (updates live on swap)</summary>
        <pre style={page.pre}>{JSON.stringify(activeConfig, null, 2)}</pre>
      </details>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const page = {
  root: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #F8F7FF 0%, #EDF2FF 100%)",
    padding: "32px 24px 64px",
    fontFamily: "'Nunito', system-ui, sans-serif",
    boxSizing: "border-box",
  } as React.CSSProperties,

  hero: {
    textAlign: "center",
    marginBottom: "28px",
  } as React.CSSProperties,

  badge: {
    display: "inline-block",
    background: "#6C63FF22",
    color: "#6C63FF",
    borderRadius: "999px",
    padding: "4px 14px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: "10px",
  } as React.CSSProperties,

  heading: {
    margin: "0 0 8px",
    fontSize: "clamp(28px, 5vw, 42px)",
    fontWeight: 900,
    color: "#1A1A2E",
    letterSpacing: "-0.02em",
  } as React.CSSProperties,

  sub: {
    margin: "0 auto",
    maxWidth: "540px",
    color: "#666",
    fontSize: "16px",
    lineHeight: 1.6,
  } as React.CSSProperties,

  controlRow: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-end",
    flexWrap: "wrap",
    marginBottom: "20px",
    justifyContent: "center",
  } as React.CSSProperties,

  control: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  } as React.CSSProperties,

  label: {
    fontSize: "11px",
    fontWeight: 800,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  } as React.CSSProperties,

  select: {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1.5px solid #DDD",
    fontSize: "14px",
    fontFamily: "inherit",
    background: "#FAFAFE",
    cursor: "pointer",
    outline: "none",
    minWidth: "180px",
  } as React.CSSProperties,

  roleToggle: {
    display: "flex",
    background: "#ECEBF8",
    borderRadius: "12px",
    padding: "3px",
    gap: "2px",
  } as React.CSSProperties,

  toggleBtn: {
    border: "none",
    padding: "7px 12px",
    borderRadius: "9px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s ease",
  } as React.CSSProperties,

  resetBtn: {
    padding: "10px 20px",
    borderRadius: "12px",
    border: "none",
    background: "#F0EFFF",
    color: "#6C63FF",
    fontWeight: 800,
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background 0.15s",
    alignSelf: "flex-end",
  } as React.CSSProperties,

  saveNotification: {
    maxWidth: "880px",
    margin: "0 auto 16px",
    padding: "10px 18px",
    background: "#E8FFF0",
    color: "#1A7A40",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: 700,
    border: "1px solid #B3EFD0",
    textAlign: "center",
  } as React.CSSProperties,

  scoreBadge: {
    textAlign: "center",
    margin: "0 auto 16px",
    display: "inline-block",
    background: "#E8FFF0",
    color: "#1A7A40",
    borderRadius: "999px",
    padding: "6px 20px",
    fontSize: "14px",
    fontWeight: 700,
    border: "1px solid #B3EFD0",
    width: "100%",
  } as React.CSSProperties,

  featureBanner: {
    maxWidth: "880px",
    margin: "0 auto 20px",
    padding: "12px 18px",
    background: "rgba(108, 99, 255, 0.08)",
    border: "1px solid rgba(108, 99, 255, 0.2)",
    borderRadius: "14px",
    fontSize: "13px",
    color: "#3A3575",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    lineHeight: 1.5,
  } as React.CSSProperties,

  runnerWrap: {
    maxWidth: "880px",
    margin: "0 auto 28px",
  } as React.CSSProperties,

  details: {
    maxWidth: "880px",
    margin: "0 auto",
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #E8E8F0",
    padding: "12px 20px",
  } as React.CSSProperties,

  summary: {
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "13px",
    color: "#666",
    userSelect: "none",
  } as React.CSSProperties,

  pre: {
    fontSize: "12px",
    color: "#444",
    overflow: "auto",
    maxHeight: "400px",
    paddingTop: "12px",
    margin: 0,
    lineHeight: 1.6,
  } as React.CSSProperties,
};
