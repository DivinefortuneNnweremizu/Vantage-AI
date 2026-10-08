# AGENTS.md — Vantage AI

This file is the entry point for every AI coding agent working on the Vantage AI codebase.

Read this file first.

Before making any code changes:

1. Read this file completely.
2. Read `design.md` (the design system).
3. Load every rule in `.agents/rules/`.
4. Load the relevant skill(s) from `.agents/skills/`.
5. If a workflow exists for the task, follow it from beginning to end.
6. If documentation conflicts, this file is authoritative for implementation decisions, and `design.md` is authoritative for visual decisions.

---

# What Vantage AI Is

Vantage AI is an AI-powered design critique platform.

It gives designers senior-level, principle-based feedback on demand.

Designers upload mock-ups, paste Figma links, or attach PDFs, describe their goal, and receive a structured **Design Analysis Report** that explains what works, what does not, why, and how to fix it.

The primary output of this product is the **Design Analysis Report**.

The platform is **not**:

- a design tool
- a Figma competitor
- a UI generator
- a code generator
- a portfolio or social platform
- a place for subjective "looks good" feedback

Every feature should improve the quality, clarity, or actionability of design feedback.

If it does not help a designer improve their design, it does not belong in this product.

---

# The Problem We Are Solving

From the product case study:

- **Echo chamber.** Designers share work on Dribbble or X and mostly get subjective praise. Validation is loud and improvement is quiet.
- **Non-actionable feedback.** Most feedback is based on taste, not principles, so designers do not know what to fix.
- **Limited access to experts.** Senior designers are expensive and scarce.
- **Mental overload.** Designers try to remember Fitts's Law, accessibility rules, spacing systems, and more, all at once.

Designers lack feedback and structured thinking. Vantage AI provides both.

The product rests on three pillars:

- **Knowledge Transfer**
- **Guidance**
- **Best Practices**

---

# Who We Are Building For

Primary users:

- Growing and junior Product Designers
- UX/UI Designers
- Freelance and solo designers without a design lead
- Design students and career switchers

Secondary users:

- Senior designers who want a fast second opinion
- Founders and PMs reviewing design work

Users want clear, principle-based reasons and concrete fixes, not scores without explanation.

---

# Product Philosophy

The AI teaches design thinking.

It does not replace the designer's judgment.

Always prefer:

- principles over taste
- actionable over descriptive
- explanation over verdict
- prioritized over exhaustive
- honesty about uncertainty over false confidence

Every finding should be something a senior designer would be comfortable saying out loud in a critique.

---

# Core Features

These five features come from the case study and portfolio mock-ups. They are the MVP scope.

## 1. Upload and Prompt

- Upload mock-ups (images), paste Figma links or URLs, or attach PDFs.
- Describe the goal of the design in a prompt.
- Choose **Single Page** or **Multiple Page Journey**.
- Choose **App** (mobile) or **Web**.

## 2. Design Analysis Report

A report with tabs:

- **Key Takeaways** — summary of the most important findings.
- **UX Score** — a Design Quality Score made of three dimensions: Intuitive, Trusted, Valuable.
- **Sentiment** (Sentiment Map) — likes and dislikes mapped directly onto the design, plus findings grouped by principle (for example Visual Hierarchy, Feedback and Interaction, Accessibility, Mobile Responsiveness).
- **Recommendations** — see below.
- **Assistant** — see below.

The report highlights usability and accessibility issues directly on the design.

## 3. Smart Recommendations

Structured, prioritized fixes that move the designer from seeing problems to fixing them.

## 4. AI Assistive Partner

A chat assistant scoped to the current analysis. Users ask questions like "Why is this a problem?" or "How can I improve accessibility?" and get tailored answers.

## 5. Structured Workspace and Design Library

- A sidebar with New Session, Design Library, and Previous Sessions.
- A Design Library grid of past and ongoing analyses as visual cards.
- Users can revisit, re-analyze, and track progress across iterations.

---

# Tech Stack

The stack is inherited from the Design.md Generator project for consistency across the maintainer's products.

## Frontend

- Next.js 15 (App Router)
- React
- TypeScript
- Tailwind CSS v4 (theme from `tokens/design-tokens.css`)
- Lucide React
- React Hook Form + Zod

## Backend

- Next.js Route Handlers
- Server Actions

