export const REPORT_TABS = [
  { id: "sentiment", label: "Sentiment" },
  { id: "recommendations", label: "Recommendations" },
  { id: "takeaways", label: "Key Takeaways" },
  { id: "score", label: "UX Score" },
  { id: "assistant", label: "Assistant" },
] as const;

export type ReportTabId = (typeof REPORT_TABS)[number]["id"];

/** The first tab opens by default: what to fix, shown on the design itself. */
export const DEFAULT_TAB: ReportTabId = "sentiment";

export function parseTab(value: string | undefined): ReportTabId {
  return REPORT_TABS.find((tab) => tab.id === value)?.id ?? DEFAULT_TAB;
}

export function tabHref(sessionId: string, tab: ReportTabId, iteration?: number): string {
  const params = new URLSearchParams();
  if (tab !== DEFAULT_TAB) params.set("tab", tab);
  if (iteration !== undefined) params.set("v", String(iteration));
  const query = params.toString();
  return `/sessions/${sessionId}${query ? `?${query}` : ""}`;
}
