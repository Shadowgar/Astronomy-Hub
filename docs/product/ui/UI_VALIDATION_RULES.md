# UI_VALIDATION_RULES.md

# UI Validation Rules — Phase B Enforcement

## Purpose

This document defines the enforceable review rules for UI Phase B.

Unlike the main spec, this file is written as a pass/fail validation checklist so that:
- BitFrog
- a human reviewer
- or a later AI session

can determine whether a Phase B step is acceptable.

Where possible, the rules below should be checked with simple searches, code review, and running the frontend locally.

---

# 1. Validation philosophy

A Phase B implementation is not valid just because it "looks nicer."

It is valid only if:
- it follows the architecture
- it follows the theme system
- it follows the layout system
- it preserves functionality
- it reduces drift rather than increasing it

These rules exist to stop regressions.

---

# 2. Architecture validation rules

## Rule A1 — Shared design layers exist
### PASS if
- the frontend contains token, theme, and semantic design layers
- those layers are imported into the app

### FAIL if
- theme values are scattered throughout components
- no semantic design layer exists
- new styling bypasses the shared system

---

## Rule A2 — Shared primitives exist
### PASS if
- `GlassPanel`, `SectionHeader`, `StatusBadge`, `AppButton`, and `RowItem` exist or equivalent approved primitives exist

### FAIL if
- module conversions happen before shared primitives exist
- multiple duplicate "panel-like" primitives appear

---

## Rule A3 — App shell exists
### PASS if
- the app is wrapped in a shared shell/layout component

### FAIL if
- page background, width, and global spacing remain scattered through feature components

---

# 3. Hardcoded styling validation rules

## Rule H1 — No hardcoded colors in feature modules
### PASS if
feature modules do not contain direct literal theme colors for surfaces, borders, text, or accents.

### FAIL examples
- `#0d1117`
- `#fff`
- `rgb(...)`
- `rgba(...)` for theme surface styling inside feature modules
- inline style color definitions that replace token usage

### Notes
Hardcoded colors in token/theme definition files are allowed.
Hardcoded colors in feature modules are not.

---

## Rule H2 — No module-local panel systems
### PASS if
feature modules use `GlassPanel` or an approved shared panel primitive.

### FAIL if
a module defines its own custom wrapper with separate border, radius, shadow, and background rules that duplicate the panel system.

---

## Rule H3 — No independent spacing scales
### PASS if
spacing comes from shared tokens or approved shared CSS classes.

### FAIL if
modules repeatedly define one-off padding/margin values unrelated to the shared scale.

---

## Rule H4 — No inconsistent radius drift
### PASS if
panel, button, badge, and row radius values align to the token scale.

### FAIL if
multiple unrelated radius values appear throughout modules without system reason.

---

# 4. Theme validation rules

## Rule T1 — Five supported modes exist
### PASS if
the app supports:
- light
- light high contrast
- dark
- dark high contrast
- red

### FAIL if
the app still only supports day/night/red after the Phase B theme foundation step is declared complete.

---

## Rule T2 — Theme switch preserves design
### PASS if
switching between modes changes visual tokens but preserves structure and hierarchy.

### FAIL if
any theme visibly changes:
- layout
- spacing
- component structure
- hierarchy

---

## Rule T3 — High contrast is token-driven
### PASS if
high-contrast improvements come through token overrides.

### FAIL if
high-contrast modes require separate component markup or separate layouts.

---

## Rule T4 — Red mode remains coherent
### PASS if
red mode still clearly belongs to the same product family.

### FAIL if
red mode feels like a disconnected novelty skin or loses readability.

---

# 5. Layout validation rules

## Rule L1 — Hero-first hierarchy exists
### PASS if
the hero appears before the support grid and is visually dominant.

### FAIL if
the app still reads as a flat card board with no clear primary decision surface.

---

## Rule L2 — Support grid is explicit
### PASS if
the lower content area is intentionally structured through shared layout composition.

### FAIL if
module placement is still incidental or scattered.

---

## Rule L3 — Desktop width is used intentionally
### PASS if
the layout avoids a thin center column and uses available desktop width coherently.

