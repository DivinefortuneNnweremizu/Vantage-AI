"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

import { REPORT_TABS, tabHref, type ReportTabId } from "@/components/report/tabs";
import { cn } from "@/lib/cn";

interface ReportTabsProps {
  sessionId: string;
  active: ReportTabId;
  iteration?: number;
}

export const PANEL_ID = "report-panel";

/** Tab bar. Each tab is a link, so the address always matches what you see. Arrow keys move between tabs. */
export function ReportTabs({ sessionId, active, iteration }: ReportTabsProps) {
  const router = useRouter();
  const refs = useRef<Array<HTMLAnchorElement | null>>([]);

  function move(to: number): void {
    const count = REPORT_TABS.length;
    const index = (to + count) % count;
    const tab = REPORT_TABS[index];
    if (!tab) return;
    refs.current[index]?.focus();
    router.push(tabHref(sessionId, tab.id, iteration), { scroll: false });
  }

  return (
    <div
      role="tablist"
      aria-label="Report sections"
      className="flex items-center gap-2 overflow-x-auto rounded-xl border border-line bg-surface p-3"
    >
      {REPORT_TABS.map((tab, index) => {
        const isActive = tab.id === active;
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
              "flex min-h-11 shrink-0 items-center gap-2 rounded-lg border px-3 text-base font-medium whitespace-nowrap transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              isActive
                ? "border-selected-line bg-selected text-on-selected"
                : "border-transparent text-fg-muted hover:bg-hover hover:text-fg",
            )}
          >
            {tab.id === "assistant" ? <Sparkles className="size-5" aria-hidden="true" /> : null}
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
