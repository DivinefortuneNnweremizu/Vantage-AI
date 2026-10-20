import "server-only";
import type { ChatInput } from "@/services/ai/provider";

type Report = ChatInput["report"];
type Finding = Report["findings"][number];

interface AnswerContext {
  report: Report;
  /** The finding-by-category lookup most answers need. */
  byCategory: (category: string) => Finding[];
}

/**
 * One topic the demo assistant can answer. The first rule whose words appear in the question and that has
 * something to say wins. A rule returns null when it has nothing to say, and the next rule gets a turn.
 * To teach the demo assistant a new topic, add a rule to ANSWER_RULES. Nothing else needs to change.
 */
interface AnswerRule {
  matches: RegExp;
  answer: (context: AnswerContext) => string | null;
}

function list(items: string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function explain(finding: Finding): string {
  return `${finding.title} (${finding.category}). ${finding.observation} ${finding.impact} This comes from ${finding.standard}.`;
}

/** An answer that lists the findings in one category, or a fixed reply when there are none. */
function categoryRule(matches: RegExp, category: string, intro: string, none: string | null): AnswerRule {
  return {
    matches,
    answer: ({ byCategory }) => {
      const found = byCategory(category);
      return found.length > 0 ? `${intro}\n\n${list(found.map(explain))}` : none;
    },
  };
}

const ANSWER_RULES: AnswerRule[] = [
  categoryRule(
    /contrast|access|read|legib|wcag/,
    "Accessibility",
    "Here is what this report found on accessibility:",
    "This report did not flag any accessibility problems. The accessibility checks it ran are listed under the Sentiment tab.",
  ),
  categoryRule(/hierarch|prominen|attention|focus|stand out|main action/, "Visual Hierarchy", "On visual hierarchy, the report says:", null),
  categoryRule(
    /mobile|responsive|thumb|tap|small screen/,
    "Mobile Responsiveness",
    "On mobile and responsive behavior:",
    "This report did not flag any mobile or responsive problems.",
  ),
  {
    matches: /trust|credib|polish|professional/,
    answer: ({ report }) => `Trusted scored ${report.scores.trusted} out of 100. ${report.overallTakeaway}`,
  },
  {
    matches: /score|rating|number|percent/,
    answer: ({ report }) =>
      `The overall score is ${report.overall} out of 100. Intuitive is ${report.scores.intuitive}, ` +
      `Trusted is ${report.scores.trusted}, and Valuable is ${report.scores.valuable}. ` +
      "Each score starts at 100, loses points for problems weighted by severity and by how strongly the related design standard bears on it, and regains a few points for strengths.",
  },
  {
    matches: /fix|improve|first|recommend|change|how|priorit/,
    answer: ({ report }) => {
      const top = report.recommendations.slice(0, 3);
      const opening = report.strengths[0] ? `${report.strengths[0]} That is a good base to build on.` : "This design has a good base to build on.";
      const items = top.map((item, index) => {
        const image = item.findingRefs[0] ? `\n[image: ${item.findingRefs[0]}]` : "";
        return `${index + 1}. ${item.title}${image}\n${item.rationale}\n- ${item.change}`;
      });
      return `${opening}\n\nHere is what I would improve first.\n\n${items.join("\n\n")}\n\nStart with "${top[0]?.title ?? "the first change"}".`;
    },
  },
  {
    matches: /strength|good|well|working|like/,
    answer: ({ report }) => `What the design does well:\n\n${list(report.strengths.slice(0, 4))}`,
  },
  {
    matches: /why|problem|pain/,
    answer: ({ report }) => {
      const first = report.findings.find((finding) => finding.valence === "dislike");
      return first ? `${explain(first)}\n\nThe recommended change: ${report.recommendations[0]?.change ?? "see the Recommendations tab."}` : null;
    },
  },
];

/** Builds an answer from the report only. Never claims anything the report does not contain. */
export function composeMockAnswer({ report, question }: ChatInput): string {
  const q = question.toLowerCase();
  const context: AnswerContext = {
    report,
    byCategory: (category) => report.findings.filter((finding) => finding.category === category),
  };

  for (const rule of ANSWER_RULES) {
    if (!rule.matches.test(q)) continue;
    const answer = rule.answer(context);
    if (answer !== null) return answer;
  }

  return (
    "I can answer questions about this analysis, such as why a finding matters, what to fix first, or how a score was reached. " +
    `The two biggest pain points right now:\n\n${list(report.painPoints.slice(0, 2))}`
  );
}
