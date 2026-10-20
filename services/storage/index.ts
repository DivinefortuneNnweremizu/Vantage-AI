import "server-only";
import { isShowcaseMode } from "@/features/auth/dev-auth";
import { DatabaseStorageDriver } from "@/services/storage/database-driver";
import { LocalStorageDriver } from "@/services/storage/local-driver";
import { SupabaseStorageDriver } from "@/services/storage/supabase-driver";
import type { StorageDriver } from "@/services/storage/types";

let driver: StorageDriver | undefined;

/** The drivers that can be named in STORAGE_DRIVER. To add one, add a line here. */
const DRIVERS: Record<string, () => StorageDriver> = {
  local: () => {
    if (process.env.NODE_ENV === "production") {
      throw new Error("The local storage driver is not allowed in production.");
    }
    return new LocalStorageDriver();
  },
  database: () => new DatabaseStorageDriver(),
  supabase: () => new SupabaseStorageDriver(),
};

/**
 * Picks the storage driver: "local" (disk, development only), "supabase", or "database" (a table in
 * Postgres, for showcases). The local driver only works outside production, so uploaded files can never
 * silently end up on an application server's disk in production. In production the default is Supabase,
 * or the database when SHOWCASE_MODE is on.
 */
export function getStorage(): StorageDriver {
  if (driver) return driver;

  // An empty value counts as unset, so a half-filled .env falls back to the safe default.
  const productionDefault = isShowcaseMode() ? "database" : "supabase";
  const wanted = process.env.STORAGE_DRIVER || (process.env.NODE_ENV === "production" ? productionDefault : "local");

  const create = DRIVERS[wanted];
  if (!create) throw new Error(`Unknown STORAGE_DRIVER "${wanted}". Use local, supabase, or database.`);

  driver = create();
  return driver;
}
