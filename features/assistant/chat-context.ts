import "server-only";
import type { ReportView } from "@/features/analysis/queries";
import type { ChatReportContext } from "@/services/ai/provider";

/** Only what the assistant may talk about: the saved report. Nothing else is sent to the model. */
export function toChatContext(report: ReportView): ChatReportContext {
  return {
    title: report.session.title,
    goal: report.analysis.goal,
    overall: report.analysis.scores.overall,
    scores: {
      intuitive: report.analysis.scores.intuitive,
      trusted: report.analysis.scores.trusted,
      valuable: report.analysis.scores.valuable,
    },
    strengths: report.strengths,
    painPoints: report.painPoints,
    overallTakeaway: report.analysis.overallTakeaway,
    findings: report.findings.map((finding, index) => ({
      ref: index + 1,
      title: finding.title,
      valence: finding.valence,
      severity: finding.severity,
      category: finding.category,
      standard: finding.standard,
      observation: finding.observation,
      impact: finding.impact,
    })),
    recommendations: report.recommendations.map((item) => ({
      rank: item.rank,
      title: item.title,
      change: item.change,
      rationale: item.rationale,
      findingRefs: item.findingIds.map((id) => report.findings.findIndex((finding) => finding.id === id) + 1).filter((ref) => ref > 0),
    })),
  };
}
