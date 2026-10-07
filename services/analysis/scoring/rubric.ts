import { getPrinciple, type ScoreDimension } from "@/services/ai/principles/library";

/**
 * Scoring rubric, version 1.0.0.
 *
 * Scores are computed here, in code, from validated findings. The model never writes a score.
 * Each dimension starts at 100. A problem subtracts points. A strength adds a few back, up to a cap.
 * Points are scaled by how strongly the finding's principle bears on that dimension and by confidence.
 *
 * See .agents/rules/ai-behavior.md (Scoring Standards).
 */
export const RUBRIC_VERSION = "1.0.0";

export const DIMENSIONS: readonly ScoreDimension[] = ["intuitive", "trusted", "valuable"];

const SEVERITY_PENALTY = { critical: 14, major: 8, minor: 3 } as const;
const STRENGTH_BONUS = 2.5;
const STRENGTH_BONUS_CAP = 12;
const CONFIDENCE_FACTOR = { high: 1, medium: 0.75, low: 0.5 } as const;

export interface ScorableFinding {
  id: string;
  severity: "critical" | "major" | "minor" | "strength";
  confidence: "high" | "medium" | "low";
  principleId: string;
}

export interface ScoreContribution {
  findingId: string;
  /** Negative for problems, positive for strengths. Rounded to one decimal. */
  points: number;
}

export interface DimensionResult {
  score: number;
  contributions: ScoreContribution[];
  /** True when strengths would have added more than the cap allows. */
  bonusCapped: boolean;
}

export interface ScoreResult {
  overall: number;
  dimensions: Record<ScoreDimension, DimensionResult>;
  rubricVersion: string;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function computeScores(findings: readonly ScorableFinding[]): ScoreResult {
  const dimensions = {} as Record<ScoreDimension, DimensionResult>;

  for (const dimension of DIMENSIONS) {
    const contributions: ScoreContribution[] = [];
    let penalty = 0;
    let bonus = 0;

    for (const finding of findings) {
      const principle = getPrinciple(finding.principleId);
      if (!principle) continue;

      const weight = principle.weights[dimension];
      const confidence = CONFIDENCE_FACTOR[finding.confidence];

      if (finding.severity === "strength") {
        const points = STRENGTH_BONUS * weight * confidence;
        bonus += points;
        contributions.push({ findingId: finding.id, points: round1(points) });
      } else {
        const points = SEVERITY_PENALTY[finding.severity] * weight * confidence;
        penalty += points;
        contributions.push({ findingId: finding.id, points: round1(-points) });
      }
    }

    const cappedBonus = Math.min(bonus, STRENGTH_BONUS_CAP);
    const raw = 100 - penalty + cappedBonus;

    dimensions[dimension] = {
      score: Math.max(0, Math.min(100, Math.round(raw))),
      contributions: contributions.filter((entry) => entry.points !== 0),
      bonusCapped: bonus > STRENGTH_BONUS_CAP,
    };
  }

  const overall = Math.round(
    DIMENSIONS.reduce((total, dimension) => total + dimensions[dimension].score, 0) / DIMENSIONS.length,
  );

  return { overall, dimensions, rubricVersion: RUBRIC_VERSION };
}

export const DIMENSION_LABELS: Record<ScoreDimension, string> = {
  intuitive: "Intuitive",
  trusted: "Trusted",
  valuable: "Valuable",
};

export const DIMENSION_QUESTIONS: Record<ScoreDimension, string> = {
  intuitive: "Can people understand and use it without thinking?",
  trusted: "Does it feel reliable, clear, and safe?",
  valuable: "Does it help people reach their goal?",
};

/** Maps a score to a short plain-language reading. */
export function describeScore(score: number): string {
  if (score >= 85) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs work";
  return "Weak";
}