## Database

- PostgreSQL
- Prisma ORM

## Authentication

- Supabase Authentication

## AI

- Provider accessed only through the AI Service Layer (`services/ai/`).
- Provider: DeepSeek. The integration is planned and not yet built.
- The analysis model must support image input.
- Until the integration lands, develop and test against a mocked provider that returns schema-valid reports.

Responsibilities:

- Design understanding from images, PDFs, and Figma links
- Heuristic and principle-based evaluation
- UX scoring
- Sentiment Map marker placement
- Recommendation generation
- Assistant chat grounded in the current analysis

## Storage

- Supabase Storage for uploaded designs, rendered PDF pages, and Figma frame exports.

## Figma

Two ways in, both supported:

- **Paste a link.** Import frames from a Figma link the server can read.
- **Connect an account.** Figma OAuth for private files, with read-only file scope and encrypted tokens.

Both paths use the Figma REST API to export frames as images.

## Payments

- Flutterwave for the VantagePro subscription.

## Email

- Resend

## Analytics

- PostHog

## Error Monitoring

- Sentry

## Deployment

- Vercel

## Package Manager

- pnpm

---

# Project Structure

```text
Vantage AI/
│
├── AGENTS.md                             (this file)
├── design.md                             (design system — visual source of truth)
│
├── .agents/
│   ├── rules/                            (always-on rules)
│   │   ├── architecture.md
│   │   ├── code-style.md
│   │   ├── design-system.md
│   │   ├── security.md
│   │   ├── accessibility.md
│   │   ├── ai-behavior.md
│   │   ├── analysis-output.md
│   │   ├── performance.md
│   │   ├── testing.md
│   │   └── naming.md
│   │
│   ├── skills/                           (load only when relevant)
│   │   ├── component-builder-skill/
│   │   ├── api-route-scaffolder/
│   │   ├── db-migration-runner/
│   │   ├── design-analysis-pipeline/
│   │   └── flutterwave-integration/
│   │
│   └── workflows/                        (planned)
│       ├── start-session.md
│       ├── upload-design.md
│       ├── import-figma-frame.md
│       ├── run-analysis.md
│       ├── ask-assistant.md
│       ├── re-analyze-iteration.md
│       ├── upgrade-plan.md
│       └── payment-webhook.md
│
├── tokens/                               (design tokens — source of truth)
│   ├── color-tokens.json                 (edit tokens here)
│   ├── design-tokens.css                 (auto-generated)
│   └── convert-tokens.js                 (regenerator)
│
├── app/
├── components/
├── features/
├── services/
├── lib/
├── hooks/
├── prisma/
├── types/
├── public/
├── tests/
├── docs/
└── package.json
```

---

# How to Use These Files

## Rules

Everything inside `.agents/rules/` is always active.

Load every rule before beginning work. Never override them unless the maintainer explicitly instructs it.

## Design System

`design.md` defines colors, typography, spacing, radius, elevation, motion, and component patterns.

Token values live in `tokens/`:

- Edit tokens in `tokens/color-tokens.json`.
- Regenerate `tokens/design-tokens.css` with `node tokens/convert-tokens.js`.
- Never edit `tokens/design-tokens.css` directly.

All UI must use design tokens. Never hardcode colors, spacing, type sizes, or radii.

## Skills

Load a skill when the task matches it. Skills describe how to build a specific kind of thing.

## Workflows

Workflows are implementation recipes. Follow them exactly once they exist.

---

# Build Status

| Area | Status |
|---------|---------|
| Screens from the Figma file, light and dark | Built |
| Upload images, Single Page and Journey | Built |
| Analysis pipeline, scoring, Sentiment Map, recommendations, assistant | Built against the demo provider |
| Iteration comparison | Built |
| Real AI (DeepSeek) | **Not connected.** Demo provider only, clearly labeled, refused in production |
| Supabase sign-in and storage | Written, **not yet tested** against a real project |
| Website URL, Figma link, and PDF input | **Not built.** The composer says so when a link is pasted |
| Plans, checkout, and limits | **Not built.** Entitlements are placeholders in `features/billing/plans.ts` |

See `README.md` for how to run it and `docs/implementation-plan.md` for what is next.

---

# Core User Flows

## First Analysis

New Session (choose Single Page or Journey, App or Web, add images)

↓

