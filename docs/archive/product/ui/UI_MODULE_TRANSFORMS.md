# UI_MODULE_TRANSFORMS.md

# UI Module Transform Map — Phase B

## Purpose

This document removes module-by-module ambiguity during Phase B conversion.

It answers:
- what should stay
- what should change
- what shared primitives each module must use
- what visual problems should be eliminated
- what the transformed module should feel like

This document is not a component API reference.
It is a transformation map from the current module state to the Phase B target system.

---

# 1. Global transform rules

Every module transformation in this file must respect all of the following:

1. Preserve feature logic unless a bug forces a small correction.
2. Preserve backend contracts.
3. Preserve current data responsibilities.
4. Replace local visual wrapper styling with shared primitives.
5. Replace repeated local list patterns with shared row patterns where appropriate.
6. Preserve module purpose and hierarchy.
7. Do not add new Phase C features under the excuse of visual cleanup.

---

# 2. Global before → after definition

## Before (current repo state)
The current implementation includes:
- dashboard shell
- conditions module
- targets module
- alerts module
- passes module
- moon summary
- day/night/red mode system with persistence
- active UI Phase B, but the current Phase B spec still frames the work as polished dashboard plus lightweight local primitives rather than a full product-level rebaseline. citeturn795795view1turn795795view2turn795795view3

## After (Phase B target)
Each module must:
- live inside the new layout system
- render through shared panel language
- use shared section header language
- use shared row language where repeated rows exist
- inherit semantic tokens
- preserve one design across all five supported modes
- support hero-first page composition

---

# 3. Conditions module

## 3.1 Module purpose
The Conditions module answers:
- can I observe?
- how good are conditions?
- what are the biggest constraints right now?

It is a support module, not the primary decision panel.
It should reinforce the hero.

## 3.2 Preserve
- current endpoint usage
- current derived display logic
- current factual content categories
- current position in the support layer of the dashboard

## 3.3 Remove / replace
- module-local wrapper styles
- module-local card treatment
- independent border/shadow treatment
- ad hoc typography rules inconsistent with shared system
- any hardcoded mode-specific color usage

## 3.4 Required primitives
- `GlassPanel`
- `SectionHeader`
- shared text roles from semantic tokens

## 3.5 Optional primitives
- `RowItem` only if conditions are expressed as repeated fact rows and the pattern fits naturally

## 3.6 Required visual outcome
The module should feel:
- concise
- crisp
- supportive
- easy to scan
- lower emphasis than hero and targets

## 3.7 Visual anti-patterns
Reject the transform if:
- it looks visually louder than targets
- it becomes a giant weather card
- it uses large decorative graphics
- it uses bespoke styling that no other module shares

---

# 4. Recommended Targets module

## 4.1 Module purpose
This is one of the most important support modules.
It operationalizes the recommendation layer below the hero.

It should answer:
- what should I look at?
- which targets matter most?
- what is the rough ordering or priority?

## 4.2 Preserve
- target fetching logic
- current data ordering behavior
- current expansion/drill affordance if already implemented
- target-specific metadata already shown if still useful

## 4.3 Remove / replace
- module-specific wrapper styles
- bespoke row styling that duplicates future shared row behavior
- inconsistent spacing between rows and header
- repeated local mini-card treatments unless formalized as system variants

## 4.4 Required primitives
- `GlassPanel`
- `SectionHeader`
- `RowItem` or a shared row-derived structure

## 4.5 Visual priority
Among support modules, this should usually be one of the strongest.
It must feel closer to the hero than alerts or passes.

## 4.6 Required visual outcome
The transformed Targets module should feel:
- actionable
- curated
- structured
- decision-supportive
- visually aligned with the hero

## 4.7 Visual anti-patterns
Reject the transform if:
- target rows look like a generic HTML list
- the module loses clarity in favor of decorative visuals
- each target becomes an oversized card without clear reason
- row interactions feel unrelated to alerts/passes rows

---

# 5. Alerts / Events module

## 5.1 Module purpose
The Alerts module surfaces notable events, opportunities, or cautions.
It is informational support, not the center of the page.

## 5.2 Preserve
- current alert/event content logic
- list/count structure where relevant
- any useful severity or timing metadata already shown

## 5.3 Remove / replace
- local wrapper styling
- local list-item styling that can be handled by shared row treatment
- overemphasized alert coloration that competes with the hero

## 5.4 Required primitives
- `GlassPanel`
- `SectionHeader`
- `RowItem` if rendered as a repeated list

## 5.5 Required visual outcome
The transformed Alerts module should feel:
- informative
- controlled
- visible
- clearly secondary

