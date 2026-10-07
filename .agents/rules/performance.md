---
title: Performance Rules
product: Vantage AI
version: 1.0.0
status: Active
owner: Engineering
last_updated: 2026-10
applies_to: Entire Repository
trigger: always_on
related_files:
  - AGENTS.md
  - design.md
  - .agents/rules/architecture.md
  - .agents/rules/code-style.md
---

# Performance Rules

This document defines the performance standards for **Vantage AI**.

Designers come to Vantage AI for fast feedback. A slow analysis breaks the moment of curiosity that brought them here.

Performance is part of the Definition of Done.

---

# Performance Budgets

| Operation | Target |
|---------|---------|
| Library and session load | < 2 seconds |
| Upload acknowledgement | < 1 second |
| Single Page analysis | < 30 seconds |
| Multiple Page Journey analysis | < 60 seconds |
| Assistant first token | < 3 seconds |
| Re-render of a stored report | < 500 milliseconds |

If an implementation risks exceeding a budget, rethink the approach before shipping.

---

# Web Vitals

Optimize for:

- Largest Contentful Paint (LCP)
- Interaction to Next Paint (INP)
- Cumulative Layout Shift (CLS)

Reserve space for the design preview, score cards, and library thumbnails so content does not shift.

---

# Server-First Rendering

- Default to React Server Components.
- Keep client bundles small. The report shell, library grid, and settings render on the server.
- Client Components are limited to the composer, tabs, Sentiment Map, toggles, dialogs, and assistant chat.

---

# Uploads & Images

- Upload directly from the browser to Supabase Storage with signed upload URLs. Do not proxy file bytes through route handlers.
- Downscale images server-side to the resolution the model needs before analysis.
- Generate a WebP thumbnail for the Design Library at upload time.
- Render PDF pages and Figma frames to images once and cache them by asset ID.
- Serve previews through `next/image` with explicit sizes.

---

# Analysis Performance

- Run independent analysis stages in parallel where the provider allows.
- Stream stage progress to the client (Server-Sent Events or streaming responses).
- Show partial results (for example Key Takeaways) as soon as they validate.
- For Multiple Page Journeys, analyze pages concurrently with a concurrency limit, then run one cross-page pass.
- Time out and fail gracefully with a retry action rather than hanging.

---

# Assistant Performance

- Stream replies token by token.
- Send the report summary and relevant findings as context, not the full raw model output.
- Cap conversation history sent to the model and summarize older turns.

---

# Data Loading

- Avoid N+1 queries. Load a report with its findings and recommendations in one query.
- Paginate the Design Library with cursor-based pagination.
- Select only the fields a view displays.

---

# Caching

Cache:

- Static assets and fonts
- The principle library
- Rendered thumbnails and PDF page images

Never cache:

- Authentication state
- Payment verification
- Another user's data

Stored reports are immutable, so their rendered views can be cached per user.

---

# Bundling & Assets

- Dynamically import the chart library and the Sentiment Map.
- Load Open Sauce Two weights 400, 500, and 600 only, with `font-display: swap`, and preload the 400 weight.
- Import Lucide icons individually.

---

# Client Performance

- Memoize only when profiling shows a benefit.
- Debounce library search.
- Never block the main thread while placing many Sentiment Map markers. Render markers as absolutely positioned buttons, not canvas redraws, so they stay accessible.

---

# Measuring

- Track analysis duration per stage in logs and analytics.
- Track Web Vitals in production.
- Profile before optimizing.

---

# Performance Checklist

- [ ] Meets the operation budgets.
- [ ] No N+1 queries.
- [ ] Analysis progress is streamed.
- [ ] Uploads go directly to storage.
- [ ] Images are downscaled and thumbnailed.
- [ ] Server Components used where possible.
- [ ] No avoidable layout shift.
- [ ] Heavy client modules are lazy-loaded.

---

# Anti-Patterns

Do **not**:

- Proxy large uploads through the app server.
- Send full-resolution images to the model when a smaller size suffices.
- Re-call the AI to display a stored report.
- Block the UI while analysis runs.
- Optimize without measuring.

---

# Definition of Good Performance

- Uploads feel instant.
- Analysis shows steady, meaningful progress.
- Stored reports open immediately.
- The assistant starts answering within seconds.

> **Fast feedback keeps designers curious.**
