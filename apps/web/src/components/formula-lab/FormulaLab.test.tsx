import { describe, it, expect } from "vitest";
import * as React from "react";
import { renderToString } from "react-dom/server";
import { FormulaLab, FormulaLabConfig } from "@edusim/ui";
import velocityFixture from "../../../../../packages/scenario-engine/fixtures/formula-configs/velocity.json";
import forceFixture from "../../../../../packages/scenario-engine/fixtures/formula-configs/force.json";
import circleAreaFixture from "../../../../../packages/scenario-engine/fixtures/formula-configs/circle_area.json";
import simpleInterestFixture from "../../../../../packages/scenario-engine/fixtures/formula-configs/simple_interest.json";
import potentialEnergyFixture from "../../../../../packages/scenario-engine/fixtures/formula-configs/potential_energy.json";

const testConfig: FormulaLabConfig = {
  formulas: ["v = u + a * t"],
  precision: 2,
  variables: [
    { symbol: "u", label: "Initial Velocity", defaultValue: 5, min: 0, max: 20, step: 1, unit: "m/s" },
    { symbol: "a", label: "Acceleration", defaultValue: 9.8, min: 0, max: 20, step: 0.1, unit: "m/s^2" },
    { symbol: "t", label: "Time", defaultValue: 4, min: 0, max: 10, step: 0.5, unit: "s" },
    { symbol: "v", label: "Final Velocity", defaultValue: 0, min: 0, max: 100, step: 1, unit: "m/s" },
  ],
  tier_rules: {
    primary: {
      variables_shown: ["u", "a", "t"],
      description: "Primary school introduction to velocity",
      title: "Fun with Speed",
      show_graph: true,
    },
    middle: {
      variables_shown: ["t"],
      description: "Middle school kinematics with constant acceleration",
      title: "Kinematics Lab",
      show_graph: true,
    },
    university: {
      description: "University-level math sandbox",
      title: "Advanced Sandbox Lab",
      show_graph: true,
      custom_formula: true,
      export_csv: true,
    },
  },
};

