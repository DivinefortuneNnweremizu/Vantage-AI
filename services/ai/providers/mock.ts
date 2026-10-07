import { getPrinciple, principleAppliesTo } from "@/services/ai/principles/library";
import type { AiProvider, AnalyzeInput, ChatInput } from "@/services/ai/provider";
import type { ReportInput } from "@/features/analysis/schemas";

/**
 * Demo provider. Returns DETERMINISTIC, INVENTED content so the whole product can run before a real
 * model is connected. It does not look at the image. The same images always give the same report.
 *
 * Reports from this provider are stored with model "mock-fixtures" and the UI labels them as demos.
 * It is blocked in production (see services/ai/index.ts).
 */

interface LikeTemplate {
  principleId: string;
  title: string;
  observation: string;
  impact: string;
}

interface DislikeTemplate extends LikeTemplate {
  change: string;
  rationale: string;
}

const LIKES: LikeTemplate[] = [
  {
    principleId: "visual-hierarchy",
    title: "Clear visual hierarchy",
    observation: "The main heading is the largest, highest-contrast element, so the eye lands there first.",
    impact: "Users grasp the main message within a second.",
  },
  {
    principleId: "conventions",
    title: "Familiar patterns",
    observation: "Navigation and input fields follow conventions people already know from other products.",
    impact: "Users spend no time learning how it works.",
  },
  {
    principleId: "aesthetic-usability",
    title: "Polished, trustworthy finish",
    observation: "Refined typography and restrained color give the design a premium, considered look.",
    impact: "A polished look raises trust in the product before anyone reads a word.",
  },
  {
    principleId: "minimalist-design",
    title: "Focused layout",
    observation: "Only the elements needed for the task are on screen, with generous space around them.",
    impact: "Less noise helps users reach the next step faster.",
  },
  {
    principleId: "proximity",
    title: "Related content is grouped",
    observation: "Related controls sit together and are separated from unrelated ones by clear spacing.",
    impact: "Users understand which items belong together without reading labels.",
  },
  {
    principleId: "match-real-world",
    title: "Plain-language labels",
    observation: "Labels use everyday words instead of internal jargon, so each control explains itself.",
    impact: "People understand each control without having to guess.",
  },
  {
    principleId: "alignment-rhythm",
    title: "Consistent spacing rhythm",
    observation: "Elements align to a steady grid and spacing repeats predictably down the page.",
    impact: "An ordered layout reads as reliable and is easier to scan.",
  },
  {
    principleId: "system-status",
    title: "Status is visible",
    observation: "The interface shows what is happening after each action, such as selected and active states.",
    impact: "Users know the system received their input.",
  },
];

const DISLIKES: DislikeTemplate[] = [
  {
    principleId: "primary-action-emphasis",
    title: "Unclear next step",
    observation: "No single action stands out as the clear way forward, so several elements compete for attention.",
    impact: "Users hesitate at the moment they are ready to continue.",
    change: "Give the main action a filled button with the strongest contrast on the screen, and make secondary actions quieter.",
    rationale: "One distinct primary action shortens decision time (Hick's Law).",
  },
  {
    principleId: "text-contrast",
    title: "Low text contrast",
    observation: "Some secondary text is hard to read against its background.",
    impact: "People with low vision, or anyone in bright light, may miss important information.",
    change: "Raise secondary text to at least a 4.5:1 contrast ratio against its background.",
    rationale: "WCAG 2.1 success criterion 1.4.3 sets 4.5:1 as the minimum for body text.",
  },
  {
    principleId: "target-size",
    title: "Small tap targets",
    observation: "Several interactive controls look smaller than 44 by 44 px.",
    impact: "Fingers miss small targets, which causes mistakes and frustration.",
    change: "Enlarge small controls to at least 44 by 44 px, or add spacing so the tappable area reaches that size.",
    rationale: "Larger, well-spaced targets are faster to hit (Fitts's Law and WCAG 2.5.5).",
  },
  {
    principleId: "system-status",
    title: "No feedback after actions",
    observation: "Nothing on screen confirms that an action was received or is in progress.",
    impact: "Users are left unsure whether to wait, retry, or move on.",
    change: "Show a confirmation or progress state immediately after every action.",
    rationale: "Visibility of system status is Nielsen's first usability heuristic.",
  },
  {
    principleId: "error-prevention",
    title: "Mistakes are easy to make",
    observation: "Inputs give no hint of the expected format and show no guidance before submission.",
    impact: "Users discover errors only after they submit.",
    change: "Add inline validation and a short example next to inputs that expect a specific format.",
    rationale: "Preventing errors at the source beats explaining them afterwards (Nielsen heuristic 5).",
  },
  {
    principleId: "component-consistency",
    title: "Inconsistent styling",
    observation: "Fonts, colors, or spacing vary between elements that do the same job.",
    impact: "Inconsistency makes the product feel less reliable and slows recognition.",
    change: "Define one style for each kind of element and apply it everywhere it appears.",
    rationale: "Consistency builds trust and lowers learning effort (Nielsen heuristic 4).",
  },
  {
    principleId: "recognition-over-recall",
    title: "Information is hidden",
    observation: "Users must remember details from earlier steps to make the current decision.",
    impact: "Memory load slows decisions and causes errors.",
    change: "Show the key details at the point where the decision is made.",
    rationale: "Recognition is easier than recall (Nielsen heuristic 6).",
  },
  {
    principleId: "not-color-alone",
    title: "Meaning depends on color",
    observation: "Status appears to be communicated by color only, without an icon or label.",
    impact: "People with color-vision differences may miss the message.",
    change: "Pair every status color with an icon or a short text label.",
    rationale: "WCAG 2.1 success criterion 1.4.1 asks that color is never the only signal.",
  },
  {
    principleId: "thumb-reach",
    title: "Key actions are hard to reach",
    observation: "Important actions sit at the top of the screen, far from where a thumb rests.",
    impact: "One-handed use becomes awkward on larger phones.",
    change: "Move the primary action into the lower half of the screen.",
    rationale: "Thumb-reach ergonomics follow Fitts's Law: nearer targets are faster to hit.",
  },
  {
    principleId: "responsive-reflow",
    title: "Layout may not adapt",
    observation: "The layout looks fixed to one screen width and may force sideways scrolling on small screens.",
    impact: "Small-screen users have to scroll in two directions to read.",
    change: "Let the layout reflow at narrow widths and test it down to 320 px.",
    rationale: "WCAG 2.1 success criterion 1.4.10 asks content to reflow without horizontal scrolling.",
  },
];

