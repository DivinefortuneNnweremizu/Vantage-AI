export const REPORT_TABS = [
  { id: "takeaways", label: "Key Takeaways" },
  { id: "score", label: "UX Score" },
  { id: "sentiment", label: "Sentiment" },
  { id: "recommendations", label: "Recommendations" },
  { id: "assistant", label: "Assistant" },
] as const;

export type ReportTabId = (typeof REPORT_TABS)[number]["id"];

export const DEFAULT_TAB: ReportTabId = "takeaways";

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
