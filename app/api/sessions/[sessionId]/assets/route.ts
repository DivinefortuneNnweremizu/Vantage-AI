import type { NextRequest } from "next/server";

import { AppError } from "@/lib/app-error";
import { ok } from "@/lib/api-response";
import { assertSameOrigin, enforceRateLimit, handleRouteError, requireApiUser } from "@/lib/route-helpers";
import { uuidSchema } from "@/features/sessions/schemas";
import { addAsset } from "@/features/sessions/assets";
import { MAX_UPLOAD_BYTES } from "@/services/storage/process-image";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export const runtime = "nodejs";

const TOO_LARGE_MESSAGE = "That file is larger than 10 MB. Export a smaller image and try again.";

/**
 * Uploads one image to a session the user owns. Send multipart form data with a "file" field,
 * and optionally "replaceAssetId" to swap an existing pending image.
 *
 * The file passes through this route so it can be checked by its real contents before it is stored.
 * Move to signed direct uploads when Supabase is connected (see docs/implementation-plan.md).
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    enforceRateLimit(user.id, "upload", 60, 60);
    const sessionId = uuidSchema.parse((await params).sessionId);

    // Next buffers at most 10 MB of a request body when middleware is present, so anything larger
    // would fail inside the parser with a vague error. Say the real reason instead.
    const declaredLength = Number(request.headers.get("content-length") ?? "0");
    if (declaredLength > MAX_UPLOAD_BYTES) {
      throw new AppError("VALIDATION_ERROR", TOO_LARGE_MESSAGE);
    }

    const form = await request.formData().catch(() => {
      throw new AppError("BAD_REQUEST", "We could not read that upload. Try again.");
    });

    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new AppError("BAD_REQUEST", "Choose an image to upload.");
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new AppError("VALIDATION_ERROR", TOO_LARGE_MESSAGE);
    }

    const replaceRaw = form.get("replaceAssetId");
    const replaceAssetId = typeof replaceRaw === "string" && replaceRaw ? uuidSchema.parse(replaceRaw) : undefined;

    const asset = await addAsset({
      userId: user.id,
      sessionId,
      fileName: file.name || "design",
      data: Buffer.from(await file.arrayBuffer()),
      replaceAssetId,
    });

    return ok({ id: asset.id, order: asset.order, width: asset.width, height: asset.height }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
