/**
 * FormulaLab — Interactive mathematical equation playground.
 *
 * Renders a full formula experimentation lab from a FormulaConfig:
 *   • Selectable formula list (if multiple configured)
 *   • Live sliders for adjustable variables
 *   • Read-only badges for locked variables (enforced in 'middle' tier)
 *   • Live formula substitution visualization (e.g. "v = 10 + 9.8 * t")
 *   • Real-time graph/chart showing output trend against a selected sweep variable (using Recharts)
 *   • Custom formulas and variable definitions for university level students
 *   • CSV export of parameter sweeps
 *   • Full error diagnostics (syntax, division by zero)
 */

import * as React from "react";
import type { AgeTier } from "@edusim/shared-types";
import { evaluateFormula, FormulaEvaluationResult } from "@edusim/scenario-engine";
import { parse } from "mathjs";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { TutorChat } from "./TutorChat";
import { emitEvent } from "./emitEvent";
import { Sparkles } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// 0. Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface FormulaLabVariable {
  symbol: string;
  label: string;
  unit?: string;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
}

export interface FormulaLabConfig {
  /** List of formula expressions, e.g. ["v = u + a * t"] */
  formulas?: string[];
  /** Definitions for variables in the formulas */
  variables?: FormulaLabVariable[];
  /** Decimal places to round output, default: 2 */
  precision?: number;
  /** Variable symbols to enable plotting against, e.g. ["t"] */
  graphVariables?: string[];
  /** Per-tier customizations */
  tier_rules?: Partial<Record<AgeTier, {
    /** Subset of variables shown as adjustable sliders at this tier */
    variables_shown?: string[];
    /** Tier-specific question or instruction */
    description?: string;
    /** Custom title override */
    title?: string;
    /** Plot a live line chart if true */
    show_graph?: boolean;
    /** Let the student type custom math expressions if true */
    custom_formula?: boolean;
    /** Enable export CSV button if true */
    export_csv?: boolean;
  }>>;
}

