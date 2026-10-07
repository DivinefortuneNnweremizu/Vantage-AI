---
title: Design System Rules
product: Vantage AI
version: 1.0.0
status: Active
owner: Design
last_updated: 2026-10
applies_to: Entire Repository
trigger: always_on
related_files:
  - AGENTS.md
  - design.md
  - .agents/rules/code-style.md
  - .agents/rules/accessibility.md
  - tokens/color-tokens.json
  - tokens/design-tokens.css
  - tokens/convert-tokens.js
---

# Design System Rules

The full design system lives in `design.md` at the repository root.

Read `design.md` before building or changing any UI.

This rule file holds the non-negotiables that every agent must apply, including in code that only touches presentation indirectly, such as charts, emails, and generated images.

---

# Source of Truth

| What | Where |
|---------|---------|
| Visual rules, component patterns, usage | `design.md` |
| Token values | `tokens/color-tokens.json` |
| Compiled Tailwind theme and role variables | `tokens/design-tokens.css` (generated) |
| Compiler | `tokens/convert-tokens.js` |

Change a token by editing `tokens/color-tokens.json`, then run:

```bash
node tokens/convert-tokens.js
```

Never edit `tokens/design-tokens.css` by hand.

---

# Setup

`app/globals.css` must start with:

```css
@import "tailwindcss";
@import "../tokens/design-tokens.css";
```

Follow it with the body and `.cv01` base styles from the Typography section of `design.md`.

Load Open Sauce Two at weights 400, 500, and 600 only.

---

# Brand Primary

The brand primary is **#3929CE** (`primary-500`).

| State | Utility | Light | Dark |
|---------|---------|---------|---------|
| Default fill | `bg-action` | `primary-500` | `primary-500` |
| Hover | `hover:bg-action-hover` | `primary-600` | `primary-400` |
| Pressed | `active:bg-action-pressed` | `primary-700` | `primary-600` |
| Accent text, toggle on, focus outline | `text-accent`, `bg-accent`, `outline-accent` | `primary-500` | `primary-300` |
| Selected / active background | `bg-selected` | `primary-50` | #262254 |
| Selected border | `border-selected-line` | `primary-75` | `primary-400` |
| Focus ring | `ring-focus` | `primary-50` | #2A246E |
| Count badge | `bg-primary-400` | `primary-400` | `primary-400` |

`primary-300` is decorative only in light mode, and is the accent text color in dark mode.

---

# Non-Negotiables

- Never hardcode a hex, rgb, or hsl color in components. Use token utilities or role variables.
- Never use arbitrary color utilities such as `bg-[#3929CE]`.
- Never use Tailwind's default palette. It is removed from the theme.
- Use only three font weights: 400, 500, 600.
- Use only one shadow, `shadow-xs`. Elevation comes from borders.
- Cards use `bg-surface` with a `border-line` border and `rounded-xl` corners.
- Use one primary button per view hierarchy.
- Every interactive element has a visible focus state: `outline-accent`, or `ring-focus` paired with `border-accent` on inputs.
- Use theme-aware utilities (`bg-surface`, `text-fg`, `border-line`) for anything that changes between themes. Never `bg-white` or `text-grey-*` in components.
- Status color is never the only signal. Pair it with an icon or text.
- Support light, dark, and system themes through `data-theme` on `<html>`. Components never branch on theme in JavaScript.
- Use Lucide React icons only.

---

# When Something Is Missing

If a needed token or pattern is not in `design.md`:

1. Check whether an existing token or pattern can serve the need.
2. If not, add the token to `tokens/color-tokens.json` and document the pattern in `design.md` in the same change.
3. Never introduce a one-off style inside a component.
