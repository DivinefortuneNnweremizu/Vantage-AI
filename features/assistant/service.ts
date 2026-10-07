import { z } from "zod";

import { AppError } from "@/lib/app-error";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getReportView, type ReportView } from "@/features/analysis/queries";
import { getOwnedSession } from "@/features/sessions/service";
import { getAiProvider } from "@/services/ai";
import type { ChatReportContext } from "@/services/ai/provider";

export const askAssistantSchema = z.object({
  question: z.string().trim().min(1, "Type a question first.").max(1000, "Use 1,000 characters or fewer."),
});

export interface AssistantMessageView {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: Date;
}

const HISTORY_LIMIT = 40;
const CONTEXT_HISTORY = 10;

export async function listAssistantMessages(userId: string, sessionId: string): Promise<AssistantMessageView[]> {
  await getOwnedSession(userId, sessionId);
  const rows = await prisma.assistantMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
    select: { id: true, role: true, content: true, createdAt: true },
  });
  return rows.reverse();
}

/** Only what the assistant may talk about: the saved report. Nothing else is sent to the model. */
export function toChatContext(report: ReportView): ChatReportContext {
  return {
    title: report.session.title,
    goal: report.analysis.goal,
    overall: report.analysis.scores.overall,
    scores: {
      intuitive: report.analysis.scores.intuitive,
      trusted: report.analysis.scores.trusted,
      valuable: report.analysis.scores.valuable,
    },
    strengths: report.strengths,
    painPoints: report.painPoints,
    overallTakeaway: report.analysis.overallTakeaway,
    findings: report.findings.map((finding) => ({
      title: finding.title,
      valence: finding.valence,
      severity: finding.severity,
      category: finding.category,
      standard: finding.standard,
      observation: finding.observation,
      impact: finding.impact,
    })),
    recommendations: report.recommendations.map((item) => ({
      rank: item.rank,
      title: item.title,
      change: item.change,
      rationale: item.rationale,
    })),
  };
}

/**
 * Saves the question, streams the answer as text, then saves the answer.
 * The answer is saved only when it finishes, so a dropped connection never stores half a reply.
 */
export async function streamAssistantReply(
  userId: string,
  sessionId: string,
  question: string,
): Promise<ReadableStream<Uint8Array>> {
  await getOwnedSession(userId, sessionId);

  const report = await getReportView(userId, sessionId);
  if (!report) {
    throw new AppError("CONFLICT", "Analyze a design first. The assistant answers questions about your report.");
  }

  const history = await listAssistantMessages(userId, sessionId);
  await prisma.assistantMessage.create({
    data: { sessionId, analysisId: report.analysis.id, role: "USER", content: question },
  });

  const provider = getAiProvider();
  const chunks = provider.chat({
    report: toChatContext(report),
    history: history.slice(-CONTEXT_HISTORY).map((message) => ({ role: message.role, content: message.content })),
    question,
  });

  const encoder = new TextEncoder();
  let answer = "";

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of chunks) {
          answer += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
        await prisma.assistantMessage.create({
          data: { sessionId, analysisId: report.analysis.id, role: "ASSISTANT", content: answer },
        });
        controller.close();
      } catch (error) {
        logger.error("Assistant reply failed", { sessionId, error: error instanceof Error ? error.message : "unknown" });
        controller.error(error);
      }
    },
  });
}
