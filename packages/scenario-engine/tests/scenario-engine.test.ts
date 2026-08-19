import { describe, it, expect } from "vitest";
import {
  validateScenarioConfig,
  evaluateAnswer,
  getQuestionForTier,
  findCorrectIndex,
  SimulationConfig,
} from "../src/index";
import type { AgeTier } from "@edusim/shared-types";

import nearestTree from "../fixtures/nearest-tree-to-bird.json";
import farthestPlanet from "../fixtures/farthest-planet-from-rocket.json";
import heaviestObject from "../fixtures/heaviest-object-on-scale.json";

const ALL_TIERS: AgeTier[] = ["primary", "middle", "high_school", "university"];

// ─────────────────────────────────────────────────────────────────────────────
// 1. Fixture validation across all 3 scenarios
// ─────────────────────────────────────────────────────────────────────────────

describe("SimulationConfig fixture validation", () => {
  it("nearest-tree-to-bird passes schema", () => {
    const result = validateScenarioConfig(nearestTree);
    expect(result.success).toBe(true);
  });

  it("farthest-planet-from-rocket passes schema", () => {
    const result = validateScenarioConfig(farthestPlanet);
    expect(result.success).toBe(true);
  });

  it("heaviest-object-on-scale passes schema", () => {
    const result = validateScenarioConfig(heaviestObject);
    expect(result.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. All 3 scenarios at EVERY tier: Question overrides, hints, maxAttempts
// ─────────────────────────────────────────────────────────────────────────────

describe("All 3 scenario configs at every applicable tier", () => {
  const configs = [
    { name: "nearest-tree", parsed: validateScenarioConfig(nearestTree).data! },
    { name: "farthest-planet", parsed: validateScenarioConfig(farthestPlanet).data! },
    { name: "heaviest-object", parsed: validateScenarioConfig(heaviestObject).data! },
  ];

  configs.forEach(({ name, parsed }) => {
    describe(`Scenario: ${name}`, () => {
      ALL_TIERS.forEach((tier) => {
        it(`correctly resolves tier settings for "${tier}"`, () => {
          const question = getQuestionForTier(parsed, tier);
          expect(typeof question).toBe("string");
          expect(question.length).toBeGreaterThan(0);

          const tierRule = parsed.tier_rules[tier];
          if (tierRule?.maxAttempts) {
            expect(tierRule.maxAttempts).toBeGreaterThan(0);
          }
        });
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Scenario 1: Nearest Tree — Correct/Incorrect detection & Asset swap
// ─────────────────────────────────────────────────────────────────────────────

describe("Scenario 1: Nearest Tree to Bird", () => {
  const config = validateScenarioConfig(nearestTree).data!;
  // Seeker at (0.5, 0.65)
  // Oak: (0.15, 0.55) -> d ≈ 0.364
  // Pine: (0.75, 0.50) -> d ≈ 0.292
  // Palm: (0.88, 0.60) -> d ≈ 0.383
  // Autumn: (0.35, 0.45) -> d = 0.250 (WINNER)

  it("correctly identifies Autumn Tree as the winning nearest tree", () => {
    const correctIdx = findCorrectIndex(config);
    expect(correctIdx).toBe(3); // Autumn Tree
    expect(config.objects[correctIdx].label).toBe("Autumn Tree");

    // Correct evaluation
    expect(evaluateAnswer(config, "tree-autumn", 3)).toBe(true);

    // Incorrect evaluation for all other objects
    expect(evaluateAnswer(config, "tree", 0)).toBe(false); // Oak
    expect(evaluateAnswer(config, "tree-pine", 1)).toBe(false); // Pine
    expect(evaluateAnswer(config, "tree-palm", 2)).toBe(false); // Palm
  });

  it("preserves correct answer evaluation when swapping Autumn Tree -> Soccer Ball", () => {
    const swapped: SimulationConfig = {
      ...config,
      objects: config.objects.map((obj, i) =>
        i === 3 ? { ...obj, assetSlug: "ball-soccer", label: "Soccer Ball" } : obj
      ),
    };

    expect(findCorrectIndex(swapped)).toBe(3);
    expect(evaluateAnswer(swapped, "ball-soccer", 3)).toBe(true);
    expect(evaluateAnswer(swapped, "tree", 0)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Scenario 2: Farthest Planet — Correct/Incorrect detection & Object Disambiguation
// ─────────────────────────────────────────────────────────────────────────────

describe("Scenario 2: Farthest Planet from Rocket", () => {
  const config = validateScenarioConfig(farthestPlanet).data!;
  // Rocket at (0.12, 0.80)
  // Earth: (0.28, 0.35), d ≈ 0.478
  // Saturn: (0.60, 0.25), d ≈ 0.730
  // Mars: (0.42, 0.50), d ≈ 0.424
  // Neptune: (0.88, 0.20), d ≈ 0.968 (WINNER)

  it("correctly identifies Neptune as farthest and disambiguates from Saturn", () => {
    const correctIdx = findCorrectIndex(config);
    expect(correctIdx).toBe(3); // Neptune
    expect(config.objects[correctIdx].label).toBe("Neptune");

    // Neptune (index 3) is correct
    expect(evaluateAnswer(config, "planet-ringed", 3)).toBe(true);

    // Saturn (index 1) also uses "planet-ringed" slug but is NOT the farthest
    expect(evaluateAnswer(config, "planet-ringed", 1)).toBe(false);

    // Earth (index 0) and Mars (index 2) are not the farthest
    expect(evaluateAnswer(config, "planet-earth", 0)).toBe(false);
    expect(evaluateAnswer(config, "planet-earth", 2)).toBe(false);
  });

  it("preserves correct answer evaluation when swapping Neptune -> Comet", () => {
    const swapped: SimulationConfig = {
      ...config,
      objects: config.objects.map((obj, i) =>
        i === 3 ? { ...obj, assetSlug: "comet", label: "Distant Comet" } : obj
      ),
    };

    expect(findCorrectIndex(swapped)).toBe(3);
    expect(evaluateAnswer(swapped, "comet", 3)).toBe(true);
    expect(evaluateAnswer(swapped, "planet-ringed", 1)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Scenario 3: Heaviest Object on Scale — Mass comparison & Asset swap
// ─────────────────────────────────────────────────────────────────────────────

describe("Scenario 3: Heaviest Object on Scale", () => {
  const config = validateScenarioConfig(heaviestObject).data!;
  // Soccer Ball: 0.43 kg
  // Wooden Box: 5.0 kg
  // Beaker: 0.25 kg
  // Iron Weight: 12.0 kg (WINNER)

  it("correctly identifies Iron Weight (12kg) as heaviest", () => {
    const correctIdx = findCorrectIndex(config);
    expect(correctIdx).toBe(3);
    expect(config.objects[correctIdx].label).toBe("Iron Weight");

    // Correct evaluation
    expect(evaluateAnswer(config, "weight", 3)).toBe(true);

    // Incorrect evaluation for lighter objects
    expect(evaluateAnswer(config, "ball-soccer", 0)).toBe(false);
    expect(evaluateAnswer(config, "wooden-box", 1)).toBe(false);
    expect(evaluateAnswer(config, "beaker", 2)).toBe(false);
  });

  it("preserves correct answer evaluation when swapping Iron Weight -> Golden Anvil", () => {
    const swapped: SimulationConfig = {
      ...config,
      objects: config.objects.map((obj, i) =>
        i === 3 ? { ...obj, assetSlug: "anvil", label: "Golden Anvil" } : obj
      ),
    };

    expect(findCorrectIndex(swapped)).toBe(3);
    expect(evaluateAnswer(swapped, "anvil", 3)).toBe(true);
    expect(evaluateAnswer(swapped, "wooden-box", 1)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Slider Mode live math matches Tap Mode answer
// ─────────────────────────────────────────────────────────────────────────────

describe("Slider Mode live math matches Tap Mode answer", () => {
  it("computes exact distance math matching tap mode in nearest-tree scenario", () => {
    const config = validateScenarioConfig(nearestTree).data!;
    const sx = config.seeker.x;
    const sy = config.seeker.y;

    // Slider mode math computation:
    const calculatedDistances = config.objects.map((obj, idx) => ({
      index: idx,
      slug: obj.assetSlug,
      d: Math.hypot(obj.x - sx, obj.y - sy),
    }));

    const sliderWinner = [...calculatedDistances].sort((a, b) => a.d - b.d)[0];
    const tapWinnerIndex = findCorrectIndex(config);

    // Verify slider mode calculation matches tap mode target
    expect(sliderWinner.index).toBe(tapWinnerIndex);
    expect(evaluateAnswer(config, sliderWinner.slug, sliderWinner.index)).toBe(true);
  });

  it("computes exact distance math matching tap mode in farthest-planet scenario", () => {
    const config = validateScenarioConfig(farthestPlanet).data!;
    const sx = config.seeker.x;
    const sy = config.seeker.y;

    // Slider mode math computation for farthest:
    const calculatedDistances = config.objects.map((obj, idx) => ({
      index: idx,
      slug: obj.assetSlug,
      d: Math.hypot(obj.x - sx, obj.y - sy),
    }));

    const sliderWinner = [...calculatedDistances].sort((a, b) => b.d - a.d)[0];
    const tapWinnerIndex = findCorrectIndex(config);

    // Verify slider mode calculation matches tap mode target
    expect(sliderWinner.index).toBe(tapWinnerIndex);
    expect(evaluateAnswer(config, sliderWinner.slug, sliderWinner.index)).toBe(true);
  });

  it("computes exact weight W = m * g matching tap mode across different gravity fields", () => {
    const config = validateScenarioConfig(heaviestObject).data!;

    const gravityFields = [9.81, 3.71, 1.62, 24.79]; // Earth, Mars, Moon, Jupiter

    gravityFields.forEach((g) => {
      // Slider mode weight calculation: W = m * g
      const calculatedWeights = config.objects.map((obj, idx) => ({
        index: idx,
        slug: obj.assetSlug,
        w: Number(obj.properties?.mass ?? 0) * g,
      }));

      const sliderWinner = [...calculatedWeights].sort((a, b) => b.w - a.w)[0];
      const tapWinnerIndex = findCorrectIndex(config);

      // Verify slider mode calculation matches tap mode target in any gravity field
      expect(sliderWinner.index).toBe(tapWinnerIndex);
      expect(evaluateAnswer(config, sliderWinner.slug, sliderWinner.index)).toBe(true);
    });
  });
});
