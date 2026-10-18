import { OpenAiCompatibleProvider } from "@/services/ai/providers/openai-compatible";

/**
 * Google Gemini, through its OpenAI-compatible endpoint. It has a free tier that accepts images, which
 * makes it a good fit for trials. Settings come from the environment, never from code:
 * - GEMINI_API_KEY    required (a free key from Google AI Studio works)
 * - GEMINI_MODEL      optional, default "gemini-3.8-flash". "gemini-3.5-flash-lite" is lighter and faster.
 * - GEMINI_BASE_URL   optional, default Google's compatible endpoint
 *
 * Free-tier content may be used by Google to improve its products, so the app tells people to upload
 * only designs they are happy to share. See https://ai.google.dev/gemini-api/docs/openai
 */
export class GeminiAiProvider extends OpenAiCompatibleProvider {
  constructor() {
    super({
      id: "gemini",
      displayName: "Gemini",
      keyVariable: "GEMINI_API_KEY",
      apiKey: process.env.GEMINI_API_KEY || "",
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      baseUrl: process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai",
      // Gemini thinks before it answers, and that counts toward the reply size, so keep thinking short
      // and leave more room. If the provider rejects the setting, the plain retry leaves it out.
      analysisExtras: { reasoning_effort: "low" },
      analyzeMaxTokens: 10_000,
    });
  }
}