Upload Images (preview, Replace, delete, add pages for a journey)

↓

My Goal (what do you want to learn and test, optional)

↓

Fetching your insights... (staged progress)

↓

Design Analysis Report (opens on Sentiment)

↓

Explore Recommendations, Key Takeaways, UX Score

↓

Ask the Assistant

↓

Saved to Design Library

---

## Iterate on a Design

Open from Design Library or Previous Sessions

↓

Upload revised design

↓

Re-analyze

↓

Compare scores and resolved findings with the previous iteration

---

## Upgrade

Hit a Free plan limit or click "Upgrade to VantagePro"

↓

Plan dialog

↓

Flutterwave checkout

↓

Server-side verification and webhook

↓

VantagePro features unlocked

---

# AI Operating Principles

The AI must:

- Ground every finding in a named design principle or guideline.
- Point to where on the design the issue occurs whenever possible.
- Explain why it matters and how to fix it.
- Never invent elements that are not in the uploaded design.
- Never fabricate research, metrics, or user data.
- Clearly label low-confidence findings.
- Prioritize findings by impact.
- Stay within the scope of design critique.

See `.agents/rules/ai-behavior.md`.

---

# Subscription & Billing

Two plans appear in the mock-ups: **Free** and **VantagePro**.

The exact limits are not yet defined (see Open Questions). Until they are, build entitlements behind a single `plans` configuration so limits can change without code changes.

## Billing Rules

- Flutterwave is the canonical payment provider.
- Business logic never depends directly on the Flutterwave SDK.
- Payment processing is abstracted behind a payment service.
- Always verify webhook signatures.
- Never trust client-side payment status.
- Never expose secret keys.

---

# Non-Negotiables

1. The primary artifact is the Design Analysis Report.
2. Every finding is principle-based and actionable.
3. Never invent design elements or fabricate data.
4. Uploaded designs are private to their owner.
5. Users own their uploads and reports.
6. Never silently discard uploaded files.
7. Preserve session and iteration history.
8. Scores always show what they are made of.
9. The AI explains uncertainty instead of guessing.
10. Never generate production UI code for the user's design unless explicitly requested.

---

# Performance Standards

| Operation | Target |
|---------|---------|
| Library and session load | < 2 seconds |
| Single Page analysis | < 30 seconds |
| Multiple Page Journey analysis | < 60 seconds |
| Assistant first token | < 3 seconds |
| Upload acknowledgement | < 1 second |

---

# Security Rules

- Store secrets in environment variables.
- Keep uploaded designs in private storage buckets.
- Never expose API keys.
- Verify every payment webhook.
- Restrict sessions and uploads to their owners.
- Treat uploaded designs as confidential, including client work under NDA.

See `.agents/rules/security.md`.

---

# Success Metrics

Optimize for:

- First analysis completion rate
- Time to first report
- Recommendations viewed per report
- Assistant questions per session
- Return sessions (re-analysis of an iteration)
- Upgrade conversion
- User-rated usefulness of findings

When implementation options are equal, choose the one that improves these metrics.

---

# Open Questions

Items marked **Open** are not decided. Do not build around a guess. Ask the maintainer.

1. **Plan limits. Open.** The maintainer will define what Free includes versus VantagePro.
2. **Vision model. Decided.** DeepSeek will power analysis. The integration is coming soon. Build everything behind `services/ai/` so the pipeline works with a mocked provider until then.
3. **Scoring method. Decided.** Scores are calculated against established design standards: Jakob Nielsen's usability heuristics, Jakob's Law and the other Laws of UX, Gestalt principles, WCAG 2.1 AA, and platform guidelines. See the Scoring Standards section in `.agents/rules/ai-behavior.md`.
4. **Figma access. Decided.** Support both: pasting a Figma link, and connecting a Figma account with OAuth for private files.
5. **Dark mode. Decided and tokenized.** Dark tokens were translated from the maintainer's Figma file and live in `tokens/color-tokens.json` under `color.dark`. Components use theme-aware utilities so they switch automatically. See the Dark Mode section of `design.md`.
6. **Sentiment Map. Decided.** The Figma tab called "Valency" is renamed **Sentiment Map** (tab label "Sentiment"). It is the emotional-reaction map: smile and frown markers on the design, plus findings by principle. The internal enum stays `Valence`.
