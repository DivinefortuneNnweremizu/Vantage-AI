import type { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { AppError, isAppError } from "@/lib/app-error";
import { fail } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSessionUser, type CurrentUser } from "@/features/auth/get-current-user";

/** Returns the signed-in user or throws UNAUTHORIZED. Identity is never taken from the request body. */
export async function requireApiUser(): Promise<CurrentUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AppError("UNAUTHORIZED", "Sign in to continue.");
  }
  return user;
}

/**
 * Rejects state-changing requests that come from another site.
 * Cookies are SameSite=Lax, so this is a second layer, not the only one.
 */
export function assertSameOrigin(request: NextRequest): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host = request.headers.get("host");
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new AppError("FORBIDDEN", "That request was blocked.");
  }
  if (host && originHost !== host) {
    throw new AppError("FORBIDDEN", "That request was blocked.");
  }
}

export function enforceRateLimit(userId: string, name: string, limit: number, windowSeconds: number): void {
  const result = checkRateLimit(`${name}:${userId}`, limit, windowSeconds);
  if (!result.allowed) {
    throw new AppError("RATE_LIMITED", `You are going a little fast. Try again in ${result.retryAfterSeconds} seconds.`);
  }
}

/** Message safe to show a user for any thrown value. Internal details only go to the log. */
export function userMessageFor(error: unknown): string {
  if (isAppError(error)) return error.message;
  return "Something went wrong on our side. Try again.";
}

/** Maps any thrown value to the standard error response. Never leaks internals. */
export function handleRouteError(error: unknown): NextResponse {
  if (isAppError(error)) {
    return fail(error.code, error.message);
  }
  if (error instanceof ZodError) {
    return fail("VALIDATION_ERROR", error.issues[0]?.message ?? "Check the details and try again.");
  }
  logger.error("Unhandled route error", { error: error instanceof Error ? error.message : "unknown" });
  return fail("INTERNAL_ERROR", "Something went wrong on our side. Try again.");
}