/** Small seeded random generator so the same input always gives the same report. */
function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const a = copy[i] as T;
    copy[i] = copy[j] as T;
    copy[j] = a;
  }
  return copy;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SEVERITY_ORDER = ["critical", "major", "major", "minor", "minor"] as const;
const COLUMNS = 3;
const ROWS = 4;

export class MockAiProvider implements AiProvider {
  readonly id = "mock";
  readonly model = "mock-fixtures";
  readonly isDemo = true;

  async analyze(input: AnalyzeInputWithLatency): Promise<ReportInput> {
    // Simulated thinking time so the progress screen is visible. Skipped in tests.
    await sleep(input.simulatedLatencyMs ?? 3200);

    const seed = input.assets.map((asset) => asset.contentHash).join("|") + "|" + (input.goal ?? "");
    const random = seededRandom(seed);

    const dislikeCandidates = DISLIKES.filter((template) => {
      const principle = getPrinciple(template.principleId);
      return principle ? principleAppliesTo(principle, input.platform) : false;
    });
    const dislikes = shuffled(dislikeCandidates, random).slice(0, 5);
    const dislikedPrinciples = new Set(dislikes.map((template) => template.principleId));

    const likeCandidates = LIKES.filter((template) => {
      const principle = getPrinciple(template.principleId);
      return principle && principleAppliesTo(principle, input.platform) && !dislikedPrinciples.has(template.principleId);
    });
    const likes = shuffled(likeCandidates, random).slice(0, 5);

    // Spread markers over a coarse grid so they do not overlap, per page.
    const slotsByAsset = new Map<number, Array<{ column: number; row: number }>>();
    const nextSlot = (assetIndex: number): { x: number; y: number } => {
      let slots = slotsByAsset.get(assetIndex);
      if (!slots || slots.length === 0) {
        const all: Array<{ column: number; row: number }> = [];
        for (let column = 0; column < COLUMNS; column += 1) {
          for (let row = 0; row < ROWS; row += 1) all.push({ column, row });
        }
        slots = shuffled(all, random);
        slotsByAsset.set(assetIndex, slots);
      }
      const slot = slots.pop() as { column: number; row: number };
      const jitter = () => (random() - 0.5) * 0.08;
      const x = Math.min(0.94, Math.max(0.06, (slot.column + 0.5) / COLUMNS + jitter()));
      const y = Math.min(0.94, Math.max(0.06, (slot.row + 0.5) / ROWS + jitter()));
      return { x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 };
    };

    const pageCount = Math.max(1, input.assets.length);
    let counter = 0;
    const findings: ReportInput["findings"] = [];

    likes.forEach((template) => {
      counter += 1;
      const assetIndex = counter % pageCount;
      findings.push({
        id: `f${counter}`,
        assetIndex,
        valence: "like",
        severity: "strength",
        principleId: template.principleId,
        title: template.title,
        observation: template.observation,
        impact: template.impact,
        confidence: random() > 0.35 ? "high" : "medium",
        marker: nextSlot(assetIndex),
      });
    });

    const dislikeFindingIds: string[] = [];
    dislikes.forEach((template, index) => {
      counter += 1;
      const assetIndex = counter % pageCount;
      const id = `f${counter}`;
      dislikeFindingIds.push(id);
      findings.push({
        id,
        assetIndex,
        valence: "dislike",
        severity: SEVERITY_ORDER[index] ?? "minor",
        principleId: template.principleId,
        title: template.title,
        observation: template.observation,
        impact: template.impact,
        confidence: random() > 0.45 ? "high" : "medium",
        marker: nextSlot(assetIndex),
      });
    });

    const recommendations: ReportInput["recommendations"] = dislikes.map((template, index) => ({
      rank: index + 1,
      title: template.title === "Unclear next step" ? "Make the main action unmistakable" : `Fix: ${template.title.toLowerCase()}`,
      change: template.change,
      rationale: template.rationale,
      principleId: template.principleId,
      findingIds: [dislikeFindingIds[index] as string],
    }));

    const topLike = likes[0];
    const topDislike = dislikes[0];
    const goalPart = input.goal ? `Measured against your goal, "${input.goal.slice(0, 140)}", ` : "";
    const previousPart = input.previousSummary ? " Compared with your previous version, the changes are reflected in the scores." : "";
    const overallTakeaway =
      `${goalPart}the design is strongest in ${topLike ? topLike.title.toLowerCase() : "its overall finish"} ` +
      `and weakest in ${topDislike ? topDislike.title.toLowerCase() : "a few details"}. ` +
      `Fixing the highest-ranked recommendation first would do the most to help people reach the next step with confidence.${previousPart}`;

    return {
      strengths: likes.map((template) => `${template.observation} ${template.impact}`),
      painPoints: dislikes.map((template) => `${template.observation} ${template.impact}`),
      overallTakeaway,
      findings,
      recommendations,
      suggestedPrompts: [
        "Why is the first pain point a problem?",
        "How can I improve accessibility?",
        "What should I fix first?",
      ],
    };
  }

