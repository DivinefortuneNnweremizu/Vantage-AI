import { prisma } from "@/lib/prisma";
import { getOwnedSession } from "@/features/sessions/service";
import { diffIterations, fromStoredFinding, markerOf } from "@/services/analysis/match-iterations";
import { CATEGORY_ORDER } from "@/services/ai/principles/library";
import type { DimensionResult } from "@/services/analysis/scoring/rubric";

export interface ViewFinding {
  id: string;
  assetId: string | null;
  valence: "like" | "dislike";
  severity: "critical" | "major" | "minor" | "strength";
  category: string;
  principleId: string;
  standard: string;
  title: string;
  observation: string;
  impact: string;
  confidence: "high" | "medium" | "low";
  marker: { x: number; y: number } | null;
  iterationStatus: "new" | "persisting" | null;
}

export interface ViewRecommendation {
  id: string;
  rank: number;
  title: string;
  change: string;
  rationale: string;
  principleId: string;
  findingIds: string[];
}

export interface ViewAsset {
  id: string;
  order: number;
  width: number | null;
  height: number | null;
}

export interface ScoreSet {
  overall: number;
  intuitive: number;
  trusted: number;
  valuable: number;
}

export interface IterationComparison {
  previousIteration: number;
  previous: ScoreSet;
  delta: ScoreSet;
  resolved: Array<{ title: string; category: string }>;
  newCount: number;
  persistingCount: number;
}

export interface ReportView {
  session: { id: string; title: string; pageScope: "SINGLE_PAGE" | "JOURNEY"; platform: "APP" | "WEB"; goal: string | null };
  analysis: {
    id: string;
    iteration: number;
    createdAt: Date;
    goal: string | null;
    scores: ScoreSet;
    breakdown: Record<"intuitive" | "trusted" | "valuable", DimensionResult> | null;
    overallTakeaway: string;
    model: string;
    isDemo: boolean;
    rubricVersion: string;
  };
  iterations: Array<{ iteration: number; createdAt: Date; overall: number }>;
  assets: ViewAsset[];
  strengths: string[];
  painPoints: string[];
  findings: ViewFinding[];
  recommendations: ViewRecommendation[];
  suggestedPrompts: string[];
  comparison: IterationComparison | null;
}

const SEVERITY_RANK = { critical: 0, major: 1, minor: 2, strength: 3 } as const;

function lower<T extends string>(value: string): T {
  return value.toLowerCase() as T;
}

interface ScoredAnalysis {
  overallScore: number | null;
  intuitiveScore: number | null;
  trustedScore: number | null;
  valuableScore: number | null;
}

function scoreSetOf(analysis: ScoredAnalysis): ScoreSet {
  return {
    overall: analysis.overallScore ?? 0,
    intuitive: analysis.intuitiveScore ?? 0,
    trusted: analysis.trustedScore ?? 0,
    valuable: analysis.valuableScore ?? 0,
  };
}

/** What changed since the previous report: score movement, resolved problems, and what is new or still open. */
async function buildComparison(params: {
  sessionId: string;
  previousIteration: number;
  analysis: { assets: Array<{ assetId: string; order: number }>; findings: Parameters<typeof fromStoredFinding>[0][] };
  scores: ScoreSet;
  findings: ViewFinding[];
}): Promise<IterationComparison | null> {
  const { sessionId, previousIteration, analysis, scores, findings } = params;

  const previous = await prisma.analysis.findUnique({
    where: { sessionId_iteration: { sessionId, iteration: previousIteration } },
    include: { findings: true, assets: true },
  });
  if (!previous) return null;

  const orderOf = (links: Array<{ assetId: string; order: number }>) => new Map(links.map((link) => [link.assetId, link.order]));
  const previousOrder = orderOf(previous.assets);
  const currentOrder = orderOf(analysis.assets);

  const diff = diffIterations(
    previous.findings.map((finding) => fromStoredFinding(finding, previousOrder)),
    analysis.findings.map((finding) => fromStoredFinding(finding, currentOrder)),
  );

  const previousFindingById = new Map(previous.findings.map((finding) => [finding.id, finding]));
  const previousScores = scoreSetOf(previous);

  return {
    previousIteration,
    previous: previousScores,
    delta: {
      overall: scores.overall - previousScores.overall,
      intuitive: scores.intuitive - previousScores.intuitive,
      trusted: scores.trusted - previousScores.trusted,
      valuable: scores.valuable - previousScores.valuable,
    },
    resolved: diff.resolved.map((entry) => {
      const original = previousFindingById.get(entry.id);
      return { title: original?.title ?? "A previous issue", category: original?.category ?? "" };
    }),
    // Only problems count here. A strength that stays or appears is not an "open issue".
    newCount: findings.filter((finding) => finding.valence === "dislike" && diff.current.get(finding.id) === "NEW").length,
    persistingCount: findings.filter((finding) => finding.valence === "dislike" && diff.current.get(finding.id) === "PERSISTING").length,
  };
}

