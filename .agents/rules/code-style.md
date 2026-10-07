---
title: Code Style Rules
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
  - .agents/rules/design-system.md
  - .agents/rules/security.md
  - .agents/rules/analysis-output.md
  - design.md
  - tokens/design-tokens.css
---

# Code Style Rules

This document defines the coding standards for **Vantage AI**.

Every AI agent, developer, and contributor must follow these conventions when writing or modifying code.

Consistency is more important than personal preference.

The goal is to produce a codebase that is:

- Easy to understand
- Easy to review
- Easy to extend
- Easy for AI agents to reason about
- Predictable across the entire repository

---

# Guiding Principles

## Readability Over Cleverness

Write code for the next engineer—not for yourself.

Avoid unnecessarily clever abstractions.

Prefer explicit code over hidden magic.

If a junior developer cannot understand a function after reading it once, simplify it.

---

## Consistency Over Preference

Even if multiple approaches work, use the established project conventions.

Do not introduce new coding patterns without approval.

---

## Composition Over Duplication

Extract reusable logic.

Avoid copy-pasting components or business logic.

If the same logic appears three or more times, consider abstraction.

---

## Small, Focused Files

Each file should have a single responsibility.

Avoid files that become "catch-all" utilities.

---

# Language Standards

Vantage AI uses:

- TypeScript
- React
- Next.js App Router

JavaScript files are not allowed unless explicitly required by tooling.

Always prefer TypeScript.

---

# TypeScript Standards

## Never Use `any`

❌ Avoid:

```ts
const user: any
```

✅ Prefer:

```ts
const user: User
```

or

```ts
const data: unknown
```

then validate.

---

## Prefer Interfaces for Objects

```ts
interface User {
  id: string
  email: string
}
```

Use `type` primarily for:

- unions
- intersections
- utility types
- mapped types

---

## Explicit Return Types

Public functions should always define return types.

Example:

```ts
function calculateTotal(): number
```

Avoid relying on inference for exported functions.

---

## Strict Null Safety

Handle:

- null
- undefined

Never assume values exist.

---

# File Naming

Use:

```
kebab-case
```

Examples:

```
generate-design.ts

project-card.tsx

upload-image.ts
```

Never use:

```
ProjectCardFinal.tsx

newComponent.tsx

TEMP.ts
```

---

# Folder Naming

Folders should also use:

```
kebab-case
```

Example:

```
features/design-generator

features/project-history
```

---

# Component Naming

React components use:

```
PascalCase
```

Example:

```tsx
ProjectCard

SidebarNavigation

ScoreCard
```

Each file exports one primary component.

---

# Function Naming

Functions should describe what they do.

Good:

```ts
generateDesignDocument()

validateProjectInput()

uploadDesignAsset()

verifyFlutterwaveWebhook()
```

Avoid vague names:

```ts
handle()

run()

process()

doThing()
```

---

# Variable Naming

Use meaningful names.

Avoid abbreviations.

Good:

```ts
projectTitle

uploadedImages

generationResult

paymentStatus
```

Avoid:

```ts
x

tmp

res

obj
```

---

# Boolean Naming

Booleans should read naturally.

Good:

```ts
isLoading

hasSubscription

canAnalyze

shouldRetry
```

Avoid:

```ts
loading

subscription

retry
```

---

# Constants

Constants use:

```
UPPER_SNAKE_CASE
```

Example:

```ts
MAX_PROJECTS

DEFAULT_TIMEOUT

FREE_PLAN_LIMIT
```

---

# Imports

Import order:

```ts
// React

// Next.js

// Third-party libraries

// Internal aliases

// Relative imports
```

Example:

```ts
import { Suspense } from "react"

import Link from "next/link"

import { z } from "zod"

import { Button } from "@/components/ui/button"

import "./styles.css"
```

Do not mix import order.

---

# Path Aliases

Use aliases.

Good:

```ts
@/components

@/lib

@/services

@/features
```

Avoid deep relative imports.

❌

```ts
../../../../utils
```

---

# Component Structure

Preferred order:

```tsx
Imports

Types

Constants

Component

Helpers

Export
```

Keep files predictable.

---

# React Standards

Prefer:

Server Components.

Use Client Components only when required.

Client Components must begin with:

```tsx
"use client"
```

Do not add this directive unnecessarily.

---

# Hooks

Rules:

- Call hooks at the top level.
- Never inside loops.
- Never inside conditions.

Custom hooks belong in:

```
hooks/
```

Naming:

