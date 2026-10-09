import { cn } from "@/lib/cn";

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  className?: string;
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function Avatar({ name, imageUrl, className }: AvatarProps) {
  return (
    <span
      className={cn(
        "relative inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-[1.5px] border-surface bg-subtle text-sm font-semibold text-fg-heading",
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
