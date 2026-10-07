import { notFound } from "next/navigation";
import type { DesignSession } from "@prisma/client";

import { isAppError } from "@/lib/app-error";
import { getOwnedSession } from "@/features/sessions/service";
import { uuidSchema } from "@/features/sessions/schemas";

/**
 * For pages. Loads a session the user owns, or shows the not-found page.
 * A malformed id and another user's id look the same, so nothing leaks about what exists.
 */
export async function loadOwnedSessionOrNotFound(userId: string, rawSessionId: string): Promise<DesignSession> {
  const parsed = uuidSchema.safeParse(rawSessionId);
  if (!parsed.success) notFound();

  try {
    return await getOwnedSession(userId, parsed.data);
  } catch (error) {
    if (isAppError(error) && error.code === "NOT_FOUND") notFound();
    throw error;
  }
}
