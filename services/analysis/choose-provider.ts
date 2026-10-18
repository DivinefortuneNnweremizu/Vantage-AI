import { AppError } from "@/lib/app-error";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getAiProvider, getDemoProvider, isDemoAllowed } from "@/services/ai";
import type { AiProvider } from "@/services/ai/provider";

/**
 * Real AI analyses cost money or free quota, so the number each person can run, and the number the
 * whole site can run, is capped per rolling 24 hours. Past a cap, the person gets a clearly labeled
 * demo report instead of an error, when demo reports are allowed.
 *
 * Change the caps with REAL_AI_PER_USER_PER_DAY and REAL_AI_PER_DAY. 0 means "none, always demo".
 */
const DEFAULT_PER_USER_PER_DAY = 3;
const DEFAULT_PER_DAY = 50;
const WINDOW_MS = 24 * 60 * 60 * 1000;

function limitFromEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

/** Analyses by real models in the last 24 hours. Demo reports never count. */
function countRealAnalyses(userId?: string): Promise<number> {
  return prisma.analysis.count({
    where: {
      status: "COMPLETE",
      createdAt: { gte: new Date(Date.now() - WINDOW_MS) },
      NOT: { model: { startsWith: "mock" } },
      ...(userId ? { session: { userId } } : {}),
    },
  });
}

/** What to use when the real provider cannot be used: a demo report if allowed, otherwise a clear error. */
export function demoFallbackOrThrow(message: string): AiProvider {
  if (isDemoAllowed()) return getDemoProvider();
  throw new AppError("RATE_LIMITED", message);
}

/** Like demoFallbackOrThrow, but returns null when there is no demo to fall back to. */
export function demoFallbackOrNull(): AiProvider | null {
  return isDemoAllowed() ? getDemoProvider() : null;
}

/** Picks the provider for one analysis: the configured one, unless the person or the site is over its daily cap. */
export async function chooseProvider(userId: string): Promise<AiProvider> {
  const provider = getAiProvider();
  if (provider.isDemo) return provider;

  const perUser = limitFromEnv("REAL_AI_PER_USER_PER_DAY", DEFAULT_PER_USER_PER_DAY);
  const perDay = limitFromEnv("REAL_AI_PER_DAY", DEFAULT_PER_DAY);

  const [mine, everyone] = await Promise.all([countRealAnalyses(userId), countRealAnalyses()]);

  if (mine >= perUser) {
    logger.info("Per-user cap reached, using a demo report", { userId, mine, perUser });
    return demoFallbackOrThrow("You have used your real analyses for today. Come back tomorrow for more.");
  }
  if (everyone >= perDay) {
    logger.info("Daily cap reached, using a demo report", { everyone, perDay });
    return demoFallbackOrThrow("Real analyses are used up for today. Come back tomorrow.");
  }
  return provider;
}
