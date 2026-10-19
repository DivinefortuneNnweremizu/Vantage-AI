import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GeminiAiProvider } from "@/services/ai/providers/gemini";
import { AiProviderUnavailableError, ProviderQuotaError, type AnalyzeInput } from "@/services/ai/provider";

const input: AnalyzeInput = {
  goal: null,
  pageScope: "SINGLE_PAGE",
  platform: "WEB",
  previousSummary: null,
  assets: [{ index: 0, width: 1200, height: 760, contentHash: "a", image: Buffer.from("image") }],
};

const fetchMock = vi.fn<typeof fetch>();

function ok(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content }, finish_reason: "stop" }] }), { status: 200 });
}

function body(call = 0): Record<string, unknown> {
  return JSON.parse(String(fetchMock.mock.calls[call]?.[1]?.body)) as Record<string, unknown>;
}

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "gemini-test-key");
  vi.stubEnv("GEMINI_MODEL", "");
  vi.stubEnv("GEMINI_BASE_URL", "");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("Gemini provider", () => {
  it("uses Google's compatible endpoint, the key, and a default model", async () => {
    fetchMock.mockResolvedValueOnce(ok('{"ok":true}'));
    const provider = new GeminiAiProvider();
    await expect(provider.analyze(input)).resolves.toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer gemini-test-key");
    expect(provider.id).toBe("gemini");
    expect(provider.isDemo).toBe(false);
    expect(body().model).toBe("gemini-3.6-flash");
  });

  it("keeps thinking short and leaves room for the report", async () => {
    fetchMock.mockResolvedValueOnce(ok("{}"));
    await new GeminiAiProvider().analyze(input);
    expect(body().reasoning_effort).toBe("low");
    expect(body().max_tokens).toBe(10_000);
  });

  it("drops the extra settings on the plain retry when Google rejects the request", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 400 }));
    fetchMock.mockResolvedValueOnce(ok('{"ok":true}'));
    await expect(new GeminiAiProvider().analyze(input)).resolves.toEqual({ ok: true });
    expect(body(1).reasoning_effort).toBeUndefined();
    expect(body(1).response_format).toBeUndefined();
    expect(body(1).messages).toBeDefined();
  });

  it("can use another model from the environment", async () => {
    vi.stubEnv("GEMINI_MODEL", "gemini-3.5-flash-lite");
    fetchMock.mockResolvedValueOnce(ok("{}"));
    const provider = new GeminiAiProvider();
    await provider.analyze(input);
    expect(provider.model).toBe("gemini-3.5-flash-lite");
    expect(body().model).toBe("gemini-3.5-flash-lite");
  });

  it("names its own key variable when the key is missing", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const error = await new GeminiAiProvider().analyze(input).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AiProviderUnavailableError);
    expect((error as Error).message).toContain("GEMINI_API_KEY");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("recognises Google's 400 for a wrong key, and does not retry", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { code: 400, message: "Please pass a valid API key", status: "INVALID_ARGUMENT" } }), { status: 400 }),
    );
    const error = await new GeminiAiProvider().analyze(input).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AiProviderUnavailableError);
    expect((error as Error).message).toContain("GEMINI_API_KEY");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("still tells the user about a wrong key when it is the assistant", async () => {
    fetchMock.mockResolvedValueOnce(new Response("API key not valid. Please pass a valid API key.", { status: 400 }));
    const chat = new GeminiAiProvider().chat({
      report: {
        title: "T", goal: null, overall: 1, scores: { intuitive: 1, trusted: 1, valuable: 1 },
        strengths: [], painPoints: [], overallTakeaway: "", findings: [], recommendations: [],
      },
      history: [],
      question: "Hi?",
    });
    await expect(chat[Symbol.asyncIterator]().next()).rejects.toBeInstanceOf(AiProviderUnavailableError);
  });

  it("treats Google's 503 'high demand' as busy too, so the app can fall back to a demo report", async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 503, status: "UNAVAILABLE" } }), { status: 503 }));
    await expect(new GeminiAiProvider().analyze(input)).rejects.toBeInstanceOf(ProviderQuotaError);
  });

  it("reports a usage limit separately, so the app can fall back to a demo report", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 429 }));
    const error = await new GeminiAiProvider().analyze(input).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ProviderQuotaError);
    expect(String((error as Error).message)).not.toContain("gemini-test-key");
  });
});