```ts
useProject()

useAnalysis()

useSubscription()
```

---

# Props

Prefer explicit interfaces.

Example:

```ts
interface ButtonProps {
  children: React.ReactNode
}
```

Avoid inline prop types.

---

# Styling

Use:

Design Tokens and Variables from `tokens/design-tokens.css`.

Never mix multiple styling systems.

Avoid:

- inline styles
- CSS modules
- styled-components

unless specifically approved.

---

# Design Tokens

The design system's source of truth is `tokens/color-tokens.json` (regenerated into `tokens/design-tokens.css` by `tokens/convert-tokens.js`).

Never hardcode colors.

In JSX, use the Tailwind utilities generated from the token theme. In CSS, SVG, and chart code, use the semantic role variables from `design-tokens.css`.

Good:

```tsx
bg-action hover:bg-action-hover

text-fg-muted

border-line
```

```css
fill: var(--primary-color);
```

Avoid:

```tsx
text-[#3929CE]

hover:bg-[#3022B8]

bg-blue-500
```

Arbitrary color values are never allowed. Tailwind's default palette is removed, so default color classes will not compile.

See `design.md` for the full token and component reference.

---

# Typography

Primary font:

```
Open Sauce Two
```

Fallback:

```
ui-sans-serif

system-ui

sans-serif
```

Never specify font families directly inside components.

Use global typography tokens.

---

# Icons

Use:

Lucide React

Do not mix icon libraries.

Icons should communicate meaning—not decoration.

---

# Forms

Use:

- React Hook Form
- Zod

Validation must exist on both:

- client
- server

Never trust client validation alone.

---

# Error Handling

Never ignore errors.

Avoid:

```ts
catch {}
```

Always:

- log
- recover
- return useful messages

---

# Async Code

Prefer:

```
async / await
```

Avoid nested Promise chains.

Good:

```ts
await createProject()

await runDesignAnalysis()
```

---

# Comments

Code should explain itself.

Write comments only when necessary.

Good comments explain:

**Why**

Not:

**What**

Avoid:

```ts
// Increment counter

counter++
```

---

# TODOs

Allowed format:

```ts
TODO(username):

```

Example:

```ts
TODO(divine):

Support collaborative editing.
```

Never leave anonymous TODOs.

---

# Logging

Use structured logging.

Never use:

```ts
console.log()
```

in production code.

Use the project's logging utility.

---

# API Responses

Success:

```json
{
  "success": true,
  "data": {}
}
```

Failure:

```json
{
  "success": false,
  "error": {
    "code": "",
    "message": ""
  }
}
```

Every API should follow this structure.

---

# Accessibility

Every interactive element must support:

- keyboard navigation
- focus states
- screen readers

Accessibility is part of the Definition of Done.

---

# Performance

Avoid:

- unnecessary re-renders
- duplicate requests
- unnecessary client components

Memoize only when profiling shows a benefit.

---

# Testing Mindset

Before considering a feature complete, ask:

- Does it compile?
- Is it typed?
- Is it accessible?
- Is it responsive?
- Is it secure?
- Does it follow the design system?
- Does it match AGENTS.md and design.md?
- Can another AI agent understand it?

---

# Code Review Checklist

Before submitting code:

- [ ] TypeScript has no errors.
- [ ] ESLint passes.
- [ ] No `any` types.
- [ ] No unused imports.
- [ ] No dead code.
- [ ] No duplicated logic.
- [ ] Uses design tokens.
- [ ] Uses Open Sauce Two typography tokens.
- [ ] Accessible.
- [ ] Responsive.
- [ ] Secure.
- [ ] Uses server components where possible.
- [ ] Business logic lives outside UI.
- [ ] Validation exists.
- [ ] Error handling exists.
- [ ] Matches architecture rules.

---

# Anti-Patterns

Do **not**:

- Use `any`.
- Hardcode colors.
- Duplicate components.
- Mix styling systems.
- Mix icon libraries.
- Place business logic in React components.
- Create files with multiple responsibilities.
- Leave debugging code in production.
- Ignore TypeScript errors.
- Ignore accessibility requirements.
- Build components that bypass the Design System.

---

# Definition of Clean Code

Clean code in Vantage AI should be:

- Readable
- Predictable
- Typed
- Accessible
- Modular
- Reusable
- Well-structured
- Easy for AI agents to understand
- Easy for humans to maintain

Every line of code should support Vantage AI's mission:

> **Help designers understand what to fix, why it matters, and how to improve it, with clear principle-based feedback every time.**