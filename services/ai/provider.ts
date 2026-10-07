/**
 * The seam between the product and any AI model. UI and business code only ever talk to this
 * interface, so the provider can change without touching the pipeline.
 *
 * See .agents/rules/ai-behavior.md and architecture.md (AI Is a Service Layer).
 */
export interface AnalyzeAsset {
  /** Zero-based position in the analyzed set. Findings refer to images by this index. */
  index: number;
  width: number;
  height: number;
  contentHash: string;
  /** The stored, normalized WebP bytes. */
  image: Buffer;
}

export interface AnalyzeInput {
  goal: string | null;
  pageScope: "SINGLE_PAGE" | "JOURNEY";
  platform: "APP" | "WEB";
  assets: AnalyzeAsset[];
  /** Short summary of the previous iteration, when this is a re-analysis. */
  previousSummary: string | null;
  /** Set on the single retry after validation failed, so the provider can correct itself. */
  validationFeedback?: string[];
}

export interface ChatReportContext {
  title: string;
  goal: string | null;
  overall: number;
  scores: { intuitive: number; trusted: number; valuable: number };
  strengths: string[];
  painPoints: string[];
  overallTakeaway: string;
  findings: Array<{
    title: string;
    valence: "like" | "dislike";
    severity: string;
    category: string;
    standard: string;
    observation: string;
    impact: string;
  }>;
  recommendations: Array<{ rank: number; title: string; change: string; rationale: string }>;
}

export interface ChatInput {
  report: ChatReportContext;
  history: Array<{ role: "USER" | "ASSISTANT"; content: string }>;
  question: string;
}

export interface AiProvider {
  /** Short id for logs, for example "mock" or "deepseek". */
  readonly id: string;
  /** The model name stored on each analysis. */
  readonly model: string;
  /** True for fixture providers that return invented content. The UI labels such reports as demos. */
  readonly isDemo: boolean;
  /** Returns an UNTRUSTED report. The pipeline validates it before anything is stored. */
  analyze(input: AnalyzeInput): Promise<unknown>;
  /** Streams the reply to a question about the report as plain-text chunks. */
  chat(input: ChatInput): AsyncIterable<string>;
}

export class AiProviderUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiProviderUnavailableError";
  }
}
