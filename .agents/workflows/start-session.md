---
title: Start Session Workflow
product: Vantage AI
version: 1.0.0
status: Active
owner: Engineering
applies_to: New Session composer, session creation
related_files:
  - AGENTS.md
  - design.md
  - .agents/skills/design-analysis-pipeline/skill.md
  - .agents/skills/api-route-scaffolder/skill.md
---

# Start Session Workflow

Follow these steps exactly when building or changing the New Session flow.

## Goal

A designer lands on New Session, adds a design, states a goal, picks scope and platform, and starts an analysis.

## Steps

1. **Render the greeting and composer** from `components/session/composer.tsx`, following the Composer section of `design.md`.
2. **Collect inputs.** At least one asset is required: an upload, a PDF, a Figma link, or a URL. The goal is optional but encouraged. Scope is `SINGLE_PAGE` or `JOURNEY`. Platform is `APP` or `WEB`.
3. **Upload files directly to storage.**
   - Request `POST /api/uploads/sign` with file name, type, and size.
   - The route checks ownership, type, size, and entitlements, then returns a signed URL.
   - The browser uploads straight to the private Supabase bucket.
   - Call `POST /api/uploads` to confirm. The server verifies the object exists and creates an `Asset`.
4. **Import links.** Figma links go to `POST /api/imports/figma`. Website URLs go to `POST /api/imports/url`. Both pass the SSRF guard first.
5. **Create the session.** `POST /api/sessions` validates with Zod, creates a `DesignSession` owned by the signed-in user, and attaches the assets in order.
6. **Start the analysis.** Hand off to `.agents/workflows/run-analysis.md`.
7. **Update the sidebar and library.** The new session appears under Previous Sessions and in the Design Library.

## Rules

- Never trust a client-supplied user id. Derive it from the session.
- Never lose uploaded assets if a later step fails.
- Disable the submit button until at least one asset is present, and say why when it is disabled.
- Announce upload progress and errors in a live region.
- Every state has a design: empty, uploading, error, ready.

## Done when

- A signed-in user can create a session with an asset and see it in the sidebar and library.
- Tests cover validation, ownership, and failed uploads.
