import { Check } from "lucide-react";

import { cn } from "@/lib/cn";

const STEPS = ["Upload", "Goal", "Report"] as const;

/** Where you are on the way to a report: Upload, then Goal, then Report. Finished steps get a tick. */
export function FlowSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol aria-label="Steps to your report" className="flex items-center gap-2 text-sm">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const isDone = step < current;
        const isCurrent = step === current;
        return (
          <li key={label} aria-current={isCurrent ? "step" : undefined} className="flex items-center gap-2">
            {index > 0 ? <span aria-hidden="true" className={cn("h-px w-6 sm:w-10", isDone || isCurrent ? "bg-fg-subtle" : "bg-line")} /> : null}
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                isCurrent ? "bg-selected text-on-selected" : "bg-subtle text-fg-muted",
              )}
            >
              {isDone ? <Check className="size-3.5" aria-hidden="true" /> : step}
            </span>
            <span className={cn(isCurrent ? "font-semibold text-fg-strong" : "text-fg-muted")}>
              {label}
              {isDone ? <span className="sr-only"> (done)</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
