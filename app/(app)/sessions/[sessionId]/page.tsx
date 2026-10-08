import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AssistantPanel } from "@/components/report/assistant-panel";
import { KeyTakeaways } from "@/components/report/key-takeaways";
import { IterationSummary } from "@/components/report/iteration-summary";
import { DemoNotice, Disclaimer } from "@/components/report/notices";
import { Recommendations } from "@/components/report/recommendations";
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
        {tab === "recommendations" ? <Recommendations report={report} variant="page" /> : null}
        {tab === "assistant" ? (
          <div className="grid gap-6 xl:grid-cols-2">
            <Recommendations report={report} variant="card" />
            <AssistantPanel
              sessionId={session.id}
              initialMessages={messages.map((message) => ({ id: message.id, role: message.role, content: message.content }))}
              suggestedPrompts={report.suggestedPrompts}
            />
          </div>
        ) : null}
      </div>

      <Disclaimer />
    </div>
  );
}
