import { describe, expect, it } from "vitest";

import { analysisSystemPrompt, chatSystemPrompt } from "@/services/ai/prompts";
import type { ChatInput } from "@/services/ai/provider";

const report: ChatInput["report"] = {
  title: "Flowboard",
  goal: null,
  overall: 70,
  scores: { intuitive: 70, trusted: 70, valuable: 70 },
  strengths: [],
  painPoints: [],
  overallTakeaway: "",
  findings: [],
  recommendations: [],
};

describe("assistant instructions", () => {
  const prompt = chatSystemPrompt(report);

  it("asks for the fix as concrete changes, not just an explanation", () => {
    expect(prompt).toContain("Always say what to do");
    expect(prompt).toContain("darker shade");
    expect(prompt).toContain("Never stop at explaining the problem");
  });

  it("asks for a designer-style critique for broad questions, with close-ups of the design", () => {
    expect(prompt).toContain("what already works");
    expect(prompt).toContain("numbered improvements");
    expect(prompt).toContain("[image: N]");
    expect(prompt).toContain("Start with");
    expect(prompt).toContain("Never cite a standard or law by name");
  });

  it("asks for everyday words and names the jargon to avoid", () => {
    expect(prompt).toContain("everyday design words");
    for (const term of ["WCAG", "success criterion", "contrast ratio"]) {
      expect(prompt).toContain(term);
    }
    expect(prompt).toContain("hard to read");
  });

  it("gives safe grey values it can quote, and tells it not to guess other colours", () => {
    expect(prompt).toContain("#595959");
    expect(prompt).toContain("#767676");
    expect(prompt).toContain("do not guess a colour");
  });

  it("still keeps the assistant to this report, in plain text", () => {
    expect(prompt).toContain("Answer only about this report");
    expect(prompt).toContain("no HTML and no Markdown symbols");
  });
});

describe("report instructions", () => {
  const prompt = analysisSystemPrompt("WEB");

  it("asks for recommendations that say exactly what to change, in everyday words", () => {
    expect(prompt).toContain("exactly what to change in everyday words");
    expect(prompt).toContain("darker shade");
    expect(prompt).toContain('Never just say "improve the contrast"');
  });

  it("keeps jargon out of the sentences and in the principle", () => {
    expect(prompt).toContain("avoid jargon");
    expect(prompt).toContain("belongs in the principle");
  });

  it("shares the same colour guidance as the assistant", () => {
    expect(prompt).toContain("#595959");
    expect(prompt).toContain("#767676");
  });
});
