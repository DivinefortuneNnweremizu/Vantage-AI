/**
 * The principle library. Every finding in a report must cite one of these.
 * Findings never invent principles. Adding one is a reviewed code change.
 *
 * See .agents/rules/ai-behavior.md (Principle Library and Scoring Standards).
 */
export const PRINCIPLE_LIBRARY_VERSION = "1.0.0";

export type PrincipleCategory =
  | "Visual Hierarchy"
  | "Layout and Spacing"
  | "Accessibility"
  | "Consistency"
  | "Feedback and Interaction"
  | "Mobile Responsiveness"
  | "Error Prevention"
  | "Content and Clarity";

export type ScoreDimension = "intuitive" | "trusted" | "valuable";

export interface Principle {
  id: string;
  category: PrincipleCategory;
  name: string;
  /** The established standard this principle comes from. Shown in the report. */
  standard: string;
  summary: string;
  /** How strongly a finding on this principle moves each score dimension, from 0 to 1. */
  weights: Record<ScoreDimension, number>;
  /** Limit to one platform when the principle only applies there. */
  platform?: "APP" | "WEB";
}

export const PRINCIPLES: readonly Principle[] = [
  // Visual Hierarchy
  {
    id: "visual-hierarchy",
    category: "Visual Hierarchy",
    name: "Size, weight, and contrast signal importance",
    standard: "Gestalt figure-ground and visual hierarchy fundamentals",
    summary: "The most important element should be the most visually prominent.",
    weights: { intuitive: 0.8, trusted: 0.3, valuable: 0.5 },
  },
  {
    id: "primary-action-emphasis",
    category: "Visual Hierarchy",
    name: "One clear primary action",
    standard: "Hick's Law and the Von Restorff Effect",
    summary: "A single, distinct primary action shortens decision time.",
    weights: { intuitive: 0.8, trusted: 0.2, valuable: 0.6 },
  },
  {
    id: "aesthetic-usability",
    category: "Visual Hierarchy",
    name: "A polished look builds trust",
    standard: "Aesthetic-Usability Effect",
    summary: "Users perceive attractive, well-finished interfaces as more usable and reliable.",
    weights: { intuitive: 0.2, trusted: 0.8, valuable: 0.3 },
  },

  // Layout and Spacing
  {
    id: "proximity",
    category: "Layout and Spacing",
    name: "Related items sit close together",
    standard: "Gestalt law of proximity",
    summary: "Spacing communicates which elements belong together.",
    weights: { intuitive: 0.6, trusted: 0.3, valuable: 0.2 },
  },
  {
    id: "alignment-rhythm",
    category: "Layout and Spacing",
    name: "Consistent alignment and spacing rhythm",
    standard: "Gestalt law of continuity and grid fundamentals",
    summary: "A consistent grid and spacing scale make a layout feel ordered.",
    weights: { intuitive: 0.4, trusted: 0.5, valuable: 0.1 },
  },
  {
    id: "chunking",
    category: "Layout and Spacing",
    name: "Group information into small chunks",
    standard: "Miller's Law",
    summary: "People hold a limited amount of information at once, so chunk it.",
    weights: { intuitive: 0.6, trusted: 0.1, valuable: 0.3 },
  },

  // Accessibility
  {
    id: "text-contrast",
    category: "Accessibility",
    name: "Text contrast of at least 4.5:1",
    standard: "WCAG 2.1 success criterion 1.4.3",
    summary: "Body text needs enough contrast against its background to be read by everyone.",
    weights: { intuitive: 0.4, trusted: 0.5, valuable: 0.4 },
  },
  {
    id: "target-size",
    category: "Accessibility",
    name: "Touch targets of at least 44 by 44 px",
    standard: "WCAG 2.1 success criterion 2.5.5 and Fitts's Law",
    summary: "Larger, well-spaced targets are faster and easier to hit.",
    weights: { intuitive: 0.5, trusted: 0.2, valuable: 0.3 },
  },
  {
    id: "text-alternatives",
    category: "Accessibility",
    name: "Images and icons have text alternatives",
    standard: "WCAG 2.1 success criterion 1.1.1",
    summary: "Meaningful images and icon-only controls need a name that assistive technology can read.",
    weights: { intuitive: 0.2, trusted: 0.4, valuable: 0.2 },
  },
  {
    id: "not-color-alone",
    category: "Accessibility",
    name: "Meaning never relies on color alone",
    standard: "WCAG 2.1 success criterion 1.4.1",
    summary: "Pair color with an icon, label, or pattern so everyone gets the message.",
    weights: { intuitive: 0.4, trusted: 0.4, valuable: 0.2 },
  },

  // Consistency
  {
    id: "conventions",
    category: "Consistency",
    name: "Follow established conventions",
    standard: "Jakob's Law and Nielsen heuristic 4",
    summary: "Users expect your product to work like the products they already know.",
    weights: { intuitive: 0.8, trusted: 0.5, valuable: 0.2 },
  },
  {
    id: "component-consistency",
    category: "Consistency",
    name: "Reuse the same pattern for the same job",
    standard: "Nielsen heuristic 4: consistency and standards",
    summary: "Identical jobs should look and behave identically across the product.",
    weights: { intuitive: 0.5, trusted: 0.6, valuable: 0.1 },
  },

  // Feedback and Interaction
  {
    id: "system-status",
    category: "Feedback and Interaction",
    name: "Keep users informed of system status",
    standard: "Nielsen heuristic 1: visibility of system status",
    summary: "Respond to every action so users know it was received.",
    weights: { intuitive: 0.6, trusted: 0.7, valuable: 0.3 },
  },
  {
    id: "user-control",
    category: "Feedback and Interaction",
    name: "Give users control and an easy way out",
    standard: "Nielsen heuristic 3: user control and freedom",
    summary: "Make it easy to undo, cancel, and go back.",
    weights: { intuitive: 0.5, trusted: 0.6, valuable: 0.2 },
  },
  {
    id: "recognition-over-recall",
    category: "Feedback and Interaction",
    name: "Show options instead of making users remember",
    standard: "Nielsen heuristic 6: recognition rather than recall",
    summary: "Keep the information needed for a decision visible where the decision happens.",
    weights: { intuitive: 0.7, trusted: 0.2, valuable: 0.3 },
  },
  {
    id: "response-time",
    category: "Feedback and Interaction",
    name: "Respond within 400 ms or show progress",
    standard: "Doherty Threshold",
    summary: "Fast, steady responses keep users engaged.",
    weights: { intuitive: 0.3, trusted: 0.5, valuable: 0.4 },
  },
  {
    id: "goal-gradient",
    category: "Feedback and Interaction",
    name: "Show progress toward the goal",
    standard: "Goal-Gradient Effect",
    summary: "People accelerate as they near a goal, so show how close they are.",
    weights: { intuitive: 0.3, trusted: 0.2, valuable: 0.7 },
  },

  // Mobile Responsiveness
  {
    id: "thumb-reach",
    category: "Mobile Responsiveness",
    name: "Keep key actions within thumb reach",
    standard: "Fitts's Law and mobile ergonomics",
    summary: "Primary actions belong where a thumb can reach them comfortably.",
    weights: { intuitive: 0.6, trusted: 0.1, valuable: 0.4 },
    platform: "APP",
  },
  {
    id: "responsive-reflow",
    category: "Mobile Responsiveness",
    name: "Layouts adapt without horizontal scrolling",
    standard: "WCAG 2.1 success criterion 1.4.10",
    summary: "Content should reflow to the screen instead of forcing sideways scrolling.",
    weights: { intuitive: 0.4, trusted: 0.4, valuable: 0.3 },
    platform: "WEB",
  },
  {
    id: "platform-guidelines",
    category: "Mobile Responsiveness",
    name: "Follow platform guidelines",
    standard: "Apple Human Interface Guidelines and Material Design",
    summary: "Native conventions make an app feel at home on the device.",
    weights: { intuitive: 0.6, trusted: 0.4, valuable: 0.2 },
    platform: "APP",
  },

  // Error Prevention
  {
    id: "error-prevention",
    category: "Error Prevention",
    name: "Prevent errors before they happen",
    standard: "Nielsen heuristic 5: error prevention",
    summary: "Constraints, defaults, and hints stop mistakes at the source.",
    weights: { intuitive: 0.5, trusted: 0.7, valuable: 0.3 },
  },
  {
    id: "error-recovery",
    category: "Error Prevention",
    name: "Help users recover from errors",
    standard: "Nielsen heuristic 9: help users recognize, diagnose, and recover from errors",
    summary: "Error messages should say what went wrong and how to fix it, in plain language.",
    weights: { intuitive: 0.4, trusted: 0.7, valuable: 0.2 },
  },

  // Content and Clarity
  {
    id: "match-real-world",
    category: "Content and Clarity",
    name: "Speak the user's language",
    standard: "Nielsen heuristic 2: match between the system and the real world",
    summary: "Use words and concepts users already know, not internal jargon.",
    weights: { intuitive: 0.8, trusted: 0.4, valuable: 0.4 },
  },
  {
    id: "minimalist-design",
    category: "Content and Clarity",
    name: "Remove information that does not help",
    standard: "Nielsen heuristic 8: aesthetic and minimalist design",
    summary: "Every extra element competes with the ones that matter.",
    weights: { intuitive: 0.7, trusted: 0.2, valuable: 0.5 },
  },
] as const;

const BY_ID = new Map(PRINCIPLES.map((principle) => [principle.id, principle]));

export function getPrinciple(id: string): Principle | undefined {
  return BY_ID.get(id);
}

export function principleAppliesTo(principle: Principle, platform: "APP" | "WEB"): boolean {
  return principle.platform === undefined || principle.platform === platform;
}

/** The six sections shown in the Figma design, in order, followed by the extra ones. */
export const CATEGORY_ORDER: readonly PrincipleCategory[] = [
  "Visual Hierarchy",
  "Accessibility",
  "Consistency",
  "Feedback and Interaction",
  "Mobile Responsiveness",
  "Error Prevention",
  "Layout and Spacing",
  "Content and Clarity",
];
