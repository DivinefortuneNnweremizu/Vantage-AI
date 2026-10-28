"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { LogoGlyph } from "@/components/brand/logo";
import { useReportTabs } from "@/components/report/report-tabs-state";
import { PANEL_ID, REPORT_TABS, tabHref, type ReportTabId } from "@/components/report/tabs";
import { cn } from "@/lib/cn";

interface ReportTabsProps {
  sessionId: string;
  active: ReportTabId;
  iteration?: number;
}

/** Tab bar. Each tab is a link, so the address always matches what you see. Arrow keys move between tabs. */
export function ReportTabs({ sessionId, active, iteration }: ReportTabsProps) {
  const router = useRouter();
  const { pending, setPending } = useReportTabs();
  // The tab that was just clicked counts as selected straight away, while its content loads.
  const shown = pending ?? active;
  const refs = useRef<Array<HTMLAnchorElement | null>>([]);

  function move(to: number): void {
    const count = REPORT_TABS.length;
    const index = (to + count) % count;
    const tab = REPORT_TABS[index];
    if (!tab) return;
    refs.current[index]?.focus();
    if (tab.id !== active) setPending(tab.id);
    router.push(tabHref(sessionId, tab.id, iteration), { scroll: false });
  }

  return (
    <div
      role="tablist"
      aria-label="Report sections"
      // On a phone the tabs wrap onto a second line, so all five are visible at once instead of hiding behind sideways scrolling.
      className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-surface p-2 sm:flex-nowrap sm:gap-2 sm:overflow-x-auto sm:p-3"
    >
      {REPORT_TABS.map((tab, index) => {
        const isActive = tab.id === shown;
        return (
          <Link
            key={tab.id}
            ref={(node) => {
              refs.current[index] = node;
            }}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={PANEL_ID}
            tabIndex={isActive ? 0 : -1}
            href={tabHref(sessionId, tab.id, iteration)}
            scroll={false}
            // Each tab is a full server render, so prefetching all five on every page view is wasted work.
            prefetch={false}
            onClick={(event) => {
              // A plain click starts loading the tab. Opening in a new tab or window does not.
              const plain = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
              if (plain && tab.id !== active) setPending(tab.id);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") {
                event.preventDefault();
                move(index + 1);
              } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                move(index - 1);
              } else if (event.key === "Home") {
                event.preventDefault();
                move(0);
              } else if (event.key === "End") {
                event.preventDefault();
                move(REPORT_TABS.length - 1);
              }
            }}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-2 border border-transparent px-2.5 text-sm font-medium whitespace-nowrap transition-colors sm:px-3 sm:text-base",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              // As in the Figma file: the selected Assistant tab is the lavender chip, the others are light grey.
              tab.id === "assistant" ? "rounded-xl" : "rounded-[14px]",
              isActive
                ? tab.id === "assistant"
                  ? "bg-chip text-on-chip"
                  : "bg-tab-active text-on-tab-active"
                : "text-fg-muted hover:bg-hover hover:text-fg",
            )}
          >
            {tab.id === "assistant" ? <LogoGlyph mono className="size-5" /> : null}
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
