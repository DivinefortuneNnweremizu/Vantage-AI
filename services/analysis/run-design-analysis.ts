import { AppError } from "@/lib/app-error";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { STAGE_LABELS, type AnalysisEvent, type AnalysisProgressStage } from "@/features/analysis/schemas";
import { getOwnedSession } from "@/features/sessions/service";
import { getAiProvider } from "@/services/ai";
import { AiProviderUnavailableError, type AiProvider, type AnalyzeInput } from "@/services/ai/provider";
import { diffIterations, fromStoredFinding, type ComparableFinding } from "@/services/analysis/match-iterations";
import { persistReport } from "@/services/analysis/persist-report";
import { computeScores } from "@/services/analysis/scoring/rubric";
import { ReportValidationError, validateReport, type ValidatedReport } from "@/services/analysis/validate-report";
import { getStorage } from "@/services/storage";

/** An analysis that has run this long without finishing is treated as dead. */
const STALE_AFTER_MS = 5 * 60 * 1000;
const PROVIDER_TIMEOUT_MS = 120_000;

export interface RunAnalysisParams {
  userId: string;
  sessionId: string;
  /** When provided, replaces the session goal. Pass an empty string to clear it. */
  goal?: string;
}

export interface AnalysisOutcome {
  analysisId: string;
  iteration: number;
}

type Emit = (event: AnalysisEvent) => void;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new AppError("INTERNAL_ERROR", "The analysis took too long. Try again.")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

type OwnedSession = Awaited<ReturnType<typeof getOwnedSession>>;

/**
 * Checks that the session can be analyzed, then returns its pending pages.
 * Also fails runs that never finished, so they cannot block a retry.
 */
async function loadPendingAssets(session: OwnedSession) {
  const assets = await prisma.asset.findMany({
    where: { sessionId: session.id, deletedAt: null, analyses: { none: { analysis: { status: "COMPLETE" } } } },
    orderBy: { order: "asc" },
  });

  if (assets.length === 0) {
    throw new AppError("VALIDATION_ERROR", "Add at least one image before you analyze.");
  }
  if (session.pageScope === "SINGLE_PAGE" && assets.length > 1) {
    // Adding a second page switches a session to a journey, so this only guards against inconsistent data.
    throw new AppError("CONFLICT", "This design has more than one page but is set to Single Page. Reload the page and try again.");
  }

  const staleBefore = new Date(Date.now() - STALE_AFTER_MS);
  await prisma.analysis.updateMany({
    where: { sessionId: session.id, status: { in: ["QUEUED", "RUNNING"] }, createdAt: { lte: staleBefore } },
    data: { status: "FAILED", failureReason: "The analysis did not finish." },
  });
  // One run at a time per session.
  const active = await prisma.analysis.findFirst({
    where: { sessionId: session.id, status: { in: ["QUEUED", "RUNNING"] } },
    select: { id: true },
  });
  if (active) {
    throw new AppError("CONFLICT", "An analysis is already running for this design. Wait for it to finish.");
  }

  return assets;
}

/** Asks the provider for a report. A report that fails validation gets one more try, with the problems listed. */
async function requestValidatedReport(
  provider: AiProvider,
  input: AnalyzeInput,
  context: { assetCount: number; platform: OwnedSession["platform"] },
  analysisId: string,
): Promise<ValidatedReport> {
  const first = await withTimeout(provider.analyze(input), PROVIDER_TIMEOUT_MS);
  try {
    return validateReport(first, context);
  } catch (error) {
    if (!(error instanceof ReportValidationError)) throw error;
    logger.warn("Report failed validation, retrying once", { analysisId, issues: error.issues.length });
    const second = await withTimeout(
      provider.analyze({ ...input, validationFeedback: error.issues.slice(0, 10) }),
      PROVIDER_TIMEOUT_MS,
    );
    return validateReport(second, context);
  }
}

/**
 * Runs one full analysis for a session the user owns. See .agents/workflows/run-analysis.md.
 *
 * Every step that can fail marks the analysis FAILED and keeps the uploaded images,
 * so the user can retry without uploading again. A completed analysis is never changed.
 */
