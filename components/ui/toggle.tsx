"use client";

import { cn } from "@/lib/cn";

interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Visible text next to the switch. Used as its accessible name. */
  label: string;
}

/** On/off switch. Recipe from design.md: 44 by 24 track, white thumb. */
export function Toggle({ checked, onCheckedChange, label }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <span className="cv01 text-base font-medium text-fg">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          checked ? "bg-accent" : "bg-line-strong",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-block size-5 rounded-full bg-white shadow-xs transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  );
}
