---
title: Design System Rules
product: Vantage AI
version: 1.0.0
status: Active
owner: Design
last_updated: 2026-10
applies_to: Entire Repository
trigger: always_on
source_reference: Ollio Telehealth (https://telehealth-gules-gamma.vercel.app/)
brand_primary: "#3929CE"
related_files:
  - AGENTS.md
  - .agents/rules/design-system.md
  - .agents/rules/architecture.md
  - .agents/rules/code-style.md
  - .agents/rules/accessibility.md
  - tokens/color-tokens.json
  - tokens/design-tokens.css
  - tokens/convert-tokens.js
---

# Design System Rules

Vantage AI gives designers senior-level, principle-based critique on demand.

Designers upload a mock-up, Figma link, or PDF, state their goal, and receive a structured Design Analysis Report with Key Takeaways, a UX Score, Sentiment Maps, prioritized Recommendations, and an AI Assistant they can question.

The interface should feel like sitting next to a calm, experienced design lead who explains *why* something is a problem and *how* to fix it.

This design system is extracted from the Ollio Telehealth reference product. It keeps that product's neutrals, status colors, typography, spacing, radius, elevation, and component patterns. The only intentional change is the brand primary, which is **#3929CE**. Every primary shade (hover, pressed, container, focus ring, emphasis) is rebuilt from #3929CE using the same lightness and saturation offsets the reference uses for its own primary.

The UI should emphasize:

- Content-first design: the user's design and the critique are the hero
- Minimal visual noise
- Calm, light, bordered surfaces
- Progressive disclosure
- Conversational AI that explains its reasoning in plain language
- Clear, readable typography
- Generous but disciplined whitespace
- Fast perceived performance

---

# Design Principles

## The User's Design Is the Hero

Uploaded designs, annotations, and findings take visual priority.

Chrome, navigation, and controls stay visually secondary until needed.

---

## Feedback Must Be Actionable

Every finding names the principle behind it, explains the impact, and suggests a fix.

Never show a score or label without the reasoning that produced it.

---

## Calm Workspace

Neutral surfaces, thin borders, and almost no shadow.

Primary color is used sparingly so it always means "act here" or "you are here."

---

## Progressive Disclosure

Show the summary first, then let users drill into scores, maps, recommendations, and the assistant.

Advanced options stay hidden until requested.

---

## Trust Is Designed

AI work must always communicate what it is doing and what happens next.

Uncertain findings are labelled as uncertain. Scores show what they are made of.

---

## Consistency Builds Trust

Every screen reuses the same shell, card, list row, badge, and button patterns.

Prefer improving an existing pattern over inventing a new one.

---

# Layout Philosophy

The application uses a **sidebar + workspace** layout, taken directly from the reference product.

```
Sidebar (272px, persistent on desktop, drawer on mobile)
        ↓
Sticky Header (session title, search, upgrade, light/dark icon)
        ↓
Workspace (report tabs, cards, assistant)
```

The analyzed design always sits in the visual center of the report.

Navigation stays quiet: white sidebar, grey text, a single tinted active item.

Large monitors gain whitespace and side-by-side cards, not wider text columns.

---

# Workspace Rules

Prefer:

- Surface cards (`bg-surface`) with a 1px `border-line` border and `rounded-xl` corners
- Card headers separated from content by a 1px divider
- List rows separated by 1px `border-divider` dividers
- Circular icon containers on `bg-subtle`
- Sticky header and sidebar
- Contextual actions inside the card they affect

Avoid:

- Heavy shadows or floating widgets
- Gradients, glassmorphism, neumorphism
- Saturated color fills over large areas
- Decorative illustrations
- Dense dashboards with competing focal points

---

# Color System

Color communicates meaning, not decoration.

Most of the interface uses `bg-surface` panels on a `bg-canvas` page: white on light grey in light mode, #1E1F20 on #131314 in dark mode.

Primary color is reserved for:

- Primary actions (one per view hierarchy)
- Active navigation and selected tabs
- Focus borders, focus rings, and focus outlines
- Unread and attention indicators
- Hover emphasis on interactive list titles
- Toggle "on" state and selected calendar or segmented items
- The leading series in score charts

Status colors communicate system and finding status only.

Never hardcode a hex value in a component. Use tokens.

---

## Primary Scale

Built from **#3929CE**. Each step mirrors the offset the reference product uses between its base primary and that shade.

| Token | Hex | Reference equivalent | Usage |
|---------|---------|---------|---------|
| `primary-50` | `#E9E7FC` | `#FFECE5` | Active nav background and border, selected tab and segment background, focus ring, selected date |
| `primary-75` | `#CBC6F6` | `#FCD2C2` | Selected tab border |
| `primary-300` | `#877CEB` | `#FA9874` | Soft accent bars, secondary chart series, event markers |
| `primary-400` | `#4D3CDF` | `#F56630` | Count badges, icon accents |
| `primary-500` | `#3929CE` | `#EB5017` | **Base.** Primary buttons, focus border and outline, unread dot, link hover text, toggle on |
| `primary-600` | `#3022B8` | `#D4440F` | **Hover** for primary buttons and primary filled elements |
| `primary-700` | `#2A1EA2` | none | **Pressed / active** for primary buttons. Added by continuing the same hover step once more |

Contrast checks:

| Pair | Ratio | Result |
|---------|---------|---------|
| White on `primary-500` | 8.81:1 | AA and AAA |
| White on `primary-600` | 10.26:1 | AA and AAA |
| White on `primary-400` | 6.94:1 | AA |
| `primary-500` text on `grey-50` | 8.43:1 | AA and AAA |
| `grey-900` text on `primary-50` | 14.52:1 | AA and AAA |
| White on `primary-300` | 3.44:1 | **Not for text.** Decorative use only |

---

## Neutral Scale

| Token | Hex | Usage |
|---------|---------|---------|
| `white` | `#FFFFFF` | Cards, sidebar, header, inputs, dialogs |
| `grey-50` | `#F9FAFB` | Page background, search field, row hover |
| `grey-100` | `#F0F2F5` | Icon containers, inactive tabs, icon-button background, subtle dividers |
| `grey-200` | `#E4E7EC` | Card borders, card header dividers, icon-button hover |
| `grey-300` | `#D0D5DD` | Input borders, secondary button borders, toggle off |
| `grey-400` | `#98A2B3` | Disabled text and icons |
| `grey-500` | `#667185` | Placeholder, tertiary text, overlines, "See all" links |
| `grey-600` | `#475367` | Secondary text, labels, metadata |
| `grey-700` | `#344054` | Secondary button text, stat values, emphasized labels |
| `grey-800` | `#1D2739` | Calendar and dense data text |
| `grey-900` | `#101928` | Body text default, overlay base at 40% |
| `black` | `#000000` | Page titles only |

---

## Status Colors

| Token | Hex | Usage |
|---------|---------|---------|
| `success-50` | `#E7F6EC` | Positive badge background |
| `success-600` | `#04802E` | Online dot, positive inline text, "Like" markers |
| `success-700` | `#036B26` | Positive badge text |
| `warning-50` | `#FEF6E7` | Warning badge background |
| `warning-700` | `#865503` | Warning badge text |
| `error-50` | `#FBEAE9` | Error badge background |
| `error-500` | `#CB1A14` | Destructive buttons, field error borders, "Dislike" markers |
| `error-700` | `#9E0A05` | Destructive hover, error badge text |
| `info-50` | `#E3EFFC` | Informational badge background |
| `info-700` | `#04326B` | Informational badge text |

The reference calls the info pair "secondary". Vantage AI names it `info` so it is never confused with a secondary brand color.

---

## Theme-Aware Utilities

Components use **theme-aware utilities**. Each one points to a role variable that changes between light and dark, so components never branch on theme.

Use scale utilities such as `bg-primary-400` or `bg-success-600` only for colors that stay the same in both themes, such as count badges and Like or Dislike markers.

| Utility | Role variable | Light | Dark | Usage |
|---------|---------|---------|---------|---------|
| `bg-canvas` | `--background-color` | `grey-50` #F9FAFB | `night-950` #131314 | Page background, search field |
| `bg-surface` | `--surface-color` | `white` | `night-925` #1E1F20 | Sidebar, header, cards, inputs, dialogs |
| `bg-hover` | `--hover-color` | `grey-50` | `night-875` #28292A | Row and button hover |
| `bg-subtle` | `--surface-subtle-color` | `grey-100` | `night-800` #373737 | Icon containers, inactive tabs, skeletons, progress tracks |
| `bg-subtle-hover` | `--surface-subtle-hover-color` | `grey-200` | `night-700` #474747 | Hover on subtle surfaces |
| `bg-overlay/40` | `--overlay-color` | `grey-900` | `black` | Scrim behind drawers and dialogs |
| `text-fg` | `--text-primary-color` | `grey-900` | `night-150` #EDEDED | Body text |
| `text-fg-strong` | `--text-strong-color` | `black` | `white` | Page titles, greeting |
| `text-fg-heading` | `--text-heading-color` | `grey-700` | `night-100` #F1F1F1 | Stat values, emphasized labels, secondary button text |
| `text-fg-muted` | `--text-secondary-color` | `grey-600` | `night-300` #C1C1C1 | Secondary text, metadata |
| `text-fg-subtle` | `--text-tertiary-color` | `grey-500` | `night-400` #A1A1A1 | Placeholder, overlines, finding descriptions |
| `text-fg-disabled` | `--text-disabled-color` | `grey-400` | `night-500` #7E7E7E | Disabled controls only. Never for text people need to read: grey-400 on the page is only 2.5:1 |
| `border-line` | `--border-color` | `grey-200` | `night-750` #3A3B3D | Card borders |
| `border-line-strong` | `--border-strong-color` | `grey-300` | `night-600` #6B6C6E | Input and secondary button borders, toggle off |
| `bg-line` | `--border-color` | `grey-200` | `night-750` | Card header dividers |
| `bg-divider` / `border-divider` | `--divider-color` | `grey-100` | `night-850` #2A2B2D | List and group dividers |
| `bg-action` | `--primary-color` | `primary-500` | `primary-500` | Primary buttons |
| `hover:bg-action-hover` | `--primary-hover-color` | `primary-600` | `primary-400` | Primary hover. Darkens on light, lightens on dark |
| `active:bg-action-pressed` | `--primary-pressed-color` | `primary-700` | `primary-600` | Primary pressed |
| `text-on-action` | `--on-primary-color` | `white` | `white` | Text on primary |
| `text-accent` / `bg-accent` / `outline-accent` | `--accent-color` | `primary-500` | `primary-300` #877CEB | Link hover, toggle on, focus outline, unread dot |
| `bg-selected` | `--primary-container-color` | `primary-50` | `primary-night-container` #262254 | Active nav, selected tab and segment, user chat bubble |
| `border-selected-line` | `--primary-container-border-color` | `primary-75` | `primary-400` | Selected tab border |
| `text-on-selected` | `--on-primary-container-color` | `grey-900` | `night-150` | Text on selected surfaces |
| `ring-focus` | `--focus-ring-color` | `primary-50` | `primary-night-ring` #2A246E | Input focus ring |
| `bg-success-bg` / `text-success-fg` | success container roles | `success-50` / `success-700` | #183423 / #5CAC77 | Success badges |
| `bg-warning-bg` / `text-warning-fg` | warning container roles | `warning-50` / `warning-700` | #403320 / #D0A86D | Warning badges |
| `bg-error-bg` / `text-error-fg` | error container roles | `error-50` / `error-700` | #441E1D / #E58C8A | Error badges |
| `bg-info-bg` / `text-info-fg` | info container roles | `info-50` / `info-700` | #223148 / #78A1E4 | Info badges |
| `bg-chart-1` | `--chart-1-color` | `primary-500` | `primary-300` | Intuitive |
| `bg-chart-2` | `--chart-2-color` | `primary-300` | `primary-400` | Trusted |
| `bg-chart-3` | `--chart-3-color` | `primary-75` | `primary-75` | Valuable |

Tailwind's default palette is removed in the theme file, so classes like `bg-blue-500` will not compile.

---

## Dark Mode

Dark mode is translated from the maintainer's Vantage AI Figma file. It is applied with `data-theme="dark"` on `<html>`, and follows the system preference when the user has not chosen a theme.

What came from Figma:

| Figma value | Where it is used in Figma | Vantage token |
|---------|---------|---------|
| #131314 | Page background | `night-950` → `bg-canvas` |
| #1E1F20 | Sidebar, header, tab bar, composer | `night-925` → `bg-surface` |
| #222222 | Score and finding cards | `night-900`. Cards use `bg-surface` so card and panel stay one color, matching the light system |
| #373737 / #474747 | Segmented control track and selected segment | `night-800` / `night-700` → `bg-subtle` / `bg-subtle-hover` |
| #EDEDED / #F1F1F1 / white | Body text, card titles, greeting | `text-fg` / `text-fg-heading` / `text-fg-strong` |
| #C1C1C1 / #A1A1A1 | Tab labels and legend / finding descriptions | `text-fg-muted` / `text-fg-subtle` |
| #7E7E7E | AI disclaimer | `text-fg-subtle`. Figma uses a very quiet grey here, but small text must meet 4.5:1, and the light-mode equivalent does not |
| #9494FF | Intuitive series, View Maps toggle on | Replaced by `primary-300` #877CEB, the nearest shade of #3929CE |
| #4C4CF1 | Trusted series | Replaced by `primary-400` #4D3CDF |
| #BFBFF0 | Valuable series | Replaced by `primary-75` #CBC6F6 |
| #7A7AF0 | Selected Likes / Dislikes filter | Uses `bg-selected` with `border-selected-line` like every other selected segment |
| #E0E0E0 chip, white active nav | Selected tab, active nav item | Uses `bg-selected`. A white chip on a dark page breaks the "primary means you are here" rule |

Decisions made in translation:

- **The primary stays #3929CE.** Figma's lavender and indigo accents map almost exactly onto the existing primary scale, so no new hues were added.
- **The dark accent is `primary-300`.** It passes as text on dark surfaces (5.41:1 on canvas, 4.81:1 on surface). `primary-500` does not (2.11:1), so dark mode uses it only as a button fill.
- **Primary hover lightens in dark mode** (`primary-400`) so the hover stays visible against dark surfaces.
- **Hairline borders become 1px.** Figma uses 0.4–0.6px light borders at partial opacity. The tokens use solid 1px equivalents: `night-750` for cards and `night-600` for inputs, which passes the 3:1 non-text contrast for input boundaries.
- **Fonts and radii follow this document, not Figma.** Figma uses Instrument Sans with 14–36px radii. The maintainer chose the reference system as the source of truth where the two conflict, so Open Sauce Two and the radius scale above apply in both themes.
- **Like and Dislike markers keep `success-600` and `error-500`** in both themes. They read at 3.65:1 and 3.27:1 against the dark canvas, and they always carry a smile or frown icon.

Dark contrast checks:

| Pair | Ratio | Result |
|---------|---------|---------|
| `text-fg` #EDEDED on canvas | 15.86:1 | AA and AAA |
| `text-fg-muted` #C1C1C1 on canvas | 10.31:1 | AA and AAA |
| `text-fg-subtle` #A1A1A1 on canvas | 7.19:1 | AA and AAA |
| `text-accent` #877CEB on surface | 4.81:1 | AA |
| `text-on-selected` on `bg-selected` | 12.46:1 | AA and AAA |
| White on `bg-action` | 8.81:1 | AA and AAA |
| Status `-fg` on status `-bg` | 4.9–5.83:1 | AA |

Theme switching:

- Store the user's choice (`light`, `dark`, or `system`) in a cookie so the server renders the right `data-theme` with no flash.
- A sun/moon icon button at the top right of every page, where the avatar used to be, switches between light and dark. It shows the mode you will switch to. Settings and Privacy keeps the three-way choice, including System.
- Images of the user's designs are never recolored.

---

# Typography

| Token | Value | Usage |
|---------|---------|---------|
| `--font-sans` | `"Open Sauce Two", ui-sans-serif, system-ui, sans-serif` | All UI and content |
| `--font-mono` | `ui-monospace, SFMono-Regular, Menlo, …` | Code, hex values, IDs |

Load Open Sauce Two weights **400, 500, 600** only, with `font-display: swap`. Use the `@fontsource/open-sauce-two` package or self-host the WOFF2 files.

Global body settings, matching the reference:

```css
body {
  background-color: var(--background-color);
  color: var(--text-primary-color);
  font-family: var(--font-sans);
  letter-spacing: var(--tracking-body);      /* -0.02em */
  font-feature-settings: "cv03" 1, "cv04" 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.cv01 {
  font-feature-settings: "cv01" 1, "cv03" 1, "cv04" 1;
}
```

Apply the `cv01` class to headings, stat values, button labels, and names. It switches Open Sauce Two to its alternate glyph set used for display text in the reference.

## Type Scale

| Usage | Size | Line height | Weight | Color |
|---------|---------|---------|---------|---------|
| Page title / greeting | `text-2xl` (24px) | `leading-tight` (1.2) | `font-semibold` | `text-fg-strong` |
| Score and stat values | `text-xl` (20px) | `leading-tight` (1.2) | `font-semibold` | `text-fg-heading` |
| Card title | `text-lg` (18px) | `leading-ui` (1.45) | `font-semibold` | `text-fg` |
| Page intro paragraph | `text-base` (16px) | `leading-relaxed` (1.6) | `font-regular` | `text-fg-muted` |
| List title, name | `text-base` (16px) | `leading-ui` (1.45) | `font-medium` | `text-fg` |
| Body UI text, buttons, inputs | `text-sm` (14px) | `leading-ui` (1.45) | `font-regular` / `font-semibold` for buttons | `text-fg` |
| Supporting text, metadata | `text-sm` (14px) | `leading-ui` (1.45) | `font-regular` | `text-fg-muted` |
| Caption, badge | `text-xs` (12px) | `leading-ui` (1.45) | `font-medium` | context |
| Overline / section label | `text-xs` (12px) | `leading-ui` (1.45) | `font-medium`, `uppercase`, `tracking-wide` | `text-fg-subtle` |

Rules:

- Use only three weights: 400, 500, 600.
- Default line height for UI text is 1.45. It is built into `text-xs` through `text-lg`, so do not repeat `leading-[1.45]`.
- Long-form critique paragraphs use `leading-relaxed` (1.6).
- Do not introduce arbitrary sizes. If a larger display size is needed for the composer greeting, add it to the tokens first.

---

# Spacing

The spacing base unit is **4px** (`--spacing: 0.25rem`). Use Tailwind spacing utilities only.

| Step | Value | Typical usage |
|---------|---------|---------|
| `0.5` | 2px | Badge internal gap, hover nudge |
| `1` | 4px | Title-to-subtitle gap, nav item gap |
| `1.5` | 6px | Badge-to-label gap |
| `2` | 8px | Button icon gap, input icon gap |
| `2.5` | 10px | Search and input vertical padding |
| `3` | 12px | Nav item gap and vertical padding, list cell gaps, header vertical padding |
| `4` | 16px | Card padding (compact), grid gaps, page gutter on mobile, nav horizontal padding |
| `5` | 20px | List row vertical padding, info chip horizontal padding |
| `6` | 24px | Card section padding, page gutter on tablet, section stacking, form field rows |
| `9` | 36px | Page gutter on desktop, bottom page padding |

Layout spacing:

| Area | Mobile | `sm` (640px+) | `lg` (1024px+) |
|---------|---------|---------|---------|
| Page horizontal padding | 16px | 24px | 36px |
| Main top / bottom padding | 24px / 36px | same | same |
| Header padding | 12px × 16px | 12px × 24px | 12px × 36px |
| Card grid gap | 16px | 16px | 16px |

The reference uses 23px card paddings to offset a 1px border. Vantage AI normalizes these to `px-6 pt-6` (24px).

---

# Border Radius

| Token | Value | Usage |
|---------|---------|---------|
| `rounded-sm` | 4px | Sidebar nav items, focusable list wrappers |
| `rounded-md` | 6px | Inputs, search field, tabs and segmented controls |
| `rounded-lg` | 8px | Buttons |
| `rounded-badge` | 10px | Small badges, status dots |
| `rounded-xl` | 12px | Cards, panels, dialogs, popovers, medium pill badges |
| `rounded-2xl` | 16px | Large media frames (uploaded design preview) |
| `rounded-full` | 9999px | Avatars, icon buttons, toggles, chips, calendar days |

Corners should feel soft but not playful.

---

# Shadows & Elevation

The reference product uses one shadow only.

| Token | Value | Usage |
|---------|---------|---------|
| `shadow-xs` | `0 1px 2px 0 rgb(16 24 40 / 0.05)` | Inputs, search field, popovers, dialogs, side sheets |

Elevation is communicated with **borders**, not shadows.

| Layer | Treatment | z-index |
|---------|---------|---------|
| Page | `bg-canvas` | auto |
| Card | `bg-surface border border-line` | auto |
| Sticky header | `bg-surface` | 20 |
| Overlay scrim | `bg-overlay/40` | 30 |
| Sidebar drawer, popovers, dialogs | `bg-surface border border-line shadow-xs` | 40 |

---

# Components

Reusable primitives belong in:

```
components/ui/
```

Always compose primitives. Never duplicate them.

---

## App Shell

- Sidebar: `w-[272px]`, white, `border-r border-line`, `pt-6 pb-6`, sticky full height on `lg`, off-canvas drawer below `lg` with a `bg-overlay/40` scrim.
- Header: sticky, white, `px-4 py-3 sm:px-6 lg:px-9`, contains a hamburger below `lg`, the session title or search, the "Upgrade to VantagePro" button, and the light/dark icon button.
- Main: `px-4 pt-6 pb-9 sm:px-6 lg:px-9`.

---

## Sidebar

Contents, from the Vantage AI mock-ups:

- Logo
- New Session (primary entry point)
- Design Library
- Previous Sessions (overline label, then a truncated list)
- Upgrade to VantagePro (bottom)
- Account row with avatar, name, and email (bottom). Clicking it opens a menu above it with Settings and Privacy and Log out, like ChatGPT. Escape or a click outside closes it.

Nav item:

```
flex w-full items-center gap-3 rounded-sm border px-4 py-3 text-sm transition-colors
inactive: border-transparent text-fg hover:bg-hover
active:   border-selected bg-selected font-medium   (aria-current="page")
```

Icons are 20px. Groups are separated by a `h-px bg-divider` divider.

---

## Header Search

```
label: flex items-center gap-2 rounded-md bg-canvas px-3 py-2.5 shadow-xs
       focus-within:ring-2 focus-within:ring-focus
input: w-full bg-transparent text-sm outline-none placeholder:text-fg-subtle
```

Max width 629px on desktop. Use `role="combobox"` with a results popover.

---

## Button

All buttons share:

```
cv01 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2
text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer
disabled:cursor-default disabled:opacity-60
focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
```

| Variant | Classes |
|---------|---------|
| Primary | `bg-action text-on-action hover:bg-action-hover active:bg-action-pressed` |
| Secondary | `border border-line-strong bg-surface text-fg-heading hover:bg-hover` |
| Destructive | `bg-error-500 text-white hover:bg-error-700` |
| Icon button | `size-10 rounded-full bg-subtle hover:bg-subtle-hover` (header) or `size-9 rounded-full hover:bg-subtle` (inline) |

Sizes: Medium is the default above (36px tall). Small uses `px-3 py-1.5 text-xs`. Large uses `px-5 py-2.5 text-base`. Every button must keep a 44px touch target on touch devices through padding or a hit-area wrapper.

Never place two primary buttons in the same hierarchy.

---

## Input

```
w-full rounded-md border border-line-strong bg-surface px-3 py-2.5 text-sm text-fg
shadow-xs outline-none placeholder:text-fg-subtle
focus:border-accent focus:ring-2 focus:ring-focus
```

Error state: `border-error-500 focus:ring-error-bg` with a `text-xs text-error-fg` message below. Use `text-error-fg`, not `text-error-500`: red-500 on the dark surface is only about 2.9:1.

Rules:

- Labels are always visible: `text-sm font-medium text-fg-heading`, 4px above the field.
- Placeholder is never the label.
- Minimum height 44px.

> **Known gap (light mode):** `border-line-strong` is `grey-300` (#D0D5DD) on white, which is about 1.5:1. WCAG 1.4.11 asks for 3:1 on the boundary of an input. This value is inherited from the reference product. Dark mode passes at 3.14:1. Decision pending: darken the light input border (for example to a new `grey-450` near #8A93A3) or accept the reference value. Tracked as an open question in `docs/implementation-plan.md`.

---

## Authentication screens (Log in, Sign up, Welcome)

Minimal, modeled on ChatGPT's "Log in or sign up" dialog. Email and password only. No Google, Apple, or phone buttons.

- Layout: logo, then one centered card on `bg-canvas`. `max-w-[440px] rounded-3xl border border-line bg-surface px-6 py-8 shadow-md`.
- Header: title `text-2xl font-semibold`, one muted sentence below. Centered.
- Fields: pill inputs (`min-h-12 rounded-full px-5`), placeholders "Email address" and "Password", real labels kept as `sr-only`. The password field has a show/hide eye button.
- One wide pill primary button: "Continue".
- Footer link switches between Log in and Sign up.
- Entry: a signed-out visitor with no account lands on Sign up, then onboarding. A returning visitor lands on Log in.
- Onboarding (`/welcome`): shown once, right after the first sign-up, before New Session. One question, "What should we call you?", one field. Sign-up itself asks only for email and password.

---

## Composer (Upload and Prompt)

The New Session screen greets the user ("Hi {name}, where should we start?") above a single composer card. The layout follows ChatGPT.

- Desktop (`sm` and up): greeting and card are one group, centered horizontally and vertically in the content area, `max-w-[768px]`. Row 1: "+", text input, image icon. Row 2: the two segmented controls with text labels.
- Mobile: the header shows the menu button and the "Vantage" title. The greeting is centered in the free space. The card is pinned to the bottom (`rounded-2xl`). The text input is on the first row. Below it: "+" at the bottom left, the segmented controls as icon-only buttons in the middle (`iconOnlyOnMobile`), and the primary round image button at the bottom right.
- Card: `rounded-xl border border-line bg-surface p-4 shadow-xs`, `focus-within:border-accent focus-within:ring-2 focus-within:ring-focus`.
- Input placeholder: "URL, images or PDF asset".
- Attach button: icon button with a plus icon. Supports drag-and-drop.
- Page scope segmented control: **Single Page** / **Multiple Page Journey**.
- Platform segmented control: **App** / **Web**.
- Submit: primary icon button, disabled until there is at least one asset.
- Attachments render as removable thumbnails inside the card.

---

## Tabs and Segmented Controls

Used for the report tabs and the composer toggles. Tab order, left to right: **Sentiment, Recommendations, Key Takeaways, UX Score, Assistant**. Sentiment is the first tab and opens by default, so a designer sees what to fix on the design straight away.

```
flex items-center gap-2 rounded-md border p-[11px] text-sm font-medium transition-colors
selected:   border-selected-line bg-selected text-fg
unselected: border-line-strong bg-subtle text-fg-heading hover:bg-subtle-hover
```

Use `role="tablist"`, `role="tab"`, and `aria-selected`. Arrow keys move between tabs.

The Assistant tab carries a sparkle icon to mark it as AI-powered. It uses the same selected style as other tabs.

---

## Card

```
overflow-hidden rounded-xl border border-line bg-surface
header:  flex h-[63px] items-start justify-between px-6 pt-6
         h2: cv01 text-lg font-semibold
         optional trailing ghost link "See all"
divider: h-px bg-line
body:    px-6 py-6
footer:  border-t border-line px-6 pt-5 pb-5, actions gap-2
```

Compact stat card: `flex items-center gap-4 rounded-xl border border-line bg-surface p-4` with a 40px circular icon container on the right.

No gradients. No shadows on cards.

---

## Score Card (UX Score)

From the mock-ups: a Design Quality Score with three dimensions, **Intuitive**, **Trusted**, and **Valuable**, each with a percentage and a one-line explanation.

- Overall score uses the stat-card pattern with `text-xl font-semibold text-fg-heading`.
- Dimension cards show a label, a percentage, a progress bar, and the explanation in `text-sm text-fg-muted leading-relaxed`.
- Progress track: `h-2 rounded-full bg-subtle`. Fill: `bg-chart-1` for Intuitive, `bg-chart-2` for Trusted, `bg-chart-3` for Valuable.
- Chart series: `chart-1` Intuitive, `chart-2` Trusted, `chart-3` Valuable. In SVG use `var(--chart-1-color)` and so on. Always show the numeric value next to every segment.

---

## Sentiment Map

The Sentiment Map is the emotional-reaction map of the design. It pins smile and frown markers directly onto the uploaded screen, showing where a user is likely to feel positive or negative. The Figma file calls it "Valency". The name comes from *valence*, the psychology term for how positive or negative an emotion is.

The tab label is **Sentiment**. It was renamed from "Valency" because designers recognize "sentiment" immediately, while "valency" reads as a chemistry term. The internal `Valence` enum is unchanged.

- **Two columns from `lg` (5 : 6).** The design is on the left and stays in view (`lg:sticky lg:top-24`) while the findings scroll on the right. Both must be visible on arrival without scrolling at a 1512 by 982 screen, and a browser test checks it. Below `lg` they stack, design first.
- Design frame: `rounded-2xl border border-line bg-subtle`. The image may grow to `max(360px, 100vh - 15rem)` tall, so a phone screen is large enough to read. A wide picture is limited by the column width instead.
- Under the design: the Page selector for journeys.
- Top of the right column: the "View Maps" toggle in a `bg-surface border border-line rounded-xl` strip, then a heading ("What to fix" or "What works") with the Likes / Dislikes segmented filter.
- **"Show on design"** is a real button, not a text link: secondary button with `border-accent bg-selected text-on-selected`, a crosshair icon in the accent color, and a 44px minimum height. The label stays in the high-contrast selected-text color because accent-colored text on the dark selected tint is only 4.25:1. Clicking it switches to the right page, highlights the marker, and moves focus to it.
- Like marker: `bg-success-600` rounded square, 40px, with a white smile icon. Dislike marker: `bg-error-500` rounded square with a white frown icon. Both themes use the same marker colors.
- Markers are buttons. Activating one scrolls to and highlights the matching finding.
- Findings are listed in one column on the right, separated by `border-divider` lines. Each row has a 40px outline smile or frown icon, the principle as a title (`text-lg font-semibold text-fg`), and the explanation (`text-sm text-fg-subtle leading-relaxed`).
- Categories seen in Figma: Visual Hierarchy, Accessibility, Consistency, Feedback and Interaction, Mobile Responsiveness, Error Prevention.

## Upload Images Step

Second screen of a new session, from Figma.

- Title "Upload Images" with the muted line "Upload UI images from your files to get started".
- A rail of page thumbnails on the left (112 by 128 px, `rounded-xl`, 2px border). The selected page uses `border-accent`. A dashed add tile always sits below the thumbnails, until the page limit is reached. Adding a second page turns a Single Page session into a Multiple page journey, and a status message says so.
- A large preview frame on the right (`rounded-2xl border border-line bg-subtle`) with a **Replace** secondary button at the top left and a red delete icon button at the top right.
- Primary "Continue to analysis" button below, centered.
- With no images yet (for example when uploading a new version), a large dashed drop zone with a file picker.

## My Goal Step

- Title "My Goal" with the muted line "Provide more information about what you want to learn and test".
- The design preview above a single multi-line field with a primary send icon button. Enter starts the analysis. The goal is optional and limited to 600 characters, with a visible counter.
- If an analysis fails, a `bg-error-bg` panel explains why and offers Try again. The images are never lost.

## Analysis Loader

"Fetching your insights..." with concentric rings that orbit and a core that breathes. Beside it (from `md`, stacked below) a seven-step list shows what is happening now: reading, hierarchy, accessibility, interaction, scoring, sentiment, recommendations. The animation and the list are side by side so both are visible at once without scrolling. Only the current step is announced to screen readers, not the whole list. With reduced motion the rings stay still.

## Report Header

The edit icon button renames the design. The title reads "{name} Design Analysis". On the right: a Version selector (from version 2), a "New version" secondary button, and a delete icon button that opens a confirmation dialog.

## Assistant Tab Layout

Two columns from `xl`: the recommendations card on the left and the assistant panel on the right, as in Figma. They stack below `xl`.

## AI Disclaimer

Every report screen ends with a centered disclaimer in `text-xs text-fg-subtle`:

> Disclaimer: The information provided by this AI is for general informational purposes only. While we strive for accuracy, please verify any facts or data independently before making decisions based on this information.

---

## Recommendation List

- **Same two-column layout as the Sentiment Map** on the Recommendations tab: the design on the left (sticky, image height capped at `max(360px, 100vh - 16rem)`), the heading and the list on the right. Both are in view on arrival. Below `lg` they stack.
- On the Assistant tab the list sits in a card beside the assistant instead.
- Numbered, ordered by priority.
- Each item: number in `cv01 text-lg font-semibold text-fg-subtle`, title in `text-base font-medium`, explanation in `text-sm text-fg-muted leading-relaxed`.
- Items separated by `h-px bg-divider`.
- Each item names the principle it applies (badge) and offers "Ask the assistant" as a ghost action.

---

## AI Assistant Panel

- Lives in a side panel next to the report on `xl`, and as a full tab below `xl`.
- Header: assistant avatar, "Assistant" label, relative timestamp.
- Assistant message bubble: `rounded-xl bg-subtle px-4 py-3 text-sm`.
- User message bubble: `rounded-xl bg-selected px-4 py-3 text-sm text-fg`, right-aligned.
- Typing indicator: three `size-1.5 rounded-full bg-fg-subtle` dots with `animate-bounce` and staggered delays.
- Suggested prompts: horizontally scrollable chips, `rounded-xl border border-line bg-surface px-4 py-3 text-sm text-fg-heading hover:bg-hover`.
- Input: "Ask about your designs here", uses the Input pattern with a trailing send icon button.

---

## Design Library

A grid of project cards for past and ongoing analyses.

- Grid: 1 column, `sm` 2 columns, `xl` 3 columns, `gap-4`.
- Card: thumbnail (`aspect-[4/3] rounded-xl object-cover` with a `border-line` border), then avatar, title (`text-base font-medium`, 2-line clamp), and relative time (`text-sm text-fg-subtle`).
- Hover: title turns `text-accent`.
- The whole card is one link with a visible focus outline.

---

## List Row

```
li: flex items-center border-b border-divider bg-surface
cell: flex items-center gap-3 px-4 py-5 sm:px-6
title: text-sm font-medium
meta:  text-sm text-fg-muted
```

Navigational list rows end in a 24px chevron that nudges `translate-x-0.5` on hover, and the title turns `text-accent` on hover.

---

## Badge

| Size | Classes |
|---------|---------|
| Small | `inline-flex items-center gap-0.5 rounded-badge px-1 text-xs font-medium` |
| Medium | `inline-flex items-center gap-0.5 rounded-xl px-3 py-0.5 text-sm font-medium` |
| Count | `rounded-xl px-2 text-xs font-medium bg-primary-400 text-white` |

| Tone | Classes |
|---------|---------|
| Success | `bg-success-bg text-success-fg` |
| Warning | `bg-warning-bg text-warning-fg` |
| Error | `bg-error-bg text-error-fg` |
| Info | `bg-info-bg text-info-fg` |
| Neutral | `bg-subtle text-fg-heading` |

Severity mapping for findings: Critical uses Error, Major uses Warning, Minor uses Info, Strength uses Success.

---

## Toggle

```
relative inline-flex h-6 w-11 rounded-full transition-colors
off: bg-line-strong     on: bg-accent
thumb: size-5 rounded-full bg-white (both themes), translate-x-0.5 → translate-x-[22px]
focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
```

Use `role="switch"` and `aria-checked`.

---

## Avatar

Circular, with a `border-[1.5px] border-white` ring. Size 40px. Add other sizes when a screen needs them.

---

## Dialog, Popover, Side Sheet

| Pattern | Classes | Max width |
|---------|---------|---------|
| Dialog | `rounded-xl border border-line bg-surface p-6 shadow-xs`, content `gap-4` | 440px |
| Popover / dropdown | `rounded-xl border border-line bg-surface shadow-xs`, `mt-2` | 380px |
| Side sheet | full height, `bg-surface shadow-xs sm:border-l sm:border-line` | 560px |

All use a `bg-overlay/40` scrim, trap focus, close on `Esc`, and return focus to the trigger.

Use dialogs for upgrade, export, delete confirmation, and session rename.

---

## Upgrade Prompt

"Upgrade to VantagePro" appears in the header and at the bottom of the sidebar. It uses the Secondary button style with a sparkle icon so it never competes with the page's primary action.

---

# Iconography

Use **Lucide React** exclusively. The reference uses custom SVGs. Vantage AI uses the closest Lucide equivalents to keep one icon family.

| Context | Size |
|---------|---------|
| Inline, badges | 12–16px |
| Buttons, nav, inputs | 20px |
| Feature rows, chevrons | 24px |

Stroke width 1.5. Icons inside 40px or 48px circular containers on `bg-subtle`.

Icons that carry meaning need an accessible label. Decorative icons use `aria-hidden="true"`.

---

# Motion

Motion communicates state. It never decorates.

| Token | Value | Usage |
|---------|---------|---------|
| `--default-transition-duration` | 150ms | Color, background, border changes |
| `--duration-base` | 200ms | Drawer slide, scrim fade, dialog fade and scale |
| `--default-transition-timing-function` | `cubic-bezier(0.4, 0, 0.2, 1)` | All transitions |
| `animate-pulse` | 2s | Skeleton loaders |
| `animate-bounce` | 1s | Assistant typing dots only |

Allowed:

- Color and opacity transitions
- Subtle slide for the sidebar drawer and side sheets
- 2px chevron nudge on hover
- Scale from 0.98 for dialogs

Avoid bounce (except typing dots), spin (except inline loaders), page transitions, and parallax.

Respect `prefers-reduced-motion` by removing transforms and keeping opacity changes.

---

# AI Feedback Patterns

Every analysis communicates meaningful progress in stages.

- Reading your design...
- Checking visual hierarchy...
- Measuring contrast and accessibility...
- Reviewing interaction feedback...
- Scoring Intuitive, Trusted and Valuable...
- Mapping likes and dislikes...
- Writing recommendations...

Avoid generic messages like:

```
Thinking...
Loading...
Please wait...
```

---

# Empty States

Every empty state teaches the next step and includes one primary action.

| Instead of | Use |
|---------|---------|
| No sessions | Upload a screen or paste a Figma link to get your first critique. |
| Library empty | Your analyzed designs will live here. Start a new session to add one. |
| No recommendations | This design follows the principles we checked. Ask the assistant what to explore next. |

---

# Loading States

Prefer skeletons (`bg-subtle animate-pulse rounded-*` matching the final shape) over spinners.

Long-running analysis shows the staged progress list above, announced through a polite live region.

The rest of the interface stays usable while analysis runs.

---

# Accessibility

Target: **WCAG 2.1 AA**.

- Full keyboard navigation and visible focus on every interactive element.
- Focus treatment: inputs use a `border-accent` border plus `ring-focus` ring. Everything else uses a 2px `outline-accent` outline with 2px offset. Both resolve to `primary-500` in light mode and `primary-300` in dark mode.
- Never rely on color alone for scores, markers, or severity.
- Minimum 44px touch targets.
- Charts include text values and a data table alternative.
- Respect `prefers-reduced-motion`.

---

# Responsive Design

Design mobile-first using these breakpoints:

| Name | Min width | Key changes |
|---------|---------|---------|
| Mobile | 0 | Sidebar becomes a drawer, single-column cards |
| `sm` | 640px | Stat grid becomes 3 columns, wider gutters |
| `md` | 768px | Two-column findings |
| `lg` | 1024px | Persistent sidebar, desktop gutters |
| `xl` | 1280px | Report and assistant side by side |

The uploaded design preview always fits its container without horizontal scrolling.

---

# What Not To Do

- Do not hardcode hex values, including hover shades. Use `hover:bg-action-hover`, not `#3022B8`.
- Do not use light-only scale utilities (`bg-white`, `text-grey-600`) for anything that must change in dark mode. Use the theme-aware utilities.
- Do not use the reference product's orange primary anywhere.
- Do not use Tailwind's default palette.
- Do not add shadows beyond `shadow-xs`.
- Do not use gradients, glassmorphism, or neumorphism.
- Do not use more than three font weights.
- Do not create multiple competing primary actions.
- Do not show a score without its explanation.
- Do not use `primary-300` for text.
- Do not recolor the user's uploaded designs for dark mode.
- Do not invent new component styles without updating this document.

---

# Design Goal

The interface should disappear behind the user's design and the critique of it.

Every interaction should reinforce one outcome:

> **Help designers understand what to fix in their work, why it matters, and how to improve it, with clear principle-based feedback every single time.**
