import { cn } from "@/lib/cn";

type AvatarSize = 40 | 48 | 64;

const SIZE_CLASSES: Record<AvatarSize, string> = {
  40: "size-10",
  48: "size-12",
  64: "size-16",
};

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: AvatarSize;
  className?: string;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function Avatar({ name, imageUrl, size = 40, className }: AvatarProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-surface bg-subtle text-sm font-semibold text-fg-heading",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={name} className="size-full object-cover" />
      ) : (
        <>
          <span aria-hidden="true">{initialsFor(name)}</span>
          <span className="sr-only">{name}</span>
        </>
      )}
    </span>
  );
}
