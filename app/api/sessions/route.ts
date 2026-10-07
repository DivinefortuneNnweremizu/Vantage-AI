import type { NextRequest } from "next/server";

import { ok } from "@/lib/api-response";
import { assertSameOrigin, handleRouteError, requireApiUser } from "@/lib/route-helpers";
import { createSessionSchema } from "@/features/sessions/schemas";
import { createDraftSession } from "@/features/sessions/service";

/** Creates a draft session. It appears in the library only after its first report. */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const body: unknown = await request.json().catch(() => ({}));
    const input = createSessionSchema.parse(body);
    const session = await createDraftSession(user.id, input);
    return ok({ id: session.id }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
