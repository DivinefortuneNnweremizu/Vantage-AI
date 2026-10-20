import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Showcase mode: a way to show the prototype without Supabase. Fake sign-in with a separate temporary
 * account per browser, and uploaded images kept in the database. It must be a deliberate opt-in.
 */
const storedFile = {
  upsert: vi.fn(),
  findUnique: vi.fn(),
  deleteMany: vi.fn(),
};
vi.mock("@/lib/prisma", () => ({ prisma: { storedFile } }));

beforeEach(() => {
  vi.stubEnv("DEV_AUTH", "");
  vi.stubEnv("SHOWCASE_MODE", "");
  vi.stubEnv("STORAGE_DRIVER", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  storedFile.upsert.mockReset();
  storedFile.findUnique.mockReset();
  storedFile.deleteMany.mockReset();
});

describe("when guest sign-in is on", () => {
  it("is off by default, in development and in production", async () => {
    for (const env of ["development", "production"]) {
      vi.stubEnv("NODE_ENV", env);
      vi.resetModules();
      const { isGuestAuthEnabled, isShowcaseMode } = await import("@/features/auth/dev-auth");
      expect(isGuestAuthEnabled(), env).toBe(false);
      expect(isShowcaseMode(), env).toBe(false);
    }
  });

  it("is still impossible to turn on in production with DEV_AUTH alone", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEV_AUTH", "true");
    const { isGuestAuthEnabled } = await import("@/features/auth/dev-auth");
    expect(isGuestAuthEnabled()).toBe(false);
  });

  it("is on in production only with the separate SHOWCASE_MODE opt-in", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SHOWCASE_MODE", "true");
    const { isGuestAuthEnabled, isShowcaseMode } = await import("@/features/auth/dev-auth");
    expect(isShowcaseMode()).toBe(true);
    expect(isGuestAuthEnabled()).toBe(true);
  });

  it("is on in development with DEV_AUTH", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_AUTH", "true");
    const { isGuestAuthEnabled } = await import("@/features/auth/dev-auth");
    expect(isGuestAuthEnabled()).toBe(true);
  });
});

describe("who a guest is", () => {
  const id = "3f2b8f2e-9d34-4c1a-8a52-0b9d6c8e1a77";

  it("gives each browser its own account in showcase mode", async () => {
    vi.stubEnv("SHOWCASE_MODE", "true");
    const { guestIdentity } = await import("@/features/auth/dev-auth");
    const first = guestIdentity({ kind: "existing", name: null, userId: id });
    const second = guestIdentity({ kind: "existing", name: null, userId: "11111111-2222-4333-8444-555555555555" });
    expect(first.id).toBe(id);
    expect(first.email).toBe("guest-3f2b8f2e9d34@showcase.local");
    expect(second.id).not.toBe(first.id);
    expect(second.email).not.toBe(first.email);
  });

  it("uses the name from onboarding, 'Guest' for a returning visitor, and no name for a new sign-up", async () => {
    vi.stubEnv("SHOWCASE_MODE", "true");
    const { guestIdentity } = await import("@/features/auth/dev-auth");
    expect(guestIdentity({ kind: "new", name: "Ada Lovelace", userId: id }).fullName).toBe("Ada Lovelace");
    expect(guestIdentity({ kind: "existing", name: null, userId: id }).fullName).toBe("Guest");
    expect(guestIdentity({ kind: "new", name: null, userId: id }).fullName).toBeNull();
  });

  it("is the one demo user in local development, where nothing is separated", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_AUTH", "true");
    const { guestIdentity, DEV_USER } = await import("@/features/auth/dev-auth");
    expect(guestIdentity({ kind: "existing", name: null, userId: id }).id).toBe(DEV_USER.id);
  });

  it("only accepts a real id in the browser's account cookie", async () => {
    const { isValidGuestId } = await import("@/features/auth/dev-auth");
    expect(isValidGuestId(id)).toBe(true);
    for (const value of [undefined, "", "admin", "../../etc", "3f2b8f2e-9d34-4c1a-8a52"]) {
      expect(isValidGuestId(value), String(value)).toBe(false);
    }
  });
});

describe("which storage is used", () => {
  it("is the database in a showcase in production, with nothing else set", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SHOWCASE_MODE", "true");
    const { getStorage } = await import("@/services/storage");
    expect(getStorage().constructor.name).toBe("DatabaseStorageDriver");
  });

  it("can be chosen as the database in any environment", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("STORAGE_DRIVER", "database");
    const { getStorage } = await import("@/services/storage");
    expect(getStorage().constructor.name).toBe("DatabaseStorageDriver");
  });

  it("still refuses the local disk in production, even in a showcase", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SHOWCASE_MODE", "true");
    vi.stubEnv("STORAGE_DRIVER", "local");
    const { getStorage } = await import("@/services/storage");
    expect(() => getStorage()).toThrow("not allowed in production");
  });
});

describe("the database storage", () => {
  async function driver() {
    const { DatabaseStorageDriver } = await import("@/services/storage/database-driver");
    return new DatabaseStorageDriver();
  }

  it("saves an image, replacing one at the same path", async () => {
    await (await driver()).put("a/b.webp", Buffer.from([1, 2, 3]), "image/webp");
    const call = storedFile.upsert.mock.calls[0]?.[0] as { where: { path: string }; create: { data: Uint8Array; contentType: string } };
    expect(call.where).toEqual({ path: "a/b.webp" });
    expect(call.create.contentType).toBe("image/webp");
    expect(Array.from(call.create.data)).toEqual([1, 2, 3]);
  });

  it("gives an image back as a Buffer", async () => {
    storedFile.findUnique.mockResolvedValueOnce({ data: new Uint8Array([9, 8, 7]) });
    const result = await (await driver()).get("a/b.webp");
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(Array.from(result)).toEqual([9, 8, 7]);
  });

  it("says clearly when an image is missing", async () => {
    storedFile.findUnique.mockResolvedValueOnce(null);
    await expect((await driver()).get("missing.webp")).rejects.toThrow("Stored file not found");
  });

  it("deletes the paths it is given, and does nothing for an empty list", async () => {
    const store = await driver();
    await store.remove([]);
    expect(storedFile.deleteMany).not.toHaveBeenCalled();
    await store.remove(["a", "b"]);
    expect(storedFile.deleteMany).toHaveBeenCalledWith({ where: { path: { in: ["a", "b"] } } });
  });
});
