import { cn } from "@/lib/cn";

interface AssetImageProps {
  assetId: string;
  alt: string;
  size?: "full" | "thumb";
  className?: string;
  priority?: boolean;
}

export function assetUrl(assetId: string, size: "full" | "thumb" = "full"): string {
  return `/api/assets/${assetId}/file${size === "thumb" ? "?size=thumb" : ""}`;
}

/**
 * Shows an uploaded design. Images come from an authenticated route, so they are plain <img> elements:
 * Next's image optimizer would not carry the user's session.
 */
export function AssetImage({ assetId, alt, size = "full", className, priority = false }: AssetImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={assetUrl(assetId, size)}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("block max-w-full", className)}
    />
  );
}
