# UI_VISUAL_CALIBRATION.md

# UI Visual Calibration — Phase B Lock

## Purpose

This document removes the last layer of visual ambiguity from UI Phase B.

`UI_PHASE_B_SPEC.md` defines the architectural and structural rules.
`PHASE_B_EXECUTION_TODO.md` defines the implementation order.
This file defines the visual calibration ranges, ratios, and tolerances that make the design direction reproducible.

This is not a mood-board document.
This is a calibration document.

Use it when a coder or reviewer asks:
- how strong should the glow be?
- how subtle is "subtle"?
- how much transparency is acceptable?
- how much larger should the hero be than a standard panel?
- how dark is dark mode allowed to become?
- how bright is light mode allowed to become?
- what visually counts as "same design, different theme"?

---

# 1. Calibration philosophy

The target UI is:

- cinematic, but not game-like
- elevated, but not glossy
- layered, but not noisy
- premium, but not ornamental
- dark and atmospheric in dark mode, but not muddy
- bright and clean in light mode, but not flat
- accessible in high-contrast modes, but not visually separate
- astronomy-safe in red mode, but still clearly the same product

This document defines ranges and relationships.
Do not treat the numbers below as optional styling suggestions.

---

# 2. Visual hierarchy ratios

## 2.1 Hero dominance

The hero must be visually dominant over a standard module.

### Required hero-to-standard ratios
- Hero vertical padding must be between **1.35x and 1.8x** standard panel vertical padding.
- Hero title size must be between **1.45x and 1.9x** standard panel title size.
- Hero border or glow emphasis may be between **1.15x and 1.6x** the perceived intensity of a standard panel.
- Hero support text block width should generally remain narrower than the full hero width to preserve readability.

### Forbidden
- Hero treated as just another card
- Hero title only slightly larger than section titles
- Hero more than 2x the visual intensity of standard panels
- Hero with decorative effects so strong that support modules disappear by comparison

---

## 2.2 Primary / secondary / tertiary contrast

### Primary layer
Must visibly lead the page within the first glance.

### Secondary layer
Must read as clearly grouped support modules and not compete with the hero.

### Tertiary layer
Must remain readable without pulling initial focus.

### Practical interpretation
- Panel heading contrast must be stronger than row metadata.
- Row primary labels must be stronger than row support text.
- Metadata must not use the same emphasis as titles.
- Accent color must not be used as a substitute for hierarchy everywhere.

---

# 3. Spacing calibration

## 3.1 Core spacing rhythm

Recommended baseline token values come from `tokens.css`, but this file locks how they should be used perceptually.

### Standard module rhythm
- Panel internal horizontal padding: `space-6` to `space-7`
- Panel internal vertical padding: `space-6` to `space-7`
- Header-to-body gap: `space-4` to `space-5`
- Row-to-row gap in list modules: `space-3` to `space-4`
- Panel-to-panel gap in a stacked column: `space-6`

### Hero rhythm
- Hero internal padding: `space-7` to `space-9`
- Eyebrow/meta to title gap: `space-3` to `space-4`
- Title to summary gap: `space-3` to `space-4`
- Summary to CTA gap: `space-5` to `space-6`

### Global layout rhythm
- Top bar to hero gap: `space-6` to `space-7`
- Hero to lower grid gap: `space-7`
- Lower grid inter-column gap: `space-6`
- Large section shifts should prefer one consistent scale rather than ad hoc values

---

## 3.2 Empty-space rules

### Allowed
- breathing room that reinforces hierarchy
- enough panel padding to feel premium
- controlled whitespace around hero and grid

### Forbidden
- oversized dead air on desktop
- squeezed interior spacing that makes panels feel cramped
- giant mobile padding that destroys density
- random per-module spacing scales

---

# 4. Border calibration

## 4.1 Standard panel border opacity

The target border treatment is thin and controlled.

### Recommended opacity ranges
#### Dark mode
- standard panel border opacity: **0.06 to 0.11**
- stronger panel or hero border opacity: **0.10 to 0.18**

