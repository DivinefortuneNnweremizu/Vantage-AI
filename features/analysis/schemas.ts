import { z } from "zod";

/**
 * The report a provider must return. Defined once here and shared by validation, tests,
 * and the mock provider. See .agents/rules/analysis-output.md.
 *
 * Category and standard are NOT part of this schema. They come from the principle library
 * by principle id, so a model can never invent them.
 */
const shortText = (max: number) => z.string().trim().min(1).max(max);

export const markerSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export const findingSchema = z.object({
  id: shortText(40),
  /** Zero-based index of the analyzed image this finding refers to. */
  assetIndex: z.number().int().min(0),
  valence: z.enum(["like", "dislike"]),
  severity: z.enum(["critical", "major", "minor", "strength"]),
  principleId: shortText(60),
  title: shortText(80),
  observation: shortText(400),
  impact: shortText(300),
  confidence: z.enum(["high", "medium", "low"]),
  marker: markerSchema.nullable(),
});

export const recommendationSchema = z.object({
  rank: z.number().int().min(1).max(20),
  title: shortText(100),
  change: shortText(500),
  rationale: shortText(300),
  principleId: shortText(60),
  findingIds: z.array(shortText(40)).min(1),
});

export const reportSchema = z.object({
  strengths: z.array(shortText(500)).min(1).max(8),
  painPoints: z.array(shortText(500)).min(1).max(8),
  overallTakeaway: shortText(900),
  findings: z.array(findingSchema).min(1).max(30),
  recommendations: z.array(recommendationSchema).min(1).max(12),
  suggestedPrompts: z.array(shortText(140)).min(1).max(5),
});

export type ReportInput = z.infer<typeof reportSchema>;
export type FindingInput = z.infer<typeof findingSchema>;
export type RecommendationInput = z.infer<typeof recommendationSchema>;

export const analysisRequestSchema = z.object({
  goal: z.string().trim().max(600, "Use 600 characters or fewer.").optional(),
});

export type AnalysisProgressStage =
  | "reading"
  | "hierarchy"
  | "accessibility"
  | "interaction"
  | "scoring"
  | "sentiment"
  | "recommendations";

/** Plain-language labels. Never use generic messages like "Loading". See ai-behavior.md. */
export const STAGE_LABELS: Record<AnalysisProgressStage, string> = {
  reading: "Reading your design...",
  hierarchy: "Checking visual hierarchy...",
  accessibility: "Measuring contrast and accessibility...",
  interaction: "Reviewing interaction feedback...",
  scoring: "Scoring Intuitive, Trusted and Valuable...",
  sentiment: "Mapping likes and dislikes...",
  recommendations: "Writing recommendations...",
};

export const STAGE_ORDER: readonly AnalysisProgressStage[] = [
  "reading",
  "hierarchy",
  "accessibility",
  "interaction",
  "scoring",
  "sentiment",
  "recommendations",
];

export type AnalysisEvent =
  | { type: "progress"; stage: AnalysisProgressStage; label: string }
  | { type: "complete"; sessionId: string; analysisId: string; iteration: number }
  | { type: "error"; message: string };
