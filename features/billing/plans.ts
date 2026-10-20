import type { Plan } from "@prisma/client";

/**
 * Plan entitlements, defined as data in one place.
 *
 * The Free and VantagePro limits are NOT decided yet (see AGENTS.md, Open Questions).
 * `null` means "no limit for now". Change numbers here when the plans are set.
 */
interface Entitlements {
  /** Analysis runs per calendar month. */
  analysesPerMonth: number | null;
  /** Assistant replies per calendar month. */
  assistantMessagesPerMonth: number | null;
  /** Whether Multiple Page Journey is available. */
  journeyAnalysis: boolean;
  /** Maximum pages in one journey. */
  pagesPerJourney: number;
  /** Images one person can keep across all their designs. Protects shared storage. */
  maxStoredImages: number;
}

const PLAN_ENTITLEMENTS: Record<Plan, Entitlements> = {
  FREE: {
    analysesPerMonth: null,
    assistantMessagesPerMonth: null,
    journeyAnalysis: true,
    pagesPerJourney: 10,
    maxStoredImages: 50,
  },
  VANTAGE_PRO: {
    analysesPerMonth: null,
    assistantMessagesPerMonth: null,
    journeyAnalysis: true,
    pagesPerJourney: 10,
    maxStoredImages: 500,
  },
};

export function entitlementsFor(plan: Plan): Entitlements {
  const entitlements = PLAN_ENTITLEMENTS[plan];
  // MAX_STORED_IMAGES overrides the stored-image limit, for example on a host with plenty of storage.
  const override = Number.parseInt(process.env.MAX_STORED_IMAGES ?? "", 10);
  return Number.isFinite(override) && override > 0 ? { ...entitlements, maxStoredImages: override } : entitlements;
}
