import type { NextRequest } from "next/server";

import { ok } from "@/lib/api-response";
import { assertSameOrigin, handleRouteError, requireApiUser } from "@/lib/route-helpers";
import { uuidSchema } from "@/features/sessions/schemas";
import { removeAsset } from "@/features/sessions/assets";

interface RouteContext {
  params: Promise<{ sessionId: string; assetId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const resolved = await params;
    await removeAsset(user.id, uuidSchema.parse(resolved.sessionId), uuidSchema.parse(resolved.assetId));
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
