import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn("overflow-hidden rounded-xl border border-line bg-surface", className)} {...props} />;
}

interface CardHeaderProps {
  title: string;
  action?: React.ReactNode;
}

/** Card title row followed by a divider, matching design.md. */
export function CardHeader({ title, action }: CardHeaderProps) {
  return (
    <>
      <div className="flex h-[63px] items-start justify-between px-6 pt-6">
        <h2 className="cv01 text-lg font-semibold">{title}</h2>
        {action}
      </div>
      <div className="h-px bg-line" />
    </>
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-6", className)} {...props} />;
}
