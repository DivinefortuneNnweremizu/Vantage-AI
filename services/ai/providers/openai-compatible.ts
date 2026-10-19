import { extractJson } from "@/services/ai/extract-json";
import { analysisMessages, chatMessages, type ChatMessage } from "@/services/ai/prompts";
import {
  AiProviderUnavailableError,
  ProviderQuotaError,
  type AiProvider,
  type AnalyzeInput,
  type ChatInput,
} from "@/services/ai/provider";

/**
 * A provider for any service that speaks the common "chat completions" format (DeepSeek, Gemini,
 * and others). It sends the designs to a vision-capable model and returns its report as UNTRUSTED
 * data. The pipeline validates it before anything is stored or shown.
 *
 * A specific provider only supplies its settings (see deepseek.ts and gemini.ts).
 *
 * Images can only be sent in user messages, so the instructions go in the system message and the
 * images go in the user message.
 */
export interface OpenAiCompatibleConfig {
  /** Short id for logs, for example "deepseek". */
  id: string;
  /** Name used in messages, for example "DeepSeek". */
  displayName: string;
  /** The environment variable that holds the key. Named in the "not set up" message. */
  keyVariable: string;
  apiKey: string;
  model: string;
  /** For example "https://api.deepseek.com". No trailing slash needed. */
  baseUrl: string;
  /** Extra fields for analysis requests. They are left out of the plain retry if the provider rejects the request. */
  analysisExtras?: Record<string, unknown>;
  /** Room for the report. Providers that "think" first need more, because thinking counts toward it. */
  analyzeMaxTokens?: number;
}

/** Shorter than the pipeline's own 120 second limit, so this request ends first with a clear error. */
const ANALYZE_TIMEOUT_MS = 110_000;
const CHAT_TIMEOUT_MS = 60_000;

const DEFAULT_ANALYZE_MAX_TOKENS = 6000;
const CHAT_MAX_TOKENS = 900;

interface CompletionBody {
  messages: ChatMessage[];
  max_tokens: number;
  temperature: number;
  stream?: boolean;
  response_format?: { type: "json_object" };
  [extra: string]: unknown;
}

export class OpenAiCompatibleProvider implements AiProvider {
  readonly id: string;
  readonly model: string;
  readonly isDemo = false;

  constructor(private readonly config: OpenAiCompatibleConfig) {
    this.id = config.id;
    this.model = config.model;
  }

  async analyze(input: AnalyzeInput): Promise<unknown> {
    this.requireKey();
    const extras = this.config.analysisExtras ?? {};
    const body: CompletionBody = {
      messages: analysisMessages(input),
      max_tokens: this.config.analyzeMaxTokens ?? DEFAULT_ANALYZE_MAX_TOKENS,
      // Low, so the same design gets a steady critique from one run to the next.
      temperature: 0.2,
      response_format: { type: "json_object" },
      ...extras,
    };

    let response = await this.post(body, ANALYZE_TIMEOUT_MS);
    if (response.status === 400 && !(await this.isKeyProblem(response))) {
      // Some models reject JSON mode with images, or an extra field. The prompt already asks for JSON only.
      const plain: CompletionBody = { ...body };
      delete plain.response_format;
      for (const key of Object.keys(extras)) delete plain[key];
      response = await this.post(plain, ANALYZE_TIMEOUT_MS);
    }
    await this.throwIfFailed(response);

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null }; finish_reason?: string }>;
    };
    const choice = data.choices?.[0];
    if (choice?.finish_reason === "length") {
      throw new Error("The model's reply was cut off before the report was finished.");
    }
    return extractJson(choice?.message?.content ?? "");
  }

  async *chat(input: ChatInput): AsyncIterable<string> {
    this.requireKey();
    const response = await this.post(
      { messages: chatMessages(input), max_tokens: CHAT_MAX_TOKENS, temperature: 0.4, stream: true },
      CHAT_TIMEOUT_MS,
    );
    await this.throwIfFailed(response);
    if (!response.body) throw new Error("The AI provider sent an empty reply.");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let pending = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });

      // Server-sent events: one "data: {json}" line per chunk. Other lines are keep-alives.
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      for (const line of lines) {
        const text = parseStreamLine(line);
        if (text === DONE) return;
        if (text) yield text;
      }
    }
    const last = parseStreamLine(pending);
    if (last && last !== DONE) yield last;
  }

  private async post(body: CompletionBody, timeoutMs: number): Promise<Response> {
    const baseUrl = this.config.baseUrl.replace(/\/+$/, "");
    return fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.config.apiKey}` },
      body: JSON.stringify({ model: this.config.model, ...body }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  }

  private requireKey(): void {
    if (!this.config.apiKey) {
      throw new AiProviderUnavailableError(`AI analysis is not set up yet. Add ${this.config.keyVariable} and try again.`);
    }
  }

  /**
   * Google answers a wrong key with 400, not 401, and says so in the body ("Please pass a valid API key").
   * Reads a copy of the body, so the response can still be used.
   */
  private async isKeyProblem(response: Response): Promise<boolean> {
    try {
      const text = await response.clone().text();
      return /api key/i.test(text);
    } catch {
      return false;
    }
  }

  /** Turns a failed response into an error. The message never includes the key or the request. */
  private async throwIfFailed(response: Response): Promise<void> {
    if (response.ok) return;
    if (response.status === 401 || response.status === 403 || (response.status === 400 && (await this.isKeyProblem(response)))) {
      throw new AiProviderUnavailableError(`The AI provider did not accept the API key. Check ${this.config.keyVariable}.`);
    }
    if (response.status === 402) {
      throw new AiProviderUnavailableError("The AI provider account has no balance left. Top it up and try again.");
    }
    // 429 is a usage limit. 503 is the provider saying it is overloaded ("high demand"). Both are usually temporary.
    if (response.status === 429 || response.status === 503) {
      throw new ProviderQuotaError(`${this.config.displayName} is busy or at its usage limit right now.`);
    }
    throw new Error(`The AI provider returned status ${response.status}.`);
  }
}

const DONE = Symbol("done");

/** The text in one streamed line, DONE at the end of the stream, or null for anything else. */
function parseStreamLine(line: string): string | typeof DONE | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;
  const payload = trimmed.slice(5).trim();
  if (payload === "[DONE]") return DONE;
  try {
    const event = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string | null } }> };
    return event.choices?.[0]?.delta?.content || null;
  } catch {
    return null;
  }
}
