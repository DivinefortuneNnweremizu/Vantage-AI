import "server-only";
import { z } from "zod";

import { AppError } from "@/lib/app-error";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getReportView } from "@/features/analysis/queries";
import { toChatContext } from "@/features/assistant/chat-context";
import { getOwnedSession } from "@/features/sessions/service";
import { chooseChatProvider } from "@/services/analysis/choose-provider";

export const askAssistantSchema = z.object({
  question: z.string().trim().min(1, "Type a question first.").max(1000, "Use 1,000 characters or fewer."),
});

interface AssistantMessageView {
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

/**
 * Saves the question, streams the answer as text, then saves the answer.
 * The answer is saved only when it finishes, so a dropped connection never stores half a reply.
 */
export async function streamAssistantReply(
  userId: string,
  sessionId: string,
  question: string,
  country: string | null = null,
): Promise<ReadableStream<Uint8Array>> {
  await getOwnedSession(userId, sessionId);

  const report = await getReportView(userId, sessionId);
  if (!report) {
    throw new AppError("CONFLICT", "Analyze a design first. The assistant answers questions about your report.");
  }

  const history = await listAssistantMessages(userId, sessionId);
  // Chosen before the question is saved: past the daily cap this may switch to the demo assistant, or refuse.
  const provider = await chooseChatProvider(userId, country, report.analysis.isDemo);
  const savedQuestion = await prisma.assistantMessage.create({
    data: { sessionId, analysisId: report.analysis.id, role: "USER", content: question },
    select: { id: true },
  });
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
        // Take the unanswered question back out, so asking again does not leave two questions in a row.
        await prisma.assistantMessage.delete({ where: { id: savedQuestion.id } }).catch(() => undefined);
        controller.error(error);
      }
    },
  });
}
