/**
 * Formula Evaluation Engine
 *
 * Safe mathematical expression parser and evaluator using mathjs.
 * Implements FormulaConfig type usage with comprehensive error handling
 * for invalid syntax, undefined variables, and division by zero.
 */

import { compile, parse } from "mathjs";
import type { FormulaConfig } from "@edusim/shared-types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type FormulaErrorCode =
  | "EMPTY_EXPRESSION"
  | "SYNTAX_ERROR"
  | "DIV_BY_ZERO"
  | "MISSING_VARIABLE"
  | "INVALID_VALUE"
  | "EVALUATION_ERROR";

export interface FormulaEvaluationSuccess {
  success: true;
  expression: string;
  targetVariable?: string;
  result: number;
  formattedResult: string;
  variablesUsed: Record<string, number>;
}

export interface FormulaEvaluationFailure {
  success: false;
  expression: string;
  targetVariable?: string;
  error: string;
  errorCode: FormulaErrorCode;
}

export type FormulaEvaluationResult =
  | FormulaEvaluationSuccess
  | FormulaEvaluationFailure;

export interface EvaluateFormulaOptions {
  /** Decimal places for formatted output (default: 4 or from FormulaConfig.precision). */
  precision?: number;
  /** If true, treats division by zero strictly as an error instead of Infinity. Default: true. */
  strictDivisionByZero?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes expression syntax:
 *   - Converts unicode multiplication (×, ·) to *
 *   - Converts unicode division (÷) to /
 *   - Normalizes superscripts (², ³) to ^2, ^3
 */
export function normalizeFormulaExpression(raw: string): {
  targetVariable?: string;
  evaluableExpression: string;
} {
  let cleaned = (raw || "").trim();

  // Normalize common mathematical unicode symbols
  cleaned = cleaned
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/−/g, "-");

  // Check if expression is an equation like "v = u + a * t"
  if (cleaned.includes("=")) {
    const parts = cleaned.split("=");
    if (parts.length === 2) {
      const left = parts[0].trim();
      const right = parts[1].trim();

      // Check if left side is a valid variable identifier (e.g. "v" or "s" or "F_net")
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(left)) {
        return {
          targetVariable: left,
          evaluableExpression: right,
        };
      }
    }
  }

  return {
    evaluableExpression: cleaned,
  };
}

/**
 * Formats a numeric result according to specified decimal precision.
 */
