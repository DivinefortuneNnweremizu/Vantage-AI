---
title: Run Analysis Workflow
product: Vantage AI
version: 1.0.0
status: Active
owner: Engineering
applies_to: Analysis pipeline, progress streaming, report persistence
related_files:
  - AGENTS.md
  - .agents/rules/ai-behavior.md
  - .agents/rules/analysis-output.md
  - .agents/skills/design-analysis-pipeline/skill.md
---

# Run Analysis Workflow

Follow these steps exactly when building or changing the analysis run.

## Goal

Turn the assets and goal of a session into a validated, immutable Design Analysis Report, and show meaningful progress while it runs.

## Steps

1. **Receive the request** at `POST /api/sessions/[sessionId]/analyses`. Validate with Zod. Confirm the signed-in user owns the session.
2. **Check entitlements** with `getEntitlements(userId)`. Stop with a clear upgrade message if a limit is reached.
3. **Create the `Analysis`** with status `QUEUED`, the next `iteration` number, and the scope, platform, and goal copied from the session.
4. **Open the progress stream** (Server-Sent Events). Move the analysis to `RUNNING`.
5. **Prepare assets.** Downscale images, render PDF pages, export Figma frames, capture URLs. Never fetch a URL that fails the SSRF guard.
6. **Assemble context.** Goal, scope, platform, principle library, and a short summary of the previous iteration if there is one. Wrap any text taken from designs or URLs in a delimited data block.
7. **Run deterministic checks** for contrast, target size, and resolution.
8. **Call the provider** through `services/ai/`. In development and tests the provider is `mock`.
9. **Validate the output** against the report schema. On failure, retry once with the validation error. On a second failure, mark the analysis `FAILED` and keep the assets.
10. **Compute scores** with the rubric. The model never writes score numbers.
11. **Match iterations** against the previous report and label findings `NEW`, `PERSISTING`, or `RESOLVED`.
12. **Persist the report** in one `prisma.$transaction`: analysis scores, takeaways, findings, recommendations, suggested prompts, and the session's latest analysis pointer.
13. **Send the final event** so the client can show Key Takeaways.

## Progress stages

Emit these in order: reading, hierarchy, accessibility, interaction, scoring, sentiment, recommendations. Use the labels in `.agents/rules/ai-behavior.md`.

## Rules

- A completed analysis is immutable.
- Never render an unvalidated model response.
- Never log image contents, extracted text, or prompts that contain user content.
- A failed run never changes the session's previous latest report.

## Done when

- A mocked analysis streams all stages and stores a valid report.
- Tests cover schema rejection, retry, scoring, and the failure path.
