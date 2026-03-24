# UI Phase B — Grand Design Rebaseline & Product UI System (Authoritative Execution Spec)

## Purpose

UI Phase B replaces the earlier "polished dashboard" direction with a full product-grade UI system rebaseline.

This phase is responsible for turning Astronomy Hub from a functional module dashboard into a guided astronomy command surface that feels intentional, premium, calm, and field-ready.

This document is not a loose design brief.
It is the authoritative execution specification for the entire Phase B UI transformation.

The implementation goal is not merely "make it look better."
The goal is to establish a reusable, extensible, theme-safe UI foundation that all future UI work must inherit.

---

## Why this phase exists

The repository currently shows:
- Phase 1 complete
- Phase 2 complete
- UI Phase A complete
- UI Phase B active
- an existing UI Phase B spec that still reflects a lighter "dashboard polish" mindset rather than the new grand design target. The repo root README and current project state both identify UI Phase B as the active phase, while the current UI Phase B spec remains anchored to a more conservative dashboard style. citeturn351042view0turn232743view1turn351042view1

That mismatch must be resolved here.

This document formally redefines UI Phase B around the grand design target:
- one design system
- multiple visual modes
- hero-first hierarchy
- cinematic but restrained observatory styling
- a unified theming and layout architecture
- reusable panel and row primitives
- responsive behavior that preserves hierarchy
- accessibility built into the system rather than patched on later

---

## Relationship to other project docs

This spec must be treated as compatible with and subordinate to:
- `docs/ASTRONOMY_HUB_MASTER_PLAN.md`
- `docs/PROJECT_STATE.md`
- `docs/SESSION_CONTINUITY_BRIEF.md`
- `docs/UI_MASTER_PLAN.md`

This document does not change backend phase boundaries.
This document does not authorize Phase C exploration features.
This document only redefines how the current application should look, feel, and be structured at the UI-system level.

---

## Product framing (locked)

Astronomy Hub is:

- a decision-support astronomy product
- a field-ready observing companion
- a guided astronomy interface
- a command surface for "what matters now"

Astronomy Hub is not:

- a generic SaaS dashboard
- a GitHub-style admin screen
- a raw astronomy data grid
- a widget board
- a scientific data dump
- a dense observatory control panel for expert-only workflows

The interface must primarily answer:

> What should I know about the sky right now from where I am, and what should I look at next?

This sentence is not marketing copy.
It is the organizing rule for hierarchy, layout, emphasis, and future UI decisions.

---

## Phase B mission statement (locked)

UI Phase B must deliver all of the following together:

1. A formal theme system that supports:
   - light mode
   - light mode high contrast
   - dark mode
   - dark mode high contrast
   - red mode

2. A formal layout system that:
   - preserves one design across all modes
   - preserves hierarchy across desktop, tablet, and mobile
   - supports a dominant hero panel with unified supporting modules

3. A formal visual system that:
   - replaces ad hoc styling
   - defines panels, headers, rows, actions, states, and spacing
   - makes future implementation predictable

4. A formal primitive/component system that:
   - minimizes one-off module styling
   - centralizes panel treatment
   - centralizes section headers and row patterns
   - centralizes button, badge, and state behavior

5. A migration path that:
   - preserves current functionality
   - does not change backend contracts
   - does not introduce Phase C feature scope
   - incrementally converts the existing frontend to the new system

---

## Non-negotiable design rules

### Rule 1 — Design is fixed, theme is variable

There is one UI design system.

All supported modes must share the same:
- information hierarchy
- component structure
- page structure
- spacing rhythm
- typography hierarchy
- icon placement logic
- interaction model
- responsive collapse behavior

Only theme tokens may vary by mode:
- colors
- transparency values
- border strength
- glow strength
- text contrast
- background treatment intensity

No theme is allowed to become a separate design language.

### Rule 2 — Hero-first hierarchy

The top of the page must be dominated by one primary, decision-oriented hero panel.

This panel must visually and structurally answer:
- is observing good?
- what time window matters?
- what should I do next?
- what is tonight's or right-now plan?

All supporting modules exist to reinforce, clarify, or extend that primary decision layer.

### Rule 3 — Shared primitives first, module styling second

No major module may be visually re-authored independently before the shared primitive system exists.

All module restyling must inherit from shared primitives.

### Rule 4 — No hardcoded mode styling in modules

Modules may not hardcode theme-specific colors, borders, or glow rules.
They must consume semantic tokens and shared primitives only.

### Rule 5 — Accessibility is part of the base system

