---
title: Analysis Output Rules
product: Vantage AI
version: 1.0.0
status: Active
owner: Engineering
last_updated: 2026-10
applies_to: Design Analysis Reports, Assistant replies, report rendering
trigger: always_on
related_files:
  - AGENTS.md
  - design.md
  - .agents/rules/ai-behavior.md
  - .agents/rules/security.md
  - .agents/skills/design-analysis-pipeline/skill.md
---

# Analysis Output Rules

This document defines the structure, validation, and rendering of the **Design Analysis Report**, the primary artifact of Vantage AI.

In the Design.md Generator this role belonged to `markdown.md`. Here the artifact is a structured report, so the rules govern a typed schema instead of a Markdown template.

---

# Core Principles

- The report is structured data first, rendered UI second.
- Every element in the report traces back to a validated finding.
- Scores are computed by code from findings, never typed by the model.
- The report is stored, versioned, and re-renderable without calling the AI again.

---

# Report Structure

Every report contains these sections, matching the report tabs:

1. **Metadata**: session ID, iteration number, page scope (Single Page or Multiple Page Journey), platform (App or Web), user goal, analyzed asset IDs, model and rubric versions, created timestamp.
2. **Key Takeaways**, as designed in Figma: the **Goal** the user set, a numbered list of **Strengths**, a numbered list of **Pain Points**, and one **Overall takeaway** paragraph. Strengths and pain points come from the likes and dislikes. The overall takeaway names the strongest and weakest areas and the first fix.
3. **UX Score**: overall score plus Intuitive, Trusted, and Valuable, each with its rubric breakdown and contributing findings.
4. **Sentiment Map**: Likes and Dislikes, each a finding with an optional marker.
5. **Findings**: the full list, grouped by category.
6. **Recommendations**: ordered fixes linked to findings.
7. **Assumptions & Limitations**: anything the AI could not see or had to infer.

Do not add sections outside this structure without updating this document and the schema.

---

# Finding Schema

| Field | Type | Notes |
|---------|---------|---------|
| `id` | string | Stable within the report |
| `assetId` | string | Which uploaded page it refers to |
| `valence` | `"like"` \| `"dislike"` | Drives the Sentiment Map |
| `severity` | `"critical"` \| `"major"` \| `"minor"` \| `"strength"` | Drives badge tone |
| `category` | enum | From the principle library categories |
| `principleId` | string | Must exist in the principle library |
| `title` | string | 3–8 words |
| `observation` | string | What is on the design |
| `impact` | string | Why it matters to the end user |
| `confidence` | `"high"` \| `"medium"` \| `"low"` | Low confidence is shown as a label |
| `marker` | `{ x, y }` or null | Normalized 0–1 coordinates |

# Recommendation Schema

| Field | Type | Notes |
|---------|---------|---------|
| `id` | string | Stable within the report |
| `rank` | number | 1 is highest impact |
| `title` | string | Imperative, 3–10 words |
| `change` | string | The concrete change to make |
| `rationale` | string | Principle-based reason |
| `findingIds` | string[] | At least one |
| `principleId` | string | Must exist in the principle library |

Define both schemas once in Zod (`features/analysis/schemas.ts`) and derive TypeScript types from them.

---

# Text Rules

All human-readable text in a report:

- Uses plain language first and the principle name second.
- Is one idea per sentence.
- Avoids hedging filler ("it might be worth considering").
- Never contains HTML.
- May contain minimal Markdown (bold, italic, lists, inline code) and nothing else.

---

# Validation

Before storing a report:

- Parse model output with Zod. Reject on failure and retry once with the validation error.
- Reject findings with unknown `principleId` or `category`.
- Reject markers outside 0–1.
- Reject recommendations with no linked findings.
- Strip any HTML and `javascript:` URLs from text fields.
- Compute scores from the rubric after validation.

---

# Rendering

- Render text fields with a sanitizing Markdown renderer limited to the allowed syntax.
- Never use `dangerouslySetInnerHTML` on report text.
- Render from stored data. Never re-call the AI to display an existing report.
- Follow the component patterns in `design.md` for score cards, the Sentiment Map, recommendation lists, and badges.

---

# Versioning

- Each analysis run creates a new immutable report version.
- Re-analysis compares the new report with the previous version by `principleId`, `category`, and approximate marker location.
- Store `rubricVersion` and `principleLibraryVersion` so old reports stay explainable after the rubric changes.

---

# Export

When report export is built:

- Export from stored data only.
- Include metadata, version, and export timestamp.
- Never include other users' data, secrets, or storage URLs that grant access.

---

# Anti-Patterns

Do **not**:

- Store unvalidated model output.
- Let the model write final score numbers.
- Render raw HTML from the model.
- Add report sections that are not in the schema.
- Mutate a stored report version.

---

# Definition of Done

A report is complete when it:

- Validates against the schema.
- Links every recommendation to findings and every finding to a principle.
- Shows scores with their breakdown.
- Renders safely from stored data.
- Reads like a critique a senior designer would stand behind.
