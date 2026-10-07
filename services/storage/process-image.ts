import { createHash } from "node:crypto";
import sharp from "sharp";

import { AppError } from "@/lib/app-error";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_INPUT_PIXELS = 50_000_000;
const FULL_MAX_EDGE = 2400;
const THUMB_MAX_EDGE = 640;

export const ACCEPTED_TYPES_LABEL = "PNG, JPG, or WebP";

/** Identifies the real file type from its first bytes. The browser-reported type is never trusted. */
export function sniffImageType(data: Buffer): "image/png" | "image/jpeg" | "image/webp" | null {
  if (data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    data.length >= 12 &&
    data.subarray(0, 4).toString("ascii") === "RIFF" &&
    data.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export interface ProcessedImage {
  full: Buffer;
  thumb: Buffer;
  width: number;
  height: number;
  contentHash: string;
}

/**
 * Validates an uploaded image and produces the stored versions: a normalized WebP
 * (orientation fixed, metadata stripped, longest edge capped) and a thumbnail.
 */
export async function processImage(data: Buffer): Promise<ProcessedImage> {
  if (data.length === 0) {
    throw new AppError("VALIDATION_ERROR", "That file is empty.");
  }
  if (data.length > MAX_UPLOAD_BYTES) {
    throw new AppError("VALIDATION_ERROR", "That file is larger than 10 MB. Export a smaller image and try again.");
  }
  if (!sniffImageType(data)) {
    throw new AppError("VALIDATION_ERROR", `We can only read ${ACCEPTED_TYPES_LABEL} images.`);
  }

  try {
    const base = () => sharp(data, { limitInputPixels: MAX_INPUT_PIXELS }).rotate();

    const fullResult = await base()
      .resize({ width: FULL_MAX_EDGE, height: FULL_MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 88 })
      .toBuffer({ resolveWithObject: true });

    const thumb = await base()
      .resize({ width: THUMB_MAX_EDGE, height: THUMB_MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    return {
      full: fullResult.data,
      thumb,
      width: fullResult.info.width,
      height: fullResult.info.height,
      contentHash: createHash("sha256").update(data).digest("hex"),
    };
  } catch {
    throw new AppError("VALIDATION_ERROR", "We could not read that image. It may be damaged or too large.");
  }
}