High contrast modes are not a later patch.
Keyboard focus, contrast, and readable state behavior must be part of the Phase B system itself.

### Rule 6 — No Phase C drift

This phase does not authorize:
- new exploratory drill-down systems
- 3D views
- sky maps
- charts
- expanded analytics
- animated data visualizations
- new data features
- backend redesign

If a change is required only because of appearance, hierarchy, theming, layout, or accessibility, it belongs in Phase B.
If a change introduces new exploration depth or new functionality, it belongs in a later phase.

---

## Target visual character (locked)

The UI must feel:

- calm
- immersive
- premium
- astronomy-native
- spatial without being flashy
- cinematic without being game-like
- dense enough to be useful
- controlled enough to avoid overload

The visual direction should be understood as:

- deep atmospheric background, not a flat app background
- glass-like panel elevation, not heavy opaque boxes
- thin illuminated edges, not thick borders
- restrained gradients and glows, not decorative excess
- strong primary/secondary/tertiary hierarchy
- modern readable typography, not sci-fi novelty type
- generous but disciplined spacing
- strong content grouping and visual rhythm

The UI should feel like a premium observatory companion interface, not like a generic admin panel.

---

## Information hierarchy (locked)

The page hierarchy must remain:

### Primary layer
- observing quality / status
- observing window / current usable time
- central recommendation / plan
- main CTA

### Secondary layer
- conditions
- recommended targets
- alerts / events
- passes
- moon summary

### Tertiary layer
- metadata
- explanatory labels
- secondary counts
- inline details
- progressive disclosure affordances

All layout, typography, spacing, color emphasis, and motion decisions must reinforce that hierarchy.

---

## Supported modes (locked)

The Phase B system must support all of these modes using the same design language:

1. `theme-light`
2. `theme-light-hc`
3. `theme-dark`
4. `theme-dark-hc`
5. `theme-red`

### Additional mode rules

#### Light mode
- not washed out
- must preserve depth through layering and controlled elevation
- must remain clearly related to dark mode in structure and styling

#### Light high contrast
- stronger borders
- lower transparency where needed
- stronger text contrast
- no layout changes
- no size changes

#### Dark mode
- baseline cinematic mode
- primary reference for atmospheric styling
- must not become muddy or overly low-contrast

#### Dark high contrast
- improved readability
- stronger text separation
- stronger border visibility
- reduced dependence on subtle glow alone

#### Red mode
- astronomy-safe
- avoid cold blue emphasis
- still part of the same product family
- must not become a separate novelty skin
- should preserve hierarchy even with limited color space

---

## Required frontend architecture outcome

At the end of Phase B, the frontend must conceptually consist of these layers:

### Layer A — Tokens
Raw, reusable values for:
- spacing
- radii
- typography sizes
- font weights
- opacity levels
- shadow recipes
- background layers
- motion timing
- z-index roles

### Layer B — Theme definitions
Mode-specific mappings for:
- background values
- panel values
- border values
- text roles
- status roles
- accent roles
- glow values
- focus ring values

### Layer C — Semantic tokens
Meaning-based tokens that primitives consume, such as:
- page background
- shell background
- panel background
- panel border
- panel shadow
- text primary
- text secondary
- text muted
- hero glow
- primary action background
- primary action text
- status good background
- status good text
- focus ring
- divider color
- subtle hover overlay

### Layer D — Primitives
Shared building blocks:
- app shell
- top bar
- glass panel
- panel header
- section header
- status badge
- button
- row item
- inline meta cluster
- icon slot
- hero frame

### Layer E — Layout composition
Page-level layout:
- shell
- hero
- two-column support grid
- stacked cards
- responsive collapse rules
- vertical rhythm

### Layer F — Feature modules
Existing product modules rebuilt from primitives:
- conditions
- targets
- alerts
- passes
- moon summary

No feature module may skip directly to raw styling once the primitive system exists.

---

## Required file structure (target architecture)

The exact final structure can adapt slightly to repository conventions, but the Phase B implementation must produce an equivalent architecture.

### Required design files
- `frontend/src/design/tokens.css`
- `frontend/src/design/themes.css`
- `frontend/src/design/semantic.css` or equivalent semantic token layer
- `frontend/src/design/motion.css` or equivalent state/motion token layer if separated

### Required shared UI files
- `frontend/src/components/ui/GlassPanel.jsx`
- `frontend/src/components/ui/SectionHeader.jsx`
- `frontend/src/components/ui/StatusBadge.jsx`
- `frontend/src/components/ui/AppButton.jsx`
- `frontend/src/components/ui/RowItem.jsx`

