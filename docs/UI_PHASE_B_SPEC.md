# UI Phase B — Polished Dashboard & Design System Foundation

## Objective
Prepare and begin the polish of the Phase 1 UI while introducing lightweight, local design primitives to make future work easier.

## Status
- **UI Phase B:** ACTIVE (Product UI Transformation)

## Visual Design Direction (LOCKED)

UI Phase B uses a hybrid design approach:

1. Base Style: GitHub-style interface
	- Dark-first design
	- Subtle borders (not heavy cards)
	- Clean typography
	- Structured layout
	- Minimal visual noise

2. Product Feel: Mission Control influence
	- Feels like a purpose-built tool, not a website
	- Clear section hierarchy instead of card grid
	- Information grouped by function (decision → support)
	- Slightly more presence than GitHub (not flat, not flashy)

### Layout Principles

- ONE primary decision panel at top
- All other modules are secondary
- Avoid “card grid” layout
- Prefer sections and dividers over boxed cards
- Strong hierarchy:
  - Primary (decision)
  - Secondary (supporting modules)
  - Tertiary (details / drill-down)

### Style Rules

- Background: dark (#0d1117 style)
- Borders: subtle (#30363d style)
- No heavy shadows
- No excessive gradients
- Accent color only for actions (buttons)

### Constraints

- Do NOT introduce animations
- Do NOT introduce 3D or maps
- Do NOT change data contracts
- Do NOT redesign information architecture
- This is a visual and hierarchy transformation only

Goal: Ensure all future UI work follows a consistent, modern, product-level design language.

## Desktop Layout Width & Mode Behavior (LOCKED)

1. Desktop Width
- UI Phase B must not use a narrow center-column layout on desktop.
- On large screens, the main content area should expand to a wider max width so the interface feels like a command center, not a blog page.
- Side gutters should exist, but must be controlled and intentional.
- Hero and section layouts should visibly use desktop real estate.

2. Section Width
- The Primary Decision Panel should span a wide desktop width.
- Two-column supporting sections must feel balanced and substantial, not compressed into a narrow center strip.
- Main content should scale cleanly from laptop to large monitor.

3. Mode Behavior
- Day mode: clear, usable, high-contrast, professional.
- Night mode: primary visual mode; GitHub-style dark + slight mission-control feel.
- Red mode: purpose-built observing mode, not just a red recolor of day/night.

4. Density Rules
- Avoid oversized empty margins on widescreen displays.
- Avoid thin central content stacks.
- Support modules must remain readable while filling the workspace appropriately.

5. Constraints
- Do not change information architecture.
- Do not add new features.
- This section defines visual layout behavior only.

Goal:
Make future UI Phase B implementation account for real desktop screenshots, desktop width usage, and coherent day/night/red behavior.

## Scope (non-blocking for Phase A)
- Introduce design tokens (colors, spacing, typography scale) as a small module
- Create simple, reusable `Card` and `SectionHeader` components
- Improve typography and spacing across the app
- Refine responsive behavior and small-screen ergonomics
- Accessibility improvements (ARIA landmarks, focus-visible styles)

## Non-goals
- Do not introduce a full external design system library
- Do not change Phase 1 information architecture


