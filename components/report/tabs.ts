export const REPORT_TABS = [
  { id: "sentiment", label: "Sentiment" },
  { id: "recommendations", label: "Recommendations" },
  { id: "takeaways", label: "Key Takeaways" },
  { id: "score", label: "UX Score" },
  { id: "assistant", label: "Assistant" },
] as const;

export type ReportTabId = (typeof REPORT_TABS)[number]["id"];

/** The id of the content area the tabs control. */
export const PANEL_ID = "report-panel";

/** The first tab opens by default: what to fix, shown on the design itself. */
const DEFAULT_TAB: ReportTabId = "sentiment";

export function parseTab(value: string | undefined): ReportTabId {
  return REPORT_TABS.find((tab) => tab.id === value)?.id ?? DEFAULT_TAB;
}

/** A kind of finding the summary chips can open: one severity of problem, or the strengths. */
export type FocusSeverity = "critical" | "major" | "minor" | "strength";

const FOCUS_VALUES: readonly FocusSeverity[] = ["critical", "major", "minor", "strength"];

export function parseFocus(value: string | undefined): FocusSeverity | undefined {
  return FOCUS_VALUES.find((focus) => focus === value);
}

export function tabHref(sessionId: string, tab: ReportTabId, iteration?: number, focus?: FocusSeverity): string {
  const params = new URLSearchParams();
  if (tab !== DEFAULT_TAB) params.set("tab", tab);
  if (iteration !== undefined) params.set("v", String(iteration));
  if (focus) params.set("focus", focus);
  const query = params.toString();
  return `/sessions/${sessionId}${query ? `?${query}` : ""}`;
}
