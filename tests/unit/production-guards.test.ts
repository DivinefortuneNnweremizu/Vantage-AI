import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The development shortcuts (fake sign-in, demo AI, disk storage) must never be usable in production,
 * even if someone copies a development .env into a deployment.
 */
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("development sign-in", () => {
  it("is available only when explicitly enabled outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_AUTH", "true");
    const { isDevAuthEnabled } = await import("@/features/auth/dev-auth");
    expect(isDevAuthEnabled()).toBe(true);
  });

  it("is off by default", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("DEV_AUTH", "");
    const { isDevAuthEnabled } = await import("@/features/auth/dev-auth");
    expect(isDevAuthEnabled()).toBe(false);
  });

  it("can never be enabled in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEV_AUTH", "true");
    const { isDevAuthEnabled } = await import("@/features/auth/dev-auth");
    expect(isDevAuthEnabled()).toBe(false);
  });
});

describe("demo AI provider", () => {
  it("is the default outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AI_PROVIDER", "");
    const { getAiProvider } = await import("@/services/ai");
    expect(getAiProvider().isDemo).toBe(true);
  });

  it("is refused in production, so users are never shown invented reports", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AI_PROVIDER", "mock");
    vi.stubEnv("ALLOW_DEMO_AI", "");
    const { getAiProvider } = await import("@/services/ai");
    expect(() => getAiProvider()).toThrow("not allowed in production");
  });

  it("can be allowed in production only by an explicit, separate opt-in", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AI_PROVIDER", "mock");
    vi.stubEnv("ALLOW_DEMO_AI", "true");
    const { getAiProvider } = await import("@/services/ai");
    expect(getAiProvider().isDemo).toBe(true);
  });

  it("defaults to the real provider in production, which refuses to invent content", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AI_PROVIDER", "");
    const { getAiProvider } = await import("@/services/ai");
    const provider = getAiProvider();
    expect(provider.id).toBe("deepseek");
    expect(provider.isDemo).toBe(false);
    await expect(provider.analyze({} as never)).rejects.toThrow("not connected yet");
  });

  it("rejects an unknown provider name", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AI_PROVIDER", "somebody-else");
    const { getAiProvider } = await import("@/services/ai");
    expect(() => getAiProvider()).toThrow("Unknown AI_PROVIDER");
  });
});

describe("storage driver", () => {
  it("refuses the local disk driver in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("STORAGE_DRIVER", "local");
    const { getStorage } = await import("@/services/storage");
    expect(() => getStorage()).toThrow("not allowed in production");
  });

  it("uses the local driver by default outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("STORAGE_DRIVER", "");
    const { getStorage } = await import("@/services/storage");
    expect(getStorage().constructor.name).toBe("LocalStorageDriver");
  });
});