/**
 * Loads everything the report tabs need in one place. Always scoped to the owner.
 * Returns null when the session has no completed report yet.
 */
export async function getReportView(userId: string, sessionId: string, iteration?: number): Promise<ReportView | null> {
  const session = await getOwnedSession(userId, sessionId);

  const iterations = await prisma.analysis.findMany({
    where: { sessionId, status: "COMPLETE" },
    orderBy: { iteration: "asc" },
    select: { iteration: true, createdAt: true, overallScore: true },
  });
  if (iterations.length === 0) return null;

  const wanted =
    iteration !== undefined && iterations.some((entry) => entry.iteration === iteration)
      ? iteration
      : (iterations[iterations.length - 1] as { iteration: number }).iteration;

  const analysis = await prisma.analysis.findUnique({
    where: { sessionId_iteration: { sessionId, iteration: wanted } },
    include: {
      assets: { include: { asset: true }, orderBy: { order: "asc" } },
      takeaways: { orderBy: [{ kind: "asc" }, { order: "asc" }] },
      findings: true,
      recommendations: { orderBy: { rank: "asc" }, include: { findings: true } },
      suggestedPrompts: { orderBy: { order: "asc" } },
    },
  });
  if (!analysis || analysis.status !== "COMPLETE") return null;

  const findings: ViewFinding[] = analysis.findings
    .map<ViewFinding>((finding) => ({
      id: finding.id,
      assetId: finding.assetId,
      valence: lower(finding.valence),
      severity: lower(finding.severity),
      category: finding.category,
      principleId: finding.principleId,
      standard: finding.standard,
      title: finding.title,
      observation: finding.observation,
      impact: finding.impact,
      confidence: lower(finding.confidence),
      marker: markerOf(finding),
      // RESOLVED is never stored on a finding. It is derived when two reports are compared.
      iterationStatus: finding.iterationStatus && finding.iterationStatus !== "RESOLVED" ? lower<"new" | "persisting">(finding.iterationStatus) : null,
    }))
    .sort((a, b) => {
      const severity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      if (severity !== 0) return severity;
      const category = CATEGORY_ORDER.indexOf(a.category as never) - CATEGORY_ORDER.indexOf(b.category as never);
      return category !== 0 ? category : a.title.localeCompare(b.title);
    });

  const scores = scoreSetOf(analysis);

  const previousEntry = [...iterations].reverse().find((entry) => entry.iteration < wanted);
  const comparison = previousEntry
    ? await buildComparison({ sessionId, previousIteration: previousEntry.iteration, analysis, scores, findings })
    : null;

  const model = analysis.model ?? "unknown";

  return {
    session: {
      id: session.id,
      title: session.title,
      pageScope: session.pageScope,
      platform: session.platform,
      goal: session.goal,
    },
    analysis: {
      id: analysis.id,
      iteration: analysis.iteration,
      createdAt: analysis.createdAt,
      goal: analysis.goal,
      scores,
      breakdown: (analysis.scoreBreakdown as ReportView["analysis"]["breakdown"]) ?? null,
      overallTakeaway: analysis.overallTakeaway ?? "",
      model,
      isDemo: model.startsWith("mock"),
      rubricVersion: analysis.rubricVersion ?? "unknown",
    },
    iterations: iterations.map((entry) => ({
      iteration: entry.iteration,
      createdAt: entry.createdAt,
      overall: entry.overallScore ?? 0,
    })),
    assets: analysis.assets.map((link) => ({
      id: link.asset.id,
      order: link.order,
      width: link.asset.width,
      height: link.asset.height,
    })),
    strengths: analysis.takeaways.filter((item) => item.kind === "STRENGTH").map((item) => item.text),
    painPoints: analysis.takeaways.filter((item) => item.kind === "PAIN_POINT").map((item) => item.text),
    findings,
    recommendations: analysis.recommendations.map((recommendation) => ({
      id: recommendation.id,
      rank: recommendation.rank,
      title: recommendation.title,
      change: recommendation.change,
      rationale: recommendation.rationale,
      principleId: recommendation.principleId,
      findingIds: recommendation.findings.map((link) => link.findingId),
    })),
    suggestedPrompts: analysis.suggestedPrompts.map((prompt) => prompt.text),
    comparison,
  };
}
