---
title: Naming Rules
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
  - .agents/rules/architecture.md
---

# Naming Rules

This document consolidates naming conventions for **Vantage AI**.

Names should be predictable, self-describing, and consistent across the repository.

When this file and `code-style.md` overlap, this file is the reference for naming conventions.

---

# Files & Folders

Use:

```
kebab-case
```

Examples:

```
generate-design.ts
project-card.tsx
upload-image.ts
features/design-generator
```

Never use:

```
ProjectCardFinal.tsx
newComponent.tsx
TEMP.ts
```

---

# React Components

Component names use:

```
PascalCase
```

Examples:

```
ProjectCard
SidebarNavigation
ScoreCard
```

Each file exports one primary component.

Files are named in kebab-case (`project-card.tsx`), even though the component is `ProjectCard`.

---

# Hooks

Custom hooks:

- Begin with `use`.
- Use `camelCase` for the hook name.
- Live in `hooks/`.

Examples:

```
useProject()
useAnalysis()
useSubscription()
```

File names: `use-project.ts`, `use-generation.ts`.

---

# Functions

Function names describe what they do.

Good:

```
generateDesignDocument()
validateProjectInput()
uploadDesignAsset()
verifyFlutterwaveWebhook()
```

Avoid:

```
handle()
run()
process()
doThing()
```

---

# Variables

Use meaningful, descriptive names.

Good:

```
projectTitle
uploadedImages
generationResult
paymentStatus
```

Avoid:

```
x
tmp
res
obj
```

---

# Booleans

Booleans read naturally:

Good:

```
isLoading
hasSubscription
canAnalyze
shouldRetry
```

Avoid:

```
loading
subscription
retry
```

---

# Constants

Use:

```
UPPER_SNAKE_CASE
```

Examples:

```
MAX_PROJECTS
DEFAULT_TIMEOUT
FREE_PLAN_LIMIT
```

---

# Types & Interfaces

- `interface` for object shapes.
- `type` for unions, intersections, utility types, and mapped types.
- Type names use `PascalCase`.
- Props interfaces end in `Props` where conventional.

Examples:

```
interface User
interface ButtonProps
type PlanTier = "free" | "vantage_pro"
```

---

# Enums & Union Values

- Enum members and union literal values use `SCREAMING_SNAKE_CASE` or `lowercase` consistently with the schema—never mix.

---

# CSS & Design Tokens

- Token names come from `tokens/color-tokens.json`.
- Tailwind utilities use the theme-aware names (`bg-surface`, `text-fg-muted`, `bg-action`). Scale names (`bg-primary-400`) are only for colors that never change between themes.
- CSS uses the role variables (`--primary-color`, `--border-color`).
- Never invent token names—edit the token source first.

---

# Database

- Prisma models use `PascalCase` (e.g., `Project`, `Subscription`).
- Fields use `camelCase` (e.g., `createdAt`, `paymentReference`).
- Enum values use `SCREAMING_SNAKE_CASE` or the casing chosen in the Prisma schema—stay consistent.
- Migration folders use Prisma's timestamped name with a descriptive suffix (e.g., `20260728113000_add_projects`).

---

# API Routes

- Routes use kebab-case and REST nouns, not verbs.

Good:

```
/api/projects
/api/design/generate
/api/billing/subscription
```

Avoid:

```
/api/getProjects
/api/newDesign
/api/paymentStuff
```

---

# Environment Variables

Use a clear `UPPER_SNAKE_CASE` prefix:

```
SUPABASE_URL
FLW_SECRET_KEY
AI_PROVIDER_API_KEY
FIGMA_CLIENT_SECRET
DATABASE_URL
```

---

# Workflows & Files

- Workflow documents use kebab-case (`create-project.md`).
- Skill directories use kebab-case (`api-route-scaffolder`).
- Rule documents use kebab-case (`code-style.md`).

---

# Git

- Commit messages are concise and describe the change.
- Branch names use kebab-case with a short prefix (e.g., `feat/sentiment-map`).

---

# Naming Anti-Patterns

Do **not**:

- Mix `camelCase`, `PascalCase`, and `snake_case` in the same category.
- Name files after their date or status (`final`, `v2`, `_old`).
- Use vague names (`stuff`, `data`, `info`).
- Abbreviate without reason (`btn`, `cfg`, `utils`).
- Invent token names not in the design system.

---

# Definition of Good Naming

A name is good when another engineer or AI agent can predict its meaning without reading its implementation.

> **Names are documentation.**
