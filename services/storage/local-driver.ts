import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";

import type { StorageDriver } from "@/services/storage/types";

/** Development storage on disk under .data/uploads. Never used in production. */
export class LocalStorageDriver implements StorageDriver {
  private readonly root: string;

  constructor(root = resolve(process.cwd(), ".data", "uploads")) {
    this.root = root;
  }

  /** Resolves a storage path and refuses anything that escapes the upload root. */
  private resolveSafe(path: string): string {
    const full = resolve(this.root, path);
    if (full !== this.root && !full.startsWith(this.root + sep)) {
      throw new Error("Invalid storage path.");
    }
    return full;
  }

  async put(path: string, data: Buffer): Promise<void> {
    const full = this.resolveSafe(path);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, data);
  }

  async get(path: string): Promise<Buffer> {
    return readFile(this.resolveSafe(path));
  }

  async remove(paths: string[]): Promise<void> {
    await Promise.all(paths.map((path) => rm(this.resolveSafe(path), { force: true })));
  }
}
