import type { Plan } from "@prisma/client";

/**
 * Plan entitlements, defined as data in one place.
 *
 * The Free and VantagePro limits are NOT decided yet (see AGENTS.md, Open Questions).
 * `null` means "no limit for now". Change numbers here when the plans are set.
 */
export interface Entitlements {
  /** Analysis runs per calendar month. */
  analysesPerMonth: number | null;
  /** Assistant replies per calendar month. */
  assistantMessagesPerMonth: number | null;
  /** Whether Multiple Page Journey is available. */
  journeyAnalysis: boolean;
  /** Maximum pages in one journey. */
  pagesPerJourney: number;
}

export const PLAN_ENTITLEMENTS: Record<Plan, Entitlements> = {
  FREE: {
    analysesPerMonth: null,
    assistantMessagesPerMonth: null,
    journeyAnalysis: true,
    pagesPerJourney: 10,
  },
  VANTAGE_PRO: {
    analysesPerMonth: null,
    assistantMessagesPerMonth: null,
    journeyAnalysis: true,
    pagesPerJourney: 10,
  },
};

export function entitlementsFor(plan: Plan): Entitlements {
  return PLAN_ENTITLEMENTS[plan];
}
