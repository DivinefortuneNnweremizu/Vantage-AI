import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { StorageDriver } from "@/services/storage/types";

/**
 * Production storage in a private Supabase Storage bucket.
 *
 * Uses the service role key, so it must only run on the server. Reads never hand out bucket URLs:
 * images are served through /api/assets/[assetId]/file after an ownership check.
 *
 * Not yet exercised against a real project. Verify once Supabase is connected.
 */
export class SupabaseStorageDriver implements StorageDriver {
  private readonly client: SupabaseClient;
  private readonly bucket: string;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      throw new Error("Supabase storage needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    }
    this.client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
    this.bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "designs";
  }

  async put(path: string, data: Buffer, contentType: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).upload(path, data, { contentType, upsert: true });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
  }

  async get(path: string): Promise<Buffer> {
    const { data, error } = await this.client.storage.from(this.bucket).download(path);
    if (error || !data) throw new Error(`Storage download failed: ${error?.message ?? "no data"}`);
    return Buffer.from(await data.arrayBuffer());
  }

  async remove(paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    const { error } = await this.client.storage.from(this.bucket).remove(paths);
    if (error) throw new Error(`Storage delete failed: ${error.message}`);
  }
}
