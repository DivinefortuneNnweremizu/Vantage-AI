import { cn } from "@/lib/cn";

/**
 * The Vantage mark: a "V" (a vantage point) whose right arm ends in a pin, the same kind of marker the
 * Sentiment Map puts on a design. Colours come from tokens, so it follows the theme rules like everything else.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-badge bg-night-950 text-white", className)}>
      <svg viewBox="0 0 40 40" className="size-full" fill="none" aria-hidden="true">
        <path d="M11 13.5 20 29.5 27.5 16" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="29" cy="12" r="4.5" className="fill-primary-300" />
      </svg>
    </span>
  );
}

/** The mark with the "Vantage" wordmark beside it. */
export function Logo({ size = "lg" }: { size?: "md" | "lg" }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className={size === "lg" ? "size-10" : "size-8"} />
      <span className={cn("cv01 font-semibold text-fg-strong", size === "lg" ? "text-2xl" : "text-lg")}>Vantage</span>
    </span>
  );
}
