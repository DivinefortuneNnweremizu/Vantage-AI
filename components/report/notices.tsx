import { Info } from "lucide-react";

/** Shown on every report made by the demo provider, so invented content is never mistaken for analysis. */
export function DemoNotice() {
  return (
    <div role="note" className="flex items-start gap-3 rounded-xl bg-warning-bg px-4 py-3 text-sm text-warning-fg">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>
        <strong className="font-semibold">Demo report.</strong> These findings are sample content, not an analysis of your image. The AI
        model is not connected yet.
      </p>
    </div>
  );
}

export function Disclaimer() {
  return (
    <p className="mx-auto max-w-[842px] pt-8 text-center text-xs leading-relaxed text-fg-subtle">
      Disclaimer: The information provided by this AI is for general informational purposes only. While we strive for accuracy,
      please verify any facts or data independently before making decisions based on this information.
    </p>
  );
}
