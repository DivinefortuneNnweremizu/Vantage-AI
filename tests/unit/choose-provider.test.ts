import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Daily caps on real AI analyses. Past a cap the person gets a labeled demo report,
 * or, where demo reports are not allowed, a clear "come back tomorrow".
 */
const count = vi.fn();

const questions = vi.fn();

vi.mock("@/lib/prisma", () => ({ prisma: { analysis: { count }, assistantMessage: { count: questions } } }));
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
  vi.stubEnv("REAL_AI_CHAT_PER_USER_PER_DAY", "");
  vi.stubEnv("REAL_AI_CHAT_PER_DAY", "");
  vi.stubEnv("ALLOW_DEMO_AI", "");
  vi.stubEnv("REAL_AI_BLOCKED_COUNTRIES", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  count.mockReset();
  questions.mockReset();
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

describe("regions where real AI is off", () => {
  it("gives visitors from the EEA a demo report, without counting anything", async () => {
    const { chooseProvider } = await load();
    expect((await chooseProvider("user-1", "DE")).isDemo).toBe(true);
    expect(count).not.toHaveBeenCalled();
  });

  it("gives visitors from the UK and Switzerland a demo report too", async () => {
    const { chooseProvider } = await load();
    expect((await chooseProvider("user-1", "GB")).isDemo).toBe(true);
    expect((await chooseProvider("user-1", "CH")).isDemo).toBe(true);
  });

  it("uses the real provider for visitors elsewhere, and when the country is unknown", async () => {
    usage(0, 0);
    const { chooseProvider } = await load();
    expect((await chooseProvider("user-1", "NG")).id).toBe("gemini");
    expect((await chooseProvider("user-1", null)).id).toBe("gemini");
    expect((await chooseProvider("user-1")).id).toBe("gemini");
  });

  it("refuses with a clear message in production when demo reports are not allowed", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { chooseProvider } = await load();
    await expect(chooseProvider("user-1", "FR")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("can be turned off for people who pay for the provider", async () => {
    vi.stubEnv("REAL_AI_BLOCKED_COUNTRIES", "none");
    usage(0, 0);
    const { chooseProvider } = await load();
    expect((await chooseProvider("user-1", "DE")).id).toBe("gemini");
  });
});

/** Answers the per-person count and the whole-site count of assistant questions. */
function asked(mine: number, everyone: number): void {
  questions.mockImplementation(async (args: { where: { session?: unknown } }) => (args.where.session ? mine : everyone));
}

describe("chooseChatProvider", () => {
  beforeEach(() => asked(0, 0));

  it("uses the real assistant for a real report from an allowed region", async () => {
    const { chooseChatProvider } = await load();
    expect((await chooseChatProvider("u1", "NG", false)).id).toBe("gemini");
    expect((await chooseChatProvider("u1", null, false)).id).toBe("gemini");
  });

  it("uses the demo assistant for a demo report, so sample content is never sent to the provider", async () => {
    const { chooseChatProvider } = await load();
    expect((await chooseChatProvider("u1", "NG", true)).isDemo).toBe(true);
  });

  it("uses the demo assistant for visitors from regions where real AI is off", async () => {
    const { chooseChatProvider } = await load();
    expect((await chooseChatProvider("u1", "DE", false)).isDemo).toBe(true);
  });

  it("refuses in production, for those regions, when demo reports are not allowed", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { chooseChatProvider } = await load();
    await expect(chooseChatProvider("u1", "DE", false)).rejects.toThrow("not available in your region");
  });

  it("switches to the demo assistant once a person has asked their daily questions", async () => {
    asked(30, 100);
    const { chooseChatProvider } = await load();
    expect((await chooseChatProvider("u1", "NG", false)).isDemo).toBe(true);
  });

  it("switches to the demo assistant once the whole site has used its daily questions", async () => {
    asked(1, 300);
    const { chooseChatProvider } = await load();
    expect((await chooseChatProvider("u1", "NG", false)).isDemo).toBe(true);
  });

  it("says to come back tomorrow, in production, when the cap is reached and demos are not allowed", async () => {
    vi.stubEnv("NODE_ENV", "production");
    asked(30, 100);
    const { chooseChatProvider } = await load();
    await expect(chooseChatProvider("u1", "NG", false)).rejects.toThrow("Come back tomorrow");
  });

  it("lets the caps be changed with environment variables", async () => {
    vi.stubEnv("REAL_AI_CHAT_PER_USER_PER_DAY", "2");
    asked(2, 2);
    const { chooseChatProvider } = await load();
    expect((await chooseChatProvider("u1", "NG", false)).isDemo).toBe(true);
  });
});
