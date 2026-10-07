import type { NextRequest } from "next/server";

import { handleRouteError, requireApiUser } from "@/lib/route-helpers";
import { uuidSchema } from "@/features/sessions/schemas";
import { readAssetFile } from "@/features/sessions/assets";

interface RouteContext {
  params: Promise<{ assetId: string }>;
}

export const runtime = "nodejs";

/**
 * Serves an uploaded image to its owner. Storage buckets are never exposed, so every image
 * passes an ownership check here. Images never change once stored, so they cache privately.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireApiUser();
    const assetId = uuidSchema.parse((await params).assetId);
    const size = request.nextUrl.searchParams.get("size") === "thumb" ? "thumb" : "full";
    const file = await readAssetFile(user.id, assetId, size);

    return new Response(new Uint8Array(file.data), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.data.length),
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
