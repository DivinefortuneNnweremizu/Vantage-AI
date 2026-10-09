import { cn } from "@/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-md border border-line-strong bg-surface px-3 py-2.5 text-sm text-fg shadow-xs outline-none " +
          "placeholder:text-fg-subtle focus:border-accent focus:ring-2 focus:ring-focus",
        className,
      )}
      {...props}
    />
  );
}
