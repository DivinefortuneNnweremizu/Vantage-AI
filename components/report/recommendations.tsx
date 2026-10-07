import { DesignPreview } from "@/components/report/design-preview";
import { cn } from "@/lib/cn";
import type { ReportView } from "@/features/analysis/queries";

interface RecommendationsProps {
  report: ReportView;
  /** "page" shows the design above the list. "card" is the compact version beside the assistant. */
  variant: "page" | "card";
}

export function RecommendationList({ report, variant }: RecommendationsProps) {
  const findingById = new Map(report.findings.map((finding) => [finding.id, finding]));

  return (
    <ol className={cn("flex flex-col", variant === "page" ? "mx-auto w-full max-w-3xl" : "")}>
      {report.recommendations.map((recommendation) => {
        const standards = Array.from(
          new Set(
            recommendation.findingIds
              .map((id) => findingById.get(id)?.standard)
              .filter((value): value is string => Boolean(value)),
          ),
        );
        return (
          <li key={recommendation.id} className="flex gap-3 border-t border-line py-4 first:border-t-0 first:pt-0">
            <span className="cv01 w-8 shrink-0 text-2xl font-semibold text-fg-subtle" aria-hidden="true">
              {recommendation.rank}.
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <h3 className="cv01 text-lg font-semibold text-fg">
                <span className="sr-only">{`Recommendation ${recommendation.rank}: `}</span>
                {recommendation.title}
              </h3>
              <p className="text-base leading-relaxed text-fg">{recommendation.change}</p>
              <p className="text-sm leading-relaxed text-fg-muted">{recommendation.rationale}</p>
              {standards.length > 0 ? <p className="text-xs text-fg-subtle">Based on {standards.join("; ")}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function Recommendations({ report, variant }: RecommendationsProps) {
  if (variant === "card") {
    return (
      <section aria-labelledby="recs-heading" className="flex flex-col gap-6 rounded-xl border border-line bg-surface p-6">
        <h2 id="recs-heading" className="cv01 text-xl font-semibold text-fg">
          Try these recommendations to make the experience better
        </h2>
        <RecommendationList report={report} variant="card" />
      </section>
    );
  }

  return (
    <section aria-labelledby="recs-heading" className="flex flex-col gap-6">
      <h2 id="recs-heading" className="cv01 text-2xl font-semibold text-fg-strong">
        Try these recommendations to make the experience better
      </h2>
      <DesignPreview
        assets={report.assets}
        title={`Analyzed design: ${report.session.title}`}
        className="mx-auto w-full max-w-3xl"
        imageClassName="max-h-[380px]"
      />
      <RecommendationList report={report} variant="page" />
    </section>
  );
}
