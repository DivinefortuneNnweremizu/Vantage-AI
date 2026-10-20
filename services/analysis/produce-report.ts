import "server-only";
import { AppError } from "@/lib/app-error";
import { logger } from "@/lib/logger";
import type { AnalysisProgressStage } from "@/features/analysis/schemas";
import type { AiProvider, AnalyzeInput } from "@/services/ai/provider";
import { ReportValidationError, validateReport, type ValidatedReport } from "@/services/analysis/validate-report";

// The analysis route is allowed 120 seconds. Each provider call gets less than half, so one retry still fits
// and the run can fail cleanly (and be retried) instead of being cut off mid-way.
const PROVIDER_TIMEOUT_MS = 55_000;

/** The stages between "reading" and "scoring". The provider call is one request, so a timer moves through them. */
const MIDDLE_STAGES: AnalysisProgressStage[] = ["hierarchy", "accessibility", "interaction"];

interface ReportContext {
  assetCount: number;
  platform: "APP" | "WEB";
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

/** Asks the provider for a report. A report that fails validation gets one more try, with the problems listed. */
async function requestValidatedReport(provider: AiProvider, input: AnalyzeInput, context: ReportContext, analysisId: string): Promise<ValidatedReport> {
  const first = await withTimeout(provider.analyze(input), PROVIDER_TIMEOUT_MS);
  try {
    return validateReport(first, context);
  } catch (error) {
    if (!(error instanceof ReportValidationError)) throw error;
    logger.warn("Report failed validation, retrying once", { analysisId, issues: error.issues.length });
    const second = await withTimeout(provider.analyze({ ...input, validationFeedback: error.issues.slice(0, 10) }), PROVIDER_TIMEOUT_MS);
    return validateReport(second, context);
  }
}

/**
 * Gets a trusted report from a provider, and reports progress while it waits. It needs only a provider, so it can
 * be used and tested without a database. A demo provider is instant, so its stages move faster.
 */
export async function produceReport(
  provider: AiProvider,
  input: AnalyzeInput,
  context: ReportContext,
  analysisId: string,
  onStage: (stage: AnalysisProgressStage) => void,
): Promise<ValidatedReport> {
  let nextStage = 0;
  const ticker = setInterval(
    () => {
      const stage = MIDDLE_STAGES[nextStage];
      if (stage) {
        onStage(stage);
        nextStage += 1;
      }
    },
    provider.isDemo ? 900 : 5000,
  );

  try {
    return await requestValidatedReport(provider, input, context, analysisId);
  } finally {
    clearInterval(ticker);
  }
}
