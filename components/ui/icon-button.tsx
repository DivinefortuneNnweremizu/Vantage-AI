import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const iconButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-default disabled:opacity-60 " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  {
    variants: {
      tone: {
        filled: "size-10 bg-subtle text-fg-heading hover:bg-subtle-hover",
        inline: "size-9 text-fg-muted hover:bg-subtle",
        primary: "size-10 bg-action text-on-action hover:bg-action-hover active:bg-action-pressed",
      },
    },
    defaultVariants: { tone: "filled" },
  },
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  /** Required. Icon-only buttons need an accessible name. */
  "aria-label": string;
  /** React 19 passes refs as a regular prop. */
  ref?: React.Ref<HTMLButtonElement>;
}

export function IconButton({ className, tone, type = "button", ...props }: IconButtonProps) {
  return <button type={type} className={cn(iconButtonVariants({ tone }), className)} {...props} />;
}
