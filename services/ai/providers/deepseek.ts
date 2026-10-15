import { extractJson } from "@/services/ai/extract-json";
import { analysisMessages, chatMessages, type ChatMessage } from "@/services/ai/prompts";
import { AiProviderUnavailableError, type AiProvider, type AnalyzeInput, type ChatInput } from "@/services/ai/provider";

/**
 * DeepSeek provider. Sends the designs to a vision-capable DeepSeek model and returns its report
 * as UNTRUSTED data. The pipeline validates it before anything is stored or shown.
 *
 * Settings (all in the environment, never in code):
 * - DEEPSEEK_API_KEY   required
 * - DEEPSEEK_MODEL     optional, default "deepseek-flash" (the model that accepts images)
 * - DEEPSEEK_BASE_URL  optional, default "https://api.deepseek.com"
 *
 * Images can only be sent in user messages, so the instructions go in the system message and the
 * images go in the user message. See https://api-docs.deepseek.com/guides/vision/
 */
const DEFAULT_MODEL = "deepseek-flash";
const DEFAULT_BASE_URL = "https://api.deepseek.com";

/** Shorter than the pipeline's own 120 second limit, so this request ends first with a clear error. */
const ANALYZE_TIMEOUT_MS = 110_000;
const CHAT_TIMEOUT_MS = 60_000;

/** Enough for a full report. A reply cut off at this size is not valid JSON, so it is rejected. */
const ANALYZE_MAX_TOKENS = 6000;
const CHAT_MAX_TOKENS = 900;

interface CompletionBody {
  messages: ChatMessage[];
  max_tokens: number;
  temperature: number;
  stream?: boolean;
  response_format?: { type: "json_object" };
}

export class DeepSeekAiProvider implements AiProvider {
  readonly id = "deepseek";
  readonly model: string;
  readonly isDemo = false;

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    // An empty value counts as unset.
    this.apiKey = process.env.DEEPSEEK_API_KEY || "";
    this.model = process.env.DEEPSEEK_MODEL || DEFAULT_MODEL;
    this.baseUrl = (process.env.DEEPSEEK_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
  }

  async analyze(input: AnalyzeInput): Promise<unknown> {
    this.requireKey();
    const body: CompletionBody = {
      messages: analysisMessages(input),
      max_tokens: ANALYZE_MAX_TOKENS,
      // Low, so the same design gets a steady critique from one run to the next.
      temperature: 0.2,
      response_format: { type: "json_object" },
    };

    let response = await this.post(body, ANALYZE_TIMEOUT_MS);
    if (response.status === 400 && body.response_format) {
      // Some models reject JSON mode when images are present. The prompt already asks for JSON only.
      const retry: CompletionBody = { ...body };
      delete retry.response_format;
      response = await this.post(retry, ANALYZE_TIMEOUT_MS);
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
    return fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: this.model, ...body }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  }

  private requireKey(): void {
    if (!this.apiKey) {
      throw new AiProviderUnavailableError("AI analysis is not set up yet. Add DEEPSEEK_API_KEY and try again.");
    }
  }

  /** Turns a failed response into an error. The message never includes the key or the request. */
  private async throwIfFailed(response: Response): Promise<void> {
    if (response.ok) return;
    if (response.status === 401 || response.status === 403) {
      throw new AiProviderUnavailableError("The AI provider did not accept the API key. Check DEEPSEEK_API_KEY.");
    }
    if (response.status === 402) {
      throw new AiProviderUnavailableError("The AI provider account has no balance left. Top it up and try again.");
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
