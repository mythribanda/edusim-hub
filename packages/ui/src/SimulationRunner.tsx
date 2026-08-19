/**
 * SimulationRunner — interactive SVG simulation canvas.
 *
 * Renders a full scene from a validated SimulationConfig:
 *   • Seeker asset + all object assets fetched from the asset registry
 *   • Objects positioned at fractional canvas coordinates
 *   • Tap/click to select an object → client-side correctness evaluation
 *   • Confetti + animated checkmark on correct answer
 *   • Shake animation + hint text on incorrect answer
 *   • Tier-aware: question text, hint, maxAttempts, showDistanceLabels, showPropertyLabels from tier_rules
 *   • Live object swap via <AssetPicker /> with zero correct_rule disruption
 *   • Teacher Edit Mode with live config persistence to modules table
 *   • Dual Interaction Modes: 👆 Tap Mode & 🎚️ Slider Mode with real-time math inspection
 */

import * as React from "react";
import type { AgeTier, Asset } from "@edusim/shared-types";
import type { SimulationConfig } from "@edusim/scenario-engine";
import {
  evaluateAnswer,
  getQuestionForTier,
  findCorrectIndex,
  saveScenarioConfig,
} from "@edusim/scenario-engine";
import { searchAssetsWithMeta } from "@edusim/asset-registry";
import { sanitizeSvg, svgToDataUri } from "./svgSanitizer";
import { AssetPicker } from "./AssetPicker";
import { TutorChat } from "./TutorChat";
import { emitEvent } from "./emitEvent";
import { Sparkles } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// 0.  CSS injection
// ─────────────────────────────────────────────────────────────────────────────

let cssInjected = false;
function injectSimCSS() {
  if (cssInjected || typeof document === "undefined") return;
  cssInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    @keyframes simConfettiBurst {
      0%   { transform: translate(-50%, -50%) translate(0,0) scale(0) rotate(0deg); opacity: 1; }
      70%  { opacity: 1; }
      100% { transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) scale(1) rotate(var(--rot)); opacity: 0; }
    }
    @keyframes simCheckCircle {
      0%   { stroke-dashoffset: 220; }
      100% { stroke-dashoffset: 0; }
    }
    @keyframes simCheckMark {
      0%   { stroke-dashoffset: 80; }
      100% { stroke-dashoffset: 0; }
    }
    @keyframes simShake {
      0%,100% { transform: translateX(0); }
      15%     { transform: translateX(-10px); }
      30%     { transform: translateX(10px); }
      45%     { transform: translateX(-8px); }
      60%     { transform: translateX(8px); }
      75%     { transform: translateX(-5px); }
      90%     { transform: translateX(5px); }
    }
    @keyframes simFadeSlide {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes simPulse {
      0%, 100% { transform: scale(1); }
      50%      { transform: scale(1.06); }
    }
    @keyframes simGlowRing {
      0%   { r: 52; opacity: 0.8; }
      100% { r: 70; opacity: 0; }
    }
    @keyframes simModalFadeIn {
      from { opacity: 0; transform: scale(0.96) translateY(8px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1.  Deterministic confetti data (stable across renders)
// ─────────────────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  "#FF6B6B", "#FFE66D", "#4ECDC4", "#45B7D1",
  "#96CEB4", "#FF9F43", "#A29BFE", "#FD79A8",
  "#6C5CE7", "#00B894",
];

const CONFETTI_PIECES = Array.from({ length: 36 }, (_, i) => {
  const angle = (i / 36) * 360 + (i % 5) * 3; // evenly spread + tiny jitter
  const dist  = 90 + (i % 5) * 25;             // 90–190 px burst radius
  const tx    = Math.cos((angle * Math.PI) / 180) * dist;
  const ty    = Math.sin((angle * Math.PI) / 180) * dist;
  const rot   = ((i * 137) % 720) - 360;        // golden-angle rotation spread
  const size  = 7 + (i % 4) * 2;
  const shape = i % 3 === 0 ? "50%" : i % 3 === 1 ? "2px" : "0%";
  const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
  const delay = (i % 6) * 0.04;
  return { tx, ty, rot, size, shape, color, delay };
});

// ─────────────────────────────────────────────────────────────────────────────
// 2.  Asset-loading hook
// ─────────────────────────────────────────────────────────────────────────────

interface AssetMap {
  [slug: string]: string; // slug → sanitized svg_content
}

function useScenarioAssets(
  config: SimulationConfig,
  apiBase?: string
): { assetMap: AssetMap; isLoading: boolean; error: string | null } {
  const [assetMap, setAssetMap] = React.useState<AssetMap>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const slugsKey = [
    config.seeker.assetSlug,
    ...config.objects.map((o) => o.assetSlug),
  ].join(",");

  React.useEffect(() => {
    const needed = new Set([
      config.seeker.assetSlug,
      ...config.objects.map((o) => o.assetSlug),
    ]);

    // Set runtime override if caller provided a specific base URL
    if (apiBase && typeof window !== "undefined") {
      (window as any).__EDUSIM_API_URL__ = apiBase;
    }

    setIsLoading(true);
    setError(null);

    searchAssetsWithMeta({ limit: 300 })
      .then(({ assets }) => {
        const map: AssetMap = {};
        assets.forEach((a) => {
          if (needed.has(a.slug) && a.svg_content) {
            map[a.slug] = sanitizeSvg(a.svg_content);
          }
        });
        setAssetMap((prev) => ({ ...prev, ...map }));
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setIsLoading(false));
  }, [slugsKey, apiBase]);

  return { assetMap, isLoading, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3.  Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Confetti burst — rendered centred over the canvas */
function ConfettiBurst() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        borderRadius: "inherit",
      }}
    >
      {CONFETTI_PIECES.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: "50%",
            top: "40%",
            width: p.size,
            height: p.size,
            borderRadius: p.shape,
            backgroundColor: p.color,
            ["--tx" as any]: `${p.tx}px`,
            ["--ty" as any]: `${p.ty}px`,
            ["--rot" as any]: `${p.rot}deg`,
            animation: `simConfettiBurst 1.4s cubic-bezier(.22,.61,.36,1) ${p.delay}s both`,
          }}
        />
      ))}
    </div>
  );
}

