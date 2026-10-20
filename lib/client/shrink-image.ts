/**
 * Makes a big image small enough to upload.
 *
 * Hosts like Vercel refuse requests over about 4.5 MB, and design screenshots are often bigger. The
 * server shrinks every image to 2400 pixels on its longest side and stores it as WebP anyway, so doing
 * the same in the browser first loses nothing the app would have kept.
 *
 * Images already under the limit are sent untouched.
 */
export const UPLOAD_TARGET_BYTES = Math.floor(3.5 * 1024 * 1024);
const MAX_EDGE = 2400;

/** Tried in order, from best quality to smallest. The first one that fits is used. */
const ATTEMPTS: ReadonlyArray<{ scale: number; quality: number }> = [
  { scale: 1, quality: 0.92 },
  { scale: 1, quality: 0.82 },
  { scale: 0.8, quality: 0.82 },
  { scale: 0.65, quality: 0.78 },
  { scale: 0.5, quality: 0.72 },
  { scale: 0.35, quality: 0.7 },
];

/** WebP first. Safari cannot make WebP, so JPEG is the second choice. */
const OUTPUT_TYPES = ["image/webp", "image/jpeg"] as const;

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function renamed(name: string, type: string): string {
  const extension = type === "image/webp" ? "webp" : "jpg";
  return `${name.replace(/\.[^.]+$/, "") || "design"}.${extension}`;
}

export async function prepareForUpload(file: File): Promise<File> {
  if (file.size <= UPLOAD_TARGET_BYTES) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`${file.name} could not be read. Try exporting it again as a PNG, JPG, or WebP.`);
  }

  const baseScale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not resize that image. Try a smaller one.");

  try {
    for (const { scale, quality } of ATTEMPTS) {
      canvas.width = Math.max(1, Math.round(bitmap.width * baseScale * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * baseScale * scale));

      for (const type of OUTPUT_TYPES) {
        // JPEG has no transparency, so paint a white page under the image first.
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (type === "image/jpeg") {
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        const blob = await toBlob(canvas, type, quality);
        // A browser that cannot make this type quietly gives back a PNG. Skip it.
        if (blob && blob.type === type && blob.size <= UPLOAD_TARGET_BYTES) {
          return new File([blob], renamed(file.name, type), { type });
        }
      }
    }
  } finally {
    bitmap.close();
  }

  throw new Error(`${file.name} is too large to upload, even after resizing. Try a smaller image.`);
}
