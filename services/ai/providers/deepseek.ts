import "server-only";
import { OpenAiCompatibleProvider } from "@/services/ai/providers/openai-compatible";

/**
 * DeepSeek. Settings come from the environment, never from code:
 * - DEEPSEEK_API_KEY   required
 * - DEEPSEEK_MODEL     optional, default "deepseek-flash" (the model that accepts images)
 * - DEEPSEEK_BASE_URL  optional, default "https://api.deepseek.com"
 *
 * See https://api-docs.deepseek.com/guides/vision/
 */
export class DeepSeekAiProvider extends OpenAiCompatibleProvider {
  constructor() {
    // An empty value counts as unset.
    super({
      id: "deepseek",
      displayName: "DeepSeek",
      keyVariable: "DEEPSEEK_API_KEY",
      apiKey: process.env.DEEPSEEK_API_KEY || "",
      model: process.env.DEEPSEEK_MODEL || "deepseek-flash",
      baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
    });
  }
}
