import { prisma } from "@/lib/prisma";
import type { StorageDriver } from "@/services/storage/types";

/**
 * Keeps uploaded images in the database, in the StoredFile table.
 *
 * This is for showcases and small deployments that have a Postgres database but no file storage (no
 * Supabase Storage, and no disk on Vercel). Images are already shrunk to 2400 pixels and saved as WebP
 * before they get here, so each row is small. For real traffic, use Supabase Storage instead.
 */
export class DatabaseStorageDriver implements StorageDriver {
  async put(path: string, data: Buffer, contentType: string): Promise<void> {
    // Prisma wants a plain Uint8Array for binary columns, not a Node Buffer.
    const bytes = new Uint8Array(data);
    await prisma.storedFile.upsert({
      where: { path },
      create: { path, contentType, data: bytes },
      update: { contentType, data: bytes },
    });
  }

  async get(path: string): Promise<Buffer> {
    const file = await prisma.storedFile.findUnique({ where: { path }, select: { data: true } });
    if (!file) throw new Error(`Stored file not found: ${path}`);
    return Buffer.from(file.data);
  }

  async remove(paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    await prisma.storedFile.deleteMany({ where: { path: { in: paths } } });
  }
}
