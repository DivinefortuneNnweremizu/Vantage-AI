import { describe, expect, it } from "vitest";

import type { ReportInput } from "@/features/analysis/schemas";
import { ReportValidationError, sanitizeText, validateReport } from "@/services/analysis/validate-report";

const context = { assetCount: 1, platform: "WEB" as const };

function validReport(): ReportInput {
  return {
    strengths: ["The heading is clear."],
    painPoints: ["Secondary text is hard to read."],
    overallTakeaway: "A solid design with one readability problem.",
    findings: [
      {
        id: "f1",
        assetIndex: 0,
        valence: "like",
        severity: "strength",
        principleId: "visual-hierarchy",
        title: "Clear hierarchy",
        observation: "The heading is the largest element.",
        impact: "Users see the main message first.",
        confidence: "high",
        marker: { x: 0.4, y: 0.2 },
      },
      {
        id: "f2",
        assetIndex: 0,
        valence: "dislike",
        severity: "major",
        principleId: "text-contrast",
        title: "Low contrast",
        observation: "Captions are pale grey on white.",
        impact: "Low-vision users may miss them.",
        confidence: "medium",
        marker: null,
      },
    ],
    recommendations: [
      {
        rank: 1,
        title: "Darken captions",
        change: "Use a 4.5:1 contrast ratio.",
        rationale: "WCAG 1.4.3.",
        principleId: "text-contrast",
        findingIds: ["f2"],
      },
    ],
    suggestedPrompts: ["What should I fix first?"],
  };
}

function expectInvalid(mutate: (report: ReportInput) => void, ctx = context): ReportValidationError {
  const report = validReport();
  mutate(report);
  try {
    validateReport(report, ctx);
  } catch (error) {
    expect(error).toBeInstanceOf(ReportValidationError);
    return error as ReportValidationError;
  }
  throw new Error("Expected validation to fail.");
}

describe("validateReport", () => {
  it("accepts a valid report and fills category and standard from the library", () => {
    const result = validateReport(validReport(), context);
    expect(result.findings).toHaveLength(2);
    const contrast = result.findings.find((finding) => finding.id === "f2");
    expect(contrast?.category).toBe("Accessibility");
    expect(contrast?.standard).toContain("WCAG");
  });

  it("rejects output that is not an object", () => {
    expect(() => validateReport("nope", context)).toThrow(ReportValidationError);
    expect(() => validateReport(null, context)).toThrow(ReportValidationError);
  });

  it("rejects an unknown principle", () => {
    const error = expectInvalid((report) => {
      report.findings[0]!.principleId = "invented-law";
    });
    expect(error.issues.join(" ")).toContain("unknown principle");
  });

  it("rejects a marker outside the image", () => {
    expectInvalid((report) => {
      report.findings[0]!.marker = { x: 1.4, y: 0.5 };
    });
  });

  it("rejects a finding that points at a missing image", () => {
    const error = expectInvalid((report) => {
      report.findings[0]!.assetIndex = 3;
    });
    expect(error.issues.join(" ")).toContain("does not exist");
  });

  it("rejects a like that is not a strength, and a dislike that is", () => {
    expectInvalid((report) => {
      report.findings[0]!.severity = "major";
    });
    expectInvalid((report) => {
      report.findings[1]!.severity = "strength";
    });
  });

  it("rejects a recommendation that links to a missing finding", () => {
    const error = expectInvalid((report) => {
      report.recommendations[0]!.findingIds = ["ghost"];
    });
    expect(error.issues.join(" ")).toContain("unknown findings");
  });

  it("rejects duplicate finding ids and duplicate ranks", () => {
    expectInvalid((report) => {
      report.findings[1]!.id = "f1";
    });
    expectInvalid((report) => {
      report.recommendations.push({ ...report.recommendations[0]!, findingIds: ["f2"] });
    });
  });

  it("rejects a principle that does not apply to the platform", () => {
    // thumb-reach only applies to App.
    expectInvalid((report) => {
      report.findings[1]!.principleId = "thumb-reach";
    });
    const app = validReport();
    app.findings[1]!.principleId = "thumb-reach";
    app.recommendations[0]!.principleId = "thumb-reach";
    expect(() => validateReport(app, { assetCount: 1, platform: "APP" })).not.toThrow();
  });

  it("strips HTML and script links from text", () => {
    const report = validReport();
    report.findings[0]!.observation = 'Nice <script>alert(1)</script> <img src=x onerror=alert(1)> heading';
    report.overallTakeaway = "Click javascript:alert(1) now";
    const result = validateReport(report, context);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toMatch(/<script|<img|onerror=|javascript:/i);
  });

  it("rejects a finding whose text is only markup", () => {
    expectInvalid((report) => {
      report.findings[0]!.title = "<b></b>";
    });
  });

  it("sorts recommendations by rank", () => {
    const report = validReport();
    report.recommendations.unshift({
      rank: 2,
      title: "Second",
      change: "Do a thing.",
      rationale: "Because.",
      principleId: "text-contrast",
      findingIds: ["f2"],
    });
    expect(validateReport(report, context).recommendations.map((item) => item.rank)).toEqual([1, 2]);
  });
});

describe("sanitizeText", () => {
  it("collapses whitespace and removes control characters", () => {
    expect(sanitizeText("  a \n\n b\u0000\t c  ")).toBe("a b c");
  });
});
