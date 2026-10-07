import { cn } from "@/lib/cn";

/** Loading placeholder. Match its size to the content it stands in for to avoid layout shift. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-lg bg-subtle", className)} {...props} />;
}
