---
title: Architecture Rules
product: Vantage AI
version: 1.0.0
status: Active
owner: Engineering
last_updated: 2026-10
applies_to: Entire Repository
trigger: always_on
related_files:
  - AGENTS.md
  - .agents/rules/code-style.md
  - .agents/rules/security.md
  - .agents/rules/design-system.md
  - .agents/rules/analysis-output.md
  - design.md
---

# Architecture Rules

This document defines the architectural standards for **Vantage AI**.

Every AI agent working within this repository **must** follow these rules when creating, modifying, or refactoring code.

These rules exist to ensure that the codebase remains scalable, maintainable, secure, and consistent as the product grows.

Architecture decisions are not suggestions—they are the default implementation strategy unless explicitly overridden by the maintainer.

---

# Product Overview

Vantage AI is an AI-powered design critique platform that gives designers senior-level, principle-based feedback on demand.

Designers upload mock-ups, Figma links, URLs, or PDFs, describe their goal, and Vantage AI produces a Design Analysis Report with Key Takeaways, a UX Score, Sentiment Maps, prioritized Recommendations, and an AI Assistant grounded in that analysis.

Everything in the application exists to support this core workflow.

---

# Architectural Principles

Every architectural decision should support these principles.

## 1. Simplicity Before Cleverness

Prefer straightforward solutions over complex abstractions.

Code should be easy to understand by both humans and AI agents.

Avoid unnecessary patterns, premature optimization, and over-engineering.

---

## 2. Server First

Vantage AI is built using the Next.js App Router.

Default to **React Server Components (RSC)** whenever possible.

Only use Client Components when browser-only functionality is required.

Examples include:

- User interactions
- File uploads
- Drag-and-drop
- Browser APIs
- Local component state
- Animations

Everything else should remain server-rendered.

---

## 3. AI Is a Service Layer

AI should never be tightly coupled to the user interface.

Instead:

```
UI
    ↓
Server Action / API Route
    ↓
AI Service
    ↓
Provider (vision-capable model)
```

If AI providers change in the future, the UI should remain unaffected.

---

## 4. Business Logic Lives on the Server

Never place business logic inside React components.

React components should only:

- display information
- collect user input
- trigger actions

Business rules belong inside:

- Server Actions
- Route Handlers
- Service Layer

---

## 5. Composition Over Duplication

Prefer composing reusable modules instead of copying logic.

If similar code exists more than twice, extract it.

---

# High-Level Architecture

```
                    User
                      │
                      ▼
              Next.js Frontend
                      │
      ┌───────────────┼───────────────┐
      ▼                               ▼
React Server Components         Client Components
      │                               │
      └───────────────┬───────────────┘
                      ▼
          Server Actions / Route Handlers
       │
       ┌───────────────┼────────────────┐
       ▼               ▼                ▼
  Authentication   AI Services     Database Layer
(Supabase Auth)  (AI provider API)  (Prisma ORM)
       │
       ▼
PostgreSQL Database
```

---

# Technology Stack

## Frontend

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS (consuming design tokens from `tokens/design-tokens.css`)
- Lucide React
- React Hook Form
- Zod

---

## Backend

- Next.js Route Handlers
- Next.js Server Actions

---

## Database

- PostgreSQL

---

## ORM

- Prisma

---

## Authentication

- Supabase Auth

---

## Storage

- Supabase Storage

Used for:

- uploaded design images
- PDF uploads and their rendered pages
- Figma frame exports
- report thumbnails for the Design Library

---

## Payments

Flutterwave is the **only** supported payment provider during MVP.

Never introduce Paystack.

Never introduce Stripe unless the maintainer explicitly approves it.

All payment logic must be abstracted behind a Payment Service Layer.

---

## AI

Default provider:

- DeepSeek (inherited from the Design.md Generator), subject to confirming image input support

The analysis pipeline requires a vision-capable model.

Future providers should be swappable without changing business logic.

---

## Deployment

- Vercel

---

# Folder Structure

```
app/
components/
components/ui/
features/
lib/
services/
hooks/
prisma/
types/
public/
```

Server Actions live in `features/*/actions/` or `services/`—never inside components.

Never place business logic inside `components/`.

---

# Feature-Based Organization

Application features should remain isolated.

Example:

```
features/

authentication/

projects/

sessions/

billing/

analysis/

assistant/

library/

settings/
```

Each feature owns:

- components
- hooks
- services
- validation
- types

Avoid large shared folders with unrelated code.

---

# Service Layer

Every external integration belongs inside `/services`.

Examples:

```
services/

ai/

flutterwave/

storage/

email/

analytics/
```

UI should never communicate directly with external APIs.

---

# Database Layer

