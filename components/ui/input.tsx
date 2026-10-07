import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function Input({ className, hasError = false, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-md border border-line-strong bg-surface px-3 py-2.5 text-sm text-fg shadow-xs outline-none " +
          "placeholder:text-fg-subtle focus:border-accent focus:ring-2 focus:ring-focus",
        hasError && "border-error-500 focus:border-error-500 focus:ring-error-bg",
        className,
      )}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}
