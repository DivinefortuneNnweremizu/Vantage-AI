"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { PANEL_ID, type ReportTabId } from "@/components/report/tabs";
import { cn } from "@/lib/cn";

/**
 * Switching a tab asks the server for the new tab's content, which takes a moment on a slow connection.
 * Without feedback a click can look like it did nothing. This remembers the tab that was just clicked, so the
 * tab bar can highlight it straight away and the content can show that it is on its way.
 */
interface TabsState {
  pending: ReportTabId | null;
  setPending: (tab: ReportTabId | null) => void;
}

const TabsContext = createContext<TabsState | null>(null);

// If the new tab never arrives, stop showing the waiting state rather than leave the page dimmed.
const GIVE_UP_AFTER_MS = 12_000;

/** `resetKey` changes whenever a new view has arrived (a different tab, or a different filter). */
export function ReportTabsState({ resetKey, children }: { resetKey: string; children: React.ReactNode }) {
  const [pending, setPending] = useState<ReportTabId | null>(null);

  // The view on screen changed, so the wait is over.
  useEffect(() => {
    setPending(null);
  }, [resetKey]);

  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setPending(null), GIVE_UP_AFTER_MS);
    return () => clearTimeout(timer);
  }, [pending]);

  return <TabsContext.Provider value={{ pending, setPending }}>{children}</TabsContext.Provider>;
}

export function useReportTabs(): TabsState {
  const state = useContext(TabsContext);
  if (!state) throw new Error("useReportTabs must be used inside ReportTabsState.");
  return state;
}

/** The content of the selected tab. It fades slightly while the next tab is loading. */
export function ReportTabPanel({ active, children }: { active: ReportTabId; children: React.ReactNode }) {
  const { pending } = useReportTabs();
  return (
    <div
      role="tabpanel"
      id={PANEL_ID}
      aria-labelledby={`tab-${active}`}
      aria-busy={pending !== null}
      tabIndex={0}
      className={cn(
        "pt-3 outline-none transition-opacity focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent",
        pending !== null && "opacity-50",
      )}
    >
      {children}
    </div>
  );
}
