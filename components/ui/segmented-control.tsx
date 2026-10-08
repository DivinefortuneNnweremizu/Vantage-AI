"use client";

import { useId, useRef } from "react";

import { cn } from "@/lib/cn";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<SegmentOption<T>>;
  onChange: (value: T) => void;
  className?: string;
  /**
   * Below the `sm` breakpoint, show only the icons. The text stays available to screen readers
   * and as a tooltip. Use this when an icon is recognizable and space is tight.
   */
  iconOnlyOnMobile?: boolean;
  /**
   * "strong" fills the selected option with the primary color, so it stands out clearly from the others
   * (used for a filter such as Likes and Dislikes). "soft" is the pale tint.
   */
  emphasis?: "soft" | "strong";
}

/** Radio-style segmented control with arrow-key navigation. Styles match design.md Tabs. */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
  iconOnlyOnMobile = false,
  emphasis = "soft",
}: SegmentedControlProps<T>) {
  const groupId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function move(from: number, delta: number): void {
    const nextIndex = (from + delta + options.length) % options.length;
    const next = options[nextIndex];
    if (!next) return;
    onChange(next.value);
    refs.current[nextIndex]?.focus();
  }

  return (
    <div role="radiogroup" aria-label={label} id={groupId} className={cn("flex flex-wrap items-center gap-2", className)}>
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            title={iconOnlyOnMobile ? option.label : undefined}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                event.preventDefault();
                move(index, 1);
              } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                event.preventDefault();
                move(index, -1);
              }
            }}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-md border p-[11px] text-sm font-medium whitespace-nowrap transition-colors " +
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              iconOnlyOnMobile ? "min-w-11 justify-center sm:min-w-0" : "",
              selected
                ? emphasis === "strong"
                  ? "border-action bg-action text-on-action"
                  : "border-selected-line bg-selected text-on-selected"
                : "border-line-strong bg-subtle text-fg-heading hover:bg-subtle-hover",
            )}
          >
            {option.icon}
            <span className={iconOnlyOnMobile ? "sr-only sm:not-sr-only" : undefined}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
