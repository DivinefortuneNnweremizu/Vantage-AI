"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { AssetImage } from "@/components/ui/asset-image";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";

interface DesignPreviewProps {
  assets: Array<{ id: string; order: number }>;
  title: string;
  className?: string;
  imageClassName?: string;
}

/** The analyzed design in a framed preview. Journeys get previous and next page buttons. */
export function DesignPreview({ assets, title, className, imageClassName }: DesignPreviewProps) {
  const [index, setIndex] = useState(0);
  const current = assets[index];
  if (!current) return null;

  const hasMany = assets.length > 1;

  return (
    <figure className={cn("flex flex-col gap-3", className)}>
      <div className="relative overflow-hidden rounded-2xl border border-line bg-subtle">
        <AssetImage
          assetId={current.id}
          alt={`${title}${hasMany ? `, page ${index + 1} of ${assets.length}` : ""}`}
          className={cn("mx-auto max-h-[480px] w-auto object-contain", imageClassName)}
        />
      </div>
      {hasMany ? (
        <figcaption className="flex items-center justify-center gap-3 text-sm text-fg-muted">
          <IconButton tone="inline" aria-label="Previous page" disabled={index === 0} onClick={() => setIndex(index - 1)}>
            <ChevronLeft className="size-5" aria-hidden="true" />
          </IconButton>
          <span aria-live="polite">
            Page {index + 1} of {assets.length}
          </span>
          <IconButton tone="inline" aria-label="Next page" disabled={index === assets.length - 1} onClick={() => setIndex(index + 1)}>
            <ChevronRight className="size-5" aria-hidden="true" />
          </IconButton>
        </figcaption>
      ) : null}
    </figure>
  );
}