export function formatResultPrecision(val: number, precision: number = 4): string {
  if (!Number.isFinite(val)) return String(val);
  const rounded = Number(Math.round(Number(`${val}e+${precision}`)) + `e-${precision}`);
  return String(rounded);
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Evaluation API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates a single formula expression against a variables record.
 *
 * @param rawExpression - Math expression string (e.g. "u + a * t" or "v = u + a * t")
 * @param variables     - Record of numeric variable values (e.g. { u: 0, a: 9.8, t: 3 })
 * @param options       - Optional precision and strictness settings
 * @returns FormulaEvaluationResult with success status, numeric result, or error code
 */
export function evaluateFormula(
  rawExpression: string,
  variables: Record<string, number | unknown> = {},
  options: EvaluateFormulaOptions = {}
): FormulaEvaluationResult {
  const { precision = 4, strictDivisionByZero = true } = options;

  if (!rawExpression || !rawExpression.trim()) {
    return {
      success: false,
      expression: rawExpression,
      error: "Expression is empty",
      errorCode: "EMPTY_EXPRESSION",
    };
  }

  const { targetVariable, evaluableExpression } = normalizeFormulaExpression(rawExpression);

  if (!evaluableExpression) {
    return {
      success: false,
      expression: rawExpression,
      targetVariable,
      error: "No evaluable expression found",
      errorCode: "EMPTY_EXPRESSION",
    };
  }

  // 1. Parse and compile expression with mathjs
  let compiled: any;
  let parsedTree: any;

  try {
    parsedTree = parse(evaluableExpression);
    compiled = compile(evaluableExpression);
  } catch (err) {
    return {
      success: false,
      expression: rawExpression,
      targetVariable,
      error: err instanceof Error ? err.message : "Syntax error in expression",
      errorCode: "SYNTAX_ERROR",
    };
  }

  // 2. Validate referenced variable symbols in expression
  const symbols = new Set<string>();
  try {
    parsedTree.traverse((node: any) => {
      if (node.isSymbolNode && typeof node.name === "string") {
        // Exclude math constants like 'e', 'pi', 'PI', 'i' if not overridden
        const reserved = new Set(["pi", "PI", "e", "E", "i", "Infinity", "NaN", "true", "false"]);
        if (!reserved.has(node.name)) {
          symbols.add(node.name);
        }
      }
    });
  } catch {
    // Ignore traversal issues and let evaluation handle symbol resolution
  }

  const cleanScope: Record<string, number> = {};
  for (const sym of symbols) {
    const val = variables[sym];
    if (val === undefined || val === null || val === "") {
      return {
        success: false,
        expression: rawExpression,
        targetVariable,
        error: `Missing value for variable '${sym}'`,
        errorCode: "MISSING_VARIABLE",
      };
    }

    const numVal = Number(val);
    if (!Number.isFinite(numVal)) {
      return {
        success: false,
        expression: rawExpression,
        targetVariable,
        error: `Variable '${sym}' must be a finite number, received: ${val}`,
        errorCode: "INVALID_VALUE",
      };
    }

    cleanScope[sym] = numVal;
  }

  // Also include any other passed numeric variables into scope
  for (const [k, v] of Object.entries(variables)) {
    if (typeof v === "number" && Number.isFinite(v) && !(k in cleanScope)) {
      cleanScope[k] = v;
    }
  }

  // 3. Execute evaluation in scope
  try {
    const rawResult = compiled.evaluate(cleanScope);

    // Ensure result is numeric and finite
    const numResult = typeof rawResult === "number" ? rawResult : Number(rawResult);

    if (isNaN(numResult)) {
      return {
        success: false,
        expression: rawExpression,
        targetVariable,
        error: "Calculation resulted in NaN (indeterminate form or division by zero)",
        errorCode: "DIV_BY_ZERO",
      };
    }

    if (!Number.isFinite(numResult)) {
      if (strictDivisionByZero) {
        return {
          success: false,
          expression: rawExpression,
          targetVariable,
          error: "Division by zero encountered in formula",
          errorCode: "DIV_BY_ZERO",
        };
      }
    }

    return {
      success: true,
      expression: rawExpression,
      targetVariable,
      result: numResult,
      formattedResult: formatResultPrecision(numResult, precision),
      variablesUsed: cleanScope,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes("undefined symbol") || msg.toLowerCase().includes("undefined variable")) {
      return {
        success: false,
        expression: rawExpression,
        targetVariable,
        error: msg,
        errorCode: "MISSING_VARIABLE",
      };
    }

    return {
      success: false,
      expression: rawExpression,
      targetVariable,
      error: msg,
      errorCode: "EVALUATION_ERROR",
    };
  }
}

/**
 * Evaluates all formulas defined in a FormulaConfig module.
 *
 * @param config    - FormulaConfig object (e.g. from modules table or curriculum)
 * @param variables - Current variables record
 * @param options   - Evaluation options
 * @returns Array of FormulaEvaluationResult for each configured formula
 */
export function evaluateFormulaConfig(
  config: FormulaConfig,
  variables: Record<string, number | unknown> = {},
  options: EvaluateFormulaOptions = {}
): FormulaEvaluationResult[] {
  const formulas = config.formulas || [];
  const precision = options.precision ?? config.precision ?? 4;

  if (formulas.length === 0) {
    return [];
  }

  return formulas.map((expr) =>
    evaluateFormula(expr, variables, { ...options, precision })
  );
}
