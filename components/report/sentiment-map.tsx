"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, Frown, Smile, X } from "lucide-react";

import { AssetImage } from "@/components/ui/asset-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SegmentedControl, type SegmentOption } from "@/components/ui/segmented-control";
import { Toggle } from "@/components/ui/toggle";
import type { FocusSeverity } from "@/components/report/tabs";
import type { ViewAsset, ViewFinding } from "@/features/analysis/queries";
import { cn } from "@/lib/cn";

interface SentimentMapProps {
  title: string;
  assets: ViewAsset[];
  findings: ViewFinding[];
  /** Show only this kind of finding, when the page was opened from a summary chip. */
  focus?: FocusSeverity;
}

type Filter = "likes" | "dislikes";

const FILTER_OPTIONS: ReadonlyArray<SegmentOption<Filter>> = [
  { value: "likes", label: "Likes" },
  { value: "dislikes", label: "Dislikes" },
];

const SEVERITY_LABEL: Record<ViewFinding["severity"], string> = {
  critical: "Critical",
  major: "Major",
  minor: "Minor",
  strength: "Strength",
};

const SEVERITY_TONE = { critical: "error", major: "warning", minor: "info", strength: "success" } as const;

/**
 * Smile and frown markers placed on the design (left), with every finding listed beside it (right).
 * The design stays in view while the findings scroll, so the two can be read together without scrolling
 * down to find either one. The list is the full text equivalent of the markers.
 */
