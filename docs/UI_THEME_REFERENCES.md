# UI Theme References — UI Phase B (LOCKED)

This document locks the external theme references and rules for UI Phase B. All Phase B UI work must reference these sources and follow the mappings and constraints below.

## EXACT MODE MAPPING

- Light = GitHub Light
- Dark = GitHub Dark Default
- Red = Astronomy-safe (custom)

## 1. SOURCE REFERENCES

- Primary theme reference:
  - https://github.com/primer/github-vscode-theme

- Primary theme definition file:
  - https://github.com/primer/github-vscode-theme/blob/main/src/theme.js

- Color system reference (Primer):
  - https://primer.style/product/primitives/color/


## 2. LOCKED MODE MAPPING

- Light mode = GitHub Light
- Light HC Mode = GitHub Light High Contrast
- Dark mode = GitHub Dark Default
- Dark HC mode = GitHub Dark High Contrast
- Red mode = custom astronomy observing mode (non-GitHub, astronomy-specific)


## 3. USAGE RULES

- The GitHub VS Code theme repo is used as a VISUAL TOKEN REFERENCE.
- The Primer color system is the CANONICAL COLOR SOURCE when selecting or adjusting colors.
- The system should mirror GitHub UI behavior, not VS Code editor behavior.

Notes:
- Treat values in `theme.js` as visual tokens (examples of use, not as files to import).
- When exact values are unclear, prefer Primer primitives and document the choice.

## 3. COPY VS APPROXIMATE (AI RULE)

- Any automated agent (AI) implementing theme values MUST COPY token values exactly from the referenced sources when an exact mapping is available. Do not approximate, interpolate, or guess numeric color values. If the source provides a hex/rgba value, the implementation must use that same literal value.



## 4. UI TOKEN FAMILIES TO MIRROR

The app MUST derive styling from the following categories (apply Primer/Theme tokens to each family):

- page background
- surface/background layers (header, panels, sections)
- borders and dividers
- primary text
- secondary/muted text
- accent color (interactive blue)
- buttons (primary + secondary)
- inputs (text fields)
- dropdowns / select controls


## 5. EXPLICIT NON-GOALS

- Do NOT copy syntax highlighting rules.
- Do NOT replicate VS Code editor visuals.
- Do NOT import theme files directly into the app.
- Do NOT introduce a new design system — use Primer + GitHub theme references only.


## 6. RED MODE RULE

- Red mode is NOT part of the GitHub theme family.
- Red mode remains a custom, astronomy-optimized mode intended for low-light/night-vision use. Keep contrast low-luminance and avoid bright glows.
 
### Red mode strict rules

- Do NOT use white or off-white backgrounds or foregrounds in Red mode.
- Do NOT use blue or bluish accents in Red mode.
- Use low-luminance red tones only (no high-luminance reds or bright glows).
- Prefer subtle, low-opacity red status backgrounds and deep maroon borders for dividers.



## 7. FUTURE AI INSTRUCTION

All UI Phase B implementation MUST:

- Read this file (`docs/UI_THEME_REFERENCES.md`).
- Read `docs/UI_PHASE_B_SPEC.md`.
- Inspect the referenced `theme.js` when needed to match visual intent.
- Use Primer colors when exact values are unclear; document choices.


---

Goal: Ensure all future UI work uses explicit, shared, and repeatable design references instead of vague instructions like “make it look like GitHub”. This file is LOCKED for Phase B UI implementation guidance.