export interface FormulaLabProps {
  config: FormulaLabConfig;
  tier: AgeTier;
  onValueChange?: (values: Record<string, number>) => void;
  subject?: string;
  topic?: string;
  token?: string | null;
  apiBaseUrl?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CSS Injection
// ─────────────────────────────────────────────────────────────────────────────

let cssInjected = false;
function injectLabCSS() {
  if (cssInjected || typeof document === "undefined") return;
  cssInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    .fl-container {
      font-family: 'Nunito', 'Poppins', system-ui, sans-serif;
      width: 100%;
      max-width: 960px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 1px solid #ECECF4;
      border-radius: 24px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.04);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .fl-header {
      padding: 24px;
      background: linear-gradient(180deg, #F9F9FC 0%, #FFFFFF 100%);
      border-bottom: 1px solid #ECECF4;
    }
    .fl-title {
      margin: 0;
      font-size: 24px;
      font-weight: 900;
      color: #1A1A2E;
      letter-spacing: -0.02em;
    }
    .fl-subtitle {
      margin: 6px 0 0;
      font-size: 14px;
      color: #666;
      line-height: 1.5;
    }
    .fl-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      padding: 24px;
    }
    @media (min-width: 768px) {
      .fl-grid {
        grid-template-columns: 1.1fr 0.9fr;
      }
    }
    .fl-panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .fl-section-title {
      margin: 0 0 4px;
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #888;
    }
    .fl-card {
      background: #FFFFFF;
      border: 1.5px solid #F0F0F5;
      border-radius: 16px;
      padding: 16px;
      transition: all 0.2s ease;
    }
    .fl-card:hover {
      border-color: #E2E2EC;
    }
    .fl-slider-group {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .fl-slider-row {
      background: #F9F9FC;
      border: 1.5px solid #F0F0F5;
      border-radius: 16px;
      padding: 14px 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      transition: all 0.2s ease;
    }
    .fl-slider-row:hover {
      border-color: #6C63FF44;
      background: #FDFDFF;
    }
    .fl-slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .fl-slider-label {
      font-weight: 800;
      font-size: 14px;
      color: #1A1A2E;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .fl-slider-symbol {
      font-family: 'Cambria', 'Georgia', serif;
      font-style: italic;
      color: #6C63FF;
      font-weight: 700;
      background: #6C63FF10;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 13px;
    }
    .fl-slider-inputs {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .fl-range-input {
      flex: 1;
      height: 6px;
      border-radius: 3px;
      background: #E4E4ED;
      outline: none;
      -webkit-appearance: none;
      accent-color: #6C63FF;
      cursor: pointer;
    }
    .fl-number-input {
      width: 80px;
      padding: 6px 10px;
      border: 1.5px solid #E4E4ED;
      border-radius: 10px;
      font-family: monospace;
      font-size: 13px;
      font-weight: 700;
      text-align: right;
      color: #1A1A2E;
      outline: none;
    }
    .fl-number-input:focus {
      border-color: #6C63FF;
      box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.1);
    }
    .fl-unit {
      font-size: 12px;
      color: #888;
      font-weight: 600;
      min-width: 30px;
    }
    .fl-locked-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .fl-locked-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: #F4F4F8;
      border: 1.5px dashed #E2E2EC;
      border-radius: 12px;
      font-size: 13px;
      color: #666;
    }
    .fl-locked-val {
      font-family: monospace;
      font-weight: 700;
      color: #333;
    }
    .fl-formula-display {
      background: #1A1A2E;
      color: #FFFFFF;
      border-radius: 20px;
      padding: 24px;
      text-align: center;
      position: relative;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(26, 26, 46, 0.12);
    }
    .fl-formula-math {
      font-size: clamp(20px, 4vw, 26px);
      font-weight: 800;
      font-family: 'Cambria', 'Georgia', serif;
      letter-spacing: 0.02em;
      margin: 8px 0;
      word-wrap: break-word;
    }
    .fl-formula-sub {
      font-size: clamp(14px, 2.5vw, 17px);
      color: #A5A5C5;
      font-family: 'Cambria', 'Georgia', serif;
      font-style: italic;
      margin-top: 12px;
      border-top: 1px dashed rgba(255, 255, 255, 0.15);
      padding-top: 12px;
      word-wrap: break-word;
    }
    .fl-result-val {
      font-size: 40px;
      font-weight: 900;
      color: #6C63FF;
      font-family: monospace;
    }
    .fl-result-card {
      background: linear-gradient(135deg, #6C63FF 0%, #4B44C9 100%);
      color: #FFFFFF;
      border-radius: 20px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      text-align: center;
      box-shadow: 0 10px 25px rgba(108, 99, 255, 0.25);
    }
    .fl-result-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(255, 255, 255, 0.85);
    }
    .fl-error-card {
      background: #FFF0F0;
      border: 1.5px solid #FF6B6B;
      color: #CC2222;
      border-radius: 16px;
      padding: 14px 18px;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .fl-tab-bar {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding: 0 24px 12px;
      border-bottom: 1px solid #ECECF4;
      background: #F9F9FC;
    }
    .fl-tab {
      padding: 8px 16px;
      border: 1px solid #E2E2EC;
      background: #FFFFFF;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      color: #555;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }
    .fl-tab:hover {
      border-color: #6C63FF44;
      color: #6C63FF;
    }
    .fl-tab.active {
      background: #6C63FF;
      border-color: #6C63FF;
      color: #FFFFFF;
    }
    .fl-plot-container {
      background: #FFFFFF;
      border: 1.5px solid #F0F0F5;
      border-radius: 20px;
      padding: 16px;
    }
    .fl-plot-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .fl-plot-title {
      font-size: 13px;
      font-weight: 800;
      color: #1A1A2E;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .fl-plot-select {
      font-size: 12px;
      font-weight: 700;
      border: 1.5px solid #E2E2EC;
      border-radius: 8px;
      padding: 4px 8px;
      background: #F9F9FC;
      color: #555;
      outline: none;
    }
    .fl-custom-formula-input {
      width: 100%;
      background: rgba(255, 255, 255, 0.08);
      border: 1.5px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 10px 16px;
      color: #FFFFFF;
      font-family: 'Cambria', 'Georgia', serif;
      font-size: 20px;
      font-weight: 800;
      outline: none;
      text-align: center;
      transition: all 0.2s ease;
    }
    .fl-custom-formula-input:focus {
      border-color: #6C63FF;
      background: rgba(255, 255, 255, 0.12);
      box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.25);
    }
    .fl-var-editor-row {
      background: #F9F9FC;
      border: 1px solid #ECECF4;
      border-radius: 12px;
      padding: 10px 12px;
    }
    .fl-editor-mini-input {
      font-size: 11px;
      font-weight: 700;
      border: 1.5px solid #E2E2EC;
      border-radius: 6px;
      padding: 4px 6px;
      width: 100%;
      background: #FFFFFF;
      color: #333;
      outline: none;
    }
    .fl-editor-mini-input:focus {
      border-color: #6C63FF;
    }
    .fl-editor-label {
      font-size: 9px;
      font-weight: 800;
      color: #999;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .fl-export-btn {
      background: #FFFFFF;
      border: 1.5px solid #6C63FF;
      color: #6C63FF;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 800;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s ease;
    }
    .fl-export-btn:hover {
      background: #6C63FF;
      color: #FFFFFF;
      box-shadow: 0 4px 12px rgba(108, 99, 255, 0.15);
    }
  `;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Helper: Variable Substituter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Replaces symbols in expression with their numeric value formatted nicely.
 */
function substituteVariables(
  formulaStr: string,
  variables: Record<string, number>,
  precision: number = 2
): string {
  if (formulaStr.includes("=")) {
    const parts = formulaStr.split("=");
    if (parts.length === 2) {
      const lhs = parts[0].trim();
      const rhs = parts[1].trim();
      const subRhs = substituteVariablesInExpr(rhs, variables, precision);
      return `${lhs} = ${subRhs}`;
    }
  }
  return substituteVariablesInExpr(formulaStr, variables, precision);
}

function substituteVariablesInExpr(
  exprStr: string,
  variables: Record<string, number>,
  precision: number
): string {
  let display = exprStr;

  // Pretty multiply & powers
  display = display
    .replace(/\*/g, " · ")
    .replace(/\^/g, "") // clean superscript
    .replace(/\/([a-zA-Z0-9_\s().+\-*]+)/g, " / $1");

  // Sort keys descending to avoid partial matches
  const sortedKeys = Object.keys(variables).sort((a, b) => b.length - a.length);

  sortedKeys.forEach((key) => {
    const val = variables[key];
    const formatted = formatResultPrecision(val, precision);
    const regex = new RegExp(`\\b${key}\\b`, "g");
    display = display.replace(regex, formatted);
  });

  return display;
}

function formatResultPrecision(val: number, precision: number): string {
  if (!Number.isFinite(val)) return String(val);
  const rounded = Number(Math.round(Number(`${val}e+${precision}`)) + `e-${precision}`);
  return String(rounded);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. FormulaLab Component
// ─────────────────────────────────────────────────────────────────────────────

export function FormulaLab({
  config,
  tier,
  onValueChange,
  subject,
  topic,
  token = null,
  apiBaseUrl = "",
}: FormulaLabProps) {
  const [showTutor, setShowTutor] = React.useState(false);
  React.useEffect(() => {
    injectLabCSS();
  }, []);

  // SSR Safe Client detection
  const [isClient, setIsClient] = React.useState(false);
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const formulas = config.formulas || ["v = u + a * t"];
  const allVariables = config.variables || [];
  const precision = config.precision ?? 2;

  // Resolve tier rules
  const tierRules = config.tier_rules?.[tier] || {};
  const description = tierRules.description || `Explore this equation using adjustable sliders.`;
  const title = tierRules.title || `Interactive Formula Laboratory`;
  const showGraph = tierRules.show_graph === true;

  const resolvedSubject = subject || (config as any).subject || "Mathematics";
  const resolvedTopic = topic || (config as any).topic || title || "Formula Lab";

  // Session event base options (stable reference for fire-and-forget calls)
  const eventOpts = React.useMemo(() => ({
    token,
    payload: { topic: resolvedTopic, subject: resolvedSubject, formula: formulas[0] },
  }), [token, resolvedTopic, resolvedSubject, formulas]);

  // 'started' — fire once when FormulaLab mounts
  React.useEffect(() => {
    emitEvent("started", { ...eventOpts, payload: { ...eventOpts.payload, tier } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Active formula state (if custom_formula is enabled, bind to editable customFormulaStr)
  const [activeFormulaIdx, setActiveFormulaIdx] = React.useState<number>(0);
  const [customFormulaStr, setCustomFormulaStr] = React.useState<string>(
    formulas[activeFormulaIdx] || formulas[0]
  );

  const rawActiveFormula = React.useMemo(() => {
    if (tierRules.custom_formula) {
      return customFormulaStr;
    }
    return formulas[activeFormulaIdx] || formulas[0];
  }, [tierRules.custom_formula, customFormulaStr, formulas, activeFormulaIdx]);

  // Sync custom formula text when selecting a different preset (if custom formula is enabled)
  React.useEffect(() => {
    const nextPreset = formulas[activeFormulaIdx] || formulas[0];
    setCustomFormulaStr(nextPreset);
  }, [activeFormulaIdx, formulas]);

  // Variables definitions state (dynamically updated if custom_formula is enabled)
  const [customVariables, setCustomVariables] = React.useState<FormulaLabVariable[]>(allVariables);

  React.useEffect(() => {
    if (!tierRules.custom_formula) {
      setCustomVariables(allVariables);
      return;
    }

    // Parse the current custom formula expression to automatically extract variable symbols
    let parsedTarget = "";
    let evaluable = rawActiveFormula;
    if (rawActiveFormula.includes("=")) {
      const parts = rawActiveFormula.split("=");
      parsedTarget = parts[0].trim();
      evaluable = parts[1];
    }

    const symbols = new Set<string>();
    try {
      const parsedTree = parse(evaluable);
      parsedTree.traverse((node: any) => {
        if (node.isSymbolNode && typeof node.name === "string") {
          const reserved = new Set(["pi", "PI", "e", "E", "i", "Infinity", "NaN", "true", "false"]);
          if (!reserved.has(node.name) && node.name !== parsedTarget) {
            symbols.add(node.name);
          }
        }
      });
    } catch {
      // Ignore syntax errors during active typing
    }

    setCustomVariables((prev) => {
      const nextVars: FormulaLabVariable[] = [];
      symbols.forEach((symbol) => {
        const existing = prev.find((v) => v.symbol === symbol) || allVariables.find((v) => v.symbol === symbol);
        if (existing) {
          nextVars.push(existing);
        } else {
          nextVars.push({
            symbol,
            label: symbol,
            defaultValue: 1,
            min: 0,
            max: 100,
            step: 1,
            unit: "",
          });
        }
      });
      return nextVars;
    });
  }, [rawActiveFormula, tierRules.custom_formula, allVariables]);

  const resolvedVariables = React.useMemo(() => {
    if (tierRules.custom_formula) {
      return customVariables;
    }
    return allVariables;
  }, [tierRules.custom_formula, customVariables, allVariables]);

  // Variables shown: fallback to all resolved symbols if none specified
  const variablesShown = React.useMemo(() => {
    if (tierRules.variables_shown) {
      return tierRules.variables_shown;
    }
    let parsedTarget = "";
    if (rawActiveFormula.includes("=")) {
      parsedTarget = rawActiveFormula.split("=")[0].trim();
    }
    return resolvedVariables
      .map((v) => v.symbol)
      .filter((symbol) => symbol !== parsedTarget);
  }, [tierRules.variables_shown, resolvedVariables, rawActiveFormula]);

  // Sliders to render
  const slidersToRender = React.useMemo(() => {
    return resolvedVariables.filter((v) => variablesShown.includes(v.symbol));
  }, [resolvedVariables, variablesShown]);

  // Locked parameters
  const lockedToRender = React.useMemo(() => {
    return resolvedVariables.filter(
      (v) => !variablesShown.includes(v.symbol) && tier === "middle"
    );
  }, [resolvedVariables, variablesShown, tier]);

  // Initial variables state
  const [values, setValues] = React.useState<Record<string, number>>(() => {
    const initialValues: Record<string, number> = {};
    allVariables.forEach((v) => {
      initialValues[v.symbol] = v.defaultValue;
    });
    return initialValues;
  });

  React.useEffect(() => {
    const initialValues: Record<string, number> = {};
    resolvedVariables.forEach((v) => {
      initialValues[v.symbol] = v.defaultValue;
    });
    setValues(initialValues);
  }, [resolvedVariables]);

  // Enforce locked variables in 'middle' tier
  const activeValues = React.useMemo(() => {
    const resolved = { ...values };
    if (tier === "middle") {
      resolvedVariables.forEach((v) => {
        const isShown = variablesShown.includes(v.symbol);
        if (!isShown) {
          resolved[v.symbol] = v.defaultValue;
        }
      });
    }
    return resolved;
  }, [values, tier, resolvedVariables, variablesShown]);

  // Value change handler — also emits 'answered' to record the student exploring
  const handleValChange = React.useCallback((symbol: string, val: number) => {
    if (tier === "middle" && !variablesShown.includes(symbol)) {
      return;
    }
    const nextValues = { ...values, [symbol]: val };
    setValues(nextValues);
    onValueChange?.(nextValues);
    // 'answered' — student adjusted a slider (fire-and-forget, no await)
    emitEvent("answered", {
      ...eventOpts,
      payload: { ...eventOpts.payload, symbol, value: val },
    });
  }, [values, tier, variablesShown, onValueChange, eventOpts]);

  // Edit university level variables properties
  const updateCustomVariable = (symbol: string, field: keyof FormulaLabVariable, val: any) => {
    setCustomVariables((prev) =>
      prev.map((v) => {
        if (v.symbol === symbol) {
          const updated = { ...v, [field]: val };
          if (field === "defaultValue") {
            setValues((prevVals) => ({ ...prevVals, [symbol]: Number(val) }));
          }
          return updated;
        }
        return v;
      })
    );
  };

  // Math recomputation
  const evaluation: FormulaEvaluationResult = React.useMemo(() => {
    return evaluateFormula(rawActiveFormula, activeValues, { precision });
  }, [rawActiveFormula, activeValues, precision]);

  // Graph/Plotting state
  const plotVariableOpts = React.useMemo(() => {
    return config.graphVariables || variablesShown;
  }, [config.graphVariables, variablesShown]);

  const [plotVariable, setPlotVariable] = React.useState<string>(() => {
    const opts = config.graphVariables || variablesShown;
    return opts.length > 0 ? opts[0] : "";
  });

  React.useEffect(() => {
    if (plotVariableOpts.length > 0 && !plotVariableOpts.includes(plotVariable)) {
      setPlotVariable(plotVariableOpts[0]);
    }
  }, [plotVariableOpts, plotVariable]);

  // Generate plotting data points
  const plotDataPoints = React.useMemo(() => {
    if (!plotVariable) return [];
    const targetVar = resolvedVariables.find((v) => v.symbol === plotVariable);
    if (!targetVar) return [];

    const points: { valX: number; valY: number }[] = [];
    const steps = 40;
    const range = targetVar.max - targetVar.min;
    const increment = range / steps;

    for (let i = 0; i <= steps; i++) {
      const valX = targetVar.min + increment * i;
      const testScope = { ...activeValues, [plotVariable]: valX };
      const res = evaluateFormula(rawActiveFormula, testScope, { precision });

      if (res.success && Number.isFinite(res.result)) {
        points.push({ valX, valY: res.result });
      }
    }
    return points;
  }, [plotVariable, activeValues, rawActiveFormula, resolvedVariables, precision]);

  const activeResultUnit = React.useMemo(() => {
    let target = "";
    if (rawActiveFormula.includes("=")) {
      target = rawActiveFormula.split("=")[0].trim();
    }
    return resolvedVariables.find((v) => v.symbol === target)?.unit || "";
  }, [rawActiveFormula, resolvedVariables]);

  // CSV Sweep exporter
  const handleExportCSV = React.useCallback(() => {
    if (!plotVariable) return;
    const targetVar = resolvedVariables.find((v) => v.symbol === plotVariable);
    if (!targetVar) return;

    let csvContent = `${plotVariable},${evaluation.targetVariable || "output"}\n`;

    const steps = 40;
    const range = targetVar.max - targetVar.min;
    const increment = range / steps;

    for (let i = 0; i <= steps; i++) {
      const valX = targetVar.min + increment * i;
      const testScope = { ...activeValues, [plotVariable]: valX };
      const res = evaluateFormula(rawActiveFormula, testScope, { precision });

      if (res.success && Number.isFinite(res.result)) {
        csvContent += `${valX.toFixed(4)},${res.result.toFixed(precision)}\n`;
      }
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `formula_sweep_${plotVariable}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [plotVariable, resolvedVariables, activeValues, rawActiveFormula, precision, evaluation.targetVariable]);

  return (
    <div style={{ display: "flex", gap: "24px", position: "relative", width: "100%", maxWidth: showTutor ? "1380px" : "960px", margin: "0 auto", alignItems: "flex-start", transition: "max-width 0.3s ease" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="fl-container">
      {/* Tab bar for switching multiple preset formulas */}
      {formulas.length > 1 && (
        <div className="fl-tab-bar">
          {formulas.map((f, idx) => (
            <button
              key={idx}
              className={`fl-tab ${activeFormulaIdx === idx ? "active" : ""}`}
              onClick={() => setActiveFormulaIdx(idx)}
            >
              {f.split("=")[0].trim() || `Formula ${idx + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Main header block */}
      <div className="fl-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 className="fl-title">{title}</h2>
            <p className="fl-subtitle">{description}</p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={() => {
                const next = !showTutor;
                setShowTutor(next);
                if (next) {
                  emitEvent("asked_tutor", {
                    ...eventOpts,
                    payload: { ...eventOpts.payload, trigger: "formula_lab" },
                  });
                }
              }}
              className="fl-tutor-toggle-btn"
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid #6C63FF",
                background: showTutor ? "#6C63FF" : "transparent",
                color: showTutor ? "#FFF" : "#6C63FF",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Sparkles style={{ width: "12px", height: "12px" }} />
              {showTutor ? "Close Tutor" : "Ask AI Tutor"}
            </button>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: "999px",
                background: "#6C63FF15",
                color: "#6C63FF",
                fontWeight: 800,
                fontSize: "12px",
                textTransform: "capitalize",
              }}
            >
              {tier.replace("_", " ")} Tier
            </span>
          </div>
        </div>
      </div>

      <div className="fl-grid">
        {/* Left column: Adjustable sliders + locked read-only section */}
        <div className="fl-panel">
          <div>
            <h4 className="fl-section-title">Adjustable Parameters</h4>
            {slidersToRender.length > 0 ? (
              <div className="fl-slider-group">
                {slidersToRender.map((v) => {
                  const currentVal = activeValues[v.symbol] ?? v.defaultValue;
                  return (
                    <div key={v.symbol} className="fl-slider-row">
                      <div className="fl-slider-header">
                        <label className="fl-slider-label">
                          <span>{v.label}</span>
                          <span className="fl-slider-symbol">{v.symbol}</span>
                        </label>
                        <div className="fl-slider-inputs">
                          <input
                            type="number"
                            min={v.min}
                            max={v.max}
                            step={v.step}
                            className="fl-number-input"
                            value={currentVal}
                            onChange={(e) => {
                              const num = parseFloat(e.target.value);
                              if (!isNaN(num)) handleValChange(v.symbol, num);
                            }}
                          />
                          {v.unit && <span className="fl-unit">{v.unit}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <input
                          type="range"
                          min={v.min}
                          max={v.max}
                          step={v.step}
                          className="fl-range-input"
                          value={currentVal}
                          onChange={(e) => handleValChange(v.symbol, parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="fl-card" style={{ fontSize: "13px", color: "#666" }}>
                No active variables parsed yet. Try typing symbols like <code>x</code> or <code>t</code>.
              </div>
            )}
          </div>

          {/* Locked parameters (Middle tier constraint) */}
          {lockedToRender.length > 0 && (
            <div>
              <h4 className="fl-section-title">🔒 Locked Variables (Level Constants)</h4>
              <div className="fl-locked-group">
                {lockedToRender.map((v) => (
                  <div key={v.symbol} className="fl-locked-badge" title="Locked to its default value">
                    <span>{v.label}:</span>
                    <span className="fl-locked-val">
                      {v.defaultValue} {v.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Interactive formula output + plotting graphs */}
        <div className="fl-panel">
          <div>
            <h4 className="fl-section-title">Formula Visualization</h4>
            <div className="fl-formula-display">
              <div className="fl-result-title">Equation Definition</div>
              {tierRules.custom_formula ? (
                <div style={{ marginTop: "10px", marginBottom: "10px" }}>
                  <input
                    type="text"
                    value={customFormulaStr}
                    onChange={(e) => setCustomFormulaStr(e.target.value)}
                    className="fl-custom-formula-input"
                    placeholder="e.g. v = u + a * t"
                  />
                  <div style={{ fontSize: "11px", color: "#A5A5C5", marginTop: "6px" }}>
                    Type any equation. RHS variables will be dynamically extracted.
                  </div>
                </div>
              ) : (
                <div className="fl-formula-math">{rawActiveFormula}</div>
              )}

              <div className="fl-formula-sub">
                Substituted: {substituteVariables(rawActiveFormula, activeValues, precision)}
              </div>
            </div>
          </div>

          {/* Custom variable definition details (University editor tool) */}
          {tierRules.custom_formula && customVariables.length > 0 && (
            <div className="fl-card">
              <h4 className="fl-section-title" style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                ⚙️ Configure Extracted Variables
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {customVariables.map((v) => (
                  <div key={v.symbol} className="fl-var-editor-row">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", gap: "6px" }}>
                      <span className="fl-slider-symbol">{v.symbol}</span>
                      <input
                        type="text"
                        placeholder="Label"
                        value={v.label}
                        className="fl-editor-mini-input"
                        style={{ width: "130px" }}
                        onChange={(e) => updateCustomVariable(v.symbol, "label", e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Unit"
                        value={v.unit || ""}
                        className="fl-editor-mini-input"
                        style={{ width: "50px" }}
                        onChange={(e) => updateCustomVariable(v.symbol, "unit", e.target.value)}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px" }}>
                      <div>
                        <div className="fl-editor-label">Min</div>
                        <input
                          type="number"
                          value={v.min}
                          className="fl-editor-mini-input"
                          onChange={(e) => updateCustomVariable(v.symbol, "min", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <div className="fl-editor-label">Max</div>
                        <input
                          type="number"
                          value={v.max}
                          className="fl-editor-mini-input"
                          onChange={(e) => updateCustomVariable(v.symbol, "max", parseFloat(e.target.value) || 100)}
                        />
                      </div>
                      <div>
                        <div className="fl-editor-label">Step</div>
                        <input
                          type="number"
                          value={v.step}
                          className="fl-editor-mini-input"
                          onChange={(e) => updateCustomVariable(v.symbol, "step", parseFloat(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <div className="fl-editor-label">Default</div>
                        <input
                          type="number"
                          value={v.defaultValue}
                          className="fl-editor-mini-input"
                          onChange={(e) => updateCustomVariable(v.symbol, "defaultValue", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live computed output card */}
          {evaluation.success ? (
            <div className="fl-result-card">
              <span className="fl-result-title">Calculated Result</span>
              <span className="fl-result-val">
                {evaluation.formattedResult}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255, 255, 255, 0.9)" }}>
                {evaluation.targetVariable || "output"} {activeResultUnit}
              </span>
            </div>
          ) : (
            <div className="fl-error-card">
              <span>⚠️</span>
              <div>
                <strong>Calculation Error:</strong>
                <div style={{ fontSize: "12px", opacity: 0.9 }}>{evaluation.error}</div>
              </div>
            </div>
          )}

          {/* Trend plotting graph (Recharts Chart) */}
          {showGraph && plotVariableOpts.length > 0 && plotDataPoints.length > 0 && (
            <div className="fl-plot-container">
              <div className="fl-plot-header">
                <h4 className="fl-plot-title">Live Trend Chart</h4>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11px", color: "#666", fontWeight: 700 }}>Plot vs:</span>
                    <select
                      className="fl-plot-select"
                      value={plotVariable}
                      onChange={(e) => setPlotVariable(e.target.value)}
                    >
                      {plotVariableOpts.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  {tierRules.export_csv && (
                    <button
                      className="fl-export-btn"
                      onClick={handleExportCSV}
                    >
                      📥 Export CSV
                    </button>
                  )}
                </div>
              </div>

              {isClient ? (
                <div style={{ width: "100%", height: 180, background: "#FDFDFF", border: "1px solid #ECECF4", borderRadius: "12px", padding: "10px 0" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={plotDataPoints.map((p) => ({
                        x: p.valX,
                        output: Number(p.valY.toFixed(precision)),
                      }))}
                      margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ECECF4" />
                      <XAxis
                        dataKey="x"
                        stroke="#888"
                        fontSize={11}
                        tickFormatter={(v) => v.toFixed(1)}
                      />
                      <YAxis stroke="#888" fontSize={11} />
                      <Tooltip
                        contentStyle={{ background: "#1A1A2E", color: "#FFF", borderRadius: 10, border: "none" }}
                        labelFormatter={(label) => `${plotVariable}: ${Number(label).toFixed(2)}`}
                        formatter={(value) => [`${value} ${activeResultUnit}`, "Output"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="output"
                        stroke="#6C63FF"
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <ReferenceLine x={activeValues[plotVariable]} stroke="#6C63FF" strokeDasharray="3 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ width: "100%", height: "180px", background: "#FDFDFF", border: "1px solid #ECECF4", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#888" }}>
                  Loading Live Trend Chart…
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
      </div>
      {showTutor && (
        <div style={{ width: "380px", height: "650px", position: "sticky", top: "20px", flexShrink: 0 }}>
          <TutorChat
            topic={resolvedTopic}
            subject={resolvedSubject}
            tier={tier}
            token={token}
            apiBaseUrl={apiBaseUrl}
          />
        </div>
      )}
    </div>
  );
}
