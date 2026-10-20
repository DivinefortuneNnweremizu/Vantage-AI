import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { MockAiProvider } from "@/services/ai/providers/mock";
import type { AiProvider, AnalyzeInput } from "@/services/ai/provider";
import { produceReport } from "@/services/analysis/produce-report";
import { ReportValidationError } from "@/services/analysis/validate-report";

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const input: AnalyzeInput = {
  goal: null,
  pageScope: "SINGLE_PAGE",
  platform: "WEB",
  previousSummary: null,
  assets: [{ index: 0, width: 1200, height: 800, contentHash: "hash", image: Buffer.alloc(1) }],
};
const context = { assetCount: 1, platform: "WEB" as const };

/** A report the demo provider makes, which always passes validation. Made once, before fake timers start. */
let sampleReport: unknown;
beforeAll(async () => {
  sampleReport = await new MockAiProvider().analyze({ ...input, simulatedLatencyMs: 0 } as AnalyzeInput);
});
const goodReport = async (): Promise<unknown> => sampleReport;

/** A provider whose answers are scripted. It never reads the images. */
function scripted(answers: Array<() => Promise<unknown>>, isDemo = false): AiProvider & { calls: AnalyzeInput[] } {
  const calls: AnalyzeInput[] = [];
  return {
    id: "scripted",
    model: "scripted",
    isDemo,
    calls,
    analyze: (given) => {
      calls.push(given);
      const next = answers[calls.length - 1] ?? answers[answers.length - 1];
      return (next as () => Promise<unknown>)();
    },
    chat: async function* () {
      yield "";
    },
  };
}

describe("produceReport", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns a validated report in one call when the first answer is good", async () => {
    const provider = scripted([goodReport]);
    const report = await produceReport(provider, input, context, "a1", () => undefined);
    expect(report.findings.length).toBeGreaterThan(0);
    expect(provider.calls).toHaveLength(1);
  });

  it("tries once more, listing the problems, when the first answer is not a valid report", async () => {
    const provider = scripted([async () => ({ nonsense: true }), goodReport]);
    const report = await produceReport(provider, input, context, "a1", () => undefined);
    expect(report.findings.length).toBeGreaterThan(0);
    expect(provider.calls).toHaveLength(2);
    expect(provider.calls[0]?.validationFeedback).toBeUndefined();
    expect(provider.calls[1]?.validationFeedback?.length).toBeGreaterThan(0);
  });

  it("gives up after the second invalid answer", async () => {
    const provider = scripted([async () => ({ nonsense: true })]);
    await expect(produceReport(provider, input, context, "a1", () => undefined)).rejects.toBeInstanceOf(ReportValidationError);
    expect(provider.calls).toHaveLength(2);
  });

  it("stops waiting for a provider that never answers", async () => {
    const provider = scripted([() => new Promise<unknown>(() => undefined)]);
    const outcome = produceReport(provider, input, context, "a1", () => undefined);
    const failure = expect(outcome).rejects.toThrow("took too long");
    await vi.advanceTimersByTimeAsync(55_001);
    await failure;
  });

  it("reports the middle stages while a slow demo provider works, then stops reporting", async () => {
    const slow = () => new Promise<unknown>((resolve) => setTimeout(() => resolve(goodReport()), 2000));
    const provider = scripted([slow], true);
    const stages: string[] = [];
    const outcome = produceReport(provider, input, context, "a1", (stage) => stages.push(stage));
    await vi.advanceTimersByTimeAsync(2000);
    await outcome;
    expect(stages).toEqual(["hierarchy", "accessibility"]);

    await vi.advanceTimersByTimeAsync(10_000);
    expect(stages).toEqual(["hierarchy", "accessibility"]);
  });
});