### Required layout files
- `frontend/src/components/layout/AppShell.jsx`
- `frontend/src/components/layout/TopBar.jsx`
- `frontend/src/components/layout/ContentGrid.jsx` or equivalent

### Required hero files
- `frontend/src/components/hero/ObservingHero.jsx`

### Required module conversion outcome
Existing feature modules may keep their names, but they must eventually be refactored to use the new primitive system.

---

## Token system specification

### Spacing scale (locked)

The system must define a consistent spacing scale and use it consistently across all major UI surfaces.

Recommended baseline:

- `--space-1: 4px`
- `--space-2: 8px`
- `--space-3: 12px`
- `--space-4: 16px`
- `--space-5: 20px`
- `--space-6: 24px`
- `--space-7: 32px`
- `--space-8: 40px`
- `--space-9: 48px`
- `--space-10: 56px`

#### Locked usage guidance
- card internal padding: `space-6` or `space-7`
- hero internal padding: `space-7` to `space-9`
- grid gap desktop: `space-6`
- section gap: `space-7`
- row vertical gap: `space-3` to `space-4`
- top-level page side padding: `space-6` desktop, reduced on smaller screens

Spacing values may be tuned, but the scale must remain coherent and tokenized.

### Radius scale (locked)

Recommended baseline:

- `--radius-xs: 6px`
- `--radius-sm: 8px`
- `--radius-md: 12px`
- `--radius-lg: 16px`
- `--radius-xl: 20px`
- `--radius-pill: 999px`

#### Locked usage guidance
- standard panel: `radius-lg`
- hero panel: `radius-xl` or tuned panel radius
- buttons: `radius-md`
- pills/badges: `radius-pill`
- internal mini surfaces: `radius-sm` or `radius-md`

### Typography scale (locked)

Recommended baseline:

- `--font-1: 12px`
- `--font-2: 14px`
- `--font-3: 16px`
- `--font-4: 18px`
- `--font-5: 22px`
- `--font-6: 28px`
- `--font-7: 36px`

Weights:
- `--weight-regular: 400`
- `--weight-medium: 500`
- `--weight-semibold: 600`
- `--weight-bold: 700`

#### Locked usage guidance
- hero eyebrow / meta: `font-2`
- body text: `font-3`
- panel heading: `font-4`
- section support text: `font-2` or `font-3`
- hero title: `font-6` desktop, responsive scaling on smaller screens
- tertiary metadata: `font-1` or `font-2`

### Depth and shadow tokens (locked)

The system must define shadow and glow tokens rather than allowing arbitrary box-shadow values throughout the app.

Recommended conceptual set:
- `--shadow-panel`
- `--shadow-panel-hover`
- `--shadow-hero`
- `--glow-soft`
- `--glow-medium`
- `--glow-strong`

These may resolve to multi-layer shadows if needed.

### Motion/state tokens (locked)

If motion is used, it must be subtle, fast, and structural rather than decorative.

Recommended:
- `--dur-fast`
- `--dur-base`
- `--ease-standard`
- `--ease-soft`

State transitions should primarily govern:
- hover glow increase
- border/intensity change
- background overlay response
- focus visibility
- active press feedback

---

## Color and semantic token model

### Base color values
Base colors may exist as raw values per theme, but components must not consume them directly.

### Required semantic token groups

#### Page and shell
- `--page-bg`
- `--page-bg-overlay`
- `--shell-max-width` (if tokenized)
- `--surface-0`
- `--surface-1`

#### Panels
- `--panel-bg`
- `--panel-bg-strong`
- `--panel-border`
- `--panel-border-strong`
- `--panel-shadow`
- `--panel-hover-overlay`

#### Text
- `--text-primary`
- `--text-secondary`
- `--text-muted`
- `--text-accent`
- `--text-inverse`

#### Actions
- `--action-primary-bg`
- `--action-primary-text`
- `--action-primary-border`
- `--action-primary-hover`
- `--action-secondary-bg`
- `--action-secondary-text`

#### Status
- `--status-good-bg`
- `--status-good-text`
- `--status-good-border`
- `--status-warning-bg`
- `--status-warning-text`
- `--status-warning-border`
- `--status-danger-bg`
- `--status-danger-text`
- `--status-danger-border`

#### Dividers and metadata
- `--divider`
- `--meta-chip-bg`
- `--meta-chip-text`

