import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { PRINCIPLE_LIBRARY_VERSION } from "@/services/ai/principles/library";
import type { CurrentStatus } from "@/services/analysis/match-iterations";
import type { ScoreResult } from "@/services/analysis/scoring/rubric";
import type { ValidatedReport } from "@/services/analysis/validate-report";

const PROMPT_VERSION = "1.0.0";

export interface PersistReportParams {
  analysisId: string;
  sessionId: string;
  goal: string | null;
  /** The analyzed pages, in order. A finding points at one of them by position. */
  assets: ReadonlyArray<{ id: string }>;
  report: ValidatedReport;
  scores: ScoreResult;
  /** How each finding compares with the previous report, keyed by the model's finding id. Empty for a first report. */
  iterationStatus: ReadonlyMap<string, CurrentStatus>;
  model: string;
  durationMs: number;
}

/**
 * Saves a finished report in one transaction, so a report is either complete or not there at all.
 * A completed analysis is never changed afterwards.
 */
export async function persistReport(params: PersistReportParams): Promise<void> {
  const { analysisId, sessionId, goal, assets, report, scores, iterationStatus, model, durationMs } = params;

  // The model's finding ids are temporary. Real ids are made here, so the report and the
  // score breakdown can refer to the same finding.
  const findingIdByModelId = new Map(report.findings.map((finding) => [finding.id, randomUUID()]));
  const recommendationIds = report.recommendations.map(() => randomUUID());

  const scoreBreakdown = Object.fromEntries(
    Object.entries(scores.dimensions).map(([dimension, result]) => [
      dimension,
      {
        ...result,
        contributions: result.contributions.map((entry) => ({
          ...entry,
          findingId: findingIdByModelId.get(entry.findingId) ?? entry.findingId,
        })),
      },
    ]),
  );

  await prisma.$transaction(async (tx) => {
    await tx.analysis.update({
      where: { id: analysisId },
      data: {
        status: "COMPLETE",
        overallScore: scores.overall,
        intuitiveScore: scores.dimensions.intuitive.score,
        trustedScore: scores.dimensions.trusted.score,
        valuableScore: scores.dimensions.valuable.score,
        scoreBreakdown: scoreBreakdown as unknown as Prisma.InputJsonValue,
        overallTakeaway: report.overallTakeaway,
        rubricVersion: scores.rubricVersion,
        promptVersion: PROMPT_VERSION,
        principleLibraryVersion: PRINCIPLE_LIBRARY_VERSION,
        model,
        rawOutput: report as unknown as Prisma.InputJsonValue,
        durationMs,
        completedAt: new Date(),
      },
    });

    await tx.takeaway.createMany({
      data: [
        ...report.strengths.map((text, order) => ({ analysisId, kind: "STRENGTH" as const, order, text })),
        ...report.painPoints.map((text, order) => ({ analysisId, kind: "PAIN_POINT" as const, order, text })),
      ],
    });

    await tx.finding.createMany({
      data: report.findings.map((finding) => ({
        id: findingIdByModelId.get(finding.id) as string,
        analysisId,
        assetId: assets[finding.assetIndex]?.id ?? null,
        valence: finding.valence === "like" ? ("LIKE" as const) : ("DISLIKE" as const),
        severity: finding.severity.toUpperCase() as "CRITICAL" | "MAJOR" | "MINOR" | "STRENGTH",
        category: finding.category,
        principleId: finding.principleId,
        standard: finding.standard,
        title: finding.title,
        observation: finding.observation,
        impact: finding.impact,
        confidence: finding.confidence.toUpperCase() as "HIGH" | "MEDIUM" | "LOW",
        markerX: finding.marker?.x ?? null,
        markerY: finding.marker?.y ?? null,
        iterationStatus: iterationStatus.get(finding.id) ?? null,
      })),
    });

    await tx.recommendation.createMany({
      data: report.recommendations.map((recommendation, index) => ({
        id: recommendationIds[index] as string,
        analysisId,
        rank: recommendation.rank,
        title: recommendation.title,
        change: recommendation.change,
        rationale: recommendation.rationale,
        principleId: recommendation.principleId,
      })),
    });

    await tx.recommendationFinding.createMany({
      data: report.recommendations.flatMap((recommendation, index) =>
        recommendation.findingIds.map((modelId) => ({
          recommendationId: recommendationIds[index] as string,
          findingId: findingIdByModelId.get(modelId) as string,
        })),
      ),
    });

    await tx.suggestedPrompt.createMany({
      data: report.suggestedPrompts.map((text, order) => ({ analysisId, order, text })),
    });

    await tx.designSession.update({
      where: { id: sessionId },
      data: {
        latestAnalysisId: analysisId,
        coverAssetId: assets[0]?.id ?? null,
        goal,
      },
    });
  });
}