## 5.6 Visual anti-patterns
Reject the transform if:
- alerts scream for attention constantly
- warning colors dominate the module even when content is minor
- the module becomes stronger than targets

---

# 6. Passes module

## 6.1 Module purpose
The Passes module presents upcoming satellite or related pass opportunities.
It is useful but secondary.

## 6.2 Preserve
- pass list logic
- time-based metadata
- existing endpoint usage
- ordering logic

## 6.3 Remove / replace
- custom wrapper styling
- custom row layout if it duplicates target or alert row structure
- inconsistent metadata alignment

## 6.4 Required primitives
- `GlassPanel`
- `SectionHeader`
- `RowItem`

## 6.5 Required visual outcome
The module should feel:
- orderly
- compact
- precise
- metadata-friendly
- secondary to hero and targets

## 6.6 Visual anti-patterns
Reject the transform if:
- pass items become bulky cards
- metadata alignment is sloppy
- the module uses a visual language different from targets/alerts rows

---

# 7. Moon Summary module

## 7.1 Module purpose
Moon Summary is a compact supporting module.
It should quickly orient the user to moon conditions relevant to observing.

## 7.2 Preserve
- current derivation from conditions data
- current factual moon-related content
- compact role in the dashboard

## 7.3 Remove / replace
- local wrapper styles
- one-off panel surface treatment
- inconsistent typography roles

## 7.4 Required primitives
- `GlassPanel`
- `SectionHeader`
- shared text roles

## 7.5 Optional primitives
- row or fact-line structure if the content naturally fits

## 7.6 Required visual outcome
The transformed module should feel:
- compact
- quiet
- useful
- tidy
- unmistakably part of the same panel family

## 7.7 Visual anti-patterns
Reject the transform if:
- it becomes oversized
- it tries to visually compete with hero or targets
- it becomes a special-case styling island

---

# 8. Top bar transformation

## 8.1 Purpose
The top bar is not one of the core data modules, but it is still part of the transform map because it must join the system language.

## 8.2 Preserve
- location control behavior
- mode control behavior
- product identity / title behavior
- any existing practical controls that belong there

## 8.3 Remove / replace
- generic nav-bar styling
- unstructured clusters with inconsistent spacing
- isolated controls that do not align with the app shell

## 8.4 Required primitives / structure
- `AppShell`
- `TopBar`
- shared button/control styling where practical

## 8.5 Required visual outcome
The top bar should feel:
- integrated
- calm
- product-like
- clearly part of the command-surface shell

---

# 9. Hero transformation

## 9.1 Purpose
The hero is effectively a new top-level transform rather than a simple module conversion.
It turns the current dashboard from "modules first" into "decision first."

## 9.2 Preserve
- any existing top-level decision content that can be reused
- current observing-status logic if already available
- current CTA concepts if they align with the product

## 9.3 New requirements
- `ObservingHero`
- `GlassPanel` hero variant
- `StatusBadge`
- `AppButton`
- hero-specific semantic emphasis tokens

## 9.4 Required outcome
The hero must:
- appear above the support grid
- dominate visually
- summarize observing quality and next action
- make the page feel like a product instead of a set of widgets

## 9.5 Failure condition
Reject the transform if:
- the hero does not clearly dominate
- the page still reads as a flat module board
- the hero behaves like a decorative banner instead of a decision surface

---

# 10. Module-order and hierarchy rules

Once transformed, modules must preserve this hierarchy:

## Primary
- Hero

## Strong secondary
- Targets
- Conditions

## Secondary
- Alerts
- Passes
- Moon Summary

This does not always require hardcoded order changes in every layout context, but the composition should reflect this hierarchy visually and structurally.

---

# 11. Before/after review checklist

Use this checklist during each module conversion.

## Preserve check
- Did feature logic remain intact?
- Did data contracts remain untouched?
- Did the module keep its original product purpose?

## System check
- Does the module now use shared primitives?
- Did local wrapper/card styling get removed?
- Are theme values coming from tokens rather than direct values?

## Hierarchy check
- Is the module visually placed at the correct level?
- Does it compete too much or too little with surrounding modules?

## Consistency check
- Does it feel like part of the same product family?
- Does it still fit in light, dark, high contrast, and red modes?

---

# 12. Execution note

This document should be used alongside:
- `UI_PHASE_B_SPEC.md`
- `PHASE_B_EXECUTION_TODO.md`
- `UI_VISUAL_CALIBRATION.md`

Use this file when converting one module at a time so the coder is not forced to infer what "convert to the new system" means.
