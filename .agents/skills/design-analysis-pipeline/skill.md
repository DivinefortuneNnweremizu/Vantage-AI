---
title: Design Analysis Pipeline Skill
product: Vantage AI
version: 1.0.0
status: Active
owner: Engineering
applies_to:
  - Upload and Prompt
  - Figma and URL import
  - Design analysis
  - Scoring
  - Sentiment Mapping
  - Recommendations
  - AI Assistant
related_files:
  - AGENTS.md
  - .agents/rules/ai-behavior.md
  - .agents/rules/analysis-output.md
  - .agents/rules/architecture.md
  - .agents/rules/security.md
  - .agents/rules/performance.md
---

# Design Analysis Pipeline Skill

This skill teaches AI agents how to build the core of **Vantage AI**: turning an uploaded design and a goal into a validated Design Analysis Report.

Load this skill for any work on uploads, imports, analysis, scoring, the Sentiment Map, recommendations, or the assistant.

---

# Pipeline Overview

```text
Composer submit
    ↓
Validate request (Zod)
    ↓
Authenticate + check ownership + check plan entitlements
    ↓
Create Analysis record (status: queued)
    ↓
Prepare assets
    images → downscale
    PDF → render pages to images
    Figma link → export frames via Figma API
    URL → server-side capture with SSRF protection
    ↓
Assemble context
    goal, page scope, platform, principle library, previous iteration summary
    ↓
Vision model call(s)   ← stage progress streamed to client
    ↓
Validate output against report schema
    ↓
Compute scores from rubric (code, not model)
    ↓
Persist findings, recommendations, scores (immutable version)
    ↓
Mark Analysis complete → client renders Key Takeaways
```

Each step lives in `services/analysis/`. Route handlers only orchestrate.

---

# Inputs

| Input | Source | Notes |
|---------|---------|---------|
| Assets | Upload, Figma link, URL | PNG, JPG, WebP, PDF. At least one required |
| Goal | Composer prompt | Optional but strongly encouraged |
| Page scope | Segmented control | `single_page` or `journey` |
| Platform | Segmented control | `app` (mobile) or `web` |
| Previous analysis | Session history | Present only on re-analysis |

Journeys keep page order. Users can reorder before submitting.

---

# Stages

Emit a progress event at the start of each stage. Labels come from `.agents/rules/ai-behavior.md`.

| Stage key | Label |
|---------|---------|
| `reading` | Reading your design... |
| `hierarchy` | Checking visual hierarchy... |
| `accessibility` | Measuring contrast and accessibility... |
| `interaction` | Reviewing interaction feedback... |
| `scoring` | Scoring Intuitive, Trusted and Valuable... |
| `sentiment` | Mapping likes and dislikes... |
| `recommendations` | Writing recommendations... |

Stages can run in parallel internally, but events are shown in this order.

---

# Prompt Assembly

- System prompt: role (senior design lead), output schema, principle library IDs, rules from `ai-behavior.md`.
- User content: goal, scope, platform, and the images.
- Wrap any text extracted from the design or a URL in a clearly delimited data block and tell the model it is untrusted content, never instructions.
- Never include secrets, user emails, or payment data.

Keep prompts in `services/ai/prompts/` as versioned templates. Record the template version on the analysis.

---

# Deterministic Checks

Run measurable checks in code where possible and pass results to the model as facts:

- Text contrast ratios, when text color pairs can be detected
- Touch target sizes, when bounding boxes are available
- Image resolution adequacy

Code-measured findings carry `confidence: "high"`.

---

# Scoring Rubric

- Lives in `services/analysis/scoring/` as pure functions.
- Input: validated findings. Output: overall score and the Intuitive, Trusted, and Valuable dimensions with breakdowns.
- Each finding carries the design standard it came from: Nielsen heuristics, Jakob's Law and the other Laws of UX, Gestalt, WCAG 2.1 AA, or platform guidelines.
- Each standard maps to one or more dimensions with documented weights. The mapping is in the Scoring Standards section of `.agents/rules/ai-behavior.md`.
- Severity weights: critical > major > minor. Strengths add back within a cap.
- Each dimension starts at 100 and loses points per weighted finding, floored at 0.
- The overall score is the average of the three dimensions unless the maintainer sets other weights.
- Stamp `rubricVersion` on every result.

Keep the weights in one config file so they can be tuned without touching the pipeline.

---

# Sentiment Map Markers

- The model returns normalized `{ x, y }` for each locatable finding.
- Validation rejects coordinates outside 0–1.
- Findings without a confident location get `marker: null` and appear only in the list.
- Journeys store markers per asset.

---

# Re-Analysis

When a session already has an analysis:

- Send a compact summary of the previous findings (principle, category, title) as context.
- After validation, match new findings to old ones by principle, category, and nearby marker.
- Label each finding `resolved`, `persisting`, or `new` for the comparison view.
- Never modify the previous report.

---

# Assistant

- Endpoint: `POST /api/sessions/[sessionId]/assistant`, streamed.
- Context: latest report summary, the findings the question references, the last N messages, and the principle library entries cited.
- Suggested prompts are generated from the top three findings at report time and stored.
- Rate-limited and counted against plan entitlements.
- Replies are sanitized Markdown, rendered with the allowed syntax only.

---

# Failure Handling

| Failure | Behavior |
|---------|---------|
| Unreadable image | Stop, explain, ask for a higher-resolution upload |
| Model timeout | Mark failed, keep assets, offer Retry |
| Schema validation fails twice | Mark failed, log raw output server-side only, offer Retry |
| Figma token expired | Ask the user to reconnect Figma |
| URL blocked by SSRF rules | Explain that the URL cannot be fetched |

Never lose uploaded assets on failure.

---

# Logging

Log per analysis: duration per stage, model and prompt versions, token usage, validation retries, and outcome.

Never log image contents, extracted text, or prompts containing user content in plain text.

---

# Checklist

- [ ] Request validated and ownership checked.
- [ ] Entitlements checked before any model call.
- [ ] Assets prepared and downscaled.
- [ ] Untrusted text delimited in the prompt.
- [ ] Progress stages streamed.
- [ ] Output validated against the schema.
- [ ] Scores computed by the rubric.
- [ ] Report stored as an immutable version.
- [ ] Failures leave assets intact with a retry path.
- [ ] Tests with a mocked provider pass.

---

# Definition of Done

The pipeline is complete when a designer can upload a design, state a goal, watch meaningful progress, and receive a validated, principle-based report within the performance budget, with every score explained and every recommendation linked to a finding.