#### Focus
- `--focus-ring`
- `--focus-ring-offset`

### Hard rule
Feature modules and primitives must consume semantic tokens only.

---

## Background system specification

The app background must not be a single flat fill.

The system should use a controlled background stack composed of several optional layers depending on mode:

1. base page tone
2. soft radial atmospheric gradient(s)
3. very subtle texture/noise if desired
4. controlled glow areas behind hero or key regions if needed
5. overlay shaping to keep module readability high

### Locked background rules
- background effects must never reduce readability
- background layers must remain subtle
- no overt nebula art
- no distracting star wallpaper
- no photo-based background dependency
- red mode may require reduced layering to remain astronomy-safe

---

## Panel system specification

### Purpose
The panel system is the core surface architecture for the app.

Every major module and the hero panel must derive from the same panel language.

### GlassPanel requirements
The standard panel primitive must define:
- background treatment
- border treatment
- radius
- padding
- shadow/elevation
- hover response
- focus-within response
- optional header/footer slots

### Standard panel visual behavior
Panels should feel:
- elevated from the background
- softly bounded
- calm
- premium
- slightly luminous in dark modes
- readable and grounded in light modes

### Required panel variants
At minimum:
- `standard`
- `hero`
- `compact` if necessary for smaller internal surfaces

The hero variant may:
- use larger padding
- use stronger edge lighting or glow
- support an atmospheric highlight band
- visually dominate without becoming flashy

### Panel state model
Each panel must define behavior for:
- default
- hover
- active (if clickable)
- focus-within
- disabled or de-emphasized where relevant

### Panel restrictions
Modules may not invent their own unrelated borders or shadow treatments unless a formal variant is added to the system.

---

## Section header system specification

Each major module must use a shared section header structure.

A section header should support:
- title
- optional subtitle or context line
- optional right-side action/meta
- consistent spacing from body content
- consistent typography roles

The section header must help unify module rhythm across the page.

---

## Row/item system specification

Repeated data rows across the app should use a shared pattern where practical.

Examples:
- target rows
- pass rows
- alert rows
- condition fact rows

### Shared row expectations
A row should support:
- left cluster: icon/thumbnail + primary label + support text
- right cluster: metadata, rank, timing, chip, or affordance
- hover response if interactive
- optional expand affordance
- consistent internal spacing
- consistent divider behavior

### Row restrictions
Rows must not rely on unrelated one-off spacing or typography if they are fulfilling the same structural role.

---

## Status badge system specification

The status badge primitive should support at minimum:
- good
- neutral/info
- warning
- danger

It must define:
- background
- text color
- border if needed
- padding
- radius
- uppercase/title-case policy
- typography size

The hero's observing quality indicator should use this system, though the hero may style it as a stronger variant.

---

## Button/action system specification

### Primary button
Must support:
- prominent CTA usage in hero
- clear hover state
- focus-visible state
- active state
- disabled state

### Secondary button or tertiary action
Optional but recommended for module-level controls and future extensibility.

### Button restrictions
- no isolated one-off CTA styling
- no theme-specific direct values in components
- no oversized decorative treatments inconsistent with the panel language

---

## App shell and top bar specification

### App shell
The shell must:
- own page background
- apply global side padding
- constrain content width
- preserve vertical rhythm
- center the main content region
- support full-height rendering

### Top bar
The top bar must support the product shell and existing controls without feeling like a generic website nav.

It should support:
- product identity / title
- location context/control area
- mode control area
- future reserved actions without redesigning the shell

### Top bar visual rule
The top bar should be present, controlled, and integrated into the design language, not an afterthought or floating generic toolbar.

---

## Layout system specification

### Overall page silhouette
The page should read as:
1. shell
2. top bar
3. dominant hero region
4. supporting grid of panels

### Desktop layout
The desktop layout should:
- use a centered content shell
- intentionally occupy width
- preserve left/right breathing room
- support a large hero above a balanced two-column lower region

### Supporting grid
The lower content region should generally use:
- two columns on desktop
- stacked modules within each column as needed
- consistent inter-card gaps
- consistent vertical rhythm

### Tablet and mobile behavior
The system must define collapse rules so hierarchy survives on smaller screens.

#### Tablet
- may collapse from wide two-column to narrower one-column depending on width
- hero remains first and dominant
- section spacing remains intact

#### Mobile
- single-column stack
- hero remains first
- supporting modules stack in logical priority order
- no mode-specific layout changes
- no layout breakage because of long text

