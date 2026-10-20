import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AssistantPanel } from "@/components/report/assistant-panel";
import { KeyTakeaways } from "@/components/report/key-takeaways";
import { IterationSummary } from "@/components/report/iteration-summary";
import { DemoNotice, Disclaimer } from "@/components/report/notices";
import { Recommendations, RecommendationList } from "@/components/report/recommendations";
import { ReportHeader } from "@/components/report/report-header";
import { PANEL_ID, ReportTabs } from "@/components/report/report-tabs";
import { SentimentMap } from "@/components/report/sentiment-map";
import { parseTab } from "@/components/report/tabs";
import { UxScore } from "@/components/report/ux-score";
import { requireCurrentUser } from "@/features/auth/get-current-user";
import { listAssistantMessages } from "@/features/assistant/service";
import { getReportView } from "@/features/analysis/queries";
import { listPendingAssets } from "@/features/sessions/assets";
import { loadOwnedSessionOrNotFound } from "@/features/sessions/page-helpers";

interface ReportPageProps {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ tab?: string; v?: string }>;
}

export async function generateMetadata({ params }: ReportPageProps): Promise<Metadata> {
  const user = await requireCurrentUser();
  const session = await loadOwnedSessionOrNotFound(user.id, (await params).sessionId);
  return { title: `${session.title} Design Analysis` };
}

// There is deliberately no loading.tsx in this folder (or above it, under sessions/). In the production build
// a loading boundary here made most tab switches inside a report hang: the server answered, but the browser
// never showed the new tab. It worked in development, so only a production build (or Vercel) shows it.
// Check any change near here with `next build` and `next start`. See "Testing a production build" in the README.
export default async function ReportPage({ params, searchParams }: ReportPageProps) {
  const user = await requireCurrentUser();
  const session = await loadOwnedSessionOrNotFound(user.id, (await params).sessionId);
  const query = await searchParams;

  const requestedIteration = query.v ? Number.parseInt(query.v, 10) : undefined;
  const report = await getReportView(
    user.id,
    session.id,
    requestedIteration !== undefined && Number.isFinite(requestedIteration) ? requestedIteration : undefined,
  );

  if (!report) {
    // No finished report yet: continue the flow where the user left off.
    const pending = await listPendingAssets(user.id, session.id);
    redirect(pending.length > 0 ? `/sessions/${session.id}/goal` : `/sessions/${session.id}/upload`);
  }

  const tab = parseTab(query.tab);
  const isLatest = report.iterations[report.iterations.length - 1]?.iteration === report.analysis.iteration;
  const iterationParam = isLatest ? undefined : report.analysis.iteration;

  const messages = tab === "assistant" ? await listAssistantMessages(user.id, session.id) : [];

  if (!report.assets.length) notFound();

  // Numbered the same way as the report the assistant reads (see toChatContext), so "[image: 3]" points at spot 3.
  const assetById = new Map(report.assets.map((asset) => [asset.id, asset]));
  const spots = report.findings.flatMap((finding, index) =>
    finding.assetId && finding.marker
      ? [{ ref: index + 1, assetId: finding.assetId, title: finding.title, x: finding.marker.x, y: finding.marker.y, width: assetById.get(finding.assetId)?.width ?? null, height: assetById.get(finding.assetId)?.height ?? null }]
      : [],
  );

  return (
    <div className="flex flex-col gap-4">
      <ReportHeader
        sessionId={session.id}
        title={report.session.title}
        tab={tab}
        currentIteration={report.analysis.iteration}
        iterations={report.iterations.map((entry) => ({ iteration: entry.iteration, overall: entry.overall }))}
      />

      {report.analysis.isDemo ? <DemoNotice /> : null}

      <ReportTabs sessionId={session.id} active={tab} iteration={iterationParam} />

      {report.comparison && (tab === "sentiment" || tab === "takeaways" || tab === "score") ? (
        <IterationSummary comparison={report.comparison} iteration={report.analysis.iteration} />
      ) : null}

      <div role="tabpanel" id={PANEL_ID} aria-labelledby={`tab-${tab}`} tabIndex={0} className="pt-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
        {tab === "takeaways" ? <KeyTakeaways report={report} /> : null}
        {tab === "score" ? <UxScore report={report} /> : null}
        {tab === "sentiment" ? (
          <SentimentMap title={`Analyzed design: ${report.session.title}`} assets={report.assets} findings={report.findings} />
        ) : null}
        {tab === "recommendations" ? <Recommendations report={report} /> : null}
        {tab === "assistant" ? (
          <div className="flex flex-col gap-4">
            {/* The chat gets the whole width so close-ups of the design are big enough to inspect. The recommendations fold away above it. */}
            <details className="group rounded-xl border border-line bg-surface">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-6 py-4 text-base font-semibold text-fg-heading focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
                Recommendations ({report.recommendations.length})
                <ChevronDown className="size-5 text-fg-subtle transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="px-6 pb-4">
                <RecommendationList report={report} />
              </div>
            </details>
            <AssistantPanel
              sessionId={session.id}
              initialMessages={messages.map((message) => ({ id: message.id, role: message.role, content: message.content }))}
              suggestedPrompts={report.suggestedPrompts}
              spots={spots}
            />
          </div>
        ) : null}
      </div>

      <Disclaimer />
    </div>
  );
}
