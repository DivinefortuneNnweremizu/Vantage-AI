import { describe, expect, it } from "vitest";

import { PRINCIPLES } from "@/services/ai/principles/library";
import { computeScores, RUBRIC_VERSION, type ScorableFinding } from "@/services/analysis/scoring/rubric";

const problem = (id: string, severity: "critical" | "major" | "minor", principleId = "text-contrast"): ScorableFinding => ({
  id,
  severity,
  confidence: "high",
  principleId,
});

const strength = (id: string, principleId = "visual-hierarchy"): ScorableFinding => ({
  id,
  severity: "strength",
  confidence: "high",
  principleId,
});

describe("scoring rubric", () => {
  it("gives a perfect score when there is nothing to report", () => {
    const result = computeScores([]);
    expect(result.overall).toBe(100);
    expect(result.dimensions.intuitive.score).toBe(100);
    expect(result.rubricVersion).toBe(RUBRIC_VERSION);
  });

  it("subtracts weighted points for a problem", () => {
    // text-contrast weights: intuitive 0.4, trusted 0.5, valuable 0.4. Critical = 14 points.
    const result = computeScores([problem("a", "critical")]);
    expect(result.dimensions.intuitive.score).toBe(Math.round(100 - 14 * 0.4));
    expect(result.dimensions.trusted.score).toBe(Math.round(100 - 14 * 0.5));
    expect(result.dimensions.valuable.score).toBe(Math.round(100 - 14 * 0.4));
  });

  it("penalizes critical more than major, and major more than minor", () => {
    const critical = computeScores([problem("a", "critical")]).overall;
    const major = computeScores([problem("a", "major")]).overall;
    const minor = computeScores([problem("a", "minor")]).overall;
    expect(critical).toBeLessThan(major);
    expect(major).toBeLessThan(minor);
  });

  it("lowers the penalty when confidence is lower", () => {
    const high = computeScores([{ ...problem("a", "critical"), confidence: "high" }]).overall;
    const low = computeScores([{ ...problem("a", "critical"), confidence: "low" }]).overall;
    expect(low).toBeGreaterThan(high);
  });

  it("adds points back for strengths, but never above 100", () => {
    const withProblem = computeScores([problem("a", "major")]).overall;
    const withBoth = computeScores([problem("a", "major"), strength("b")]).overall;
    expect(withBoth).toBeGreaterThanOrEqual(withProblem);
    expect(computeScores([strength("b"), strength("c")]).overall).toBeLessThanOrEqual(100);
  });

  it("caps how much strengths can add back", () => {
    const many = Array.from({ length: 30 }, (_, index) => strength(`s${index}`));
    const result = computeScores([problem("a", "critical", "visual-hierarchy"), ...many]);
    expect(result.dimensions.intuitive.bonusCapped).toBe(true);
    // 100 - 14*0.8 + 12 cap = 100.8, clamped to 100.
    expect(result.dimensions.intuitive.score).toBe(100);
  });

  it("never drops below zero", () => {
    const many = Array.from({ length: 40 }, (_, index) => problem(`p${index}`, "critical", "system-status"));
    const result = computeScores(many);
    for (const dimension of Object.values(result.dimensions)) {
      expect(dimension.score).toBe(0);
    }
    expect(result.overall).toBe(0);
  });

  it("weights dimensions differently for different principles", () => {
    // goal-gradient is mostly about value. aesthetic-usability is mostly about trust.
    const goal = computeScores([problem("a", "major", "goal-gradient")]);
    expect(goal.dimensions.valuable.score).toBeLessThan(goal.dimensions.trusted.score);
    const polish = computeScores([problem("a", "major", "aesthetic-usability")]);
    expect(polish.dimensions.trusted.score).toBeLessThan(polish.dimensions.valuable.score);
  });

  it("ignores findings that cite an unknown principle", () => {
    expect(computeScores([problem("a", "critical", "made-up")]).overall).toBe(100);
  });

  it("records which findings moved each score", () => {
    const result = computeScores([problem("a", "major"), strength("b")]);
    const ids = result.dimensions.intuitive.contributions.map((entry) => entry.findingId);
    expect(ids).toEqual(expect.arrayContaining(["a", "b"]));
    const a = result.dimensions.intuitive.contributions.find((entry) => entry.findingId === "a");
    expect(a?.points).toBeLessThan(0);
  });

  it("is deterministic", () => {
    const input = [problem("a", "major"), problem("b", "minor", "system-status"), strength("c")];
    expect(computeScores(input)).toEqual(computeScores(input));
  });
});

describe("principle library", () => {
  it("has unique ids", () => {
    const ids = PRINCIPLES.map((principle) => principle.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps every weight between 0 and 1", () => {
    for (const principle of PRINCIPLES) {
      for (const weight of Object.values(principle.weights)) {
        expect(weight).toBeGreaterThanOrEqual(0);
        expect(weight).toBeLessThanOrEqual(1);
      }
    }
  });

  it("cites a standard for every principle", () => {
    for (const principle of PRINCIPLES) {
      expect(principle.standard.length).toBeGreaterThan(5);
    }
  });
});