describe("<FormulaLab /> UI Component", () => {
  it("renders all variable sliders at primary tier", () => {
    const html = renderToString(
      React.createElement(FormulaLab, {
        config: testConfig,
        tier: "primary",
      })
    );

    // Should render title and description
    expect(html).toContain("Fun with Speed");
    expect(html).toContain("Primary school introduction to velocity");

    // Should render sliders for all three variables
    expect(html).toContain("Initial Velocity");
    expect(html).toContain("Acceleration");
    expect(html).toContain("Time");

    // Should display raw formula and substitution formula with defaults
    expect(html).toContain("v = u + a * t");
    expect(html).toContain("v = 5 + 9.8  ·  4");

    // Computed result: 5 + 9.8 * 4 = 44.20
    expect(html).toContain("44.2");

    // Should render graph trend chart container / placeholder when show_graph is true
    expect(html).toContain("Live Trend Chart");
  });

  it("locks non-shown variables to their default values at middle tier", () => {
    const html = renderToString(
      React.createElement(FormulaLab, {
        config: testConfig,
        tier: "middle",
      })
    );

    // Should render middle-specific title and description
    expect(html).toContain("Kinematics Lab");
    expect(html).toContain("Middle school kinematics with constant acceleration");

    // Should render slider for Time (t) which is in variables_shown
    expect(html).toContain("Time");

    // Should NOT render sliders for Initial Velocity (u) or Acceleration (a)
    // In our implementation, sliders are rendered in a block, locked variables in another.
    // Let's check that Initial Velocity and Acceleration are labeled as locked.
    expect(html).toContain("Locked Variables");
    expect(html).toContain("Initial Velocity");
    expect(html).toContain("Acceleration");

    // Computed result must still be 44.20 using the locked defaults
    expect(html).toContain("44.2");

    // Should render graph trend chart container / placeholder when show_graph is true
    expect(html).toContain("Live Trend Chart");
  });

  it("renders custom formula text input and export CSV button at university tier", () => {
    const html = renderToString(
      React.createElement(FormulaLab, {
        config: testConfig,
        tier: "university",
      })
    );

    // Should render title and description
    expect(html).toContain("Advanced Sandbox Lab");
    expect(html).toContain("University-level math sandbox");

    // Should replace the read-only formula display with an input
    expect(html).toContain("fl-custom-formula-input");

    // Should render CSV export button since export_csv is true
    expect(html).toContain("Export CSV");

    // Should render variables configuration section
    expect(html).toContain("Configure Extracted Variables");
  });

  it("handles missing tier rules by falling back to displaying all sliders", () => {
    const html = renderToString(
      React.createElement(FormulaLab, {
        config: {
          formulas: ["v = u + a * t"],
          variables: testConfig.variables,
        },
        tier: "high_school",
      })
    );

    expect(html).toContain("Initial Velocity");
    expect(html).toContain("Acceleration");
    expect(html).toContain("Time");
  });

  describe("FormulaConfig Fixtures Validation", () => {
    it("renders velocity fixture correctly across tiers", () => {
      const p = renderToString(React.createElement(FormulaLab, { config: velocityFixture as any, tier: "primary" }));
      expect(p).toContain("Kinematics: Velocity Equation");
      expect(p).toContain("Initial Velocity");

      const m = renderToString(React.createElement(FormulaLab, { config: velocityFixture as any, tier: "middle" }));
      expect(m).toContain("Kinematics: Time Sweep");
      expect(m).toContain("Locked Variables");

      const hs = renderToString(React.createElement(FormulaLab, { config: velocityFixture as any, tier: "high_school" }));
      expect(hs).toContain("Kinematics Laboratory");

      const u = renderToString(React.createElement(FormulaLab, { config: velocityFixture as any, tier: "university" }));
      expect(u).toContain("University Kinematics Sandbox");
    });

    it("renders force fixture correctly across tiers", () => {
      const p = renderToString(React.createElement(FormulaLab, { config: forceFixture as any, tier: "primary" }));
      expect(p).toContain("Force and Acceleration");
      expect(p).toContain("Mass");

      const m = renderToString(React.createElement(FormulaLab, { config: forceFixture as any, tier: "middle" }));
      expect(m).toContain("Newton&#x27;s Second Law Lab");

      const hs = renderToString(React.createElement(FormulaLab, { config: forceFixture as any, tier: "high_school" }));
      expect(hs).toContain("Force, Mass &amp; Acceleration Lab");

      const u = renderToString(React.createElement(FormulaLab, { config: forceFixture as any, tier: "university" }));
      expect(u).toContain("Dynamics Sandbox");
    });

    it("renders circle area fixture correctly across tiers", () => {
      const p = renderToString(React.createElement(FormulaLab, { config: circleAreaFixture as any, tier: "primary" }));
      expect(p).toContain("Circle Area Explorer");

      const m = renderToString(React.createElement(FormulaLab, { config: circleAreaFixture as any, tier: "middle" }));
      expect(m).toContain("Geometry Lab: Circles");

      const hs = renderToString(React.createElement(FormulaLab, { config: circleAreaFixture as any, tier: "high_school" }));
      expect(hs).toContain("Circle Area Laboratory");

      const u = renderToString(React.createElement(FormulaLab, { config: circleAreaFixture as any, tier: "university" }));
      expect(u).toContain("Geometry Sandbox");
    });

    it("renders simple interest fixture correctly across tiers", () => {
      const p = renderToString(React.createElement(FormulaLab, { config: simpleInterestFixture as any, tier: "primary" }));
      expect(p).toContain("Simple Interest Explorer");

      const m = renderToString(React.createElement(FormulaLab, { config: simpleInterestFixture as any, tier: "middle" }));
      expect(m).toContain("Simple Interest Growth");

      const hs = renderToString(React.createElement(FormulaLab, { config: simpleInterestFixture as any, tier: "high_school" }));
      expect(hs).toContain("Interest &amp; Finance Lab");

      const u = renderToString(React.createElement(FormulaLab, { config: simpleInterestFixture as any, tier: "university" }));
      expect(u).toContain("Finance Sandbox");
    });

    it("renders potential energy fixture correctly across tiers", () => {
      const p = renderToString(React.createElement(FormulaLab, { config: potentialEnergyFixture as any, tier: "primary" }));
      expect(p).toContain("Height and Energy");

      const m = renderToString(React.createElement(FormulaLab, { config: potentialEnergyFixture as any, tier: "middle" }));
      expect(m).toContain("Gravitational Potential Energy");

      const hs = renderToString(React.createElement(FormulaLab, { config: potentialEnergyFixture as any, tier: "high_school" }));
      expect(hs).toContain("Potential Energy Laboratory");

      const u = renderToString(React.createElement(FormulaLab, { config: potentialEnergyFixture as any, tier: "university" }));
      expect(u).toContain("Energy Sandbox");
    });
  });
});
