import type { NextRequest } from "next/server";

import { ok } from "@/lib/api-response";
import { assertSameOrigin, enforceRateLimit, handleRouteError, requireApiUser } from "@/lib/route-helpers";
import { askAssistantSchema, listAssistantMessages, streamAssistantReply } from "@/features/assistant/service";
import { uuidSchema } from "@/features/sessions/schemas";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireApiUser();
    const sessionId = uuidSchema.parse((await params).sessionId);
    const messages = await listAssistantMessages(user.id, sessionId);
    return ok({
      messages: messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

/** Streams the assistant's answer as plain text. Errors before the stream starts are normal JSON errors. */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    enforceRateLimit(user.id, "assistant", 30, 60);
    const sessionId = uuidSchema.parse((await params).sessionId);
    const { question } = askAssistantSchema.parse(await request.json().catch(() => ({})));

    const stream = await streamAssistantReply(user.id, sessionId, question);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
