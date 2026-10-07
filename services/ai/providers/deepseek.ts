import { AiProviderUnavailableError, type AiProvider } from "@/services/ai/provider";

/**
 * DeepSeek provider. The integration is planned and NOT built yet.
 *
 * Until it is, this provider refuses to run instead of returning invented content, so a real
 * user can never be shown a made-up critique. Implement `analyze` and `chat` here when the
 * integration lands. Nothing else in the product needs to change.
 *
 * Requirements for the real implementation (see .agents/skills/design-analysis-pipeline/skill.md):
 * - Use an image-capable model for analyze.
 * - Wrap any text extracted from designs in a delimited data block and treat it as untrusted.
 * - Return the shape in features/analysis/schemas.ts. The pipeline validates it.
 */
export class DeepSeekAiProvider implements AiProvider {
  readonly id = "deepseek";
  readonly model = "deepseek";
  readonly isDemo = false;

  private unavailable(): never {
    throw new AiProviderUnavailableError(
      "AI analysis is not connected yet. Set AI_PROVIDER=mock in development to try the product with demo reports.",
    );
  }

  async analyze(): Promise<unknown> {
    return this.unavailable();
  }

  async *chat(): AsyncIterable<string> {
    this.unavailable();
  }
}