export async function runDesignAnalysis(params: RunAnalysisParams, emit: Emit): Promise<AnalysisOutcome> {
  const startedAt = Date.now();
  const { userId, sessionId } = params;

  const session = await getOwnedSession(userId, sessionId);
  const assets = await loadPendingAssets(session);

  const goal = params.goal !== undefined ? params.goal.trim() || null : session.goal;

  const previous = await prisma.analysis.findFirst({
    where: { sessionId, status: "COMPLETE" },
    orderBy: { iteration: "desc" },
    include: { findings: true, assets: true },
  });
  const latest = await prisma.analysis.aggregate({ where: { sessionId }, _max: { iteration: true } });
  const iteration = (latest._max.iteration ?? 0) + 1;

  let analysisId: string;
  try {
    const created = await prisma.analysis.create({
      data: {
        sessionId,
        iteration,
        status: "RUNNING",
        pageScope: session.pageScope,
        platform: session.platform,
        goal,
        assets: { create: assets.map((asset, index) => ({ assetId: asset.id, order: index })) },
      },
      select: { id: true },
    });
    analysisId = created.id;
  } catch {
    throw new AppError("CONFLICT", "Another analysis just started for this design. Wait for it to finish.");
  }

  const markFailed = async (reason: string): Promise<void> => {
    await prisma.analysis
      .update({
        where: { id: analysisId },
        data: { status: "FAILED", failureReason: reason, durationMs: Date.now() - startedAt },
      })
      .catch(() => logger.error("Could not mark an analysis as failed", { analysisId }));
  };

  const provider = getAiProvider();
  const stageGapMs = provider.isDemo ? 350 : 0;
  const stage = (value: AnalysisProgressStage): void => emit({ type: "progress", stage: value, label: STAGE_LABELS[value] });

  try {
    stage("reading");

    const storage = getStorage();
    const images = await Promise.all(assets.map((asset) => storage.get(asset.storagePath)));

    const input: AnalyzeInput = {
      goal,
      pageScope: session.pageScope,
      platform: session.platform,
      previousSummary: previous
        ? `Previous version found: ${previous.findings
            .filter((finding) => finding.valence === "DISLIKE")
            .map((finding) => finding.title)
            .join("; ")}`
        : null,
      assets: assets.map((asset, index) => ({
        index,
        width: asset.width ?? 0,
        height: asset.height ?? 0,
        contentHash: asset.contentHash,
        image: images[index] as Buffer,
      })),
    };

    // The provider call is one request, so the middle stages advance on a timer while it runs.
    const middleStages: AnalysisProgressStage[] = ["hierarchy", "accessibility", "interaction"];
    let nextStage = 0;
    const ticker = setInterval(() => {
      const value = middleStages[nextStage];
      if (value) {
        stage(value);
        nextStage += 1;
      }
    }, provider.isDemo ? 900 : 5000);

    let report: ValidatedReport;
    try {
      report = await requestValidatedReport(provider, input, { assetCount: assets.length, platform: session.platform }, analysisId);
    } finally {
      clearInterval(ticker);
    }

    stage("scoring");
    await sleep(stageGapMs);
    const scores = computeScores(
      report.findings.map((finding) => ({
        id: finding.id,
        severity: finding.severity,
        confidence: finding.confidence,
        principleId: finding.principleId,
      })),
    );

    stage("sentiment");
    await sleep(stageGapMs);
    const previousOrder = new Map(previous?.assets.map((link) => [link.assetId, link.order]) ?? []);
    const diff = previous
      ? diffIterations(
          previous.findings.map((finding) => fromStoredFinding(finding, previousOrder)),
          report.findings.map<ComparableFinding>((finding) => ({
            id: finding.id,
            principleId: finding.principleId,
            valence: finding.valence,
            assetOrder: finding.assetIndex,
            marker: finding.marker,
          })),
        )
      : null;

    stage("recommendations");
    await sleep(stageGapMs);

    await persistReport({
      analysisId,
      sessionId,
      goal,
      assets,
      report,
      scores,
      iterationStatus: diff?.current ?? new Map(),
      model: provider.model,
      durationMs: Date.now() - startedAt,
    });

    emit({ type: "complete", sessionId, analysisId, iteration });
    logger.info("Analysis complete", {
      analysisId,
      iteration,
      model: provider.model,
      durationMs: Date.now() - startedAt,
      findings: report.findings.length,
    });

    return { analysisId, iteration };
  } catch (error) {
    if (error instanceof AiProviderUnavailableError) {
      await markFailed("The AI provider is not connected.");
      throw new AppError("INTERNAL_ERROR", error.message);
    }
    if (error instanceof AppError) {
      await markFailed(error.message);
      throw error;
    }
    if (error instanceof ReportValidationError) {
      logger.error("Report failed validation twice", { analysisId, issues: error.issues.slice(0, 5) });
      await markFailed("The analysis result was not valid.");
      throw new AppError("INTERNAL_ERROR", "We could not finish the analysis. Your images are saved. Try again.");
    }
    logger.error("Analysis failed", { analysisId, error: error instanceof Error ? error.message : "unknown" });
    await markFailed("The analysis failed.");
    throw new AppError("INTERNAL_ERROR", "We could not finish the analysis. Your images are saved. Try again.");
  }
}
