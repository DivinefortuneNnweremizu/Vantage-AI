import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AppError } from "@/lib/app-error";
import { LocalStorageDriver } from "@/services/storage/local-driver";
import { MAX_UPLOAD_BYTES, processImage, sniffImageType } from "@/services/storage/process-image";

async function makeImage(format: "png" | "jpeg" | "webp", width = 300, height = 200): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: "#3929CE" } })
    [format]()
    .toBuffer();
}

describe("image validation", () => {
  it("recognizes PNG, JPEG and WebP by their first bytes", async () => {
    expect(sniffImageType(await makeImage("png"))).toBe("image/png");
    expect(sniffImageType(await makeImage("jpeg"))).toBe("image/jpeg");
    expect(sniffImageType(await makeImage("webp"))).toBe("image/webp");
  });

  it("rejects anything else, whatever the file is called", () => {
    expect(sniffImageType(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"))).toBeNull();
    expect(sniffImageType(Buffer.from("MZ\u0090\u0000 not an image"))).toBeNull();
    expect(sniffImageType(Buffer.from("GIF89a...."))).toBeNull();
    expect(sniffImageType(Buffer.alloc(0))).toBeNull();
  });

  it("normalizes to WebP, makes a thumbnail, and reports the size", async () => {
    const result = await processImage(await makeImage("png", 1000, 600));
    expect(sniffImageType(result.full)).toBe("image/webp");
    expect(sniffImageType(result.thumb)).toBe("image/webp");
    expect(result.width).toBe(1000);
    expect(result.height).toBe(600);
    expect(result.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("caps very large images and keeps the aspect ratio", async () => {
    const result = await processImage(await makeImage("jpeg", 4800, 2400));
    expect(result.width).toBe(2400);
    expect(result.height).toBe(1200);
    const thumb = await sharp(result.thumb).metadata();
    expect(Math.max(thumb.width ?? 0, thumb.height ?? 0)).toBeLessThanOrEqual(640);
  });

  it("does not enlarge small images", async () => {
    const result = await processImage(await makeImage("png", 120, 80));
    expect(result.width).toBe(120);
  });

  it("gives the same hash for the same bytes", async () => {
    const image = await makeImage("png");
    expect((await processImage(image)).contentHash).toBe((await processImage(image)).contentHash);
  });

  it("rejects empty, oversized, and non-image files with a friendly message", async () => {
    await expect(processImage(Buffer.alloc(0))).rejects.toBeInstanceOf(AppError);
    await expect(processImage(Buffer.alloc(MAX_UPLOAD_BYTES + 1, 1))).rejects.toThrow("10 MB");
    await expect(processImage(Buffer.from("hello world"))).rejects.toThrow("PNG, JPG, or WebP");
  });

  it("rejects a file that has image bytes at the start but is not decodable", async () => {
    const broken = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from("garbage")]);
    await expect(processImage(broken)).rejects.toThrow("could not read");
  });
});

describe("local storage driver", () => {
  let root: string;

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), "vantage-storage-"));
  });

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("stores, reads, and removes files", async () => {
    const driver = new LocalStorageDriver(root);
    await driver.put("user/session/a.webp", Buffer.from("hello"));
    expect((await driver.get("user/session/a.webp")).toString()).toBe("hello");
    await driver.remove(["user/session/a.webp"]);
    await expect(driver.get("user/session/a.webp")).rejects.toThrow();
  });

  it("refuses paths that escape the root", async () => {
    const driver = new LocalStorageDriver(root);
    await expect(driver.put("../escape.txt", Buffer.from("x"))).rejects.toThrow("Invalid storage path");
    await expect(driver.get("../../etc/passwd")).rejects.toThrow("Invalid storage path");
    await expect(driver.remove(["a/../../b"])).rejects.toThrow("Invalid storage path");
    expect(await readdir(root)).not.toContain("escape.txt");
  });

  it("removing a missing file is not an error", async () => {
    const driver = new LocalStorageDriver(root);
    await expect(driver.remove(["nothing/here.webp"])).resolves.toBeUndefined();
  });
});
