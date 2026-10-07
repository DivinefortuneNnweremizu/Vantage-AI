import type { NextRequest } from "next/server";

import { assertSameOrigin, enforceRateLimit, handleRouteError, requireApiUser, userMessageFor } from "@/lib/route-helpers";
import { logger } from "@/lib/logger";
import { analysisRequestSchema, type AnalysisEvent } from "@/features/analysis/schemas";
import { uuidSchema } from "@/features/sessions/schemas";
import { getOwnedSession } from "@/features/sessions/service";
import { runDesignAnalysis } from "@/services/analysis/run-design-analysis";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Starts an analysis and streams progress as Server-Sent Events.
 * Events: "progress" (a stage), "complete" (the report is saved), "error" (a safe message).
 *
 * Checks that can be answered up front return a normal JSON error. Everything after that
 * is reported through the stream. The run finishes and saves even if the browser disconnects.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    enforceRateLimit(user.id, "analysis", Number(process.env.ANALYSIS_RATE_LIMIT ?? 10), 600);
    const sessionId = uuidSchema.parse((await params).sessionId);
    const body = analysisRequestSchema.parse(await request.json().catch(() => ({})));
    await getOwnedSession(user.id, sessionId);

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const send = (event: AnalysisEvent): void => {
          try {
            controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`));
          } catch {
            // The browser disconnected. The analysis keeps running and still saves.
          }
        };

        runDesignAnalysis({ userId: user.id, sessionId, goal: body.goal }, send)
          .catch((error: unknown) => {
            logger.warn("Analysis ended with an error", { sessionId });
            send({ type: "error", message: userMessageFor(error) });
          })
          .finally(() => {
            try {
              controller.close();
            } catch {
              // Already closed.
            }
          });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
