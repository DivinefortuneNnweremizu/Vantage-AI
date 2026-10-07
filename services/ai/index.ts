import { DeepSeekAiProvider } from "@/services/ai/providers/deepseek";
import { MockAiProvider } from "@/services/ai/providers/mock";
import type { AiProvider } from "@/services/ai/provider";

let provider: AiProvider | undefined;

/**
 * Chooses the AI provider from AI_PROVIDER.
 *
 * The mock provider returns invented reports. It is refused in production unless ALLOW_DEMO_AI=true,
 * so real users can never be shown made-up critiques by accident.
 */
export function getAiProvider(): AiProvider {
  if (provider) return provider;

  const isProduction = process.env.NODE_ENV === "production";
  // An empty value counts as unset, so a half-filled .env falls back to the safe default.
  const wanted = process.env.AI_PROVIDER || (isProduction ? "deepseek" : "mock");

  if (wanted === "mock") {
    if (isProduction && process.env.ALLOW_DEMO_AI !== "true") {
      throw new Error("AI_PROVIDER=mock is not allowed in production. Connect a real provider.");
    }
    provider = new MockAiProvider();
  } else if (wanted === "deepseek") {
    provider = new DeepSeekAiProvider();
  } else {
    throw new Error(`Unknown AI_PROVIDER "${wanted}".`);
  }

  return provider;
}