#### Light mode
- standard panel border opacity: **0.07 to 0.12**
- stronger panel or hero border opacity: **0.10 to 0.16**

#### High contrast
- standard panel border opacity: **0.16 to 0.28**
- stronger panel or hero border opacity: **0.22 to 0.36**

#### Red mode
- standard panel border opacity: **0.10 to 0.18**
- stronger panel or hero border opacity: **0.16 to 0.28**

### Border rules
- borders should usually be 1px
- 2px is allowed only for specific focus or emphasis cases
- thick permanent module borders are forbidden
- border brightness must not become the main source of depth

---

# 5. Panel transparency calibration

## 5.1 Standard panel background opacity

### Dark mode
- panel background opacity should generally fall between **0.50 and 0.72**
- below 0.45 risks overexposing the background
- above 0.80 risks looking like a flat opaque box

### Light mode
- panels may be mostly opaque, but should still preserve some layered depth
- effective opacity can range from **0.88 to 1.00**
- use overlay or subtle shadow to preserve elevation if transparency is low

### High contrast
- increase solidity where needed for readability
- effective opacity target: **0.82 to 1.00** depending on mode

### Red mode
- use enough solidity to keep red-safe readability stable
- avoid translucent treatment so weak that text competes with background haze

---

# 6. Shadow and glow calibration

## 6.1 General principle

Glow is not decoration.
Glow is depth language.

It should signal:
- elevation
- hierarchy
- interactivity
- focus

It must not become:
- neon ornament
- sci-fi effect spam
- halo clutter around every object

---

## 6.2 Panel shadow/glow ranges

### Standard panel
- outer shadow/glow intensity should read as subtle
- target visual strength: **1.0 baseline**
- hover state may increase to **1.1 to 1.22 baseline**
- anything beyond **1.28 baseline** for standard panels is usually too strong

### Hero panel
- base strength may read between **1.2 and 1.5 baseline**
- hover or emphasis may rise to **1.35 to 1.65 baseline**
- above **1.75 baseline** risks becoming flashy or game-like

### High contrast
- rely slightly more on border/text clarity and slightly less on glow alone
- glow should support, not replace, contrast

### Red mode
- glow should be reduced relative to dark blue/cyan treatment
- hierarchy should rely more on contrast, structure, and spacing than on luminous bloom

---

## 6.3 Blur/spread guidance

Because exact CSS formulas can vary, calibrate by visual result:

### Standard panel
- blur radius should read soft, not large
- spread should be minimal or absent
- edge should remain controlled

### Hero panel
- may use a slightly broader shadow/glow than standard panels
- still must not create a fog band across the page

---

# 7. Background calibration

## 7.1 Allowed background composition

A calibrated background may use:
1. base tone
2. one or two soft radial gradients
3. very subtle texture/noise
4. one restrained emphasis glow behind hero if it improves hierarchy

## 7.2 Forbidden background behavior
- photo wallpaper
- obvious starscape image
- bright nebula artwork
- strong vignette that darkens content edges excessively
- visible texture that reads as grain
- many competing glow centers
- saturated color blooms behind support modules

## 7.3 Background intensity targets

### Dark mode
- atmospheric gradient visibility should be perceptible but not attention-grabbing
- background should remain at least **2 visual steps quieter** than major panels

### Light mode
- depth must come mostly from layering and tone shifts, not dramatic glow
- avoid pure flat white everywhere

### Red mode
- background complexity should usually be reduced compared to dark mode
- background should not create mixed-color contamination

---

# 8. Typography calibration

## 8.1 Type hierarchy rules

### Hero title
- visually strong
- likely semibold or bold
- never overly condensed or stylized
- line length should remain readable

### Section titles
- clear, modern, restrained
- one level below hero, not too close in size

### Body/support text
- must remain readable at a glance
- should not be so faint that users need to stare

### Metadata
- quieter than support text
- readable, not ghosted

---

## 8.2 Contrast targets by role

