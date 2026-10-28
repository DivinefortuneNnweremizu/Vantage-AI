"use client";

import Link from "next/link";

import { useReportTabs } from "@/components/report/report-tabs-state";
import { tabHref, type FocusSeverity, type ReportTabId } from "@/components/report/tabs";
import { cn } from "@/lib/cn";

interface ReportSnapshotProps {
  sessionId: string;
  /** The version being shown, when it is not the latest. */
  iteration?: number;
  /** The tab and filter on screen now, so a chip that would lead to the same view does not show a waiting state. */
  active: ReportTabId;
  focus?: FocusSeverity;
  overall: number;
  counts: { critical: number; major: number; minor: number; strengths: number };
  /** The title of the most important fix. */
  topFix: string | null;
}

const chip =
  "rounded-badge px-2.5 py-1 text-sm font-medium transition-[filter] hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/**
 * The answer first: the overall score, how many problems of each weight, and what to fix first. It sits under the
 * title on every tab, so nobody has to open three tabs to find out how the design did. Every chip leads to the
 * place where its findings are: the score to the UX Score tab, the rest to the Sentiment tab, filtered to them.
 */
export function ReportSnapshot({ sessionId, iteration, active, focus, overall, counts, topFix }: ReportSnapshotProps) {
  const { setPending } = useReportTabs();

  /** A link to a view. Clicking it shows the waiting state straight away, unless it is the view already on screen. */
  function linkProps(tab: ReportTabId, target?: FocusSeverity) {
    return {
      href: tabHref(sessionId, tab, iteration, target),
      scroll: false,
      onClick: (event: React.MouseEvent) => {
        const plain = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
        const sameView = tab === active && target === focus;
        if (plain && !sameView) setPending(tab);
      },
    };
  }

  const items: Array<{ key: FocusSeverity; count: number; label: string; tone: string; phone: boolean }> = [
    // On a phone only the most serious counts show, so the tabs stay close to the title.
    { key: "critical", count: counts.critical, label: "critical", tone: "bg-error-bg text-error-fg", phone: true },
    { key: "major", count: counts.major, label: "major", tone: "bg-warning-bg text-warning-fg", phone: true },
    { key: "minor", count: counts.minor, label: "minor", tone: "bg-info-bg text-info-fg", phone: false },
    { key: "strength", count: counts.strengths, label: counts.strengths === 1 ? "strength" : "strengths", tone: "bg-success-bg text-success-fg", phone: false },
  ];

  return (
    <div className="flex flex-col gap-2">
      <ul aria-label="Report summary" className="flex flex-wrap items-center gap-2">
        <li>
          <Link {...linkProps("score")} aria-label={`Overall score ${overall}. See how it is made up.`} className={cn(chip, "block bg-selected font-semibold text-on-selected")}>
            {overall}
            <span aria-hidden="true"> overall</span>
          </Link>
        </li>
        {items
          .filter((item) => item.count > 0)
          .map((item) => (
            <li key={item.key} className={cn(!item.phone && "hidden sm:block")}>
              <Link
                {...linkProps("sentiment", item.key)}
                aria-label={`${item.count} ${item.label}. Show ${item.key === "strength" ? "what works" : "these problems"}.`}
                aria-current={active === "sentiment" && focus === item.key ? "true" : undefined}
                className={cn(chip, "block", item.tone, active === "sentiment" && focus === item.key && "ring-2 ring-current")}
              >
                {item.count} {item.label}
              </Link>
            </li>
          ))}
      </ul>
      {topFix ? (
        <p className="hidden text-sm text-fg-muted sm:block">
          Start with:{" "}
          <Link
            {...linkProps("recommendations")}
            className="font-medium text-fg underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {topFix}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
