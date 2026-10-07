import type { NextRequest } from "next/server";

import { ok } from "@/lib/api-response";
import { assertSameOrigin, handleRouteError, requireApiUser } from "@/lib/route-helpers";
import { updateSessionSchema, uuidSchema } from "@/features/sessions/schemas";
import { softDeleteSession, updateSession } from "@/features/sessions/service";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const sessionId = uuidSchema.parse((await params).sessionId);
    const input = updateSessionSchema.parse(await request.json().catch(() => ({})));
    const session = await updateSession(user.id, sessionId, input);
    return ok({ id: session.id, title: session.title, goal: session.goal });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const sessionId = uuidSchema.parse((await params).sessionId);
    await softDeleteSession(user.id, sessionId);
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
