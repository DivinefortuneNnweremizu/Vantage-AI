import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageTitle } from "@/components/layout/page-title";
import { GoalStep } from "@/components/session/goal-step";
import { requireCurrentUser } from "@/features/auth/get-current-user";
import { listPendingAssets } from "@/features/sessions/assets";
import { loadOwnedSessionOrNotFound } from "@/features/sessions/page-helpers";

export const metadata: Metadata = { title: "My Goal" };

interface GoalPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function GoalPage({ params }: GoalPageProps) {
  const user = await requireCurrentUser();
  const session = await loadOwnedSessionOrNotFound(user.id, (await params).sessionId);
  const assets = await listPendingAssets(user.id, session.id);

  const [first] = assets;
  if (!first) {
    // Nothing to analyze. Go back to upload, or to the existing report.
    redirect(session.latestAnalysisId ? `/sessions/${session.id}` : `/sessions/${session.id}/upload`);
  }

  return (
    <div className="flex flex-col gap-2">
      <PageTitle title="My Goal" subtitle="Provide more information about what you want to learn and test" />
      <GoalStep
        sessionId={session.id}
        coverAssetId={first.id}
        coverName={first.originalName}
        pageCount={assets.length}
        initialGoal={session.goal ?? ""}
      />
    </div>
  );
}
