"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ChevronUp, LogOut, Settings } from "lucide-react";

import { signOutAction } from "@/features/auth/actions";
import type { CurrentUser } from "@/features/auth/get-current-user";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";

interface ProfileMenuProps {
  user: CurrentUser;
  onNavigate: () => void;
}

const itemClass =
  "flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm text-fg transition-colors hover:bg-hover " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent";

/** The profile row at the bottom of the sidebar. Clicking it opens Settings and Log out, like ChatGPT. */
export function ProfileMenu({ user, onNavigate }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const displayName = user.fullName ?? user.email;

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: PointerEvent): void {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setIsOpen(false);
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape") return;
      // Close only this menu, not the mobile drawer around it.
      event.stopPropagation();
      setIsOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative px-2">
      {isOpen ? (
        <div
          id={panelId}
          className="absolute right-2 bottom-full left-2 mb-2 flex flex-col gap-1 rounded-xl border border-line bg-surface p-2 shadow-md"
        >
          <p className="truncate px-3 py-2 text-sm text-fg-muted">{user.email}</p>
          <div className="my-1 h-px bg-divider" />
          <Link
            href="/settings"
            className={itemClass}
            onClick={() => {
              setIsOpen(false);
              onNavigate();
            }}
          >
            <Settings className="size-5 shrink-0" aria-hidden="true" />
            Settings and Privacy
          </Link>
          <form action={signOutAction}>
            <button type="submit" className={itemClass}>
              <LogOut className="size-5 shrink-0" aria-hidden="true" />
              Log out
            </button>
          </form>
        </div>
      ) : null}

      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        aria-label={`Account menu for ${displayName}`}
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-3 rounded-sm px-4 py-3 text-left transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={displayName} imageUrl={user.avatarUrl} />
          <span className="min-w-0 text-sm">
            <span className="cv01 block truncate font-semibold">{displayName}</span>
            <span className="block truncate text-fg-muted">{user.email}</span>
          </span>
        </span>
        <ChevronUp className={cn("size-5 shrink-0 text-fg-muted transition-transform", !isOpen && "rotate-180")} aria-hidden="true" />
      </button>
    </div>
  );
}
