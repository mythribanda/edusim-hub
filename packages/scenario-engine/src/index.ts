/**
 * @edusim/scenario-engine
 *
 * Defines the full SimulationConfig schema (extended from shared-types),
 * validates module JSONB configs with Zod, and provides loadScenario()
 * to fetch + validate a typed config from the EduSim API.
 */

import { z } from "zod";
import type { AgeTier } from "@edusim/shared-types";

// ─────────────────────────────────────────────────────────────────────────────
// 1.  Zod schemas  (single source of truth — types are inferred from these)
// ─────────────────────────────────────────────────────────────────────────────

/** A positioned object on the simulation canvas. */
export const SceneObjectSchema = z.object({
  /** Slug references an asset in the asset registry (e.g. "tree", "ball-soccer"). */
  assetSlug: z.string().min(1),
  /** Human-readable label shown to the student. */
  label: z.string().min(1),
  /** x position as a fraction of canvas width  0–1. */
  x: z.number().min(0).max(1),
  /** y position as a fraction of canvas height 0–1. */
  y: z.number().min(0).max(1),
  /**
   * Domain-specific properties used by correct_rule evaluation.
   * Examples: { distance: 120, mass: 5, temperature: 37 }
   */
  properties: z.record(z.unknown()).default({}),
  /** If true the object can be dragged by the student. */
  draggable: z.boolean().default(false),
});
export type SceneObject = z.infer<typeof SceneObjectSchema>;

/** The seeker entity — the moving agent whose goal drives the scenario. */
export const SeekerSchema = z.object({
  assetSlug: z.string().min(1),
  label: z.string().min(1),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});
export type Seeker = z.infer<typeof SeekerSchema>;

/** A question posed to the student before / during the scene. */
export const SceneQuestionSchema = z.object({
  text: z.string().min(1),
  /** Optional hint shown after a wrong attempt. */
  hint: z.string().optional(),
  /** If provided the student must type / select this exact answer. */
  expectedAnswer: z.string().optional(),
});
export type SceneQuestion = z.infer<typeof SceneQuestionSchema>;

/**
 * How the engine evaluates a correct selection.
 *
 *  - "nearest"   → select the object with the smallest Euclidean distance to seeker
 *  - "farthest"  → select the object with the largest Euclidean distance to seeker
 *  - "heaviest"  → select the object whose properties.mass is the greatest
 *  - "lightest"  → select the object whose properties.mass is the smallest
 *  - "custom"    → correctObjectSlug is compared literally
 */
export const CorrectRuleSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("nearest") }),
  z.object({ type: z.literal("farthest") }),
  z.object({ type: z.literal("heaviest") }),
  z.object({ type: z.literal("lightest") }),
  z.object({
    type: z.literal("custom"),
    /** The assetSlug of the one correct answer object. */
    correctObjectSlug: z.string().min(1),
  }),
]);
export type CorrectRule = z.infer<typeof CorrectRuleSchema>;

/** Age-tier-specific overrides applied on top of the base scene. */
export const TierRuleSchema = z.object({
  /** Replace the question text for this tier. */
  questionOverride: z.string().optional(),
  /** Show / hide the numeric distance labels on objects. */
  showDistanceLabels: z.boolean().optional(),
  /** Show / hide the mass / property labels on objects. */
  showPropertyLabels: z.boolean().optional(),
  /** Maximum allowed attempts before the answer is revealed. */
  maxAttempts: z.number().int().positive().optional(),
  /** Extra hint for this tier level. */
  hint: z.string().optional(),
});
export type TierRule = z.infer<typeof TierRuleSchema>;

/** Full simulation scene configuration stored in modules.config JSONB. */
export const SimulationConfigSchema = z.object({
  /** Canvas / world background.  Hex colour, CSS gradient, or asset slug. */
  background: z.string().default("#EEF4FF"),
  /** The main question shown to the student. */
  question: SceneQuestionSchema,
  /** The moving agent (bird, rocket, student avatar…). */
  seeker: SeekerSchema,
  /** All interactive target objects. */
  objects: z.array(SceneObjectSchema).min(2),
  /** How the engine decides which object is the correct answer. */
  correct_rule: CorrectRuleSchema,
  /** Per-tier overrides — keys are AgeTier values. */
  tier_rules: z
    .object({
      primary: TierRuleSchema.optional(),
      middle: TierRuleSchema.optional(),
      high_school: TierRuleSchema.optional(),
      university: TierRuleSchema.optional(),
    })
    .default({}),
  // Legacy / optional fields kept for backward compat
  sceneId: z.string().optional(),
  allowControls: z.boolean().optional(),
  parameters: z.record(z.unknown()).optional(),
});
export type SimulationConfig = z.infer<typeof SimulationConfigSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// 2.  Module row shape (subset of the DB columns we need)
// ─────────────────────────────────────────────────────────────────────────────

const ModuleRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  type: z.enum(["simulation", "formula_lab", "tutor", "homework"]),
  tier_min: z.enum(["primary", "middle", "high_school", "university"]),
  subject: z.string(),
  config: z.unknown(), // raw JSONB — validated separately
  created_by: z.string().nullable(),
  created_at: z.string(),
});

export type ModuleRow = z.infer<typeof ModuleRowSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// 3.  Scenario validation error
// ─────────────────────────────────────────────────────────────────────────────

export class ScenarioValidationError extends Error {
  constructor(
    public readonly moduleId: string,
    public readonly issues: z.ZodIssue[]
  ) {
    super(
      `ScenarioValidationError for module ${moduleId}:\n` +
        issues.map((i) => `  [${i.path.join(".")}] ${i.message}`).join("\n")
    );
    this.name = "ScenarioValidationError";
  }
}

export class ScenarioNotFoundError extends Error {
  constructor(public readonly moduleId: string) {
    super(`Module "${moduleId}" not found or is not a simulation type.`);
    this.name = "ScenarioNotFoundError";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4.  loadScenario — fetch + validate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a module row from the EduSim API and validate its config JSONB
 * against SimulationConfigSchema using Zod.
 *
 * @param moduleId  UUID of the module row.
 * @param apiBase   Base URL of the EduSim API (default: VITE_API_URL or http://localhost:8001).
 * @param authToken Optional Bearer token for authenticated requests.
 * @returns         A validated, typed SimulationConfig.
 * @throws          ScenarioNotFoundError if the module doesn't exist.
 * @throws          ScenarioValidationError if the config JSONB is invalid.
 */
export async function loadScenario(
  moduleId: string,
  apiBase?: string,
  authToken?: string
): Promise<SimulationConfig> {
  const base = apiBase ?? getDefaultApiBase();
  const url = `${base}/api/modules/${moduleId}`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const res = await fetch(url, { headers });

  if (res.status === 404) throw new ScenarioNotFoundError(moduleId);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`loadScenario: HTTP ${res.status} — ${body}`);
  }

  const json = await res.json();

  // Validate the outer module row
  const rowParsed = ModuleRowSchema.safeParse(json);
  if (!rowParsed.success) {
    throw new ScenarioValidationError(moduleId, rowParsed.error.issues);
  }

  if (rowParsed.data.type !== "simulation") {
    throw new ScenarioNotFoundError(moduleId);
  }

  // Validate the config JSONB
  const configParsed = SimulationConfigSchema.safeParse(rowParsed.data.config);
  if (!configParsed.success) {
    throw new ScenarioValidationError(moduleId, configParsed.error.issues);
  }

  return configParsed.data;
}

/**
 * Validate an arbitrary object against SimulationConfigSchema without fetching.
 * Useful for testing fixtures or pre-validating before persisting.
 */
export function validateScenarioConfig(
  raw: unknown
): { success: true; data: SimulationConfig } | { success: false; issues: z.ZodIssue[] } {
  const result = SimulationConfigSchema.safeParse(raw);
  if (result.success) return { success: true, data: result.data };
  return { success: false, issues: result.error.issues };
}

/**
 * Validate and save a modified SimulationConfig back to a module in the modules table.
 *
 * @param moduleId  UUID of the module row.
 * @param config    Modified SimulationConfig to save.
 * @param apiBase   Base URL of the EduSim API.
 * @param authToken Optional Bearer token for authenticated requests.
 * @returns         Promise resolving to true on successful save.
 * @throws          ScenarioValidationError if config fails validation.
 */
export async function saveScenarioConfig(
  moduleId: string,
  config: SimulationConfig,
  apiBase?: string,
  authToken?: string
): Promise<boolean> {
  const validated = validateScenarioConfig(config);
  if (!validated.success) {
    throw new ScenarioValidationError(moduleId, validated.issues);
  }

  const base = apiBase ?? getDefaultApiBase();
  const url = `${base}/api/modules/${moduleId}`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ config: validated.data }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`saveScenarioConfig: HTTP ${res.status} — ${body}`);
  }

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5.  Runtime correctness helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given a config and the slug or index of the object the student selected,
 * returns true if it is the correct answer according to correct_rule.
 *
 * For spatial rules (nearest / farthest) the seeker position is used.
 * Supports both slug and index matching (crucial when multiple objects share a slug).
 */
