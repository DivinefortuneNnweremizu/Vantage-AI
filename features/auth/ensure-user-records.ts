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
export async function ensureUserRecords(identity: UserIdentity): Promise<void> {
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
