import { reportSchema, type RecommendationInput } from "@/features/analysis/schemas";
import { getPrinciple, principleAppliesTo, type PrincipleCategory } from "@/services/ai/principles/library";

export interface ValidatedFinding {
  id: string;
  assetIndex: number;
  valence: "like" | "dislike";
  severity: "critical" | "major" | "minor" | "strength";
  principleId: string;
  category: PrincipleCategory;
  standard: string;
  title: string;
  observation: string;
  impact: string;
  confidence: "high" | "medium" | "low";
  marker: { x: number; y: number } | null;
}

export interface ValidatedReport {
  strengths: string[];
  painPoints: string[];
  overallTakeaway: string;
  findings: ValidatedFinding[];
  recommendations: RecommendationInput[];
  suggestedPrompts: string[];
}

export class ReportValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Report failed validation: ${issues.slice(0, 5).join("; ")}`);
    this.name = "ReportValidationError";
    this.issues = issues;
  }
}

/**
 * Removes anything that could be rendered as markup or a script link.
 * Reports are plain text with at most light Markdown, so tags are never legitimate.
 */
export function sanitizeText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/javascript:/gi, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

interface ValidationContext {
  assetCount: number;
  platform: "APP" | "WEB";
}

/**
 * Turns untrusted provider output into a trusted report, or throws ReportValidationError.
 * Category and standard are filled in from the principle library, never taken from the model.
 */
export function validateReport(raw: unknown, context: ValidationContext): ValidatedReport {
  const parsed = reportSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ReportValidationError(
      parsed.error.issues.map((issue) => `${issue.path.join(".") || "report"}: ${issue.message}`),
    );
  }

  const input = parsed.data;
  const issues: string[] = [];

  const findingIds = new Set<string>();
  const findings: ValidatedFinding[] = [];

  for (const finding of input.findings) {
    if (findingIds.has(finding.id)) {
      issues.push(`Duplicate finding id "${finding.id}".`);
      continue;
    }
    findingIds.add(finding.id);

    const principle = getPrinciple(finding.principleId);
    if (!principle) {
      issues.push(`Finding "${finding.id}" cites an unknown principle "${finding.principleId}".`);
      continue;
    }
    if (!principleAppliesTo(principle, context.platform)) {
      issues.push(`Principle "${principle.id}" does not apply to ${context.platform}.`);
      continue;
    }
    if (finding.assetIndex >= context.assetCount) {
      issues.push(`Finding "${finding.id}" refers to image ${finding.assetIndex}, which does not exist.`);
      continue;
    }
    if (finding.valence === "like" && finding.severity !== "strength") {
      issues.push(`Finding "${finding.id}" is a like but has severity "${finding.severity}".`);
      continue;
    }
    if (finding.valence === "dislike" && finding.severity === "strength") {
      issues.push(`Finding "${finding.id}" is a dislike but has severity "strength".`);
      continue;
    }

    const title = sanitizeText(finding.title);
    const observation = sanitizeText(finding.observation);
    const impact = sanitizeText(finding.impact);
    if (!title || !observation || !impact) {
      issues.push(`Finding "${finding.id}" has empty text after cleaning.`);
      continue;
    }

    findings.push({
      id: finding.id,
      assetIndex: finding.assetIndex,
      valence: finding.valence,
      severity: finding.severity,
      principleId: principle.id,
      category: principle.category,
      standard: principle.standard,
      title,
      observation,
      impact,
      confidence: finding.confidence,
      marker: finding.marker,
    });
  }

  const ranks = new Set<number>();
  const recommendations: RecommendationInput[] = [];

  for (const recommendation of input.recommendations) {
    if (ranks.has(recommendation.rank)) {
      issues.push(`Duplicate recommendation rank ${recommendation.rank}.`);
      continue;
    }
    ranks.add(recommendation.rank);

    if (!getPrinciple(recommendation.principleId)) {
      issues.push(`Recommendation ${recommendation.rank} cites an unknown principle.`);
      continue;
    }
    const unknown = recommendation.findingIds.filter((id) => !findingIds.has(id));
    if (unknown.length > 0) {
      issues.push(`Recommendation ${recommendation.rank} links to unknown findings: ${unknown.join(", ")}.`);
      continue;
    }

    recommendations.push({
      ...recommendation,
      title: sanitizeText(recommendation.title),
      change: sanitizeText(recommendation.change),
      rationale: sanitizeText(recommendation.rationale),
    });
  }

  const cleanList = (items: string[]): string[] => items.map(sanitizeText).filter((item) => item.length > 0);
  const strengths = cleanList(input.strengths);
  const painPoints = cleanList(input.painPoints);
  const suggestedPrompts = cleanList(input.suggestedPrompts);
  const overallTakeaway = sanitizeText(input.overallTakeaway);

  if (strengths.length === 0) issues.push("No strengths after cleaning.");
  if (painPoints.length === 0) issues.push("No pain points after cleaning.");
  if (!overallTakeaway) issues.push("Overall takeaway is empty after cleaning.");
  if (findings.length === 0) issues.push("No valid findings.");
  if (recommendations.length === 0) issues.push("No valid recommendations.");

  if (issues.length > 0) {
    throw new ReportValidationError(issues);
  }

  // Recommendations are shown in rank order.
  recommendations.sort((a, b) => a.rank - b.rank);

  return { strengths, painPoints, overallTakeaway, findings, recommendations, suggestedPrompts };
}