### Dark mode
- primary text must be crisp
- secondary text should remain clearly readable
- muted text must still pass practical readability against its surface

### Light mode
- primary text must not be soft gray
- secondary text may be cooler/lighter but must still remain legible
- avoid washed-out pale UI text

### High contrast
- secondary text should come much closer to primary than in standard modes
- muted roles should be used carefully

### Red mode
- do not use weak dark-red-on-black combinations
- preserve contrast through luminance separation, not just hue change

---

# 9. Action/button calibration

## 9.1 Primary action

The primary CTA should feel clearly actionable without looking like a consumer-app marketing button.

### Calibration targets
- stronger contrast than surrounding panel surfaces
- smaller visual footprint than the hero title area
- hover state should be noticeable but not jumpy
- focus-visible must be obvious
- button shape should feel product-level and consistent with panel language

### Forbidden
- huge pill buttons dominating the hero
- glossy gradients
- hardcoded bright green or blue values unrelated to the theme system
- multiple competing primary CTAs in the same region

---

# 10. Row calibration

## 10.1 Repeated rows

Rows in targets, passes, alerts, and similar structures must feel related.

### Calibration rules
- primary row label should be the visual anchor
- secondary support text should remain readable but lower emphasis
- right-side metadata should be concise and aligned
- row hover treatment should be milder than panel hover treatment
- row separators, if used, should be quieter than panel borders

### Density
- rows should feel compact but breathable
- avoid overly tall "mobile app list item" styling on desktop
- avoid compressed spreadsheet-like line packing

---

# 11. Theme equivalence rules

This section defines what "same design, different theme" means.

## 11.1 Must remain identical across themes
- layout structure
- hero placement
- grid placement
- panel radii
- spacing rhythm
- typography hierarchy
- button shapes
- row composition
- section header structure
- responsive collapse behavior

## 11.2 Allowed to vary across themes
- background values
- border opacity
- panel transparency
- glow color and strength
- text contrast
- accent color family
- focus ring color
- subtle overlay tone

## 11.3 Visual equivalence test
When switching modes:
- the interface should still be instantly recognizable as the same app
- no theme should feel like a separate product skin
- red mode must still feel like Astronomy Hub, not a special novelty mode
- high-contrast modes must feel like accessibility variants, not alternate redesigns

---

# 12. Reviewer checklist

Use this before approving any major UI Phase B styling pass.

## Hero
- Is the hero clearly dominant?
- Is the hero calmer than a marketing banner?
- Is the hero stronger than a support panel by a visible but controlled margin?

## Panels
- Do all panels feel like one family?
- Are borders thin and controlled?
- Are panels elevated without becoming glossy?

## Background
- Is the background atmospheric but quiet?
- Does the background stay subordinate to content?

## Typography
- Is text hierarchy clear at first glance?
- Is any text too faint for practical use?

## Actions
- Is the primary CTA clear but not oversized?
- Are focus states obvious?

## Rows
- Do list modules feel related?
- Are rows readable and well-aligned?

## Themes
- Do all themes preserve the same design language?
- Do high-contrast modes clearly improve readability?
- Does red mode remain astronomy-safe and coherent?

---

# 13. Failure conditions

Reject a Phase B visual pass if any of the following are true:
- the hero looks like just another card
- support modules outcompete the hero
- panels are flat opaque boxes with no depth
- glow is obviously decorative
- borders are thick and loud
- light mode is washed out and flat
- dark mode is muddy and under-contrasted
- red mode becomes a novelty recolor
- themes visibly change structure
- text is too faint to scan quickly
- rows look unrelated across modules

---

# 14. Relationship to execution

This file does not replace `UI_PHASE_B_SPEC.md` or `PHASE_B_EXECUTION_TODO.md`.

Use:
- `UI_PHASE_B_SPEC.md` for system rules
- `PHASE_B_EXECUTION_TODO.md` for implementation order
- `UI_VISUAL_CALIBRATION.md` for visual correctness review
