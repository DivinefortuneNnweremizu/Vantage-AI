import { DesignPreview } from "@/components/report/design-preview";
import type { ReportView } from "@/features/analysis/queries";

interface RecommendationsProps {
  report: ReportView;
}

export function RecommendationList({ report }: RecommendationsProps) {
  const findingById = new Map(report.findings.map((finding) => [finding.id, finding]));

  return (
    <ol className="flex w-full flex-col">
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
            <span className="cv01 w-8 shrink-0 text-2xl font-bold text-fg-label" aria-hidden="true">
              {recommendation.rank}.
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <h3 className="cv01 text-xl font-bold text-fg-label">
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

export function Recommendations({ report }: RecommendationsProps) {
  return (
    <section aria-labelledby="recs-heading" className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* The design stays in view on the left while the recommendations scroll on the right. */}
      <DesignPreview
        assets={report.assets}
        title={`Analyzed design: ${report.session.title}`}
        className="min-w-0 lg:sticky lg:top-24"
        imageClassName="max-h-[max(360px,calc(100vh-16rem))]"
      />
      <div className="flex min-w-0 flex-col gap-6">
        <h2 id="recs-heading" className="cv01 text-2xl font-semibold text-fg-strong">
          Try these recommendations to make the experience better
        </h2>
        <RecommendationList report={report} />
      </div>
    </section>
  );
}
