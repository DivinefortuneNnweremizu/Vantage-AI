import { cn } from "@/lib/cn";

/**
 * The bare Vantage glyph, sized by the caller's class (for example "size-4"). It replaces the generic sparkle icon
 * wherever the product points at itself: the assistant, upgrade buttons, and so on. It takes the surrounding text
 * colour; the pin is the project blue, or the same colour as the text with `mono` (for coloured backgrounds).
 */
export function LogoGlyph({ className, mono = false }: { className?: string; mono?: boolean }) {
  return (
    <svg viewBox="6 5 30 30" className={className} fill="none" aria-hidden="true">
      <path d="M11 13.5 20 29.5 27.5 16" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="29" cy="12" r="4.5" className={mono ? "fill-current" : "fill-primary-300"} />
    </svg>
  );
}

/**
 * The Vantage mark: a "V" (a vantage point) whose right arm ends in a pin, the same kind of marker the
 * Sentiment Map puts on a design. Colours come from tokens, so it follows the theme rules like everything else.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-badge bg-night-950 text-white", className)}>
      <LogoGlyph className="size-[70%]" />
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