  async *chat(input: ChatInput): AsyncIterable<string> {
    const answer = composeMockAnswer(input);
    const words = answer.split(/(\s+)/);
    for (let index = 0; index < words.length; index += 4) {
      await sleep(18);
      yield words.slice(index, index + 4).join("");
    }
  }
}

interface AnalyzeInputWithLatency extends AnalyzeInput {
  /** Test hook. Lets unit tests skip the simulated delay. */
  simulatedLatencyMs?: number;
}

function list(items: string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

/** Builds an answer from the report only. Never claims anything the report does not contain. */
export function composeMockAnswer({ report, question }: ChatInput): string {
  const q = question.toLowerCase();
  const dislikes = report.findings.filter((finding) => finding.valence === "dislike");
  const byCategory = (category: string) => report.findings.filter((finding) => finding.category === category);

  const explain = (finding: ChatReportContext["findings"][number]) =>
    `${finding.title} (${finding.category}). ${finding.observation} ${finding.impact} This comes from ${finding.standard}.`;

  if (/contrast|access|read|legib|wcag/.test(q)) {
    const matches = byCategory("Accessibility");
    if (matches.length > 0) {
      return `Here is what this report found on accessibility:\n\n${list(matches.map(explain))}`;
    }
    return "This report did not flag any accessibility problems. The accessibility checks it ran are listed under the Sentiment tab.";
  }

  if (/hierarch|prominen|attention|focus|stand out|main action/.test(q)) {
    const matches = byCategory("Visual Hierarchy");
    if (matches.length > 0) {
      return `On visual hierarchy, the report says:\n\n${list(matches.map(explain))}`;
    }
  }

  if (/mobile|responsive|thumb|tap|small screen/.test(q)) {
    const matches = byCategory("Mobile Responsiveness");
    if (matches.length > 0) {
      return `On mobile and responsive behavior:\n\n${list(matches.map(explain))}`;
    }
    return "This report did not flag any mobile or responsive problems.";
  }

  if (/trust|credib|polish|professional/.test(q)) {
    return `Trusted scored ${report.scores.trusted} out of 100. ${report.overallTakeaway}`;
  }

  if (/score|rating|number|percent/.test(q)) {
    return (
      `The overall score is ${report.overall} out of 100. Intuitive is ${report.scores.intuitive}, ` +
      `Trusted is ${report.scores.trusted}, and Valuable is ${report.scores.valuable}. ` +
      "Each score starts at 100, loses points for problems weighted by severity and by how strongly the related design standard bears on it, and regains a few points for strengths."
    );
  }

  if (/fix|improve|first|recommend|change|how|priorit/.test(q)) {
    const top = report.recommendations.slice(0, 3);
    return `Start with these, in order of impact:\n\n${list(top.map((item) => `${item.title}. ${item.change} ${item.rationale}`))}`;
  }

  if (/strength|good|well|working|like/.test(q)) {
    return `What the design does well:\n\n${list(report.strengths.slice(0, 4))}`;
  }

  if (/why|problem|pain/.test(q)) {
    const first = dislikes[0];
    if (first) {
      return `${explain(first)}\n\nThe recommended change: ${report.recommendations[0]?.change ?? "see the Recommendations tab."}`;
    }
  }

  const topPain = report.painPoints.slice(0, 2);
  return (
    "I can answer questions about this analysis, such as why a finding matters, what to fix first, or how a score was reached. " +
    `The two biggest pain points right now:\n\n${list(topPain)}`
  );
}

type ChatReportContext = ChatInput["report"];
