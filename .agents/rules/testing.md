---
title: Testing Rules
product: Vantage AI
version: 1.0.0
status: Active
owner: Engineering
last_updated: 2026-10
applies_to: Entire Repository
trigger: always_on
related_files:
  - AGENTS.md
  - .agents/rules/architecture.md
  - .agents/rules/security.md
  - .agents/rules/performance.md
  - .agents/rules/accessibility.md
  - .agents/rules/analysis-output.md
---

# Testing Rules

This document defines the testing standards for **Vantage AI**.

Testing is part of every task. A feature is not complete until it is tested.

---

# Testing Philosophy

- Tests protect the trustworthiness of analysis reports.
- Tests protect users' private designs and their payments.
- Prefer small, focused tests over brittle end-to-end suites.
- Every test is deterministic.
- Use the runner and commands defined in `package.json`.

---

# Test Pyramid

1. **Unit tests**: the majority. Services, schemas, scoring rubric, principle library, utilities.
2. **Integration tests**: route handlers, database operations, the analysis pipeline with a mocked provider.
3. **End-to-end tests**: critical flows only.

---

# What to Test

Priority order:

1. Security: auth, ownership checks, upload validation, URL import SSRF protection, webhooks, sanitization.
2. Analysis pipeline: input validation, prompt assembly, output validation, scoring.
3. Payment and subscription flows.
4. Data integrity and migrations.
5. Core UI flows: new session, upload, report tabs, assistant, library.
6. Accessibility.

---

# Scoring & Rubric Tests

The scoring rubric is pure code and must be fully unit-tested:

- Known findings produce known scores.
- Scores stay within 0–100.
- Changing a finding's severity changes the score in the documented direction.
- Rubric version is stamped on every computed score.

---

# AI Testing

AI output is non-deterministic. Test the contract, not the prose.

- Validate fixtures against the report schema.
- Reject unknown principles and categories.
- Reject out-of-range markers.
- Reject recommendations without linked findings.
- Assert that instructions embedded in uploaded text are ignored (prompt-injection fixtures).
- Mock the provider and test pipeline logic deterministically.
- Keep a small, versioned set of reference designs with expected findings for manual evaluation when the prompt or model changes.

---

# Upload & Import Tests

- Accept PNG, JPG, WebP, and PDF within size limits.
- Reject executables, SVG with scripts, and mismatched MIME types.
- Reject private-network and non-https URLs.
- Handle Figma API errors and expired tokens gracefully.

---

# API & Route Handler Tests

- Correct HTTP status codes.
- Consistent `success`/`data` and `success`/`error` response shape.
- Authentication and ownership enforcement.
- Input validation rejection.
- Rate limiting on analysis, assistant, and uploads.

---

# Database Tests

Test against a test database, never production.

- Migrations apply cleanly.
- Relationships and constraints hold.
- Report versions are immutable.
- Soft-delete behavior works.

---

# Payment Testing

Before shipping payment code, verify:

- Successful payment
- Failed payment
- Duplicate webhook
- Invalid webhook signature
- Cancelled payment
- Upgrade to VantagePro
- Renewal
- Expiration and downgrade

See `.agents/skills/flutterwave-integration/skill.md`.

---

# Frontend Testing

- Test components in isolation for rendering, interaction, and accessibility.
- Test loading, empty, error, and success states.
- Test that components use token utilities. A lint rule should reject arbitrary color values such as `bg-[#...]`.
- Prefer user-facing assertions over implementation details.

---

# Accessibility Testing

- Automated axe checks on every page.
- Keyboard-only walkthrough of the composer, report tabs, Sentiment Map, and assistant.
- Screen reader check of analysis progress announcements.
- Contrast and reduced-motion checks.

---

# Test Data

- Use factories and fixtures.
- Never use real user designs in tests. Use synthetic or licensed sample designs.
- Never include secrets in fixtures.

---

# CI & Quality Gates

- Lint and type check run before tests.
- Tests run in CI before merge.
- A failing test blocks shipping.

---

# Testing Anti-Patterns

Do **not**:

- Skip tests to save time.
- Assert on exact AI prose.
- Depend on live AI, Figma, or payment providers in automated tests.
- Test against the production database.
- Commit failing tests.

---

# Testing Checklist

- [ ] Unit tests cover services, schemas, and the rubric.
- [ ] Routes enforce auth, ownership, validation, and status codes.
- [ ] Analysis contract tested with a mocked provider.
- [ ] Prompt-injection fixtures pass.
- [ ] Upload and URL import validation tested.
- [ ] Payment flows tested.
- [ ] Component states tested.
- [ ] Accessibility checks pass.
- [ ] Type check and lint pass.
- [ ] CI green.

> **Untested code is unshipped code.**
