/** Where uploaded design images live. Implemented for local disk (development) and Supabase Storage. */
export interface StorageDriver {
  put(path: string, data: Buffer, contentType: string): Promise<void>;
  get(path: string): Promise<Buffer>;
  remove(paths: string[]): Promise<void>;
}
