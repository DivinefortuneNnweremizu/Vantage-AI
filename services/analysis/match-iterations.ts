/**
 * Compares two reports of the same session so a designer can see what improved.
 *
 * A finding in the new report PERSISTS if the previous report had the same principle on the same
 * page, at a nearby spot when both are located. Otherwise it is NEW. A finding that only the
 * previous report had is RESOLVED.
 */
export interface ComparableFinding {
  id: string;
  principleId: string;
  valence: "like" | "dislike";
  /** Order of the page this finding refers to. */
  assetOrder: number;
  marker: { x: number; y: number } | null;
}

/** The fields of a saved finding that matter for comparing two reports. */
interface StoredFinding {
  id: string;
  principleId: string;
  valence: "LIKE" | "DISLIKE";
  assetId: string | null;
  markerX: number | null;
  markerY: number | null;
}

/** The spot a saved finding points at, or null when it was not located on the design. */
export function markerOf(finding: Pick<StoredFinding, "markerX" | "markerY">): { x: number; y: number } | null {
  return finding.markerX !== null && finding.markerY !== null ? { x: finding.markerX, y: finding.markerY } : null;
}

/** Turns a saved finding into what the comparison needs. `assetOrder` maps asset id to page order. */
export function fromStoredFinding(finding: StoredFinding, assetOrder: ReadonlyMap<string, number>): ComparableFinding {
  return {
    id: finding.id,
    principleId: finding.principleId,
    valence: finding.valence === "LIKE" ? "like" : "dislike",
    assetOrder: finding.assetId ? (assetOrder.get(finding.assetId) ?? 0) : 0,
    marker: markerOf(finding),
  };
}

export type CurrentStatus = "NEW" | "PERSISTING";

export interface IterationDiff {
  /** Status of each finding in the new report, keyed by finding id. */
  current: Map<string, CurrentStatus>;
  /** Findings from the previous report that no longer appear. Only problems count as resolved. */
  resolved: ComparableFinding[];
}

const MAX_MARKER_DISTANCE = 0.25;

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isMatch(previous: ComparableFinding, current: ComparableFinding): boolean {
  if (previous.principleId !== current.principleId) return false;
  if (previous.valence !== current.valence) return false;
  if (previous.assetOrder !== current.assetOrder) return false;
  if (previous.marker && current.marker) {
    return distance(previous.marker, current.marker) <= MAX_MARKER_DISTANCE;
  }
  return true;
}

export function diffIterations(
  previous: readonly ComparableFinding[],
  current: readonly ComparableFinding[],
): IterationDiff {
  const unmatchedPrevious = [...previous];
  const statuses = new Map<string, CurrentStatus>();

  for (const finding of current) {
    // Prefer the closest previous finding when several qualify.
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    unmatchedPrevious.forEach((candidate, index) => {
      if (!isMatch(candidate, finding)) return;
      const gap = candidate.marker && finding.marker ? distance(candidate.marker, finding.marker) : 0;
      if (gap < bestDistance) {
        bestDistance = gap;
        bestIndex = index;
      }
    });

    if (bestIndex >= 0) {
      unmatchedPrevious.splice(bestIndex, 1);
      statuses.set(finding.id, "PERSISTING");
    } else {
      statuses.set(finding.id, "NEW");
    }
  }

  return {
    current: statuses,
    resolved: unmatchedPrevious.filter((finding) => finding.valence === "dislike"),
  };
}