export function SentimentMap({ title, assets, findings, focus }: SentimentMapProps) {
  const hasDislikes = findings.some((finding) => finding.valence === "dislike");
  const [filter, setFilter] = useState<Filter>(focus ? (focus === "strength" ? "likes" : "dislikes") : hasDislikes ? "dislikes" : "likes");
  // Only one severity (say, the critical problems), when a summary chip was clicked. Cleared by "Show all".
  const [severity, setSeverity] = useState<FocusSeverity | undefined>(focus);
  const listHeading = useRef<HTMLDivElement>(null);
  const [showMarkers, setShowMarkers] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const listRefs = useRef(new Map<string, HTMLLIElement>());
  const markerRefs = useRef(new Map<string, HTMLButtonElement>());

  const page = assets[pageIndex];
  const wantedValence = filter === "likes" ? "like" : "dislike";
  const visible = findings.filter((finding) => finding.valence === wantedValence && (!severity || finding.severity === severity));
  const onThisPage = visible.filter((finding) => finding.marker !== null && finding.assetId === page?.id);
  const isJourney = assets.length > 1;
  const highlightedOnPage = onThisPage.some((finding) => finding.id === highlightedId);
  const pageNumberFor = (assetId: string | null): number => (assetId ? assets.findIndex((asset) => asset.id === assetId) + 1 : 0);

  // Coming from a chip, bring the list into view. On a phone it sits below the design.
  useEffect(() => {
    if (focus) listHeading.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focus]);

  function openFinding(id: string): void {
    setHighlightedId(id);
    const item = listRefs.current.get(id);
    item?.scrollIntoView({ behavior: "smooth", block: "center" });
    item?.focus({ preventScroll: true });
  }

  function backToMarker(id: string): void {
    const finding = findings.find((entry) => entry.id === id);
    const targetPage = finding?.assetId ? assets.findIndex((asset) => asset.id === finding.assetId) : -1;
    if (targetPage >= 0) setPageIndex(targetPage);
    // Highlight the marker too, so it is obvious which one belongs to this finding.
    setHighlightedId(id);
    requestAnimationFrame(() => {
      const marker = markerRefs.current.get(id);
      // On a narrow screen the design sits above the list, so bring it into view.
      marker?.scrollIntoView({ behavior: "smooth", block: "center" });
      marker?.focus({ preventScroll: true });
    });
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Left: the design with its markers. */}
      <div className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-24">
        {page ? (
          <>
            {/* Clicking empty space on the design clears the highlight. Markers have their own buttons. */}
            <div
              className="relative mx-auto w-fit max-w-full overflow-hidden rounded-2xl border border-line bg-subtle"
              onClick={(event) => {
                if (event.target === event.currentTarget || (event.target as HTMLElement).tagName === "IMG") setHighlightedId(null);
              }}
            >
              <AssetImage
                assetId={page.id}
                alt={`${title}${isJourney ? `, page ${pageIndex + 1} of ${assets.length}` : ""}. Markers are listed beside it.`}
                className="max-h-[max(360px,calc(100vh-15rem))] w-auto"
              />
              {showMarkers
                ? onThisPage.map((finding) => {
                    const isDislike = finding.valence === "dislike";
                    const Icon = isDislike ? Frown : Smile;
                    const marker = finding.marker as { x: number; y: number };
                    const isHighlighted = highlightedId === finding.id;
                    // While one marker is picked, the others step back so the picked one cannot be missed.
                    const isDimmed = highlightedOnPage && !isHighlighted;
                    return (
                      // Positions come from the report data, so they are the one place inline styles are used.
                      <div
                        key={finding.id}
                        className={cn("absolute -translate-x-1/2 -translate-y-1/2", isHighlighted ? "z-20" : "z-10")}
                        style={{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }}
                      >
                        {/* A pulsing halo behind the picked marker. It stops for people who prefer less motion. */}
                        {isHighlighted ? (
                          <span
                            aria-hidden="true"
                            className={cn(
                              "absolute inset-0 animate-ping rounded-md motion-reduce:animate-none",
                              isDislike ? "bg-error-500" : "bg-success-600",
                            )}
                          />
                        ) : null}
                        <button
                          type="button"
                          ref={(node) => {
                            if (node) markerRefs.current.set(finding.id, node);
                            else markerRefs.current.delete(finding.id);
                          }}
                          onClick={() => openFinding(finding.id)}
                          aria-label={`${isDislike ? "Dislike" : "Like"}: ${finding.title}. ${finding.category}.`}
                          data-highlighted={isHighlighted ? "true" : undefined}
                          className={cn(
                            "relative flex size-10 items-center justify-center rounded-md text-white shadow-xs transition-all duration-200 hover:scale-105",
                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                            isDislike ? "bg-error-500" : "bg-success-600",
                            // Bigger, with a white ring inside a black one, so it shows on a light or a dark design.
                            isHighlighted ? "scale-150 shadow-lg ring-4 ring-white outline-4 outline-black" : "",
                            isDimmed ? "opacity-40" : "",
                          )}
                        >
                          <Icon className="size-6" aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })
                : null}
            </div>

            {isJourney ? (
              <SegmentedControl
                label="Page"
                value={String(pageIndex)}
                options={assets.map((_, index) => ({ value: String(index), label: `Page ${index + 1}` }))}
                onChange={(value) => setPageIndex(Number(value))}
                className="justify-center"
                emphasis="strong"
              />
            ) : null}
          </>
        ) : null}
      </div>

      {/* Right: every finding, as text. */}
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
          <Toggle checked={showMarkers} onCheckedChange={setShowMarkers} label="View Maps" />
        </div>

        <div ref={listHeading} className="flex scroll-mt-24 flex-wrap items-center justify-between gap-3">
          <h2 className="cv01 text-xl font-semibold text-fg">{filter === "likes" ? "What works" : "What to fix"}</h2>
          <SegmentedControl
            label="Show"
            value={filter}
            options={FILTER_OPTIONS}
            onChange={(next) => {
              setFilter(next);
              // A severity belongs to one side, so switching sides starts again with everything.
              setSeverity(undefined);
            }}
            emphasis="strong"
          />
        </div>

        {severity ? (
          <div className="flex items-center gap-3">
            <Badge tone={SEVERITY_TONE[severity]}>Showing {visible.length} {SEVERITY_LABEL[severity].toLowerCase()}</Badge>
            <button
              type="button"
              onClick={() => setSeverity(undefined)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-fg-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <X className="size-4" aria-hidden="true" />
              Show all
            </button>
          </div>
        ) : null}

        <p className="sr-only" role="status">
          {showMarkers ? `${onThisPage.length} ${filter} marked on this page.` : "Markers hidden."} All findings are listed here.
        </p>

        {visible.length === 0 ? (
          <p className="text-base text-fg-muted">
            {filter === "likes" ? "No strengths were marked in this report." : "No problems were marked in this report."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visible.map((finding) => {
              const isDislike = finding.valence === "dislike";
              const Icon = isDislike ? Frown : Smile;
              const pageNumber = pageNumberFor(finding.assetId);
              return (
                <li
                  key={finding.id}
                  id={`finding-${finding.id}`}
                  tabIndex={-1}
                  ref={(node) => {
                    if (node) listRefs.current.set(finding.id, node);
                    else listRefs.current.delete(finding.id);
                  }}
                  className={cn(
                    "flex gap-3 rounded-xl border-b border-divider p-3 outline-none focus-visible:outline-2 focus-visible:outline-accent",
                    highlightedId === finding.id ? "bg-selected" : "",
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center text-fg-heading">
                    <Icon className="size-8" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="cv01 text-lg font-semibold text-fg">{finding.title}</h3>
                      <Badge tone={SEVERITY_TONE[finding.severity]}>
                        {SEVERITY_LABEL[finding.severity]}
                      </Badge>
                    </div>
                    <p className="text-sm text-fg-subtle">
                      {finding.category}
                      {isJourney && pageNumber > 0 ? ` · Page ${pageNumber}` : ""}
                      {finding.marker === null ? " · Not placed on the design" : ""}
                    </p>
                    <p className="text-base leading-relaxed text-fg-muted">{finding.observation}</p>
                    <p className="text-base leading-relaxed text-fg-muted">{finding.impact}</p>
                    <p className="text-xs text-fg-subtle">
                      Based on {finding.standard}
                      {finding.confidence === "low" ? " · Low confidence" : ""}
                      {finding.confidence === "medium" ? " · Medium confidence" : ""}
                    </p>
                    {finding.marker !== null ? (
                      <div>
                        {/* A solid black and white button with an icon, so it is clear that it can be clicked. */}
                        <Button
                          aria-label={`Show ${finding.title} on the design`}
                          onClick={() => backToMarker(finding.id)}
                          className="mt-1 min-h-11"
                        >
                          <Crosshair className="size-4" aria-hidden="true" />
                          Show on design
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
