---
title: Accessibility Rules
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
  - .agents/rules/design-system.md
  - .agents/rules/architecture.md
  - .agents/rules/testing.md
---

# Accessibility Rules

This document defines the accessibility standards for **Vantage AI**.

Vantage AI targets **WCAG 2.1 AA**.

Vantage AI critiques designs for accessibility. Its own interface must model the standard it teaches.

Accessibility is part of the **Definition of Done** for every feature.

---

# Core Principles

## Accessibility Is Not Optional

Every feature, component, and screen must be accessible. There is no separate "accessible version."

## Accessibility by Design

Design with accessibility from the start, not as a retrofit.

## Never Remove Accessibility for Aesthetics

Visual choices must never conflict with operability or perceivability.

---

# Keyboard Navigation

Every interactive element must be fully operable by keyboard.

- Logical, predictable tab order.
- All interactive elements reachable with `Tab`.
- Menus, dialogs, popovers, and the sidebar drawer open and close with the keyboard.
- Report tabs use arrow-key navigation inside `role="tablist"`.
- Sentiment Map markers are focusable buttons, reachable in reading order.
- `Esc` closes overlays, menus, dialogs, and drawers.

Never remove `:focus-visible` styling.

---

# Focus Indicators

Use the tokens defined in `design.md`:

- Inputs and the composer: `focus:border-accent focus:ring-2 focus:ring-focus`.
- Everything else: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`.

The `ring-focus` ring alone is too faint to meet non-text contrast in either theme. Always pair it with the `border-accent` border.

---

# Focus Management

- When a dialog opens, focus moves into it.
- When a dialog closes, focus returns to the trigger.
- When analysis completes, focus moves to the report heading.
- Activating a Sentiment Map marker moves focus to its finding. A "Back to map" control returns focus to the marker.
- Route changes update the document title.

---

# Semantic HTML

- Use `<button>` for actions and `<a>` for navigation.
- Use `<nav>`, `<main>`, `<header>`, `<aside>`, and `<section>` landmarks.
- Use one `<h1>` per page. Card titles are `<h2>`.
- Do not fake controls with `<div>` and click handlers.
- Use `aria-label` only when the accessible name is not visible.

---

# Forms

- Every input has a visible, associated label.
- Errors identify the field, explain how to fix it, and are announced.
- Placeholder text is never the label.
- `autocomplete` is used where appropriate.

---

# Color & Contrast

- Text meets 4.5:1 for body and 3:1 for large text.
- `primary-300` is decorative only. White on it is 3.44:1.
- Like and Dislike markers, severity badges, and score bars carry an icon or text in addition to color.
- Use design tokens for all colors.

---

# Uploaded Designs & Sentiment Maps

The uploaded design is an image that assistive technology cannot read.

- The design preview has alt text built from the session title and page name.
- Every Sentiment Map marker has an accessible name, for example "Dislike: low contrast on primary button. Accessibility."
- The findings list below the map is a complete text equivalent of the markers.
- The "View Maps" toggle uses `role="switch"`.

---

# Scores & Charts

- Every chart shows numeric values as text.
- Every chart has a visually hidden table or list equivalent.
- Progress bars use `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`, or are decorative next to a text value.

---

# AI Interactions

- Analysis progress stages are announced through a polite live region.
- Streaming assistant replies are announced once when complete, not on every token.
- Suggested prompt chips are buttons reachable by keyboard.
- The typing indicator has an accessible label such as "Assistant is typing".

---

# Motion

Respect `prefers-reduced-motion`:

- Disable transforms such as the drawer slide, chevron nudge, and dialog scale.
- Keep opacity fades short.
- Replace the bouncing typing dots and pulsing skeletons with static states.

---

# Touch Targets

Interactive elements have a minimum target of **44×44px**, including Sentiment Map markers and icon buttons.

---

# Responsive Accessibility

- Text resizing up to 200% must not break layout.
- Content reflows at 320px width without horizontal scrolling, except inside the zoomable design preview.
- The sidebar drawer traps focus while open and releases it on close.

---

# Testing

Check every feature for keyboard-only operation, screen reader announcements, focus management, color contrast, and reduced-motion behavior.

See `.agents/rules/testing.md`.

---

# Accessibility Checklist

- [ ] Usable by keyboard only.
- [ ] Visible focus indicators present.
- [ ] Semantic HTML used.
- [ ] Forms have visible, associated labels.
- [ ] Errors announced and actionable.
- [ ] Contrast meets WCAG AA.
- [ ] No reliance on color alone.
- [ ] Charts and maps have text equivalents.
- [ ] `prefers-reduced-motion` respected.
- [ ] 44px touch targets.
- [ ] Screen reader flow verified.
- [ ] No focus traps outside modal contexts.

---

# Anti-Patterns

Do **not**:

- Remove focus rings.
- Use color alone to indicate state, score, or severity.
- Fake buttons and links with `<div>`.
- Hide interactive content behind `aria-hidden`.
- Use placeholders as labels.
- Ship animation without reduced-motion support.
- Ship a chart or map without a text equivalent.

---

# Definition of Done

A feature is accessible when every user, whether using a keyboard, screen reader, touch, low vision settings, or reduced motion, can complete the same tasks with equal confidence.

> **A tool that teaches accessibility must be accessible itself.**
