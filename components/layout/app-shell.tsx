"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, Sparkles } from "lucide-react";

import type { CurrentUser } from "@/features/auth/get-current-user";
import type { ThemePreference } from "@/features/settings/theme";
import type { SessionListItem } from "@/features/sessions/queries";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { IconButton } from "@/components/ui/icon-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface AppShellProps {
  user: CurrentUser;
  recentSessions: SessionListItem[];
  initialTheme: ThemePreference;
  children: React.ReactNode;
}

const SIDEBAR_ID = "app-sidebar";

/** Persistent sidebar on `lg`, focus-trapped drawer below it. */
export function AppShell({ user, recentSessions, initialTheme, children }: AppShellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  const close = useCallback((): void => {
    setIsOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const drawer = drawerRef.current;
    const focusable = drawer?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
    focusable?.[0]?.focus();

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key !== "Tab" || !focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  return (
    <div className="flex min-h-screen">
      <div
        aria-hidden="true"
        onClick={close}
        className={cn(
          "fixed inset-0 z-30 bg-overlay/40 transition-opacity duration-200 lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        id={SIDEBAR_ID}
        ref={drawerRef}
        aria-label="Sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 h-dvh w-[272px] shrink-0 border-r border-line bg-surface transition-[transform,visibility] duration-200",
          "lg:visible lg:sticky lg:top-0 lg:z-auto lg:translate-x-0",
          // Hidden drawers must also leave the tab order, so use visibility as well as translate.
          isOpen ? "visible translate-x-0" : "invisible -translate-x-full",
        )}
      >
        <Sidebar user={user} recentSessions={recentSessions} onNavigate={() => setIsOpen(false)} onClose={close} />
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-surface px-4 py-3 sm:gap-6 sm:px-6 lg:px-9">
          <IconButton
            ref={menuButtonRef}
            tone="filled"
            aria-label="Open menu"
            aria-controls={SIDEBAR_ID}
            aria-expanded={isOpen}
            onClick={() => setIsOpen(true)}
            className="lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </IconButton>
          <span className="cv01 flex-1 truncate text-lg font-semibold text-fg-strong lg:hidden">Vantage</span>
          <span className="hidden lg:block" />
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/settings/billing" className={cn(buttonVariants({ variant: "secondary" }), "hidden sm:inline-flex")}>
              <Sparkles className="size-4" aria-hidden="true" />
              Upgrade to VantagePro
            </Link>
            <ThemeToggle initialTheme={initialTheme} />
          </div>
        </header>

        <main className="flex flex-col px-4 pt-6 pb-9 sm:px-6 lg:px-9">{children}</main>
      </div>
    </div>
  );
}
