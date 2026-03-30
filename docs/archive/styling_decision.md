# 🌌 ASTRONOMY HUB — STYLING DECISION (AUTHORITATIVE)

---

# 0. PURPOSE

This document defines:

> **The official theming and visual mode system for Astronomy Hub**

It establishes:

* required visual modes
* how themes are implemented
* what must remain consistent across modes
* what must change across modes

---

# 1. 🧠 CORE RULE

```text id="v7p3k1"
Astronomy Hub is a multi-mode system.

It is NOT a dark-mode application.
```

---

# 2. 🎨 REQUIRED VISUAL MODES (LOCKED)

The system MUST support exactly **five modes**:

---

## 2.1 Light Mode

Purpose:

* daytime usage
* general accessibility

Characteristics:

* light background
* dark text
* standard contrast

---

## 2.2 Light High Contrast

Purpose:

* accessibility (vision impairment)
* bright environments

Characteristics:

* stronger contrast
* sharper edges
* reduced subtle gradients

---

## 2.3 Dark Mode

Purpose:

* default system experience
* nighttime usage

Characteristics:

* deep dark background
* soft contrast
* reduced brightness

---

## 2.4 Dark High Contrast

Purpose:

* clarity in low-light environments
* accessibility

Characteristics:

* stronger contrast than Dark
* sharper separation of elements
* higher readability

---

## 2.5 Red Mode (Astrophotography Mode)

Purpose:

* preserve night vision
* telescope use
* field observation

---

### Characteristics

* red-only color palette
* no blue light
* no white light
* minimal brightness
* dim UI

---

### Rule

```text id="r8k2p7"
Red Mode must not break night vision under any circumstance.
```

---

# 3. ⚙️ IMPLEMENTATION MODEL (MANDATORY)

---

## 3.1 Token-Based System

```text id="t6m3x9"
All styling must be driven by semantic tokens
```

---

## Example

Instead of:

```css
color: #ffffff;
```

Use:

```css
color: var(--text-primary);
```

---

## 3.2 Mode Switching

Each mode must define:

* color tokens
* contrast levels
* background values

---

## Rule

```text id="y2p7v4"
Layout, spacing, and structure must NOT change between modes
```

---

# 4. 🎯 SEMANTIC COLOR SYSTEM

---

## Must Define

* background
* surface
* primary text
* secondary text
* accent
* success
* warning
* error

---

## Rule

```text id="k9r4m1"
Colors must represent meaning, not decoration
```

---

---

# 5. 🌌 RED MODE (CRITICAL SYSTEM)

---

## Strict Requirements

---

### Allowed

* deep red tones
* very dark backgrounds
* low brightness UI

---

### Forbidden

* white
* blue
* bright colors
* glow effects
* high brightness

---

## UI Adjustments

* reduce visual noise
* remove unnecessary highlights
* simplify overlays

---

## Rule

```text id="f3k9q2"
If any element breaks dark adaptation, the implementation is invalid
```

---

# 6. 🧱 COMPONENT CONSISTENCY

---

## Rule

```text id="m4p7x8"
All components must behave identically across modes
```

---

## Must Remain Constant

* layout
* spacing
* hierarchy
* interaction behavior

---

## Must Change

* color
* contrast
* brightness

---

# 7. 🔦 CONTRAST RULES

---

## Light Modes

* strong readability
* high clarity

---

## Dark Modes

* softer contrast
* reduced eye strain

---

## High Contrast Modes

* maximum readability
* accessibility-first

---

## Rule

```text id="c2t9r5"
Contrast must match environment, not preference alone
```

---

# 8. 🎛️ USER CONTROL

---

## Requirements

User must be able to:

* switch modes instantly
* persist preference
* override system defaults

---

## Default Behavior

* system may detect environment
* default to Dark Mode
* allow manual override

---

# 9. ⚠️ FORBIDDEN PRACTICES

---

The system must NOT:

* collapse to a single theme
* treat Red Mode as optional
* hardcode colors
* mix inconsistent color systems
* break hierarchy across modes

---

# 10. 🧪 VALIDATION CRITERIA

---

Styling system is correct ONLY IF:

---

## Mode Switching

* all 5 modes work
* switching is instant
* no visual glitches

---

## Consistency

* layout identical across modes
* components behave consistently

---

## Red Mode

* no white/blue light
* no brightness spikes
* usable in real dark conditions

---

## Accessibility

* high contrast modes improve readability
* text is always readable

---

# 11. 🚫 FAILURE CONDITIONS

---

Styling system is invalid if:

* any mode is missing
* red mode is compromised
* layout changes between modes
* colors are hardcoded
* accessibility is reduced

---

# 12. 🔥 FINAL STATEMENT

```text id="p8k2x6"
The styling system is not cosmetic.

It is a functional system that adapts Astronomy Hub
to real-world environments.
```

---

## Where you are now

You’ve now locked:

* UI structure
* UI behavior
* UI phases
* styling system (correctly with 5 modes)

---

## Next (final styling piece)

👉 `styling_audit.md`

This ensures:

* your current UI is checked against this system
* violations are identified
* fixes are prioritized

---