### Max width
The app should define a maximum content width appropriate for the design target so the experience feels intentional and premium rather than stretched or cramped.

---

## Hero specification

### Purpose
The hero is the primary decision surface of the page.

It must synthesize the product promise at a glance.

### Required hero content
At minimum:
- current status badge or quality indicator
- time window / context line
- hero title
- short summary / recommendation text
- primary CTA
- optional supporting inline metadata

### Hero behavior
The hero must:
- appear first
- be visually dominant
- have larger internal spacing than ordinary modules
- feel like the central command panel for the current observing period

### Hero visual treatment
The hero may include:
- stronger glow
- stronger border treatment
- subtle atmospheric highlight
- larger title typography
- elevated support text hierarchy

But it must not:
- use gimmicky effects
- become visually noisy
- overpower the whole page with decoration

---

## Module conversion requirements

The following existing functional modules must be visually refactored under the shared system without changing their fundamental feature role:

1. Conditions
2. Recommended Targets
3. Alerts / events
4. Satellite passes
5. Moon summary

### Conditions module
Must remain concise and decision-supportive.
It should answer whether observing is practical and why.

### Targets module
Must become one of the strongest supporting modules.
It should feel closely tied to the hero's recommendation layer.

### Alerts module
Must remain subordinate to the hero.
It should surface opportunity or caution without dominating the page.

### Passes module
Useful but secondary.
Must use the shared row system and not visually outcompete primary observing content.

### Moon summary
Compact, controlled, and supporting.

---

## Responsiveness specification

### Responsive principles
Responsive behavior must preserve:
- hierarchy
- readability
- action clarity
- panel integrity
- adequate touch spacing

### Breakpoint strategy
Exact breakpoints may follow existing frontend conventions, but the implementation must define and consistently use breakpoints for at least:
- desktop
- tablet
- mobile

### Required responsive behavior
- hero first at all sizes
- no broken two-column remnants on narrow screens
- no text overlap or overflow into clipped actions
- no hidden controls without deliberate design
- no theme-specific breakpoint differences

---

## Accessibility specification

Phase B must include accessibility at the system level.

### Required accessibility behavior
- visible keyboard focus
- sufficient contrast in default and high-contrast modes
- no information conveyed by color alone where avoidable
- readable type sizes
- interactive states visible without hover
- reduced transparency in high-contrast modes if needed for legibility

### High-contrast rule
High-contrast modes should improve readability by adjusting tokens, not by creating a separate layout or design.

---

## Implementation restrictions

### Not allowed
- hardcoded theme colors in feature modules
- one-off box-shadow styles per card
- module-specific panel systems
- inconsistent border radii
- unrelated spacing scales
- duplicated section header patterns
- arbitrary hover behavior
- separate layout structures per theme
- photo backgrounds
- heavy animation dependence
- Phase C feature additions disguised as UI work

### Allowed
- introducing shared primitives
- restructuring styling into tokens/themes/semantic layers
- replacing module wrappers with shared panels
- improving hierarchy
- improving density and readability
- improving responsive behavior
- improving accessibility
- adding theme-safe atmospheric styling

---

## Definition of done

UI Phase B is complete only when all of the following are true:

1. The application visually reads as a product-grade astronomy interface rather than a generic dashboard.
2. All five supported modes exist and share the same design language.
3. The hero panel is clearly dominant and recommendation-first.
4. Supporting modules feel visually unified.
5. No major module depends on hardcoded mode-specific values.
6. Shared primitives exist and are actually used.
7. Responsive behavior preserves hierarchy on desktop, tablet, and mobile.
8. Accessibility and high contrast are built into the token system.
9. Existing functionality remains intact.
10. Future UI work can extend the system without re-architecting styling again.

---

## Migration intent

This spec intentionally supports an incremental migration.

The expected delivery path is:
1. define tokens and theme architecture
2. define semantic layer
3. build primitives
4. build shell and hero
5. convert modules one by one
6. refine responsive behavior
7. validate accessibility and theme consistency

This sequence must be executed through a separate Phase B execution rail.

---

## Superseded direction

This spec supersedes the earlier UI Phase B framing that emphasized:
- GitHub-style interface
- light-touch dashboard polish
- subtle-border-only aesthetic
- lightweight local primitives as the main ambition

That direction is no longer sufficient for the current product target. The current UI Master Plan still describes Phase B in terms of design tokens, reusable components, responsive refinement, and accessibility, which is still correct at a high level, but this spec substantially deepens and redirects how those goals must be executed. citeturn232743view2turn351042view1
