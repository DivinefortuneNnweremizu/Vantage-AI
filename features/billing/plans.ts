import type { Plan } from "@prisma/client";

/**
 * Plan entitlements, defined as data in one place.
 *
 * The Free and VantagePro limits are NOT decided yet (see AGENTS.md, Open Questions). Only the limits the
 * app enforces today are here. Monthly analysis and assistant limits are added with billing, and the daily caps on
 * real AI use are separate (services/analysis/usage-caps.ts). Change numbers here when the plans are set.
 */
interface Entitlements {
  /** Whether Multiple Page Journey is available. */
  journeyAnalysis: boolean;
  /** Maximum pages in one journey. */
  pagesPerJourney: number;
  /** Images one person can keep across all their designs. Protects shared storage. */
  maxStoredImages: number;
}

const PLAN_ENTITLEMENTS: Record<Plan, Entitlements> = {
  FREE: {
    journeyAnalysis: true,
    pagesPerJourney: 10,
    maxStoredImages: 50,
  },
  VANTAGE_PRO: {
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