/** Animated SVG checkmark overlay */
function CheckmarkOverlay({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="assertive"
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        animation: "simFadeSlide 0.3s ease both",
      }}
    >
      <svg width={90} height={90} viewBox="0 0 90 90" fill="none">
        {/* Glow ring (fades outward) */}
        <circle cx={45} cy={45} r={44} fill="rgba(108,99,255,0.08)" />
        {/* Animated circle */}
        <circle
          cx={45} cy={45} r={35}
          stroke="#6C63FF" strokeWidth={4}
          fill="white"
          strokeDasharray={220} strokeDashoffset={220}
          style={{
            animation: "simCheckCircle 0.5s ease forwards",
            transformOrigin: "50% 50%",
            transform: "rotate(-90deg)",
          }}
        />
        {/* Animated checkmark path */}
        <path
          d="M28 46 L40 58 L63 34"
          stroke="#6C63FF" strokeWidth={5}
          strokeLinecap="round" strokeLinejoin="round"
          fill="none"
          strokeDasharray={80} strokeDashoffset={80}
          style={{ animation: "simCheckMark 0.35s 0.45s ease forwards" }}
        />
      </svg>
      <p style={{
        margin: "10px 0 0",
        fontSize: "22px",
        fontWeight: 900,
        color: "#6C63FF",
        fontFamily: "'Nunito', system-ui, sans-serif",
        letterSpacing: "-0.01em",
        animation: "simFadeSlide 0.3s 0.2s ease both",
        opacity: 0,
        animationFillMode: "forwards",
      }}>
        {label}
      </p>
    </div>
  );
}

/** Gentle shake container + retry message */
function IncorrectFeedback({
  hint,
  attemptsLeft,
}: {
  hint?: string;
  attemptsLeft: number;
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: "absolute",
        bottom: "12px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(255,255,255,0.95)",
        border: "2px solid #FFB3B3",
        borderRadius: "16px",
        padding: "12px 24px",
        textAlign: "center",
        pointerEvents: "none",
        animation: "simFadeSlide 0.25s ease both",
        whiteSpace: "nowrap",
        boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
      }}
    >
      <p style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#CC3333", fontFamily: "inherit" }}>
        Not quite! Try again 🔄
      </p>
      {hint && (
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#888", fontFamily: "inherit" }}>
          💡 {hint}
        </p>
      )}
      {attemptsLeft > 0 && (
        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#aaa", fontFamily: "inherit" }}>
          {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} left
        </p>
      )}
    </div>
  );
}

