import { describe, it, expect } from "vitest";
import {
  evaluateFormula,
  evaluateFormulaConfig,
  normalizeFormulaExpression,
  formatResultPrecision,
} from "./formula-eval";
import type { FormulaConfig } from "@edusim/shared-types";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Kinematics Formula: v = u + at
// ─────────────────────────────────────────────────────────────────────────────

describe("Formula Evaluator — v = u + a * t examples", () => {
  it("evaluates v = u + a * t for free fall from rest (u=0, a=9.8, t=3)", () => {
    const result = evaluateFormula("v = u + a * t", { u: 0, a: 9.8, t: 3 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.targetVariable).toBe("v");
      expect(result.result).toBeCloseTo(29.4, 5);
      expect(result.formattedResult).toBe("29.4");
      expect(result.variablesUsed).toEqual({ u: 0, a: 9.8, t: 3 });
    }
  });

  it("evaluates v = u + a * t with deceleration (u=15, a=-2.5, t=4)", () => {
    const result = evaluateFormula("v = u + a * t", { u: 15, a: -2.5, t: 4 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.targetVariable).toBe("v");
      expect(result.result).toBe(5);
      expect(result.formattedResult).toBe("5");
    }
  });

  it("evaluates expression without left-hand assignment ('u + a * t')", () => {
    const result = evaluateFormula("u + a * t", { u: 10, a: 2, t: 5 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.targetVariable).toBeUndefined();
      expect(result.result).toBe(20);
      expect(result.formattedResult).toBe("20");
    }
  });

  it("handles unicode multiplication and subtraction symbols ('v = u + a × t')", () => {
    const result = evaluateFormula("v = u + a × t", { u: 12, a: 3, t: 2 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.result).toBe(18);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. FormulaConfig Type Integration
// ─────────────────────────────────────────────────────────────────────────────

describe("FormulaConfig type usage via evaluateFormulaConfig", () => {
  it("evaluates multiple kinematics formulas in a FormulaConfig module", () => {
    const config: FormulaConfig = {
      formulas: [
        "v = u + a * t",
        "s = u * t + 0.5 * a * t^2",
        "v_sq = u^2 + 2 * a * s",
      ],
      precision: 2,
    };

    const variables = { u: 4, a: 3, t: 2, s: 14 };
    const results = evaluateFormulaConfig(config, variables);

    expect(results).toHaveLength(3);

    // 1. v = 4 + 3 * 2 = 10
    expect(results[0].success).toBe(true);
    if (results[0].success) {
      expect(results[0].targetVariable).toBe("v");
      expect(results[0].result).toBe(10);
      expect(results[0].formattedResult).toBe("10");
    }

    // 2. s = 4 * 2 + 0.5 * 3 * 4 = 8 + 6 = 14
    expect(results[1].success).toBe(true);
    if (results[1].success) {
      expect(results[1].targetVariable).toBe("s");
      expect(results[1].result).toBe(14);
    }

    // 3. v_sq = 4^2 + 2 * 3 * 14 = 16 + 84 = 100
    expect(results[2].success).toBe(true);
    if (results[2].success) {
      expect(results[2].targetVariable).toBe("v_sq");
      expect(results[2].result).toBe(100);
    }
  });

  it("respects FormulaConfig precision setting for decimal rounding", () => {
    const config: FormulaConfig = {
      formulas: ["a = (v - u) / t"],
      precision: 3,
    };

    const results = evaluateFormulaConfig(config, { v: 10, u: 0, t: 3 });
    expect(results[0].success).toBe(true);
    if (results[0].success) {
      expect(results[0].result).toBeCloseTo(3.33333, 4);
      expect(results[0].formattedResult).toBe("3.333");
    }
  });

  it("handles empty formulas array gracefully", () => {
    const config: FormulaConfig = { formulas: [] };
    const results = evaluateFormulaConfig(config, { x: 5 });
    expect(results).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Error Handling: Division by Zero
// ─────────────────────────────────────────────────────────────────────────────

describe("Division by Zero Error Handling", () => {
  it("detects division by zero in simple division ('a / t' with t=0)", () => {
    const result = evaluateFormula("a / t", { a: 10, t: 0 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe("DIV_BY_ZERO");
      expect(result.error).toContain("Division by zero");
    }
  });

  it("detects division by zero in acceleration formula ('a = (v - u) / t' with t=0)", () => {
    const result = evaluateFormula("a = (v - u) / t", { v: 20, u: 5, t: 0 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe("DIV_BY_ZERO");
      expect(result.targetVariable).toBe("a");
    }
  });

  it("detects indeterminate form 0/0 resulting in NaN", () => {
    const result = evaluateFormula("(v - u) / t", { v: 5, u: 5, t: 0 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe("DIV_BY_ZERO");
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Error Handling: Invalid Expressions & Syntax Errors
// ─────────────────────────────────────────────────────────────────────────────

describe("Invalid Expression Error Handling", () => {
  it("rejects empty expression strings", () => {
    const result = evaluateFormula("", { u: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe("EMPTY_EXPRESSION");
    }
  });

  it("rejects expressions with unclosed parentheses", () => {
    const result = evaluateFormula("u + (a * t", { u: 1, a: 2, t: 3 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe("SYNTAX_ERROR");
    }
  });

  it("rejects expressions with consecutive invalid operators", () => {
    const result = evaluateFormula("u + * t", { u: 1, t: 3 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe("SYNTAX_ERROR");
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Error Handling: Missing & Invalid Variables
// ─────────────────────────────────────────────────────────────────────────────

describe("Variable Validation Error Handling", () => {
  it("flags missing variables required by the expression", () => {
    // Formula needs u, a, t; only u and a are provided
    const result = evaluateFormula("u + a * t", { u: 5, a: 2 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe("MISSING_VARIABLE");
      expect(result.error).toContain("t");
    }
  });

  it("flags non-numeric / NaN variable values", () => {
    const result = evaluateFormula("u + a * t", { u: "not_a_number", a: 2, t: 3 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errorCode).toBe("INVALID_VALUE");
      expect(result.error).toContain("finite number");
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

describe("Utility functions", () => {
  it("normalizeFormulaExpression parses equations correctly", () => {
    const eq = normalizeFormulaExpression("  F_net = m × a  ");
    expect(eq.targetVariable).toBe("F_net");
    expect(eq.evaluableExpression).toBe("m * a");
  });

  it("formatResultPrecision formats numbers cleanly", () => {
    expect(formatResultPrecision(29.400001, 2)).toBe("29.4");
    expect(formatResultPrecision(1 / 3, 4)).toBe("0.3333");
  });
});
