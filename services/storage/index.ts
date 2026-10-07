import { LocalStorageDriver } from "@/services/storage/local-driver";
import { SupabaseStorageDriver } from "@/services/storage/supabase-driver";
import type { StorageDriver } from "@/services/storage/types";

let driver: StorageDriver | undefined;

/**
 * Picks the storage driver. The local driver only works outside production, so uploaded
 * files can never silently end up on an application server's disk in production.
 */
export function getStorage(): StorageDriver {
  if (driver) return driver;

  // An empty value counts as unset, so a half-filled .env falls back to the safe default.
  const wanted = process.env.STORAGE_DRIVER || (process.env.NODE_ENV === "production" ? "supabase" : "local");

  if (wanted === "local") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("The local storage driver is not allowed in production.");
    }
    driver = new LocalStorageDriver();
  } else {
    driver = new SupabaseStorageDriver();
  }

  return driver;
}
