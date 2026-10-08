import { Check } from "lucide-react";

import { STAGE_LABELS, STAGE_ORDER, type AnalysisProgressStage } from "@/features/analysis/schemas";
import { cn } from "@/lib/cn";

interface AnalysisLoaderProps {
  /** Stage currently running. */
  stage: AnalysisProgressStage;
}

/**
 * The "Fetching your insights..." screen. The animation and the step list sit side by side from
 * `md`, so both are in view at once. It shows what is actually happening, stage by stage, instead
 * of a generic spinner. Only the current stage is announced to screen readers, not the whole list.
 */
export function AnalysisLoader({ stage }: AnalysisLoaderProps) {
  const currentIndex = STAGE_ORDER.indexOf(stage);

  return (
    <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
      <div className="flex flex-col items-center gap-6">
        <div className="relative size-56" aria-hidden="true">
          <svg viewBox="0 0 200 200" className="absolute inset-0 size-full" fill="none">
            <circle cx="100" cy="100" r="92" stroke="var(--border-color)" strokeWidth="1" />
            <g className="loader-orbit" style={{ transformOrigin: "100px 100px" }}>
              <circle cx="100" cy="100" r="92" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeDasharray="60 520" />
            </g>
            <g className="loader-orbit-slow" style={{ transformOrigin: "100px 100px" }}>
              <circle cx="100" cy="100" r="74" stroke="var(--primary-soft-color)" strokeWidth="2" strokeLinecap="round" strokeDasharray="40 430" />
            </g>
            <circle cx="100" cy="100" r="74" stroke="var(--border-color)" strokeWidth="1" />
          </svg>
          <div className="loader-core absolute inset-[34%] rounded-full bg-selected" />
          <div className="loader-scan absolute inset-x-0 top-1/2 h-px bg-accent" />
        </div>

        <div role="status" aria-live="polite" className="flex flex-col items-center gap-2 text-center">
          <p className="cv01 text-base font-semibold text-fg-strong">Fetching your insights...</p>
          <p className="text-sm text-fg-muted">{STAGE_LABELS[stage]}</p>
        </div>
      </div>

      <ol className="flex w-full max-w-[420px] flex-col gap-3 justify-self-center md:justify-self-start" aria-label="Analysis progress">
        {STAGE_ORDER.map((item, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <li
              key={item}
              className={cn(
                "flex items-center gap-3 text-sm transition-colors",
                isCurrent ? "font-medium text-fg" : isDone ? "text-fg-muted" : "text-fg-subtle",
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border",
                  isDone ? "border-accent bg-accent text-surface" : isCurrent ? "border-accent" : "border-line-strong",
                )}
              >
                {isDone ? <Check className="size-3.5" aria-hidden="true" /> : null}
                {isCurrent ? <span className="size-2.5 rounded-full bg-accent" /> : null}
              </span>
              {STAGE_LABELS[item].replace("...", "")}
              <span className="sr-only">{isDone ? ", done" : isCurrent ? ", in progress" : ", waiting"}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
