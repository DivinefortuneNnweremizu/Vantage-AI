"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

import type { AnalysisProgressStage } from "@/features/analysis/schemas";
import { AnalysisLoader } from "@/components/session/analysis-loader";
import { AssetImage } from "@/components/ui/asset-image";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { streamAnalysis } from "@/lib/client/analysis-stream";
import { messageFor } from "@/lib/client/api";

interface GoalStepProps {
  sessionId: string;
  coverAssetId: string;
  coverName: string;
  pageCount: number;
  initialGoal: string;
}

type Phase = "form" | "running" | "failed";

const GOAL_LIMIT = 600;

export function GoalStep({ sessionId, coverAssetId, coverName, pageCount, initialGoal }: GoalStepProps) {
  const router = useRouter();
  const [goal, setGoal] = useState(initialGoal);
  const [phase, setPhase] = useState<Phase>("form");
  const [stage, setStage] = useState<AnalysisProgressStage>("reading");
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const hintId = useId();
  const submitting = useRef(false);

  async function start(): Promise<void> {
    if (submitting.current) return;
    submitting.current = true;
    setError(null);
    setStage("reading");
    setPhase("running");

    try {
      await streamAnalysis(sessionId, goal.trim(), setStage);
      router.replace(`/sessions/${sessionId}`);
      router.refresh();
    } catch (streamError) {
      setError(messageFor(streamError));
      setPhase("failed");
      submitting.current = false;
    }
  }

  const preview = (
    <div className="overflow-hidden rounded-2xl border border-line bg-subtle">
      <AssetImage
        assetId={coverAssetId}
        alt={`Your design: ${coverName}`}
        priority
        className={phase === "running" ? "mx-auto max-h-[200px] w-auto object-contain" : "mx-auto max-h-[44vh] w-auto object-contain"}
      />
    </div>
  );

  if (phase === "running") {
    return (
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-8 pt-6">
        {preview}
        <AnalysisLoader stage={stage} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 pt-6">
      {preview}
      {pageCount > 1 ? (
        <p className="text-center text-sm text-fg-muted">
          Showing page 1 of {pageCount}. All {pageCount} pages will be analyzed as one journey.
        </p>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void start();
        }}
        className="flex flex-col gap-2"
      >
        <label htmlFor={inputId} className="text-sm font-medium text-fg-heading">
          What do you want to learn and test?
        </label>
        <div className="flex items-end gap-3 rounded-xl border border-line-strong bg-surface p-3 shadow-xs focus-within:border-accent focus-within:ring-2 focus-within:ring-focus">
          <textarea
            id={inputId}
            value={goal}
            onChange={(event) => setGoal(event.target.value.slice(0, GOAL_LIMIT))}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void start();
              }
            }}
            rows={2}
            placeholder="Test if users can easily find the sign up button"
            aria-describedby={hintId}
            className="min-h-11 w-full resize-none bg-transparent px-1 py-2 text-base text-fg outline-none placeholder:text-fg-subtle"
          />
          <IconButton type="submit" tone="primary" aria-label="Start analysis">
            <Send className="size-5" aria-hidden="true" />
          </IconButton>
        </div>
        <p id={hintId} className="flex justify-between text-xs text-fg-subtle">
          <span>Optional. A clear goal gives you sharper feedback. Press Enter to start.</span>
          <span aria-hidden="true">
            {goal.length}/{GOAL_LIMIT}
          </span>
        </p>
      </form>

      {phase === "failed" && error ? (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-line bg-error-bg p-4">
          <p className="text-sm text-error-fg">{error}</p>
          <div>
            <Button variant="secondary" size="sm" onClick={() => void start()}>
              Try again
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
