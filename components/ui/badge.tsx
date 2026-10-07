import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const badgeVariants = cva("inline-flex items-center justify-center gap-0.5 font-medium whitespace-nowrap", {
  variants: {
    size: {
      sm: "rounded-badge px-1 text-xs",
      md: "rounded-xl px-3 py-0.5 text-sm",
    },
    tone: {
      success: "bg-success-bg text-success-fg",
      warning: "bg-warning-bg text-warning-fg",
      error: "bg-error-bg text-error-fg",
      info: "bg-info-bg text-info-fg",
      neutral: "bg-subtle text-fg-heading",
    },
  },
  defaultVariants: { size: "md", tone: "neutral" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, size, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ size, tone }), className)} {...props} />;
}
