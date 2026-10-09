---
title: Component Builder Skill
product: Vantage AI
version: 1.0.0
status: Active
owner: Engineering
applies_to:
  - UI Components
  - React Components
  - Design System
  - Frontend Development
related_files:
  - AGENTS.md
  - design.md
  - .agents/rules/design-system.md
  - .agents/rules/code-style.md
  - .agents/rules/accessibility.md
---

# Component Builder Skill

This skill teaches AI agents how to build UI components for **Vantage AI**.

Every component must feel calm, light, and precise. It follows the design system in `design.md`, which is extracted from the Ollio Telehealth reference product with the brand primary changed to **#3929CE**.

The objective is **consistency over creativity**. Compose interfaces from shared primitives instead of creating one-off components.

---

# Core Philosophy

Every component should be:

- Simple
- Accessible
- Reusable
- Predictable
- Responsive
- Type-safe
- Token-driven

A component is complete only when it is production-ready.

---

# Visual Language

From the reference product:

- `bg-surface` cards on a `bg-canvas` page, in both themes.
- 1px `border-line` borders instead of shadows.
- `rounded-xl` cards, `rounded-lg` buttons, `rounded-md` inputs and tabs, `rounded-full` avatars and icon buttons.
- Circular `bg-subtle` containers around 20–24px icons.
- Open Sauce Two at 400, 500, and 600, with the `cv01` class on headings and labels.
- Primary color only for actions, selection, focus, and attention.

Avoid decorative UI. Every visual element must have a purpose.

---

# Before You Build

1. Read `design.md`.
2. Check `components/ui/` for an existing primitive.
3. Extend an existing primitive with a variant before creating a new component.
4. If a new token or pattern is needed, add it to `tokens/color-tokens.json` and `design.md` first.

---

# Preferred Stack

- React
- TypeScript
- Tailwind CSS v4 with the token theme
- Lucide React icons
- `class-variance-authority` for variants and `tailwind-merge` for class merging

---

# Directory Structure

```text
components/
├── ui/
│   ├── button.tsx
│   ├── icon-button.tsx
│   ├── input.tsx
│   ├── textarea.tsx
│   ├── label.tsx
│   ├── badge.tsx
│   ├── card.tsx
│   ├── tabs.tsx
│   ├── segmented-control.tsx
│   ├── toggle.tsx
│   ├── avatar.tsx
│   ├── dialog.tsx
│   ├── popover.tsx
│   ├── side-sheet.tsx
│   ├── progress-bar.tsx
│   ├── skeleton.tsx
│   └── divider.tsx
│
├── layout/
│   ├── app-shell.tsx
│   ├── sidebar.tsx
│   ├── sidebar-nav-item.tsx
│   ├── header.tsx
│   └── mobile-menu-button.tsx
│
├── session/
│   ├── composer.tsx
│   ├── asset-thumbnail.tsx
│   ├── analysis-progress.tsx
│   └── previous-sessions-list.tsx
│
├── report/
│   ├── report-tabs.tsx
│   ├── key-takeaways.tsx
│   ├── score-card.tsx
│   ├── score-dimension-card.tsx
│   ├── score-chart.tsx
│   ├── sentiment-map.tsx
│   ├── sentiment-marker.tsx
│   ├── finding-item.tsx
│   ├── recommendation-list.tsx
│   └── recommendation-item.tsx
│
├── assistant/
│   ├── assistant-panel.tsx
│   ├── message-bubble.tsx
│   ├── typing-indicator.tsx
│   ├── suggested-prompts.tsx
│   └── assistant-input.tsx
│
└── library/
    ├── library-grid.tsx
    └── library-card.tsx
```

File names use kebab-case. Component names use PascalCase.

---

# Token Usage

Use Tailwind scale utilities in JSX. Use role variables in CSS and SVG.

Good:

```tsx
<button className="bg-action text-on-action hover:bg-action-hover active:bg-action-pressed" />
<div className="rounded-xl border border-line bg-surface" />
<p className="text-sm text-fg-muted" />
```

```tsx
<circle fill="var(--primary-color)" />
```

Never:

```tsx
<button className="bg-[#3929CE] hover:bg-[#3022B8]" />
<div style={{ background: "#ffffff" }} />
<p className="text-gray-600" />   {/* Tailwind default palette is removed */}
```

---

# Primitive Recipes

Copy these exactly. They are defined in `design.md`.

## Button

```ts
const buttonBase =
  "cv01 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold " +
  "whitespace-nowrap transition-colors cursor-pointer disabled:cursor-default disabled:opacity-60 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const buttonVariants = {
  primary: "bg-action text-on-action hover:bg-action-hover active:bg-action-pressed",
  secondary: "border border-line-strong bg-surface text-fg-heading hover:bg-hover",
  destructive: "bg-error-500 text-white hover:bg-error-700",
};

const buttonSizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "",
  lg: "px-5 py-2.5 text-base",
};
```

Loading buttons show an inline spinner, set `aria-busy="true"`, and are disabled to prevent duplicate submissions.

## Input

