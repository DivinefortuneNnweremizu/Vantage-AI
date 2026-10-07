import { CopyButton } from "@/components/report/copy-button";
import type { ReportView } from "@/features/analysis/queries";

interface KeyTakeawaysProps {
  report: ReportView;
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="flex list-decimal flex-col gap-2 pl-6 text-base leading-relaxed text-fg marker:text-fg-subtle">
      {items.map((item, index) => (
        <li key={index} className="pl-1">
          {item}
        </li>
      ))}
    </ol>
  );
}

/** Plain-text version of the tab, for the copy button. */
function toPlainText(report: ReportView): string {
  const numbered = (items: string[]) => items.map((item, index) => `${index + 1}. ${item}`).join("\n");
  return [
    `${report.session.title} Design Analysis`,
    "",
    "Goal",
    report.analysis.goal ?? "No goal was set for this analysis.",
    "",
    "Strengths",
    numbered(report.strengths),
    "",
    "Pain Points",
    numbered(report.painPoints),
    "",
    "Overall takeaway",
    report.analysis.overallTakeaway,
  ].join("\n");
}

export function KeyTakeaways({ report }: KeyTakeawaysProps) {
  const { analysis } = report;

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <section aria-labelledby="takeaway-goal" className="flex flex-col gap-2">
        <h2 id="takeaway-goal" className="cv01 text-3xl font-semibold text-fg-subtle">
          Goal
        </h2>
        <p className="text-base leading-relaxed text-fg">{analysis.goal ?? "No goal was set for this analysis."}</p>
      </section>

      <section aria-labelledby="takeaway-strengths" className="flex flex-col gap-3">
        <h2 id="takeaway-strengths" className="cv01 text-3xl font-semibold text-fg-subtle">
          Strengths
        </h2>
        <NumberedList items={report.strengths} />
      </section>

      <section aria-labelledby="takeaway-pain" className="flex flex-col gap-3">
        <h2 id="takeaway-pain" className="cv01 text-3xl font-semibold text-fg-subtle">
          Pain Points
        </h2>
        <NumberedList items={report.painPoints} />
      </section>

      <section aria-labelledby="takeaway-overall" className="flex flex-col gap-2">
        <h2 id="takeaway-overall" className="cv01 text-3xl font-semibold text-fg-subtle">
          Overall takeaway
        </h2>
        <p className="text-base leading-relaxed text-fg">{analysis.overallTakeaway}</p>
      </section>

      <div>
        <CopyButton text={toPlainText(report)} label="Copy key takeaways" />
      </div>
    </div>
  );
}
