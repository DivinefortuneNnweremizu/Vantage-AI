/**
 * Reads the JSON object out of a model reply. Models sometimes wrap it in a code fence or add a
 * sentence around it, even when told not to.
 *
 * Returns the parsed value, or the original text when it is not JSON. The pipeline's validation
 * rejects text, so a bad reply leads to the normal "fix it and try once more" path.
 */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const unfenced = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  for (const candidate of [unfenced, sliceObject(unfenced)]) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate) as unknown;
    } catch {
      // Try the next candidate.
    }
  }
  return trimmed;
}

function sliceObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 && end > start ? text.slice(start, end + 1) : null;
}
