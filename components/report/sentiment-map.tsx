"use client";

import { useRef, useState } from "react";
import { Frown, Smile } from "lucide-react";

import { AssetImage } from "@/components/ui/asset-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SegmentedControl, type SegmentOption } from "@/components/ui/segmented-control";
import { Toggle } from "@/components/ui/toggle";
import type { ViewAsset, ViewFinding } from "@/features/analysis/queries";
import { cn } from "@/lib/cn";

interface SentimentMapProps {
  title: string;
  assets: ViewAsset[];
  findings: ViewFinding[];
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
 * Smile and frown markers placed on the design, with every finding listed underneath.
 * The list is the full text equivalent of the markers, so nothing depends on seeing the image.
 */
export function SentimentMap({ title, assets, findings }: SentimentMapProps) {
  const hasDislikes = findings.some((finding) => finding.valence === "dislike");
  const [filter, setFilter] = useState<Filter>(hasDislikes ? "dislikes" : "likes");
  const [showMarkers, setShowMarkers] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const listRefs = useRef(new Map<string, HTMLLIElement>());
  const markerRefs = useRef(new Map<string, HTMLButtonElement>());

  const page = assets[pageIndex];
  const wantedValence = filter === "likes" ? "like" : "dislike";
  const visible = findings.filter((finding) => finding.valence === wantedValence);
  const onThisPage = visible.filter((finding) => finding.marker !== null && finding.assetId === page?.id);
  const isJourney = assets.length > 1;
  const pageNumberFor = (assetId: string | null): number => (assetId ? assets.findIndex((asset) => asset.id === assetId) + 1 : 0);

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
    requestAnimationFrame(() => markerRefs.current.get(id)?.focus());
  }

  return (
    <div className="flex flex-col gap-6">
      {page ? (
        <div className="flex flex-col gap-3">
          <div className="relative mx-auto w-fit max-w-full overflow-hidden rounded-2xl border border-line bg-subtle">
            <AssetImage
              assetId={page.id}
              alt={`${title}${isJourney ? `, page ${pageIndex + 1} of ${assets.length}` : ""}. Markers are listed below.`}
              className="max-h-[520px] w-auto"
            />
            {showMarkers
              ? onThisPage.map((finding) => {
                  const isDislike = finding.valence === "dislike";
                  const Icon = isDislike ? Frown : Smile;
                  const marker = finding.marker as { x: number; y: number };
                  return (
                    // Positions come from the report data, so they are the one place inline styles are used.
                    <div
                      key={finding.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }}
                    >
                      <button
                        type="button"
                        ref={(node) => {
                          if (node) markerRefs.current.set(finding.id, node);
                          else markerRefs.current.delete(finding.id);
                        }}
                        onClick={() => openFinding(finding.id)}
                        aria-label={`${isDislike ? "Dislike" : "Like"}: ${finding.title}. ${finding.category}.`}
                        className={cn(
                          "flex size-10 items-center justify-center rounded-md text-white shadow-xs transition-transform hover:scale-105",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                          isDislike ? "bg-error-500" : "bg-success-600",
                          highlightedId === finding.id ? "ring-2 ring-white outline-2 outline-accent" : "",
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
            />
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4">
        <Toggle checked={showMarkers} onCheckedChange={setShowMarkers} label="View Maps" />
        <SegmentedControl label="Show" value={filter} options={FILTER_OPTIONS} onChange={setFilter} />
      </div>

      <p className="sr-only" role="status">
        {showMarkers ? `${onThisPage.length} ${filter} marked on this page.` : "Markers hidden."} All findings are listed below.
      </p>

      <div className="h-px bg-line" />

      {visible.length === 0 ? (
        <p className="text-base text-fg-muted">
          {filter === "likes" ? "No strengths were marked in this report." : "No problems were marked in this report."}
        </p>
      ) : (
        <ul className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
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
                  "flex gap-3 rounded-xl p-2 outline-none focus-visible:outline-2 focus-visible:outline-accent",
                  highlightedId === finding.id ? "bg-selected" : "",
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center text-fg-heading">
                  <Icon className="size-8" strokeWidth={1.5} aria-hidden="true" />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="cv01 text-xl font-semibold text-fg">{finding.title}</h3>
                    <Badge size="sm" tone={SEVERITY_TONE[finding.severity]}>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Show ${finding.title} on the design`}
                        onClick={() => backToMarker(finding.id)}
                        className="-ml-3"
                      >
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
  );
}
