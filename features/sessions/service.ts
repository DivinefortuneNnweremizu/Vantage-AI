import type { DesignSession } from "@prisma/client";

import { AppError } from "@/lib/app-error";
import { prisma } from "@/lib/prisma";
import type { CreateSessionInput, UpdateSessionInput } from "@/features/sessions/schemas";

export const DEFAULT_SESSION_TITLE = "Untitled design";

/** Loads a session the user owns, or throws NOT_FOUND. Never reveals whether another user's session exists. */
export async function getOwnedSession(userId: string, sessionId: string): Promise<DesignSession> {
  const session = await prisma.designSession.findFirst({
    where: { id: sessionId, userId, deletedAt: null },
  });
  if (!session) {
    throw new AppError("NOT_FOUND", "We could not find that session.");
  }
  return session;
}

export async function createDraftSession(userId: string, input: CreateSessionInput): Promise<DesignSession> {
  return prisma.designSession.create({
    data: {
      userId,
      title: DEFAULT_SESSION_TITLE,
      pageScope: input.pageScope,
      platform: input.platform,
    },
  });
}

export async function updateSession(
  userId: string,
  sessionId: string,
  input: UpdateSessionInput,
): Promise<DesignSession> {
  await getOwnedSession(userId, sessionId);
  return prisma.designSession.update({
    where: { id: sessionId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.goal !== undefined ? { goal: input.goal } : {}),
    },
  });
}

/** Soft delete. The session and its reports are kept so they can be recovered. */
export async function softDeleteSession(userId: string, sessionId: string): Promise<void> {
  await getOwnedSession(userId, sessionId);
  await prisma.designSession.update({
    where: { id: sessionId },
    data: { deletedAt: new Date() },
  });
}

/** Turns "product-designers_bio.png" into "Product designers bio". */
export function titleFromFileName(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[a-z0-9]{2,5}$/i, "");
  const spaced = withoutExtension.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (!spaced) return DEFAULT_SESSION_TITLE;
  const titled = spaced.charAt(0).toUpperCase() + spaced.slice(1);
  return titled.slice(0, 80);
}
