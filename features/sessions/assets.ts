import { randomUUID } from "node:crypto";
import type { Asset } from "@prisma/client";

import { AppError } from "@/lib/app-error";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { entitlementsFor } from "@/features/billing/plans";
import { DEFAULT_SESSION_TITLE, getOwnedSession, titleFromFileName } from "@/features/sessions/service";
import { getStorage } from "@/services/storage";
import { processImage } from "@/services/storage/process-image";

/**
 * Assets not yet part of a completed report. This is the "working set" shown on the Upload screen.
 * Images from a failed run stay pending, so the user can retry without uploading again.
 */
const PENDING = { deletedAt: null, analyses: { none: { analysis: { status: "COMPLETE" } } } } as const;

/** Images cannot change while an analysis is reading them. */
async function assertNoActiveAnalysis(sessionId: string): Promise<void> {
  const active = await prisma.analysis.findFirst({
    where: { sessionId, status: { in: ["QUEUED", "RUNNING"] }, createdAt: { gt: new Date(Date.now() - 5 * 60 * 1000) } },
    select: { id: true },
  });
  if (active) {
    throw new AppError("CONFLICT", "An analysis is running. Wait for it to finish before changing images.");
  }
}

export async function listPendingAssets(userId: string, sessionId: string): Promise<Asset[]> {
  await getOwnedSession(userId, sessionId);
  return prisma.asset.findMany({
    where: { sessionId, ...PENDING },
    orderBy: { order: "asc" },
  });
}

interface AddAssetInput {
  userId: string;
  sessionId: string;
  fileName: string;
  data: Buffer;
  /** When set, the new image takes the place of this pending asset. */
  replaceAssetId?: string;
}

export async function addAsset(input: AddAssetInput): Promise<Asset> {
  const session = await getOwnedSession(input.userId, input.sessionId);
  await assertNoActiveAnalysis(session.id);
  const subscription = await prisma.subscription.findUnique({ where: { userId: input.userId } });
  const entitlements = entitlementsFor(subscription?.plan ?? "FREE");

  const pending = await prisma.asset.findMany({
    where: { sessionId: session.id, ...PENDING },
    orderBy: { order: "asc" },
  });

  let order = pending.length;
  let replaced: Asset | undefined;

  if (input.replaceAssetId) {
    replaced = pending.find((asset) => asset.id === input.replaceAssetId);
    if (!replaced) {
      throw new AppError("NOT_FOUND", "We could not find the image to replace.");
    }
    order = replaced.order;
  } else if (session.pageScope === "SINGLE_PAGE" && pending.length >= 1) {
    throw new AppError(
      "CONFLICT",
      "Single Page analyzes one image. Replace the current image, or switch to Multiple Page Journey.",
    );
  } else if (pending.length >= entitlements.pagesPerJourney) {
    throw new AppError("CONFLICT", `A journey can have up to ${entitlements.pagesPerJourney} pages.`);
  }

  // Validate and process before touching storage, so a bad file never leaves anything behind.
  const processed = await processImage(input.data);

  const assetId = randomUUID();
  const basePath = `${input.userId}/${session.id}/${assetId}`;
  const storagePath = `${basePath}.webp`;
  const thumbPath = `${basePath}.thumb.webp`;
  const storage = getStorage();

  await storage.put(storagePath, processed.full, "image/webp");
  await storage.put(thumbPath, processed.thumb, "image/webp");

  try {
    const asset = await prisma.$transaction(async (tx) => {
      const created = await tx.asset.create({
        data: {
          id: assetId,
          sessionId: session.id,
          kind: "IMAGE",
          originalName: input.fileName.slice(0, 200),
          storagePath,
          thumbPath,
          contentHash: processed.contentHash,
          mimeType: "image/webp",
          width: processed.width,
          height: processed.height,
          sizeBytes: processed.full.length,
          order,
        },
      });

      if (replaced) {
        await tx.analysisAsset.deleteMany({ where: { assetId: replaced.id } });
        await tx.asset.delete({ where: { id: replaced.id } });
      }

      // The first image names an untitled session.
      if (session.title === DEFAULT_SESSION_TITLE && order === 0) {
        await tx.designSession.update({
          where: { id: session.id },
          data: { title: titleFromFileName(input.fileName) },
        });
      } else {
        await tx.designSession.update({ where: { id: session.id }, data: { updatedAt: new Date() } });
      }

      return created;
    });

    if (replaced) {
      await removeStoredFiles(replaced);
    }

    return asset;
  } catch (error) {
    await storage.remove([storagePath, thumbPath]).catch(() => undefined);
    logger.error("Saving an uploaded asset failed", { sessionId: session.id });
    throw error;
  }
}

export async function removeAsset(userId: string, sessionId: string, assetId: string): Promise<void> {
  await getOwnedSession(userId, sessionId);
  await assertNoActiveAnalysis(sessionId);
  const asset = await prisma.asset.findFirst({ where: { id: assetId, sessionId, ...PENDING } });
  if (!asset) {
    throw new AppError("NOT_FOUND", "We could not find that image. It may already be part of a report.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.analysisAsset.deleteMany({ where: { assetId: asset.id } });
    await tx.asset.delete({ where: { id: asset.id } });
    // Keep the remaining pending images in a gap-free order.
    const remaining = await tx.asset.findMany({ where: { sessionId, ...PENDING }, orderBy: { order: "asc" } });
    await Promise.all(
      remaining.map((item, index) =>
        item.order === index ? Promise.resolve() : tx.asset.update({ where: { id: item.id }, data: { order: index } }),
      ),
    );
  });

  await removeStoredFiles(asset);
}

async function removeStoredFiles(asset: Asset): Promise<void> {
  const paths = [asset.storagePath, asset.thumbPath].filter((path): path is string => Boolean(path));
  await getStorage()
    .remove(paths)
    .catch(() => logger.warn("Could not delete stored files", { assetId: asset.id }));
}

export interface AssetFile {
  data: Buffer;
  mimeType: string;
}

/** Reads an image the user owns. Ownership is checked through the session, never through the asset id alone. */
export async function readAssetFile(userId: string, assetId: string, size: "full" | "thumb"): Promise<AssetFile> {
  const asset = await prisma.asset.findFirst({
    where: { id: assetId, deletedAt: null, session: { userId, deletedAt: null } },
  });
  if (!asset) {
    throw new AppError("NOT_FOUND", "We could not find that image.");
  }
  const path = size === "thumb" && asset.thumbPath ? asset.thumbPath : asset.storagePath;
  try {
    return { data: await getStorage().get(path), mimeType: asset.mimeType };
  } catch {
    throw new AppError("NOT_FOUND", "That image is no longer available.");
  }
}
