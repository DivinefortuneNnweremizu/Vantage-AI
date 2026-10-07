import type { AnalysisEvent, AnalysisProgressStage } from "@/features/analysis/schemas";
import { ApiRequestError, readApiResponse } from "@/lib/client/api";

interface StreamResult {
  analysisId: string;
  iteration: number;
}

/**
 * Starts an analysis and reads its Server-Sent Events.
 * Resolves when the report is saved. Throws with a message that is safe to show.
 */
export async function streamAnalysis(
  sessionId: string,
  goal: string,
  onStage: (stage: AnalysisProgressStage) => void,
): Promise<StreamResult> {
  const response = await fetch(`/api/sessions/${sessionId}/analyses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goal }),
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("text/event-stream") || !response.body) {
    // Checked up front by the server, so this is a normal JSON error.
    await readApiResponse<never>(response);
    throw new ApiRequestError("INTERNAL_ERROR", "We could not start the analysis. Try again.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: StreamResult | null = null;

  const handle = (rawBlock: string): void => {
    const dataLine = rawBlock.split("\n").find((line) => line.startsWith("data: "));
    if (!dataLine) return;
    let event: AnalysisEvent;
    try {
      event = JSON.parse(dataLine.slice(6)) as AnalysisEvent;
    } catch {
      return;
    }
    if (event.type === "progress") onStage(event.stage);
    if (event.type === "complete") result = { analysisId: event.analysisId, iteration: event.iteration };
    if (event.type === "error") throw new ApiRequestError("INTERNAL_ERROR", event.message);
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";
    blocks.forEach(handle);
  }
  if (buffer.trim()) handle(buffer);

  if (!result) {
    throw new ApiRequestError(
      "INTERNAL_ERROR",
      "The connection closed before your report was ready. Check the Design Library, or try again.",
    );
  }
  return result;
}
