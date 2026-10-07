import { DesignPreview } from "@/components/report/design-preview";
import { ScoreDonut } from "@/components/report/score-donut";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import type { ReportView } from "@/features/analysis/queries";
import { DIMENSION_LABELS, DIMENSION_QUESTIONS, describeScore } from "@/services/analysis/scoring/rubric";
import type { ScoreDimension } from "@/services/ai/principles/library";

interface UxScoreProps {
  report: ReportView;
}

const DIMENSIONS: ReadonlyArray<{ key: ScoreDimension; swatch: string; bar: string }> = [
  { key: "intuitive", swatch: "bg-chart-1", bar: "bg-chart-1" },
  { key: "trusted", swatch: "bg-chart-2", bar: "bg-chart-2" },
  { key: "valuable", swatch: "bg-chart-3", bar: "bg-chart-3" },
];

function DeltaBadge({ delta, version }: { delta: number; version: number }) {
  if (delta === 0) {
    return (
      <Badge size="sm" tone="neutral">
        No change since v{version}
      </Badge>
    );
  }
  return (
    <Badge size="sm" tone={delta > 0 ? "success" : "error"}>
      {delta > 0 ? "+" : "−"}
      {Math.abs(delta)} since v{version}
    </Badge>
  );
}

export function UxScore({ report }: UxScoreProps) {
  const { scores, breakdown } = report.analysis;
  const titleById = new Map(report.findings.map((finding) => [finding.id, finding.title]));
  const comparison = report.comparison;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_410px]">
        <DesignPreview assets={report.assets} title={`Analyzed design: ${report.session.title}`} />

        <Card className="self-start">
          <CardBody className="flex flex-col gap-6 p-6">
            <h2 className="cv01 text-xl font-semibold text-fg-heading">Design Quality Score</h2>
            <ScoreDonut scores={scores} />
            <ul className="flex flex-col gap-3">
              {DIMENSIONS.map(({ key, swatch }) => (
                <li key={key} className="flex items-center justify-between text-base font-semibold text-fg-muted">
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className={`size-3.5 rounded-sm ${swatch}`} />
                    {DIMENSION_LABELS[key]}
                  </span>
                  <span>{scores[key]}%</span>
                </li>
              ))}
            </ul>
            {comparison ? <DeltaBadge delta={comparison.delta.overall} version={comparison.previousIteration} /> : null}
          </CardBody>
        </Card>
      </div>

      <div className="h-px bg-line" />

      <ul className="grid gap-4 lg:grid-cols-3">
        {DIMENSIONS.map(({ key, bar }) => {
          const score = scores[key];
          const contributions = breakdown?.[key]?.contributions ?? [];
          const lowered = contributions
            .filter((entry) => entry.points < 0)
            .sort((a, b) => a.points - b.points)
            .slice(0, 3);
          const raised = contributions
            .filter((entry) => entry.points > 0)
            .sort((a, b) => b.points - a.points)
            .slice(0, 2);

          return (
            <li key={key}>
              <Card className="h-full">
                <CardBody className="flex h-full flex-col gap-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="cv01 text-xl font-bold text-fg">{DIMENSION_LABELS[key]}</h3>
                    <span className="text-base font-semibold text-fg-muted">{score}%</span>
                  </div>

                  <div
                    role="progressbar"
                    aria-label={`${DIMENSION_LABELS[key]} score`}
                    aria-valuenow={score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-3 overflow-hidden rounded-full bg-subtle"
                  >
                    <div className={`h-full rounded-full ${bar}`} style={{ width: `${score}%` }} />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge size="sm" tone={score >= 70 ? "success" : score >= 50 ? "warning" : "error"}>
                      {describeScore(score)}
                    </Badge>
                    {comparison ? <DeltaBadge delta={comparison.delta[key]} version={comparison.previousIteration} /> : null}
                  </div>

                  <p className="text-sm leading-relaxed text-fg-muted">{DIMENSION_QUESTIONS[key]}</p>

                  {lowered.length > 0 || raised.length > 0 ? (
                    <dl className="flex flex-col gap-3 text-sm">
                      {lowered.length > 0 ? (
                        <div>
                          <dt className="font-medium text-fg-heading">Lowered by</dt>
                          <dd>
                            <ul className="mt-1 flex flex-col gap-1 text-fg-muted">
                              {lowered.map((entry) => (
                                <li key={entry.findingId} className="flex justify-between gap-3">
                                  <span>{titleById.get(entry.findingId) ?? "A finding"}</span>
                                  <span className="shrink-0">−{Math.abs(entry.points).toFixed(1)}</span>
                                </li>
                              ))}
                            </ul>
                          </dd>
                        </div>
                      ) : null}
                      {raised.length > 0 ? (
                        <div>
                          <dt className="font-medium text-fg-heading">Raised by</dt>
                          <dd>
                            <ul className="mt-1 flex flex-col gap-1 text-fg-muted">
                              {raised.map((entry) => (
                                <li key={entry.findingId} className="flex justify-between gap-3">
                                  <span>{titleById.get(entry.findingId) ?? "A finding"}</span>
                                  <span className="shrink-0">+{entry.points.toFixed(1)}</span>
                                </li>
                              ))}
                            </ul>
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}
                </CardBody>
              </Card>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-fg-subtle">
        Each score starts at 100, loses points for problems (more for serious ones, and more when the related design standard
        matters most for that score), and earns a few back for strengths. Scoring rubric v{report.analysis.rubricVersion}.
      </p>
    </div>
  );
}