### FAIL if
the app still looks like a narrow blog column on large screens.

---

## Rule L4 — Responsive collapse is controlled
### PASS if
tablet and mobile preserve hierarchy cleanly.

### FAIL if
- columns partially collapse in broken ways
- text overlaps
- actions become unusable
- hero loses priority on small screens

---

# 6. Primitive usage validation rules

## Rule P1 — Section headers are unified
### PASS if
major modules use shared section header structure.

### FAIL if
each module invents its own header spacing and title styling.

---

## Rule P2 — Repeated lists use shared row language where appropriate
### PASS if
targets, passes, alerts, and similar repeated lists use a shared row system or an approved variant.

### FAIL if
every repeated list is independently styled despite serving the same structural role.

---

## Rule P3 — Buttons are unified
### PASS if
primary and secondary actions use shared action primitives or a shared styling system.

### FAIL if
modules invent one-off CTA styling.

---

# 7. Accessibility validation rules

## Rule X1 — Focus-visible is obvious
### PASS if
keyboard navigation clearly reveals focus state.

### FAIL if
interactive elements can be tabbed to but do not show a distinct focus state.

---

## Rule X2 — Text remains practically readable
### PASS if
text is readable in all five modes under normal usage.

### FAIL if
secondary or muted text becomes too faint to scan.

---

## Rule X3 — Color is not the only state signal where avoidable
### PASS if
status or interactivity is reinforced by text, structure, icons, or labels where practical.

### FAIL if
important meaning disappears when color distinction is weak.

---

# 8. Functionality preservation rules

## Rule F1 — Existing modules still work
### PASS if
conditions, targets, alerts, passes, and moon summary still render valid content.

### FAIL if
a styling step breaks data rendering or interactivity.

---

## Rule F2 — Existing mode persistence still works
### PASS if
mode selection persists across refresh as intended.

### FAIL if
theme-system refactoring breaks persistence.

---

## Rule F3 — No backend contract changes
### PASS if
UI Phase B steps do not change endpoint shapes or require backend redesign.

### FAIL if
frontend styling work introduces backend dependency changes.

---

# 9. Suggested enforcement checks

These are not mandatory scripts, but they are practical checks reviewers should use.

## Check C1 — Search for hardcoded colors in feature components
Run searches for:
- `#`
- `rgb(`
- `rgba(`
inside feature component directories

Manually confirm whether matches are legitimate token/theme definitions or invalid module-local styling.

## Check C2 — Search for duplicated panel-like wrappers
Look for repeated combinations of:
- border
- background
- border-radius
- box-shadow
inside feature modules

These often signal panel-system drift.

## Check C3 — Search for inline style blocks in modules
Inline styles are not automatically wrong, but they should be reviewed carefully because they often bypass tokens and shared primitives.

## Check C4 — Review each mode manually
At minimum, visually inspect:
- hero
- support modules
- buttons
- focus states
- row readability
in all five modes.

## Check C5 — Review desktop, tablet, and mobile
Use browser responsive tools and verify:
- hierarchy preserved
- no overflow
- no broken grid remnants
- touch/action usability

---

# 10. Rejection rules

Reject a Phase B step if any of the following are true:
- it bypasses the shared theme system
- it introduces module-local panel styling
- it changes layout differently by theme
- it breaks existing data rendering
- it adds Phase C feature scope
- it visually increases drift instead of reducing it
- it cannot be reviewed in isolation because the diff is too large

---

# 11. Completion rule

Do not mark UI Phase B complete until all of the following are true:
- shared design layers exist
- shared primitives exist
- all major modules are converted
- five-theme support exists
- hero-first layout exists
- responsive hierarchy is stable
- accessibility rules are satisfied
- no critical validation rules are failing

---

# 12. Relationship to other docs

Use this file alongside:
- `UI_PHASE_B_SPEC.md`
- `PHASE_B_EXECUTION_TODO.md`
- `UI_VISUAL_CALIBRATION.md`
- `UI_MODULE_TRANSFORMS.md`

This file is the pass/fail enforcement layer.