export function evaluateAnswer(
  config: SimulationConfig,
  selectedSlugOrIndex: string | number,
  selectedIndex?: number
): boolean {
  const rule = config.correct_rule;
  const objects = config.objects;
  const targetIndex = typeof selectedSlugOrIndex === "number"
    ? selectedSlugOrIndex
    : selectedIndex;
  const targetSlug = typeof selectedSlugOrIndex === "string"
    ? selectedSlugOrIndex
    : objects[selectedSlugOrIndex]?.assetSlug;

  if (rule.type === "custom") {
    if (targetIndex !== undefined && objects[targetIndex]) {
      return objects[targetIndex].assetSlug === rule.correctObjectSlug;
    }
    return targetSlug === rule.correctObjectSlug;
  }

  if (rule.type === "nearest" || rule.type === "farthest") {
    const sx = config.seeker.x;
    const sy = config.seeker.y;

    const distances = objects.map((o, idx) => ({
      index: idx,
      slug: o.assetSlug,
      d: Math.hypot(o.x - sx, o.y - sy),
    }));

    const sorted = [...distances].sort((a, b) =>
      rule.type === "nearest" ? a.d - b.d : b.d - a.d
    );

    if (targetIndex !== undefined) {
      return sorted[0]?.index === targetIndex;
    }
    return sorted[0]?.slug === targetSlug;
  }

  if (rule.type === "heaviest" || rule.type === "lightest") {
    const masses = objects.map((o, idx) => ({
      index: idx,
      slug: o.assetSlug,
      m: Number(o.properties?.mass ?? 0),
    }));
    const sorted = [...masses].sort((a, b) =>
      rule.type === "heaviest" ? b.m - a.m : a.m - b.m
    );

    if (targetIndex !== undefined) {
      return sorted[0]?.index === targetIndex;
    }
    return sorted[0]?.slug === targetSlug;
  }

  return false;
}

/**
 * Determine the 0-based index of the correct answer object in config.objects.
 */
export function findCorrectIndex(config: SimulationConfig): number {
  const rule = config.correct_rule;
  const objects = config.objects;

  if (rule.type === "custom") {
    const idx = objects.findIndex((o) => o.assetSlug === rule.correctObjectSlug);
    return idx >= 0 ? idx : 0;
  }

  const seeker = config.seeker;
  if (rule.type === "nearest" || rule.type === "farthest") {
    const withDist = objects.map((o, index) => ({
      index,
      d: Math.hypot(o.x - seeker.x, o.y - seeker.y),
    }));
    const sorted = withDist.sort((a, b) =>
      rule.type === "nearest" ? a.d - b.d : b.d - a.d
    );
    return sorted[0]?.index ?? 0;
  }

  if (rule.type === "heaviest" || rule.type === "lightest") {
    const withMass = objects.map((o, index) => ({
      index,
      m: Number(o.properties?.mass ?? 0),
    }));
    const sorted = withMass.sort((a, b) =>
      rule.type === "heaviest" ? b.m - a.m : a.m - b.m
    );
    return sorted[0]?.index ?? 0;
  }

  return 0;
}

/**
 * Return the tier-adjusted question text for a given AgeTier.
 */
export function getQuestionForTier(config: SimulationConfig, tier: AgeTier): string {
  const override = config.tier_rules[tier]?.questionOverride;
  return override ?? config.question.text;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.  Re-exports
// ─────────────────────────────────────────────────────────────────────────────

export { SCENARIO_ENGINE_VERSION } from "./version";
export * from "./formula-eval";

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function getDefaultApiBase(): string {
  try {
    // @ts-ignore — VITE_API_URL injected by Vite
    const v = import.meta.env.VITE_API_URL;
    if (v) return String(v).replace(/\/$/, "");
  } catch { /* not Vite */ }
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && (window as any).__EDUSIM_API_URL__) {
    return String((window as any).__EDUSIM_API_URL__).replace(/\/$/, "");
  }
  return "http://localhost:8001";
}
