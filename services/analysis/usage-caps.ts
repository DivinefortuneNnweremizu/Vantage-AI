import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * How much real AI each person, and the whole site, has used in the last 24 hours, and how much is allowed.
 * This only counts and compares. Deciding what to do about it (a demo report, an error) is
 * services/analysis/choose-provider.ts.
 *
 * 0 means "none, always demo".
 */
const WINDOW_MS = 24 * 60 * 60 * 1000;

export interface UsageLimits {
  perUser: number;
  perDay: number;
}

function limitFromEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

/** Change with REAL_AI_PER_USER_PER_DAY and REAL_AI_PER_DAY. */
export function analysisLimits(): UsageLimits {
  return {
    perUser: limitFromEnv("REAL_AI_PER_USER_PER_DAY", 3),
    perDay: limitFromEnv("REAL_AI_PER_DAY", 50),
  };
}

/** Assistant questions go to the real model too, so they are capped the same way. Change with REAL_AI_CHAT_PER_USER_PER_DAY and REAL_AI_CHAT_PER_DAY. */
export function assistantLimits(): UsageLimits {
  return {
    perUser: limitFromEnv("REAL_AI_CHAT_PER_USER_PER_DAY", 30),
    perDay: limitFromEnv("REAL_AI_CHAT_PER_DAY", 300),
  };
}

export interface Usage {
  mine: number;
  everyone: number;
}

/** Analyses by real models in the last 24 hours. Demo reports never count. */
export async function realAnalysisUsage(userId: string): Promise<Usage> {
  const since = new Date(Date.now() - WINDOW_MS);
  const count = (forUser?: string) =>
    prisma.analysis.count({
      where: {
        status: "COMPLETE",
        createdAt: { gte: since },
        NOT: { model: { startsWith: "mock" } },
        ...(forUser ? { session: { userId: forUser } } : {}),
      },
    });
  const [mine, everyone] = await Promise.all([count(userId), count()]);
  return { mine, everyone };
}

/** Questions asked of the assistant in the last 24 hours. */
export async function assistantUsage(userId: string): Promise<Usage> {
  const since = new Date(Date.now() - WINDOW_MS);
  const count = (forUser?: string) =>
    prisma.assistantMessage.count({
      where: { role: "USER", createdAt: { gte: since }, ...(forUser ? { session: { userId: forUser } } : {}) },
    });
  const [mine, everyone] = await Promise.all([count(userId), count()]);
  return { mine, everyone };
}
