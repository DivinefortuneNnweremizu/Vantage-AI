import "server-only";
import { AppError } from "@/lib/app-error";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { ApiErrorCode } from "@/lib/api-response";
import { getAiProvider, getDemoProvider, isDemoAllowed } from "@/services/ai";
import { isRealAiBlocked } from "@/services/ai/regions";
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
// Assistant questions go to the real model too, so they are capped the same way.
const DEFAULT_CHAT_PER_USER_PER_DAY = 30;
const DEFAULT_CHAT_PER_DAY = 300;
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

/** Questions asked of the assistant in the last 24 hours. */
function countAssistantQuestions(userId?: string): Promise<number> {
  return prisma.assistantMessage.count({
    where: {
      role: "USER",
      createdAt: { gte: new Date(Date.now() - WINDOW_MS) },
      ...(userId ? { session: { userId } } : {}),
    },
  });
}

const REGION_MESSAGE = "Real AI analysis is not available in your region right now.";

/** What to use when the real provider cannot be used: a demo report if allowed, otherwise a clear error. */
function demoFallbackOrThrow(message: string, code: ApiErrorCode = "RATE_LIMITED"): AiProvider {
  if (isDemoAllowed()) return getDemoProvider();
  throw new AppError(code, message);
}

/** Like demoFallbackOrThrow, but returns null when there is no demo to fall back to. */
export function demoFallbackOrNull(): AiProvider | null {
  return isDemoAllowed() ? getDemoProvider() : null;
}

/**
 * Picks the provider for one analysis: the configured one, unless the visitor is in a region where real AI
 * is switched off (see services/ai/regions.ts), or the person or the site is over its daily cap.
 */
export async function chooseProvider(userId: string, country: string | null = null): Promise<AiProvider> {
  const provider = getAiProvider();
  if (provider.isDemo) return provider;

  if (isRealAiBlocked(country)) {
    logger.info("Real AI is off for this region, using a demo report", { country });
    return demoFallbackOrThrow(REGION_MESSAGE, "FORBIDDEN");
  }

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

/**
 * Picks the provider for the assistant. A demo report gets the demo assistant, because the report is
 * sample content and there is no reason to send it to a real provider. Regions where real AI is off get
 * the demo assistant too, and so do people or sites past the daily question cap.
 * Change the caps with REAL_AI_CHAT_PER_USER_PER_DAY and REAL_AI_CHAT_PER_DAY.
 */
export async function chooseChatProvider(userId: string, country: string | null, reportIsDemo: boolean): Promise<AiProvider> {
  const provider = getAiProvider();
  if (provider.isDemo) return provider;

  const demo = demoFallbackOrNull();
  if (reportIsDemo && demo) return demo;
  if (isRealAiBlocked(country)) return demoFallbackOrThrow(REGION_MESSAGE, "FORBIDDEN");

  const perUser = limitFromEnv("REAL_AI_CHAT_PER_USER_PER_DAY", DEFAULT_CHAT_PER_USER_PER_DAY);
  const perDay = limitFromEnv("REAL_AI_CHAT_PER_DAY", DEFAULT_CHAT_PER_DAY);
  const [mine, everyone] = await Promise.all([countAssistantQuestions(userId), countAssistantQuestions()]);
  if (mine >= perUser) {
    return demoFallbackOrThrow("You have used your assistant questions for today. Come back tomorrow for more.");
  }
  if (everyone >= perDay) {
    return demoFallbackOrThrow("Assistant questions are used up for today. Come back tomorrow.");
  }
  return provider;
}