Only Prisma should communicate with PostgreSQL.

Never write raw SQL unless:

- performance requires it
- Prisma cannot support the operation

Raw SQL must be documented.

---

# Authentication Architecture

Authentication responsibilities belong entirely to Supabase.

Responsibilities include:

- Sign up
- Sign in
- Password reset
- Session management
- OAuth
- User identity

Business logic should trust authenticated user IDs only after server-side verification.

---

# Authorization

Authentication answers:

> Who is the user?

Authorization answers:

> What can the user do?

Never rely on client-side authorization.

Authorization checks must happen on the server.

---

# File Upload Architecture

Uploads follow this flow:

```
Client

↓

Validation

↓

Supabase Storage

↓

Metadata saved in PostgreSQL

↓

Referenced inside Projects
```

Never store uploaded files inside the repository.

---

# AI Generation Pipeline

Every AI request follows this lifecycle.

```
User Input

↓

Validation

↓

Context Assembly

↓

Prompt Construction

↓

Vision Model Request

↓

Response Validation

↓

Report Schema Validation

↓

Project Storage

↓

User Delivery
```

Never skip validation.

---

# State Management

Use local state whenever possible.

Priority:

1. Server Components
2. URL state
3. React state
4. Context
5. External state libraries (only when necessary)

Avoid unnecessary global state.

---

# API Design

Route handlers should follow REST conventions.

Example:

```
GET

POST

PATCH

DELETE
```

Responses should use consistent JSON structures.

Example:

```json
{
  "success": true,
  "data": {}
}
```

Errors:

```json
{
  "success": false,
  "error": {
    "message": "",
    "code": ""
  }
}
```

---

# Validation

Never trust user input.

Validate:

- forms
- uploads
- query parameters
- request bodies
- AI outputs

Use Zod as the validation library.

---

# Error Handling

Errors should be:

- predictable
- recoverable
- logged
- user-friendly

Never expose:

- stack traces
- SQL errors
- secrets
- provider errors

Users should receive actionable messages.

Developers should receive detailed logs.

---

# Logging

Log:

- AI generations
- payment events
- authentication events
- analyses
- assistant conversations
- uploads
- critical errors

Do not log:

- passwords
- tokens
- secrets
- payment credentials

---

# Caching Strategy

Cache:

- static assets
- templates
- documentation
- reusable metadata

Never cache:

- user-specific AI generations
- authentication state
- payment verification

---

# Performance Principles

Optimize for:

- First Contentful Paint
- Time to Interactive
- AI generation responsiveness
- Report rendering speed
- Upload responsiveness
- Fast navigation

Prefer streaming where appropriate.

---

# Accessibility

Architecture should support WCAG 2.1 AA.

Accessibility is not a UI concern alone.

It influences:

- routing
- forms
- keyboard navigation
- focus management
- semantic HTML
- error handling

Every feature must preserve accessibility.

---

# Security Boundaries

Client

- Display data
- Collect input

Server

- Validate
- Authenticate
- Authorize
- Process payments
- Call AI providers
- Access the database

Never expose privileged logic to the browser.

---

# Versioning

Prefer extending existing services rather than replacing them.

Avoid breaking changes.

Deprecate before removing.

---

# Scalability

Every feature should assume future support for:

- Teams
- Organizations
- Collaboration
- Version history
- AI provider abstraction
- Report sharing and export
- Design system-aware critique
- Plugin ecosystem

Avoid architectural decisions that prevent future expansion.

---

# Decision Checklist

Before introducing new architecture, ask:

- Does this simplify the codebase?
- Can another AI agent understand this quickly?
- Is it reusable?
- Does it follow feature boundaries?
- Is business logic server-side?
- Does it protect user data?
- Does it align with AGENTS.md and the case study scope?
- Does it align with the Design System?
- Does it preserve accessibility?
- Does it support future growth?

If the answer to any question is **No**, reconsider the implementation.

---

# Architecture Anti-Patterns

Do **not**:

- Put business logic inside React components.
- Couple UI directly to AI providers.
- Couple payment logic directly to Flutterwave SDK calls.
- Duplicate validation logic.
- Store secrets in code.
- Mix unrelated features in the same folder.
- Build overly generic abstractions before they are needed.
- Introduce new architectural patterns without documenting them.
- Create feature-specific exceptions to these rules.

---

# Definition of Good Architecture

Good architecture in Vantage AI should be:

- Predictable
- Modular
- Secure
- Accessible
- Testable
- AI-friendly
- Easy to understand
- Easy to extend
- Easy to maintain

Every architectural decision should move the product closer to one goal:

> **Help designers understand what to fix, why it matters, and how to improve it, with clear principle-based feedback every time.**