import type { Metadata } from "next";

import { PageTitle } from "@/components/layout/page-title";
import { UploadStep } from "@/components/session/upload-step";
import { requireCurrentUser } from "@/features/auth/get-current-user";
import { entitlementsFor } from "@/features/billing/plans";
import { listPendingAssets } from "@/features/sessions/assets";
import { loadOwnedSessionOrNotFound } from "@/features/sessions/page-helpers";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Upload Images" };

interface UploadPageProps {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ skipped?: string }>;
}

export default async function UploadPage({ params, searchParams }: UploadPageProps) {
  const user = await requireCurrentUser();
  const session = await loadOwnedSessionOrNotFound(user.id, (await params).sessionId);
  const { skipped } = await searchParams;

  const [assets, subscription] = await Promise.all([
    listPendingAssets(user.id, session.id),
    prisma.subscription.findUnique({ where: { userId: user.id }, select: { plan: true } }),
  ]);

  const isNewVersion = session.latestAnalysisId !== null;
  const skippedCount = Math.min(Math.max(Number.parseInt(skipped ?? "0", 10) || 0, 0), 50);

  return (
    <div className="flex flex-col gap-2">
      <PageTitle
        title={isNewVersion ? "Upload a new version" : "Upload Images"}
        subtitle={
          isNewVersion
            ? `Add the updated design for "${session.title}" to compare it with your last report.`
            : "Upload UI images from your files to get started"
        }
      />
      <UploadStep
        sessionId={session.id}
        pageScope={session.pageScope}
        assets={assets.map((asset) => ({ id: asset.id, name: asset.originalName }))}
        maxPages={entitlementsFor(subscription?.plan ?? "FREE").pagesPerJourney}
        skipped={skippedCount}
      />
    </div>
  );
}
