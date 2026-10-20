import "server-only";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

interface UserIdentity {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}

/**
 * Creates the User row and a FREE Subscription on first sign-in.
 * Safe to call on every request: both writes are upserts inside one transaction.
 */
async function writeUserRecords(identity: UserIdentity): Promise<void> {
  await prisma.$transaction([
    prisma.user.upsert({
      where: { id: identity.id },
      create: {
        id: identity.id,
        email: identity.email,
        fullName: identity.fullName,
        avatarUrl: identity.avatarUrl,
      },
      update: {
        email: identity.email,
        fullName: identity.fullName,
        avatarUrl: identity.avatarUrl,
      },
    }),
    prisma.subscription.upsert({
      where: { userId: identity.id },
      create: { userId: identity.id },
      update: {},
    }),
  ]);
}

export async function ensureUserRecords(identity: UserIdentity): Promise<void> {
  try {
    await writeUserRecords(identity);
  } catch (error) {
    // A brand-new user's first page makes several requests at once, and two can try to create the rows together.
    // The loser fails on the unique key, but the rows exist now, so running it again is safe.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      await writeUserRecords(identity);
      return;
    }
    throw error;
  }
}