/** Loading skeleton canvas */
function SkeletonCanvas() {
  return (
    <div
      aria-label="Loading simulation…"
      style={{
        width: "100%",
        paddingTop: "56.25%", // 16:9
        borderRadius: "20px",
        background: "linear-gradient(90deg, #F0F0F8 25%, #E8E8F5 50%, #F0F0F8 75%)",
        backgroundSize: "200% 100%",
        animation: "assetPickerShimmer 1.4s infinite",
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4.  Main scene SVG
// ─────────────────────────────────────────────────────────────────────────────

const CANVAS_W = 1000;
const CANVAS_H = 560;
const OBJ_SIZE = 100;   // SVG units — image bounding box
const HIT_R    = 58;    // tap circle radius (child-friendly)

interface SceneProps {
  config: SimulationConfig;
  assetMap: AssetMap;
  selectedSlug: string | null;
  selectedIndex: number | null;
  phase: Phase;
  showLabels: boolean;
  showDistanceLabels: boolean;
  showPropertyLabels: boolean;
  onTap: (slug: string, index: number) => void;
  shakingIndex: number | null;
}

function SimulationScene({
  config,
  assetMap,
  selectedSlug,
  selectedIndex,
  phase,
  showLabels,
  showDistanceLabels,
  showPropertyLabels,
  onTap,
  shakingIndex,
}: SceneProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const interactive = phase === "idle";

  const seekerX = config.seeker.x * CANVAS_W;
  const seekerY = config.seeker.y * CANVAS_H;
  const seekerSvg = assetMap[config.seeker.assetSlug];

  return (
    <svg
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", borderRadius: "20px", outline: "none" }}
      aria-label="Simulation scene"
    >
      {/* Transparent background (real bg on wrapper div) */}
      <rect width={CANVAS_W} height={CANVAS_H} fill="transparent" />

      {/* Ground line hint */}
      <line
        x1={0} y1={CANVAS_H * 0.88}
        x2={CANVAS_W} y2={CANVAS_H * 0.88}
        stroke="rgba(0,0,0,0.07)" strokeWidth={2}
      />

      {/* ── Distance Guide Lines (when showDistanceLabels is active) ── */}
      {showDistanceLabels &&
        config.objects.map((obj, index) => {
          const cx = obj.x * CANVAS_W;
          const cy = obj.y * CANVAS_H;
          return (
            <line
              key={`line-${index}`}
              x1={seekerX}
              y1={seekerY}
              x2={cx}
              y2={cy}
              stroke="rgba(108, 99, 255, 0.25)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          );
        })}

      {/* ── Objects ─────────────────────────────────────────────── */}
      {config.objects.map((obj, index) => {
        const cx = obj.x * CANVAS_W;
        const cy = obj.y * CANVAS_H;
        const isSelected = selectedIndex === index || (selectedSlug === obj.assetSlug && selectedIndex === null);
        const isHovered  = hoveredIndex === index && interactive;
        const isShaking  = shakingIndex === index;
        const dataUri    = assetMap[obj.assetSlug]
          ? svgToDataUri(assetMap[obj.assetSlug])
          : null;

        // Metric badge texts
        const distVal = Math.hypot(obj.x - config.seeker.x, obj.y - config.seeker.y);
        const distText =
          obj.properties?.distanceFromSun_AU !== undefined
            ? `${obj.properties.distanceFromSun_AU} AU`
            : `d = ${distVal.toFixed(2)}`;

        const propText =
          obj.properties?.massLabel !== undefined
            ? String(obj.properties.massLabel)
            : obj.properties?.mass !== undefined
            ? `${obj.properties.mass} kg`
            : null;

        return (
          <g
            key={`obj-${index}-${obj.assetSlug}`}
            style={{
              cursor: interactive ? "pointer" : "default",
              animation: isShaking ? "simShake 0.6s ease both" : undefined,
            }}
            onClick={() => interactive && onTap(obj.assetSlug, index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            role={interactive ? "button" : undefined}
            aria-label={interactive ? `Select ${obj.label}` : obj.label}
            aria-pressed={isSelected}
            tabIndex={interactive ? 0 : -1}
            onKeyDown={(e) => interactive && (e.key === "Enter" || e.key === " ") && onTap(obj.assetSlug, index)}
          >
            {/* Expanding glow ring on hover */}
            {isHovered && (
              <circle
                cx={cx} cy={cy} r={HIT_R + 4}
                fill="rgba(108,99,255,0.12)"
                stroke="rgba(108,99,255,0.3)" strokeWidth={2}
              />
            )}

            {/* Selection ring */}
            {isSelected && (
              <>
                <circle cx={cx} cy={cy} r={HIT_R + 8}
                  fill="rgba(108,99,255,0.15)"
                  stroke="#6C63FF" strokeWidth={3}
                  strokeDasharray="6 3"
                />
                {/* Pulsing outer ring */}
                <circle cx={cx} cy={cy} r={HIT_R + 14}
                  fill="none"
                  stroke="#6C63FF" strokeWidth={1.5}
                  opacity={0.4}
                  style={{ animation: "simGlowRing 1s ease infinite" }}
                />
              </>
            )}

            {/* Large invisible hit target for kid-friendly taps */}
            <circle cx={cx} cy={cy} r={HIT_R} fill="rgba(255,255,255,0.01)" />

            {/* Object background bubble */}
            <circle
              cx={cx} cy={cy} r={HIT_R - 4}
              fill={isSelected ? "rgba(108,99,255,0.08)" : isHovered ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.5)"}
              style={{ transition: "fill 0.15s" }}
            />

            {/* SVG image */}
            {dataUri ? (
              <image
                href={dataUri}
                x={cx - OBJ_SIZE / 2}
                y={cy - OBJ_SIZE / 2}
                width={OBJ_SIZE}
                height={OBJ_SIZE}
                style={{
                  transform: isHovered || isSelected ? "scale(1.08)" : "scale(1)",
                  transformOrigin: `${cx}px ${cy}px`,
                  transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              />
            ) : (
              /* Fallback emoji if SVG unavailable */
              <text x={cx} y={cy + 14} textAnchor="middle" fontSize={56}>🖼</text>
            )}

            {/* Label below object */}
            {showLabels && (
              <text
                x={cx}
                y={cy + OBJ_SIZE / 2 + 20}
                textAnchor="middle"
                fontSize={17}
                fontFamily="'Nunito', system-ui, sans-serif"
                fontWeight={700}
                fill={isSelected ? "#6C63FF" : "#333"}
                style={{ userSelect: "none", transition: "fill 0.15s" }}
              >
                {obj.label}
              </text>
            )}

            {/* Metric pill for distance / property when enabled */}
            {(showDistanceLabels || showPropertyLabels) && (
              <g transform={`translate(${cx}, ${cy + OBJ_SIZE / 2 + (showLabels ? 38 : 18)})`}>
                <rect
                  x={-42}
                  y={-11}
                  width={84}
                  height={22}
                  rx={11}
                  fill={isSelected ? "#6C63FF" : "rgba(255,255,255,0.92)"}
                  stroke={isSelected ? "#6C63FF" : "#DDD"}
                  strokeWidth={1}
                />
                <text
                  x={0}
                  y={4}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={800}
                  fill={isSelected ? "#FFF" : "#444"}
                  fontFamily="'Nunito', monospace, sans-serif"
                >
                  {showDistanceLabels ? distText : propText}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* ── Seeker ──────────────────────────────────────────────── */}
      {(() => {
        const dataUri = seekerSvg ? svgToDataUri(seekerSvg) : null;
        const SEEK_SIZE = 80;
        return (
          <g aria-label={config.seeker.label}>
            {/* Subtle shadow ellipse */}
            <ellipse
              cx={seekerX}
              cy={seekerY + SEEK_SIZE / 2 + 6}
              rx={30} ry={8}
              fill="rgba(0,0,0,0.10)"
            />
            {/* Pulse animation to show it's the "actor" */}
            <circle
              cx={seekerX} cy={seekerY} r={SEEK_SIZE / 2 + 8}
              fill="rgba(255,209,102,0.20)"
              style={{ animation: "simPulse 2s ease-in-out infinite" }}
            />
            {dataUri ? (
              <image
                href={dataUri}
                x={seekerX - SEEK_SIZE / 2}
                y={seekerY - SEEK_SIZE / 2}
                width={SEEK_SIZE}
                height={SEEK_SIZE}
              />
            ) : (
              <text x={seekerX} y={seekerY + 14} textAnchor="middle" fontSize={48}>🔍</text>
            )}
            {showLabels && (
              <text
                x={seekerX}
                y={seekerY + SEEK_SIZE / 2 + 20}
                textAnchor="middle"
                fontSize={16}
                fontFamily="'Nunito', system-ui, sans-serif"
                fontWeight={800}
                fill="#777"
                style={{ userSelect: "none" }}
              >
                {config.seeker.label}
              </text>
            )}
          </g>
        );
      })()}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5.  Phase type + attempt dots
// ─────────────────────────────────────────────────────────────────────────────

type Phase = "loading" | "idle" | "correct" | "incorrect" | "revealed" | "done";

function AttemptDots({
  total,
  remaining,
}: {
  total: number;
  remaining: number;
}) {
  return (
    <div style={{ display: "flex", gap: "6px", justifyContent: "center" }} aria-label={`${remaining} attempts remaining`}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: i < remaining ? "#6C63FF" : "#DDD",
            transition: "background 0.3s",
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.  Public component
// ─────────────────────────────────────────────────────────────────────────────

export interface SimulationRunnerProps {
  /** Validated SimulationConfig — use loadScenario() or validateScenarioConfig() from scenario-engine. */
  config: SimulationConfig;
  /** Current student's age tier — drives question text, hint, maxAttempts. */
  tier: AgeTier;
  /** Called when the student answers correctly. Score = attempts used (lower = better). */
  onComplete?: (score: number, totalAttempts: number) => void;
  /** Override the API base URL for asset fetching. */
  apiBase?: string;
  /** Positive feedback message. Default: "Great job!" */
  correctMessage?: string;
  /** Show object + seeker labels under each asset. Default: true for primary/middle. */
  showLabels?: boolean;
  /** Enable live swapping of scene assets using <AssetPicker />. Default: true. */
  allowSwap?: boolean;
  /** Teacher / edit mode flag — reveals teacher controls and saving capability. */
  editMode?: boolean;
  /** Alias for editMode / teacher role. */
  isTeacher?: boolean;
  /** Initial interaction mode: 'tap' or 'slider'. Default: 'tap'. */
  initialInteractionMode?: "tap" | "slider";
  /** Module ID in the modules table for direct persistence. */
  moduleId?: string;
  /** Auth token for API / Supabase calls. */
  authToken?: string;
  /** Callback when config is modified live (e.g. object swapped). */
  onConfigChange?: (updatedConfig: SimulationConfig) => void;
  /** Callback to save modified config to modules table / backend. */
  onSaveConfig?: (updatedConfig: SimulationConfig) => Promise<void> | void;
  subject?: string;
  topic?: string;
}

export function SimulationRunner({
  config: initialConfig,
  tier,
  onComplete,
  apiBase,
  correctMessage,
  showLabels: showLabelsProp,
  allowSwap = true,
  editMode = false,
  isTeacher = false,
  initialInteractionMode = "tap",
  moduleId,
  authToken,
  onConfigChange,
  onSaveConfig,
  subject,
  topic,
}: SimulationRunnerProps) {
  const [showTutor, setShowTutor] = React.useState(false);
  React.useEffect(() => { injectSimCSS(); }, []);

  const isEditMode = editMode || isTeacher;

  // ── Live Mutable Configuration State ──────────────────────────────────────
  const [currentConfig, setCurrentConfig] = React.useState<SimulationConfig>(initialConfig);
  const [interactionMode, setInteractionMode] = React.useState<"tap" | "slider">(initialInteractionMode);

  const resolvedSubject = subject || "Physics";
  const resolvedTopic = topic || currentConfig.sceneId || "Interactive Simulation";
  const cleanedTopic = resolvedTopic
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // ── Session event base options ─────────────────────────────────────────────
  const eventOpts = React.useMemo(() => ({
    moduleId: moduleId,
    token: authToken,
    payload: { topic: cleanedTopic, subject: resolvedSubject },
  }), [moduleId, authToken, cleanedTopic, resolvedSubject]);

  // 'started' — fire once when the component mounts
  React.useEffect(() => {
    emitEvent("started", { ...eventOpts, payload: { ...eventOpts.payload, sceneId: initialConfig.sceneId } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    setCurrentConfig(initialConfig);
  }, [initialConfig]);

  // ── Asset loading ─────────────────────────────────────────────────────────
  const { assetMap: baseAssetMap, isLoading, error } = useScenarioAssets(currentConfig, apiBase);
  const [extraAssetMap, setExtraAssetMap] = React.useState<AssetMap>({});

  const assetMap = React.useMemo(() => ({
    ...baseAssetMap,
    ...extraAssetMap,
  }), [baseAssetMap, extraAssetMap]);

  // ── Asset Registry Cache for AssetPicker ───────────────────────────────────
  const [registryAssets, setRegistryAssets] = React.useState<Asset[]>([]);
  const [isLoadingRegistry, setIsLoadingRegistry] = React.useState(false);
  const [swapModalOpen, setSwapModalOpen] = React.useState(false);
  const [selectedTargetKey, setSelectedTargetKey] = React.useState<string>("object-0");

  // ── Slider Mode Physics / Math State ──────────────────────────────────────
  const [gravityG, setGravityG] = React.useState<number>(9.81);
  const [seekerPosX, setSeekerPosX] = React.useState<number>(currentConfig.seeker.x);
  const [seekerPosY, setSeekerPosY] = React.useState<number>(currentConfig.seeker.y);

  React.useEffect(() => {
    setSeekerPosX(currentConfig.seeker.x);
    setSeekerPosY(currentConfig.seeker.y);
  }, [currentConfig.seeker.x, currentConfig.seeker.y]);

  // ── Saving State ──────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const fetchRegistryAssets = React.useCallback(async () => {
    if (registryAssets.length > 0) return;
    setIsLoadingRegistry(true);
    try {
      const res = await searchAssetsWithMeta({ limit: 300 });
      setRegistryAssets(res.assets);
    } catch (err) {
      console.warn("Could not preload asset registry:", err);
    } finally {
      setIsLoadingRegistry(false);
    }
  }, [registryAssets.length]);

  const openSwapModal = React.useCallback((targetKey: string = "object-0") => {
    setSelectedTargetKey(targetKey);
    setSwapModalOpen(true);
    fetchRegistryAssets();
  }, [fetchRegistryAssets]);

  // ── Live Object Swap Handler ──────────────────────────────────────────────
  const handleSelectSwapAsset = React.useCallback((asset: Asset) => {
    if (asset.svg_content) {
      const sanitized = sanitizeSvg(asset.svg_content);
      setExtraAssetMap((prev) => ({ ...prev, [asset.slug]: sanitized }));
    }

    let nextConfig: SimulationConfig;

    if (selectedTargetKey === "seeker") {
      nextConfig = {
        ...currentConfig,
        seeker: {
          ...currentConfig.seeker,
          assetSlug: asset.slug,
          label: asset.name || currentConfig.seeker.label,
        },
      };
    } else {
      const targetIndex = parseInt(selectedTargetKey.replace("object-", ""), 10);
      const targetObj = currentConfig.objects[targetIndex];
      if (!targetObj) return;

      const oldSlug = targetObj.assetSlug;
      const nextObjects = currentConfig.objects.map((obj, idx) =>
        idx === targetIndex
          ? {
              ...obj,
              assetSlug: asset.slug,
              label: asset.name || obj.label,
            }
          : obj
      );

      // Preserve scenario's correct_rule logic
      let nextCorrectRule = currentConfig.correct_rule;
      if (
        currentConfig.correct_rule.type === "custom" &&
        currentConfig.correct_rule.correctObjectSlug === oldSlug
      ) {
        nextCorrectRule = {
          type: "custom",
          correctObjectSlug: asset.slug,
        };
      }

      nextConfig = {
        ...currentConfig,
        objects: nextObjects,
        correct_rule: nextCorrectRule,
      };
    }

    setCurrentConfig(nextConfig);
    onConfigChange?.(nextConfig);
    setSwapModalOpen(false);
  }, [selectedTargetKey, currentConfig, onConfigChange]);

  // ── Save to Modules Table Handler ─────────────────────────────────────────
  const handleSaveToModule = React.useCallback(async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      if (onSaveConfig) {
        await onSaveConfig(currentConfig);
      } else if (moduleId) {
        await saveScenarioConfig(moduleId, currentConfig, apiBase, authToken);
      } else {
        // Mock success fallback for preview/demo mode
        await new Promise((r) => setTimeout(r, 600));
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  }, [currentConfig, onSaveConfig, moduleId, apiBase, authToken]);

  // ── Tier-specific settings ────────────────────────────────────────────────
  const tierRules   = currentConfig.tier_rules[tier] ?? {};
  const question    = getQuestionForTier(currentConfig, tier);
  const hint        = tierRules.hint ?? currentConfig.question.hint;
  const maxAttempts = tierRules.maxAttempts ?? 3;
  const showLabels  = showLabelsProp ?? (tier === "primary" || tier === "middle");
  const showDistanceLabels = tierRules.showDistanceLabels ?? false;
  const showPropertyLabels = tierRules.showPropertyLabels ?? false;
  const successMsg  = correctMessage ?? (tier === "primary" ? "Amazing! 🎉" : tier === "middle" ? "Great job! ✓" : "Correct ✓");

  // ── State ─────────────────────────────────────────────────────────────────
  const [phase, setPhase]           = React.useState<Phase>("loading");
  const [attemptsLeft, setAttemptsLeft] = React.useState(maxAttempts);
  const [totalAttempts, setTotalAttempts] = React.useState(0);
  const [selectedSlug, setSelectedSlug] = React.useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [shakingIndex, setShakingIndex] = React.useState<number | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!isLoading) setPhase("idle");
  }, [isLoading]);

  // Sync maxAttempts when tier changes
  React.useEffect(() => {
    setAttemptsLeft(maxAttempts);
  }, [maxAttempts]);

  // Cleanup timers
  React.useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // ── Tap handler ───────────────────────────────────────────────────────────
  const handleTap = React.useCallback((slug: string, index: number) => {
    if (phase !== "idle") return;

    setSelectedSlug(slug);
    setSelectedIndex(index);
    const thisAttempt = totalAttempts + 1;
    setTotalAttempts(thisAttempt);

    const correct = evaluateAnswer(currentConfig, slug, index);

    // 'answered' — every tap attempt
    emitEvent("answered", {
      ...eventOpts,
      payload: { ...eventOpts.payload, slug, attempt: thisAttempt, correct },
    });

    if (correct) {
      setPhase("correct");
      timerRef.current = setTimeout(() => {
        setPhase("done");
        // 'completed' — student answered correctly
        emitEvent("completed", {
          ...eventOpts,
          payload: { ...eventOpts.payload, attempts: thisAttempt, maxAttempts },
        });
        onComplete?.(thisAttempt, maxAttempts);
      }, 2800);
    } else {
      const remaining = attemptsLeft - 1;
      setAttemptsLeft(remaining);
      setPhase("incorrect");
      setShakingIndex(index);

      timerRef.current = setTimeout(() => {
        setShakingIndex(null);
        setSelectedSlug(null);
        setSelectedIndex(null);

        if (remaining <= 0) {
          // Reveal the correct answer
          const winIdx = findCorrectIndex(currentConfig);
          const correctSlug = currentConfig.objects[winIdx]?.assetSlug ?? null;
          setSelectedSlug(correctSlug);
          setSelectedIndex(winIdx);
          setPhase("revealed");
          timerRef.current = setTimeout(() => {
            setPhase("done");
            // 'completed' — answer revealed (out of attempts)
            emitEvent("completed", {
              ...eventOpts,
              payload: { ...eventOpts.payload, attempts: thisAttempt, maxAttempts, revealed: true },
            });
            onComplete?.(thisAttempt, maxAttempts);
          }, 2500);
        } else {
          setPhase("idle");
        }
      }, 1400);
    }
  }, [phase, currentConfig, attemptsLeft, totalAttempts, maxAttempts, onComplete, eventOpts]);

  // ── Calculations for Slider Mode ──────────────────────────────────────────
  const isSpatialRule = currentConfig.correct_rule.type === "nearest" || currentConfig.correct_rule.type === "farthest";
  const isMassRule = currentConfig.correct_rule.type === "heaviest" || currentConfig.correct_rule.type === "lightest";

  // Compute live ranking and math values for Slider Mode
  const rankedItems = React.useMemo(() => {
    if (isSpatialRule) {
      const sx = seekerPosX;
      const sy = seekerPosY;
      return currentConfig.objects.map((obj, idx) => {
        const d = Math.hypot(obj.x - sx, obj.y - sy);
        return {
          index: idx,
          label: obj.label,
          slug: obj.assetSlug,
          val: d,
          formulaText: `d = √[(${obj.x.toFixed(2)} − ${sx.toFixed(2)})² + (${obj.y.toFixed(2)} − ${sy.toFixed(2)})²] = ${d.toFixed(3)}`,
        };
      }).sort((a, b) =>
        currentConfig.correct_rule.type === "nearest" ? a.val - b.val : b.val - a.val
      );
    }

    if (isMassRule) {
      return currentConfig.objects.map((obj, idx) => {
        const m = Number(obj.properties?.mass ?? 0);
        const w = m * gravityG;
        return {
          index: idx,
          label: obj.label,
          slug: obj.assetSlug,
          val: w,
          formulaText: `W = ${m} kg × ${gravityG.toFixed(2)} m/s² = ${w.toFixed(2)} N`,
        };
      }).sort((a, b) =>
        currentConfig.correct_rule.type === "heaviest" ? b.val - a.val : a.val - b.val
      );
    }

    return [];
  }, [currentConfig, seekerPosX, seekerPosY, gravityG, isSpatialRule, isMassRule]);

  const sliderWinner = rankedItems[0];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", gap: "24px", position: "relative", width: "100%", maxWidth: showTutor ? "1300px" : "880px", margin: "0 auto", alignItems: "flex-start", transition: "max-width 0.3s ease" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'Nunito', 'Poppins', system-ui, sans-serif",
            width: "100%",
            margin: "0 auto",
          }}
        >
      {/* ── Top Bar: Mode Toggle & Teacher Toolbar ─────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Interaction Mode Toggle (Tap vs Slider) */}
          <div
            style={{
              display: "inline-flex",
              background: "#ECEBF8",
              borderRadius: "12px",
              padding: "3px",
              gap: "2px",
            }}
          >
            <button
              type="button"
              id="btn-mode-tap"
              onClick={() => setInteractionMode("tap")}
              style={{
                border: "none",
                padding: "6px 12px",
                borderRadius: "9px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                background: interactionMode === "tap" ? "#6C63FF" : "transparent",
                color: interactionMode === "tap" ? "#FFF" : "#555",
                transition: "all 0.15s ease",
              }}
            >
              👆 Tap Mode
            </button>
            <button
              type="button"
              id="btn-mode-slider"
              onClick={() => setInteractionMode("slider")}
              style={{
                border: "none",
                padding: "6px 12px",
                borderRadius: "9px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                background: interactionMode === "slider" ? "#6C63FF" : "transparent",
                color: interactionMode === "slider" ? "#FFF" : "#555",
                transition: "all 0.15s ease",
              }}
            >
              🎚️ Slider Mode
            </button>
          </div>

          {isEditMode && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "999px",
                background: "linear-gradient(135deg, #FFE8E8, #FFF2D6)",
                border: "1.5px solid #FFAA44",
                color: "#9A4400",
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              ✏️ Teacher Edit Mode
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Ask AI Tutor Toggle Button */}
          <button
            type="button"
            id="btn-tutor-toggle"
            onClick={() => {
              const next = !showTutor;
              setShowTutor(next);
              // 'asked_tutor' — first time the student opens the tutor panel
              if (next) {
                emitEvent("asked_tutor", {
                  ...eventOpts,
                  payload: { ...eventOpts.payload, trigger: "simulation_runner" },
                });
              }
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              background: showTutor ? "#6C63FF" : "#FFFFFF",
              border: "1.5px solid #6C63FF",
              borderRadius: "12px",
              color: showTutor ? "#FFFFFF" : "#6C63FF",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(108, 99, 255, 0.12)",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onMouseEnter={(e) => {
              if (!showTutor) e.currentTarget.style.background = "#EEF2FF";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              if (!showTutor) e.currentTarget.style.background = "#FFFFFF";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Sparkles style={{ width: "14px", height: "14px" }} />
            {showTutor ? "Close Tutor" : "Ask AI Tutor"}
          </button>

          {/* Swap Object Action Button */}
          {allowSwap && (
            <button
              type="button"
              id="btn-swap-object"
              onClick={() => openSwapModal("object-0")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                background: "#FFFFFF",
                border: "1.5px solid #6C63FF44",
                borderRadius: "12px",
                color: "#6C63FF",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(108, 99, 255, 0.12)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#6C63FF";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#6C63FF44";
                e.currentTarget.style.transform = "translateY(0)";
              }}
              title="Replace an object in the scene live without altering scenario rules"
            >
              🔄 Swap Object
            </button>
          )}

          {/* Teacher Save to Module Button */}
          {isEditMode && (
            <button
              type="button"
              id="btn-save-module-config"
              onClick={handleSaveToModule}
              disabled={isSaving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                background: saveSuccess ? "#00B894" : "linear-gradient(135deg, #6C63FF 0%, #4B44C9 100%)",
                border: "none",
                borderRadius: "12px",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 700,
                cursor: isSaving ? "wait" : "pointer",
                boxShadow: "0 3px 10px rgba(108, 99, 255, 0.25)",
                transition: "all 0.2s ease",
              }}
            >
              {isSaving ? "⏳ Saving…" : saveSuccess ? "✓ Saved to Module!" : "💾 Save to Module"}
            </button>
          )}
        </div>
      </div>

      {/* ── Save Notification Banners ────────────────────────── */}
      {saveSuccess && (
        <div
          role="status"
          style={{
            padding: "10px 16px",
            marginBottom: "12px",
            background: "#E6FBF5",
            border: "1.5px solid #00B894",
            borderRadius: "12px",
            color: "#007A5E",
            fontSize: "13px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            animation: "simFadeSlide 0.3s ease both",
          }}
        >
          ✅ Scenario configuration successfully saved back to the modules table!
        </div>
      )}

      {saveError && (
        <div
          role="alert"
          style={{
            padding: "10px 16px",
            marginBottom: "12px",
            background: "#FFF0F0",
            border: "1.5px solid #FF6B6B",
            borderRadius: "12px",
            color: "#CC2222",
            fontSize: "13px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ⚠️ Error saving configuration: {saveError}
        </div>
      )}

      {/* ── Question card ──────────────────────────────────────── */}
      <div style={questionCardStyle}>
        <p style={questionTextStyle} role="heading" aria-level={2}>
          {question}
        </p>
        {attemptsLeft < maxAttempts && attemptsLeft > 0 && phase === "idle" && (
          <AttemptDots total={maxAttempts} remaining={attemptsLeft} />
        )}
      </div>

      {/* ── Canvas area ────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          borderRadius: "20px",
          background: currentConfig.background,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          overflow: "hidden",
          border: phase === "correct" ? "2.5px solid #6C63FF" : "2.5px solid rgba(0,0,0,0.06)",
          transition: "border-color 0.3s",
        }}
      >
        {/* Loading skeleton */}
        {(isLoading || phase === "loading") && <SkeletonCanvas />}

        {/* Main scene */}
        {!isLoading && phase !== "loading" && (
          <SimulationScene
            config={{
              ...currentConfig,
              seeker: {
                ...currentConfig.seeker,
                x: seekerPosX,
                y: seekerPosY,
              },
            }}
            assetMap={assetMap}
            selectedSlug={selectedSlug}
            selectedIndex={selectedIndex}
            phase={phase}
            showLabels={showLabels}
            showDistanceLabels={showDistanceLabels}
            showPropertyLabels={showPropertyLabels}
            onTap={handleTap}
            shakingIndex={shakingIndex}
          />
        )}

        {/* Correct feedback overlays */}
        {phase === "correct" && (
          <>
            <ConfettiBurst />
            <CheckmarkOverlay label={successMsg} />
          </>
        )}

        {/* Incorrect feedback */}
        {phase === "incorrect" && (
          <IncorrectFeedback
            hint={attemptsLeft > 1 ? undefined : hint}
            attemptsLeft={attemptsLeft - 1}
          />
        )}

        {/* Revealed: show correct answer label */}
        {phase === "revealed" && (
          <div
            role="alert"
            style={{
              position: "absolute",
              bottom: "12px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(255,255,255,0.96)",
              border: "2px solid #FFD166",
              borderRadius: "16px",
              padding: "10px 22px",
              fontSize: "14px",
              fontWeight: 700,
              color: "#7A6000",
              whiteSpace: "nowrap",
              animation: "simFadeSlide 0.3s ease both",
              boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
            }}
          >
            💡 The answer was: <strong>{findCorrectLabel(currentConfig)}</strong>
          </div>
        )}
      </div>

      {/* ── Slider Mode Interactive Panel ───────────────────────── */}
      {interactionMode === "slider" && (
        <div
          style={{
            marginTop: "16px",
            background: "#FFFFFF",
            borderRadius: "16px",
            padding: "16px 20px",
            border: "1.5px solid #6C63FF33",
            boxShadow: "0 4px 16px rgba(108, 99, 255, 0.08)",
            animation: "simFadeSlide 0.25s ease both",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#1A1A2E" }}>
              🎚️ Live Mathematical Breakdown & Sliders
            </h3>
            <span style={{ fontSize: "12px", color: "#6C63FF", fontWeight: 700 }}>
              Matches Tap Mode Output
            </span>
          </div>

          {/* Spatial Distance Sliders */}
          {isSpatialRule && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "14px" }}>
              <div>
                <label style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, color: "#555", marginBottom: "4px" }}>
                  <span>Seeker X Position:</span>
                  <span style={{ fontFamily: "monospace" }}>{seekerPosX.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={seekerPosX}
                  onChange={(e) => setSeekerPosX(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#6C63FF", cursor: "pointer" }}
                />
              </div>
              <div>
                <label style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, color: "#555", marginBottom: "4px" }}>
                  <span>Seeker Y Position:</span>
                  <span style={{ fontFamily: "monospace" }}>{seekerPosY.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={seekerPosY}
                  onChange={(e) => setSeekerPosY(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#6C63FF", cursor: "pointer" }}
                />
              </div>
            </div>
          )}

          {/* Mass / Gravity Sliders */}
          {isMassRule && (
            <div style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#555" }}>
                  Local Gravity Field \(g\): <strong style={{ fontFamily: "monospace" }}>{gravityG.toFixed(2)} m/s²</strong>
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {[
                    { name: "Moon", g: 1.62 },
                    { name: "Mars", g: 3.71 },
                    { name: "Earth", g: 9.81 },
                    { name: "Jupiter", g: 24.79 },
                  ].map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setGravityG(p.g)}
                      style={{
                        padding: "3px 8px",
                        fontSize: "11px",
                        fontWeight: 700,
                        borderRadius: "6px",
                        border: "1px solid #DDD",
                        background: Math.abs(gravityG - p.g) < 0.05 ? "#6C63FF" : "#F4F4F8",
                        color: Math.abs(gravityG - p.g) < 0.05 ? "#FFF" : "#444",
                        cursor: "pointer",
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="range"
                min="0.5"
                max="30"
                step="0.1"
                value={gravityG}
                onChange={(e) => setGravityG(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "#6C63FF", cursor: "pointer" }}
              />
            </div>
          )}

          {/* Real-time Math Ranking Table */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
            {rankedItems.map((item, rIdx) => {
              const isBest = rIdx === 0;
              return (
                <div
                  key={item.index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    background: isBest ? "rgba(108, 99, 255, 0.10)" : "#F9F9FC",
                    border: isBest ? "1.5px solid #6C63FF" : "1px solid #E8E8EE",
                    fontSize: "13px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 800, color: isBest ? "#6C63FF" : "#777" }}>
                      #{rIdx + 1}
                    </span>
                    <strong style={{ color: "#1A1A2E" }}>{item.label}</strong>
                    <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#555" }}>
                      ({item.formulaText})
                    </span>
                  </div>
                  {isBest && (
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#6C63FF", textTransform: "uppercase" }}>
                      ⭐ Top Match
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action button to select the calculated winner */}
          {sliderWinner && (
            <button
              type="button"
              id="btn-submit-slider-answer"
              disabled={phase !== "idle"}
              onClick={() => handleTap(sliderWinner.slug, sliderWinner.index)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "12px",
                background: phase === "idle" ? "linear-gradient(135deg, #6C63FF 0%, #4B44C9 100%)" : "#DDD",
                border: "none",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: "14px",
                cursor: phase === "idle" ? "pointer" : "default",
                boxShadow: phase === "idle" ? "0 4px 12px rgba(108, 99, 255, 0.25)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              🎯 Select Calculated Result: {sliderWinner.label}
            </button>
          )}
        </div>
      )}

      {/* ── API error notice ───────────────────────────────────── */}
      {error && (
        <p style={{ marginTop: "10px", color: "#CC2222", fontSize: "13px", textAlign: "center" }}>
          ⚠️ Could not load assets: {error}
        </p>
      )}

      {/* ── Done state ─────────────────────────────────────────── */}
      {phase === "done" && (
        <div style={{ textAlign: "center", marginTop: "16px", animation: "simFadeSlide 0.4s ease both" }}>
          <p style={{ color: "#6C63FF", fontWeight: 800, fontSize: "16px", margin: 0 }}>
            Simulation complete — {totalAttempts === 1 ? "first try! 🌟" : `${totalAttempts} attempts`}
          </p>
        </div>
      )}

      {/* ── Asset Picker Modal for Object Swapping ─────────────── */}
      {swapModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="swap-modal-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(10, 10, 30, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            boxSizing: "border-box",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSwapModalOpen(false);
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "840px",
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              overflow: "hidden",
              animation: "simModalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px 16px",
                borderBottom: "1px solid #ECECF4",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "20px" }}>🔄</span>
                  <h2
                    id="swap-modal-title"
                    style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#1A1A2E" }}
                  >
                    Swap Simulation Object
                  </h2>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#666" }}>
                  Choose which scene entity to replace, then select any asset from the registry.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSwapModalOpen(false)}
                aria-label="Close modal"
                style={{
                  background: "#F2F2FA",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  fontSize: "18px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#666",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#E4E4F5";
                  e.currentTarget.style.color = "#1A1A2E";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#F2F2FA";
                  e.currentTarget.style.color = "#666";
                }}
              >
                ✕
              </button>
            </div>

            {/* Entity Target Selector Bar */}
            <div
              style={{
                padding: "12px 24px",
                background: "#F8F8FC",
                borderBottom: "1px solid #ECECF4",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                overflowX: "auto",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 800, color: "#777", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                Target Entity:
              </span>

              {/* Seeker Option */}
              <button
                type="button"
                onClick={() => setSelectedTargetKey("seeker")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "999px",
                  border: selectedTargetKey === "seeker" ? "2px solid #6C63FF" : "1.5px solid #DDD",
                  background: selectedTargetKey === "seeker" ? "#6C63FF15" : "#FFFFFF",
                  color: selectedTargetKey === "seeker" ? "#6C63FF" : "#444",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                🎯 Seeker: {currentConfig.seeker.label} ({currentConfig.seeker.assetSlug})
              </button>

              {/* Target Objects Options */}
              {currentConfig.objects.map((obj, idx) => {
                const key = `object-${idx}`;
                const isSelected = selectedTargetKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedTargetKey(key)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "999px",
                      border: isSelected ? "2px solid #6C63FF" : "1.5px solid #DDD",
                      background: isSelected ? "#6C63FF15" : "#FFFFFF",
                      color: isSelected ? "#6C63FF" : "#444",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s",
                    }}
                  >
                    📦 #{idx + 1} {obj.label} ({obj.assetSlug})
                  </button>
                );
              })}
            </div>

            {/* Modal Body with AssetPicker */}
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
              <AssetPicker
                assets={registryAssets}
                isLoading={isLoadingRegistry}
                selectedId={null}
                onSelect={handleSelectSwapAsset}
                searchPlaceholder="Search asset to swap (e.g. ball, tree, rocket, planet)…"
              />
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
      {showTutor && (
        <div style={{ width: "380px", height: "650px", position: "sticky", top: "20px", flexShrink: 0 }}>
          <TutorChat
            topic={cleanedTopic}
            subject={resolvedSubject}
            tier={tier}
            token={authToken}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7.  Helpers
// ─────────────────────────────────────────────────────────────────────────────

function findCorrectLabel(config: SimulationConfig): string {
  const winIdx = findCorrectIndex(config);
  return config.objects[winIdx]?.label ?? "Unknown";
}

// ─────────────────────────────────────────────────────────────────────────────
// 8.  Styles (objects)
// ─────────────────────────────────────────────────────────────────────────────

const questionCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.95)",
  border: "1.5px solid rgba(108,99,255,0.2)",
  borderRadius: "16px",
  padding: "16px 24px",
  marginBottom: "16px",
  boxShadow: "0 2px 12px rgba(108,99,255,0.08)",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  alignItems: "center",
  textAlign: "center",
};

const questionTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(16px, 2.5vw, 20px)",
  fontWeight: 800,
  color: "#1A1A2E",
  lineHeight: 1.4,
  letterSpacing: "-0.01em",
};
