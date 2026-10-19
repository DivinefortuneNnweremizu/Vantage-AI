import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { visitorCountry } from "@/lib/visitor-country";
import { isRealAiBlocked } from "@/services/ai/regions";

function headers(values: Record<string, string>) {
  return { get: (name: string) => values[name.toLowerCase()] ?? null };
}

describe("visitorCountry", () => {
  it("reads Vercel's country header as an upper-case code", () => {
    expect(visitorCountry(headers({ "x-vercel-ip-country": "de" }))).toBe("DE");
    expect(visitorCountry(headers({ "x-vercel-ip-country": " NG " }))).toBe("NG");
  });

  it("is null when the header is missing or is not a two-letter code", () => {
    expect(visitorCountry(headers({}))).toBeNull();
    expect(visitorCountry(headers({ "x-vercel-ip-country": "" }))).toBeNull();
    expect(visitorCountry(headers({ "x-vercel-ip-country": "Germany" }))).toBeNull();
    expect(visitorCountry(headers({ "x-vercel-ip-country": "D1" }))).toBeNull();
  });
});

describe("isRealAiBlocked", () => {
  beforeEach(() => {
    vi.stubEnv("REAL_AI_BLOCKED_COUNTRIES", "");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("blocks the EEA, Switzerland and the UK by default", () => {
    for (const country of ["DE", "FR", "IE", "NO", "IS", "LI", "CH", "GB"]) {
      expect(isRealAiBlocked(country), country).toBe(true);
    }
  });

  it("allows other countries", () => {
    for (const country of ["NG", "US", "IN", "BR", "CA"]) {
      expect(isRealAiBlocked(country), country).toBe(false);
    }
  });

  it("allows an unknown country, since there is nothing to go on", () => {
    expect(isRealAiBlocked(null)).toBe(false);
  });

  it("can be turned off with 'none', for people who pay for the provider", () => {
    vi.stubEnv("REAL_AI_BLOCKED_COUNTRIES", "none");
    expect(isRealAiBlocked("DE")).toBe(false);
    vi.stubEnv("REAL_AI_BLOCKED_COUNTRIES", "NONE");
    expect(isRealAiBlocked("GB")).toBe(false);
  });

  it("can use a list of your own", () => {
    vi.stubEnv("REAL_AI_BLOCKED_COUNTRIES", "ng, us");
    expect(isRealAiBlocked("NG")).toBe(true);
    expect(isRealAiBlocked("US")).toBe(true);
    expect(isRealAiBlocked("DE")).toBe(false);
  });
});
