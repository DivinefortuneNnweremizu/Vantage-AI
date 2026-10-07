import { Badge } from "@/components/ui/badge";
import type { IterationComparison } from "@/features/analysis/queries";

interface IterationSummaryProps {
  comparison: IterationComparison;
  iteration: number;
}

function Delta({ value }: { value: number }) {
  if (value === 0) return <Badge size="sm" tone="neutral">No change</Badge>;
  return (
    <Badge size="sm" tone={value > 0 ? "success" : "error"}>
      {value > 0 ? "+" : "−"}
      {Math.abs(value)}
    </Badge>
  );
}

/** Shown above the report from version 2 on, so progress is visible at a glance. */
export function IterationSummary({ comparison, iteration }: IterationSummaryProps) {
  const { resolved } = comparison;

  return (
    <section aria-label={`Changes since version ${comparison.previousIteration}`} className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <h2 className="cv01 text-base font-semibold text-fg">
          Version {iteration} compared with version {comparison.previousIteration}
        </h2>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-fg-muted">
          <li className="flex items-center gap-2">
            Overall <Delta value={comparison.delta.overall} />
          </li>
          <li>{resolved.length} issues resolved</li>
          <li>{comparison.persistingCount} still open</li>
          <li>{comparison.newCount} new issues</li>
        </ul>
      </div>
      {resolved.length > 0 ? (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-fg-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            See what you fixed
          </summary>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-fg-muted">
            {resolved.map((item, index) => (
              <li key={`${item.title}-${index}`}>
                {item.title}
                {item.category ? ` (${item.category})` : ""}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