```ts
const inputBase =
  "w-full rounded-md border border-line-strong bg-surface px-3 py-2.5 text-sm text-fg shadow-xs " +
  "outline-none placeholder:text-fg-subtle focus:border-accent focus:ring-2 focus:ring-focus";

const inputError = "border-error-500 focus:border-error-500 focus:ring-error-bg";
```

## Card

```tsx
<section className="overflow-hidden rounded-xl border border-line bg-surface">
  <div className="flex h-[63px] items-start justify-between px-6 pt-6">
    <h2 className="cv01 text-lg font-semibold">{title}</h2>
    {action}
  </div>
  <div className="h-px bg-line" />
  <div className="px-6 py-6">{children}</div>
</section>
```

## Tab / Segment

```ts
const tabBase = "flex items-center gap-2 rounded-md border p-[11px] text-sm font-medium transition-colors";
const tabSelected = "border-selected-line bg-selected text-fg";
const tabIdle = "border-line-strong bg-subtle text-fg-heading hover:bg-subtle-hover";
```

## Sidebar Nav Item

```ts
const navBase = "flex w-full items-center gap-3 rounded-sm border px-4 py-3 text-sm transition-colors";
const navActive = "border-selected bg-selected font-medium";
const navIdle = "border-transparent hover:bg-hover";
```

## Badge

```ts
const badgeSizes = {
  sm: "inline-flex items-center gap-0.5 rounded-badge px-1 text-xs font-medium",
  md: "inline-flex items-center gap-0.5 rounded-xl px-3 py-0.5 text-sm font-medium",
};
const badgeTones = {
  success: "bg-success-bg text-success-fg",
  warning: "bg-warning-bg text-warning-fg",
  error: "bg-error-bg text-error-fg",
  info: "bg-info-bg text-info-fg",
  neutral: "bg-subtle text-fg-heading",
};
```

## Toggle

```ts
const toggleTrack = "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const toggleOn = "bg-accent";
const toggleOff = "bg-line-strong";
```

---

# Product Components

## Composer

- Greeting `h1` in `cv01 text-2xl font-semibold text-fg-strong`.
- Composer card with attachments, prompt input, Single Page / Multiple Page Journey segment, App / Web segment, and a primary submit icon button.
- Drag-and-drop zone covers the whole card and announces drop results.

## Analysis Progress

- Ordered list of stages with a status icon for each: pending, active, done.
- Wrapped in `aria-live="polite"`.
- Never a lone spinner.

## Score Card and Dimensions

- Overall score uses the stat-card pattern.
- Three dimension cards: Intuitive, Trusted, Valuable, each with label, value, bar, and explanation.
- Chart series: `chart-1` Intuitive, `chart-2` Trusted, `chart-3` Valuable.

## Sentiment Map

- Design image in a `rounded-2xl border border-line bg-canvas` frame.
- Markers are absolutely positioned `<button>` elements, 44px hit area, using normalized coordinates.
- Like markers use `bg-success-600` with a smile icon. Dislike markers use `bg-error-500` with a frown icon.
- "View Maps" toggle and Likes / Dislikes segmented filter above the findings list.

## Recommendation Item

- Rank number, title, change, rationale, principle badge, and an "Ask the assistant" ghost action.

## Assistant Panel

- Message bubbles: assistant on `bg-subtle`, user on `bg-selected`.
- Typing indicator with three bouncing dots and an accessible label.
- Suggested prompt chips and the input pinned to the bottom.

## Library Card

- One link wrapping thumbnail, avatar, title, and relative time.
- Title hover color `text-accent`.

---

# Props

Use explicit interfaces. Never use `any`.

```ts
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}
```

---

# States

Every component that loads or lists data supports:

- Loading (skeleton matching final shape)
- Empty (teaching message plus one primary action)
- Error (human-readable, with a retry)
- Success

---

# Responsive Design

Design mobile-first using `sm`, `md`, `lg`, and `xl` from `design.md`. No desktop-only components.

---

# Accessibility

Follow `.agents/rules/accessibility.md`. In particular:

- Visible focus on every interactive element.
- Sentiment Map markers and charts have text equivalents.
- Dialogs trap and return focus.
- 44px touch targets.

---

# Motion

- Color transitions use the 150ms default.
- Drawer, scrim, and dialog transitions use 200ms.
- Only typing dots bounce. Only skeletons pulse.
- Respect `prefers-reduced-motion`.

---

# Testing Checklist

- [ ] Responsive
- [ ] Accessible
- [ ] Type-safe
- [ ] Reusable
- [ ] Uses token utilities only
- [ ] No arbitrary color values
- [ ] Keyboard accessible
- [ ] Loading, empty, and error states handled
- [ ] Matches `design.md`
- [ ] Matches `code-style.md`

---

# Anti-Patterns

Never:

- Duplicate an existing primitive
- Hardcode colors, spacing, radii, or font sizes
- Add shadows beyond `shadow-xs`
- Use gradients
- Mix icon libraries
- Use inline styles for visual design
- Build components over 200 lines
- Ignore accessibility
- Use `any`

---

# Definition of Done

A UI component is complete when it:

- Solves one clear problem.
- Matches `design.md`.
- Works across supported screen sizes.
- Is fully typed and accessible.
- Can be reused elsewhere without modification.
- Passes linting and type checking.
