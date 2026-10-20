import "server-only";
import { DeepSeekAiProvider } from "@/services/ai/providers/deepseek";
import { GeminiAiProvider } from "@/services/ai/providers/gemini";
import { MockAiProvider } from "@/services/ai/providers/mock";
import { isRealAiBlocked } from "@/services/ai/regions";
import type { AiProvider } from "@/services/ai/provider";

let provider: AiProvider | undefined;

const isProduction = (): boolean => process.env.NODE_ENV === "production";

/**
 * Demo reports are allowed outside production. In production they need an explicit, separate opt-in
 * (ALLOW_DEMO_AI=true), so real users can never be shown made-up critiques by accident.
 */
export function isDemoAllowed(): boolean {
  return !isProduction() || process.env.ALLOW_DEMO_AI === "true";
}

/** The demo provider, for when the real one cannot be used. Reports it makes are labeled "Demo report". */
export function getDemoProvider(): AiProvider {
  if (!isDemoAllowed()) {
    throw new Error("Demo reports are not allowed in production. Set ALLOW_DEMO_AI=true to allow them.");
  }
  return new MockAiProvider();
}

/** True when an analysis may send the design images to an outside AI provider, rather than make a demo report. */
export function sendsImagesToProvider(country: string | null = null): boolean {
  try {
    if (getAiProvider().isDemo) return false;
    // Visitors from regions where real AI is off get a demo report, so nothing is sent.
    return !(isRealAiBlocked(country) && isDemoAllowed());
  } catch {
    return false;
  }
}

/**
 * Chooses the AI provider from AI_PROVIDER ("gemini", "deepseek", or "mock").
 * When AI_PROVIDER is not set, a key picks it: GEMINI_API_KEY, then DEEPSEEK_API_KEY. With no key,
 * development uses the mock provider and production uses DeepSeek (which then says it is not set up).
 *
 * The mock provider returns invented reports. It is refused in production unless ALLOW_DEMO_AI=true.
 */
export function getAiProvider(): AiProvider {
  if (provider) return provider;

  // An empty value counts as unset, so a half-filled .env falls back to the safe default.
  const wanted =
    process.env.AI_PROVIDER ||
    (process.env.GEMINI_API_KEY ? "gemini" : process.env.DEEPSEEK_API_KEY || isProduction() ? "deepseek" : "mock");

  if (wanted === "mock") {
    provider = getDemoProvider();
  } else if (wanted === "gemini") {
    provider = new GeminiAiProvider();
  } else if (wanted === "deepseek") {
    provider = new DeepSeekAiProvider();
  } else {
    throw new Error(`Unknown AI_PROVIDER "${wanted}".`);
  }

  return provider;
}
