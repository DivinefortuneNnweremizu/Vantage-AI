"use client";

import { Fragment, useRef } from "react";
import { X } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";

/** A marked spot on one of the uploaded designs. `ref` is the finding's number in the report. */
export interface DesignSpot {
  ref: number;
  assetId: string;
  title: string;
  /** Where the issue is on the image, 0 to 1 from the top-left corner. */
  x: number;
  y: number;
  /** Image size, used to crop to the right shape. */
  width: number | null;
  height: number | null;
}

const ZOOM = 2.5;
const PREVIEW_ASPECT = 16 / 9;
const DEFAULT_IMAGE_ASPECT = 1.5;

/**
 * Works out the crop along one axis. `visible` is the share of the image the frame shows. The frame is moved so
 * the point sits in the middle, without showing past an edge. Returns the background position and where the point
 * lands inside the frame (both as percentages).
 */
function crop(
  point: number,
  visible: number,
): { position: number; dot: number } {
  if (visible >= 1) return { position: 50, dot: point * 100 };
  const start = Math.min(1 - visible, Math.max(0, point - visible / 2));
  return {
    position: (start / (1 - visible)) * 100,
    dot: Math.min(95, Math.max(5, ((point - start) / visible) * 100)),
  };
}

/** A close-up of the part of the design a finding points at, with a dot on the exact spot. Click it to see the whole design. */
function SpotPreview({ spot }: { spot: DesignSpot }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const imageAspect =
    spot.width && spot.height ? spot.height / spot.width : DEFAULT_IMAGE_ASPECT;
  const across = crop(spot.x, 1 / ZOOM);
  const down = crop(spot.y, 1 / PREVIEW_ASPECT / (ZOOM * imageAspect));

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label={`${spot.title}. Close-up of the design. Open the full design.`}
        className="relative aspect-video w-full max-w-2xl cursor-zoom-in overflow-hidden rounded-lg border border-line bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        // The crop depends on where the finding sits on this image, so it can only be set here.
        style={{
          backgroundImage: `url(/api/assets/${spot.assetId}/file)`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${ZOOM * 100}% auto`,
          backgroundPosition: `${across.position}% ${down.position}%`,
        }}
      >
        <span
          aria-hidden="true"
          className="absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary-500/70 shadow"
          style={{ left: `${across.dot}%`, top: `${down.dot}%` }}
        />
      </button>

      {/* Native dialog: Esc closes it, focus is trapped, and the page behind is inert. */}
      <dialog
        ref={dialog}
        aria-label={spot.title}
        className="m-auto max-h-[92dvh] max-w-[min(96vw,1200px)] rounded-xl border border-line bg-surface p-0 text-fg backdrop:bg-night-950/80"
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
          <p className="cv01 text-base font-semibold text-fg-heading">
            {spot.title}
          </p>
          <IconButton
            tone="inline"
            aria-label="Close preview"
            onClick={() => dialog.current?.close()}
          >
            <X className="size-5" aria-hidden="true" />
          </IconButton>
        </div>
        <div className="overflow-auto px-5 pb-5">
          <div className="relative mx-auto w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/assets/${spot.assetId}/file`}
              alt={`The full design, with the spot for: ${spot.title}`}
              className="block max-h-[78dvh] max-w-full rounded-lg"
            />
            <span
              aria-hidden="true"
              className="absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary-500/70 shadow"
              style={{ left: `${spot.x * 100}%`, top: `${spot.y * 100}%` }}
            />
          </div>
        </div>
      </dialog>
    </>
  );
}

type Block =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "image"; ref: number };

const IMAGE_LINE = /^\[image:\s*(\d+)\]$/i;
const NUMBERED = /^\d+\.\s+(.+)$/;
const BULLET = /^[-•]\s+(.+)$/;
// A numbered line is a heading only when it is short and not a sentence. Longer ones are ordinary list items.
const HEADING_MAX_LENGTH = 80;

/** Turns the assistant's plain text into blocks. Anything unexpected stays an ordinary paragraph. */
function toBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of text.replaceAll("**", "").split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    const image = IMAGE_LINE.exec(line);
    if (image?.[1]) {
      blocks.push({ kind: "image", ref: Number(image[1]) });
      continue;
    }
    const bullet = BULLET.exec(line);
    if (bullet?.[1]) {
      const last = blocks[blocks.length - 1];
      if (last?.kind === "bullets") last.items.push(bullet[1]);
      else blocks.push({ kind: "bullets", items: [bullet[1]] });
      continue;
    }
    const numbered = NUMBERED.exec(line);
    if (
      numbered?.[1] &&
      line.length <= HEADING_MAX_LENGTH &&
      !/[.!?]$/.test(numbered[1])
    ) {
      blocks.push({ kind: "heading", text: line });
      continue;
    }
    blocks.push({ kind: "paragraph", text: line });
  }
  return blocks;
}

/** Shows an assistant answer with its headings, bullet fixes and close-ups of the design. */
export function AssistantText({
  text,
  spots,
}: {
  text: string;
  spots: DesignSpot[];
}) {
  const blocks = toBlocks(text);
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          return (
            <p
              key={index}
              className={cn(
                "cv01 text-base font-semibold text-fg-heading",
                index > 0 && "mt-2",
              )}
            >
              {block.text}
            </p>
          );
        }
        if (block.kind === "bullets") {
          return (
            <ul
              key={index}
              className="flex list-disc flex-col gap-1.5 pl-5 marker:text-fg-subtle"
            >
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        if (block.kind === "image") {
          const spot = spots.find((candidate) => candidate.ref === block.ref);
          return (
            <Fragment key={index}>
              {spot ? <SpotPreview spot={spot} /> : null}
            </Fragment>
          );
        }
        return <p key={index}>{block.text}</p>;
      })}
    </div>
  );
}
