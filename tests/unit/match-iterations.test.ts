import { describe, expect, it } from "vitest";

import { diffIterations, type ComparableFinding } from "@/services/analysis/match-iterations";

const finding = (
  id: string,
  principleId: string,
  overrides: Partial<ComparableFinding> = {},
): ComparableFinding => ({
  id,
  principleId,
  valence: "dislike",
  assetOrder: 0,
  marker: { x: 0.5, y: 0.5 },
  ...overrides,
});

describe("diffIterations", () => {
  it("marks a repeated problem as persisting", () => {
    const diff = diffIterations([finding("p1", "text-contrast")], [finding("c1", "text-contrast")]);
    expect(diff.current.get("c1")).toBe("PERSISTING");
    expect(diff.resolved).toHaveLength(0);
  });

  it("marks a brand new problem as new", () => {
    const diff = diffIterations([], [finding("c1", "text-contrast")]);
    expect(diff.current.get("c1")).toBe("NEW");
  });

  it("reports a problem that disappeared as resolved", () => {
    const diff = diffIterations([finding("p1", "text-contrast")], [finding("c1", "system-status")]);
    expect(diff.resolved.map((item) => item.id)).toEqual(["p1"]);
    expect(diff.current.get("c1")).toBe("NEW");
  });

  it("does not report a lost strength as resolved", () => {
    const diff = diffIterations([finding("p1", "visual-hierarchy", { valence: "like" })], []);
    expect(diff.resolved).toHaveLength(0);
  });

  it("treats the same principle far away on the page as a different issue", () => {
    const diff = diffIterations(
      [finding("p1", "text-contrast", { marker: { x: 0.1, y: 0.1 } })],
      [finding("c1", "text-contrast", { marker: { x: 0.9, y: 0.9 } })],
    );
    expect(diff.current.get("c1")).toBe("NEW");
    expect(diff.resolved).toHaveLength(1);
  });

  it("matches without markers when neither is located", () => {
    const diff = diffIterations(
      [finding("p1", "text-contrast", { marker: null })],
      [finding("c1", "text-contrast", { marker: { x: 0.9, y: 0.9 } })],
    );
    expect(diff.current.get("c1")).toBe("PERSISTING");
  });

  it("does not match across different pages", () => {
    const diff = diffIterations(
      [finding("p1", "text-contrast", { assetOrder: 0 })],
      [finding("c1", "text-contrast", { assetOrder: 1 })],
    );
    expect(diff.current.get("c1")).toBe("NEW");
  });

  it("matches each previous finding at most once", () => {
    const diff = diffIterations(
      [finding("p1", "text-contrast")],
      [finding("c1", "text-contrast"), finding("c2", "text-contrast")],
    );
    const statuses = [diff.current.get("c1"), diff.current.get("c2")].sort();
    expect(statuses).toEqual(["NEW", "PERSISTING"]);
  });

  it("prefers the closest previous finding", () => {
    const diff = diffIterations(
      [
        finding("far", "text-contrast", { marker: { x: 0.2, y: 0.5 } }),
        finding("near", "text-contrast", { marker: { x: 0.5, y: 0.52 } }),
      ],
      [finding("c1", "text-contrast", { marker: { x: 0.5, y: 0.5 } })],
    );
    expect(diff.current.get("c1")).toBe("PERSISTING");
    expect(diff.resolved.map((item) => item.id)).toEqual(["far"]);
  });
});

describe("fromStoredFinding", () => {
  const stored = { id: "f1", principleId: "p1", valence: "DISLIKE" as const, assetId: "a2", markerX: 0.2, markerY: 0.4 };

  it("maps a saved finding, with its page order and marker", async () => {
    const { fromStoredFinding } = await import("@/services/analysis/match-iterations");
    expect(fromStoredFinding(stored, new Map([["a2", 1]]))).toEqual({
      id: "f1",
      principleId: "p1",
      valence: "dislike",
      assetOrder: 1,
      marker: { x: 0.2, y: 0.4 },
    });
  });

  it("uses page 0 and no marker when they are not known", async () => {
    const { fromStoredFinding } = await import("@/services/analysis/match-iterations");
    const result = fromStoredFinding({ ...stored, valence: "LIKE", assetId: null, markerX: null, markerY: 0.4 }, new Map());
    expect(result).toMatchObject({ valence: "like", assetOrder: 0, marker: null });
  });
});
