import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Daily caps on real AI analyses. Past a cap the person gets a labeled demo report,
 * or, where demo reports are not allowed, a clear "come back tomorrow".
 */
const count = vi.fn();

vi.mock("@/lib/prisma", () => ({ prisma: { analysis: { count } } }));
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

/** Answers the per-person count and the whole-site count. */
function usage(mine: number, everyone: number): void {
  count.mockImplementation(async (args: { where: { session?: unknown } }) => (args.where.session ? mine : everyone));
}

async function load() {
  vi.resetModules();
  return import("@/services/analysis/choose-provider");
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("AI_PROVIDER", "gemini");
  vi.stubEnv("GEMINI_API_KEY", "key");
  vi.stubEnv("REAL_AI_PER_USER_PER_DAY", "");
  vi.stubEnv("REAL_AI_PER_DAY", "");
  vi.stubEnv("ALLOW_DEMO_AI", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  count.mockReset();
});

describe("chooseProvider", () => {
  it("uses the real provider while both caps have room", async () => {
    usage(2, 49);
    const { chooseProvider } = await load();
    expect((await chooseProvider("user-1")).id).toBe("gemini");
  });

  it("switches to a demo report when the person has used their real analyses", async () => {
    usage(3, 10);
    const { chooseProvider } = await load();
    expect((await chooseProvider("user-1")).isDemo).toBe(true);
  });

  it("switches to a demo report when the whole site has used its real analyses", async () => {
    usage(0, 50);
    const { chooseProvider } = await load();
    expect((await chooseProvider("user-1")).isDemo).toBe(true);
  });

  it("follows caps set in the environment, and 0 means always demo", async () => {
    vi.stubEnv("REAL_AI_PER_USER_PER_DAY", "0");
    usage(0, 0);
    const { chooseProvider } = await load();
    expect((await chooseProvider("user-1")).isDemo).toBe(true);
  });

  it("falls back to the default caps when the setting is not a number", async () => {
    vi.stubEnv("REAL_AI_PER_USER_PER_DAY", "lots");
    usage(2, 0);
    const { chooseProvider } = await load();
    expect((await chooseProvider("user-1")).id).toBe("gemini");
  });

  it("refuses with a clear message in production, where demo reports are not allowed", async () => {
    vi.stubEnv("NODE_ENV", "production");
    usage(3, 3);
    const { chooseProvider } = await load();
    await expect(chooseProvider("user-1")).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });

  it("allows the demo fallback in production only with the separate opt-in", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_DEMO_AI", "true");
    usage(3, 3);
    const { chooseProvider } = await load();
    expect((await chooseProvider("user-1")).isDemo).toBe(true);
  });

  it("does not count anything when the demo provider is already the one in use", async () => {
    vi.stubEnv("AI_PROVIDER", "mock");
    const { chooseProvider } = await load();
    expect((await chooseProvider("user-1")).isDemo).toBe(true);
    expect(count).not.toHaveBeenCalled();
  });

  it("counts only finished real analyses from the last 24 hours", async () => {
    usage(0, 0);
    const { chooseProvider } = await load();
    await chooseProvider("user-1");
    const where = (count.mock.calls[0]?.[0] as { where: Record<string, unknown> }).where;
    expect(where.status).toBe("COMPLETE");
    expect(where.NOT).toEqual({ model: { startsWith: "mock" } });
    const since = (where.createdAt as { gte: Date }).gte.getTime();
    expect(Date.now() - since).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(Date.now() - since).toBeLessThan(25 * 60 * 60 * 1000);
  });
});

describe("demo fallback helpers", () => {
  it("returns nothing, rather than a demo, when demo reports are not allowed", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { demoFallbackOrNull } = await load();
    expect(demoFallbackOrNull()).toBeNull();
  });
});
