# UI Phase B — Execution TODO Rail (Active)

## Purpose

This document is the active execution rail for UI Phase B.

It translates the Phase B authoritative spec into small, controlled implementation steps that can be executed by a coding agent without guesswork and reviewed by the architect after each step.

This file is intentionally procedural.
It exists so that implementation does not drift, skip foundational work, or collapse into large unreviewable styling changes.

---

## Execution rules

These rules are mandatory for every step in this document.

1. One step at a time.
2. No skipped steps.
3. No out-of-order execution unless a prior step is explicitly blocked.
4. Prefer minimal diffs.
5. Do not combine multiple large visual concerns in one step.
6. Do not rewrite feature logic when the step is about styling or composition.
7. Preserve working functionality after every step.
8. Review the rendered UI after every visual step.
9. Do not treat this file as historical until UI Phase B is complete.
10. Any needed deviation must be reflected back into the spec or this TODO rail before proceeding.

---

## Step format

Each step must include:
1. Step ID
2. Step name
3. REQUIRED or OPTIONAL
4. Files to modify
5. Goal
6. Why now
7. Implementation notes
8. Verification
9. Suggested commit message
10. Rollback note

---

# PHASE B0 — Documentation Rebaseline

## Step B0.A1
1. **Step ID:** B0.A1  
2. **Step name:** Replace UI Phase B spec with grand design execution spec  
3. **REQUIRED**  
4. **Files to modify:**  
   - `docs/product/ui/UI_PHASE_B_SPEC.md`  
5. **Goal:** Replace the existing Phase B spec so the repository no longer points to the outdated dashboard-polish direction.  
6. **Why now:** This prevents future AI sessions and contributors from drifting back to the previous visual target.  
7. **Implementation notes:**  
   - Preserve the file path.
   - Replace the contents rather than creating a competing spec file.
   - The final doc should define one design system with five supported modes and a hero-first command-surface hierarchy.
8. **Verification:**  
   - `cat docs/product/ui/UI_PHASE_B_SPEC.md`  
   - Confirm the file clearly states that it supersedes the earlier GitHub-style dashboard direction.
9. **Suggested commit message:**  
   - `B0.A1: docs(ui): replace UI Phase B spec with grand design execution spec`
10. **Rollback:**  
   - Restore the previous version from git.

## Step B0.A2
1. **Step ID:** B0.A2  
2. **Step name:** Create active Phase B execution rail  
3. **REQUIRED**  
4. **Files to modify:**  
   - `docs/execution/frontend/PHASE_B_EXECUTION_TODO.md` (new)  
5. **Goal:** Create the active procedural rail for UI Phase B implementation.  
6. **Why now:** The Phase 2 execution file is historical only and should not be reused as an active UI implementation rail. The repo README explicitly calls the Phase 2 execution file historical rather than active. citeturn351042view0turn232743view0  
7. **Implementation notes:**  
   - This file should remain active while Phase B is in progress.
   - It should use the same numbered, exact-path format used in prior execution rails.
8. **Verification:**  
   - `ls docs`
   - `cat docs/execution/frontend/PHASE_B_EXECUTION_TODO.md`
9. **Suggested commit message:**  
   - `B0.A2: docs(ui): add Phase B execution TODO rail`
10. **Rollback:**  
   - Remove the file or revert the commit.

## Step B0.A3
1. **Step ID:** B0.A3  
2. **Step name:** Update project state to reference Phase B rebaseline  
3. **REQUIRED**  
4. **Files to modify:**  
   - `docs/execution/PROJECT_STATE.md`  
5. **Goal:** Make current project state explicitly acknowledge that UI Phase B is active under the new grand design rebaseline.  
6. **Why now:** The project state file is authoritative context for new sessions and should identify the active UI direction clearly. The current project state already says UI Phase B is active and should now point to the redefined track. citeturn232743view1  
7. **Implementation notes:**  
   - Keep all existing phase-completion truth intact.
   - Add or update a short section clarifying the Phase B mission: theming engine, layout engine, shared UI primitives, and hero-first transformation.
8. **Verification:**  
   - `cat docs/execution/PROJECT_STATE.md`
   - Confirm Phase B language now references the design-system rebaseline.
9. **Suggested commit message:**  
   - `B0.A3: docs(state): clarify active UI Phase B rebaseline`
10. **Rollback:**  
   - Revert the file.

## Step B0.A4
1. **Step ID:** B0.A4  
2. **Step name:** Update UI master plan to align Phase B summary  
3. **REQUIRED**  
4. **Files to modify:**  
   - `docs/product/ui/UI_MASTER_PLAN.md`  
5. **Goal:** Revise the Phase B summary so it no longer reads like simple dashboard polish.  
6. **Why now:** The UI master plan currently describes Phase B in a lighter, high-level way; it should stay high-level but must align to the new Phase B mission. citeturn232743view2  
7. **Implementation notes:**  
   - Keep the UI master plan concise.
   - Update the Phase B deliverables line to reference theme architecture, layout system, shared primitives, responsive hierarchy, and accessibility.
8. **Verification:**  
   - `cat docs/product/ui/UI_MASTER_PLAN.md`
9. **Suggested commit message:**  
   - `B0.A4: docs(ui): align UI master plan with Phase B rebaseline`
10. **Rollback:**  
   - Revert the file.

---

# PHASE B1 — Theme Architecture Foundation

## Step B1.B1
1. **Step ID:** B1.B1  
2. **Step name:** Add design directory and token file skeleton  
3. **REQUIRED**  
4. **Files to modify:**  
   - `frontend/src/design/tokens.css` (new)  
   - create directory if needed: `frontend/src/design/`  
5. **Goal:** Introduce the raw token layer for spacing, radii, typography, depth, and motion values.  
6. **Why now:** All later styling work depends on a stable design token foundation.  
7. **Implementation notes:**  
   - Define only non-theme raw values here.
   - Include spacing, radius, typography, weight, timing, and shadow recipe tokens where appropriate.
   - Do not place light/dark/red values here.
8. **Verification:**  
   - `test -f frontend/src/design/tokens.css && echo ok`
   - Open the file and confirm it contains only raw tokens.
9. **Suggested commit message:**  
   - `B1.B1: frontend(design): add token foundation`
10. **Rollback:**  
   - Remove the file or revert.

## Step B1.B2
1. **Step ID:** B1.B2  
2. **Step name:** Add theme token file for supported modes  
3. **REQUIRED**  
4. **Files to modify:**  
   - `frontend/src/design/themes.css` (new)  
5. **Goal:** Define per-mode theme mappings for light, light HC, dark, dark HC, and red.  
6. **Why now:** The project already has a three-mode system in code, but Phase B requires a formal five-mode architecture. The current project state documents day/night/red as complete in the existing app and this step evolves that into the new system. citeturn232743view1  
7. **Implementation notes:**  
   - Create theme root classes such as `.theme-light`, `.theme-light-hc`, `.theme-dark`, `.theme-dark-hc`, `.theme-red`.
   - Define raw color values and theme mappings only.
   - Keep layout and spacing out of theme classes.
8. **Verification:**  
   - `test -f frontend/src/design/themes.css && echo ok`
   - Manually inspect the file for all five theme selectors.
9. **Suggested commit message:**  
   - `B1.B2: frontend(design): add five-mode theme mapping`
10. **Rollback:**  
   - Remove or revert the file.

## Step B1.B3
1. **Step ID:** B1.B3  
2. **Step name:** Add semantic token layer  
3. **REQUIRED**  
4. **Files to modify:**  
   - `frontend/src/design/semantic.css` (new)  
5. **Goal:** Introduce a semantic variable layer consumed by components instead of raw theme variables.  
6. **Why now:** This step enforces the rule that components should use meaning-based tokens rather than direct color variables.  
7. **Implementation notes:**  
   - Define semantic tokens for page background, panel background, borders, text roles, status roles, action roles, focus ring, divider, overlays, and hero emphasis.
   - Semantic variables may reference theme-level variables.
8. **Verification:**  
   - `test -f frontend/src/design/semantic.css && echo ok`
   - Confirm the file contains semantic roles rather than component selectors.
9. **Suggested commit message:**  
   - `B1.B3: frontend(design): add semantic token layer`
10. **Rollback:**  
   - Remove or revert the file.

## Step B1.B4
1. **Step ID:** B1.B4  
2. **Step name:** Wire design token styles into frontend entry  
3. **REQUIRED**  
4. **Files to modify:**  
   - frontend entry file(s), likely one of:
     - `frontend/src/main.jsx`
     - `frontend/src/App.jsx`
     - existing global style import location
5. **Goal:** Ensure tokens, themes, and semantic CSS files are loaded into the app.  
6. **Why now:** The design files must exist in the running app before primitives can consume them.  
7. **Implementation notes:**  
   - Keep import order stable: tokens first, themes second, semantic third, existing app styles last unless there is a reason to invert for overrides.
   - Do not yet remove old CSS.
8. **Verification:**  
   - Run frontend dev server.
   - Confirm no import/build errors.
9. **Suggested commit message:**  
   - `B1.B4: frontend(design): wire global design layers into app`
10. **Rollback:**  
   - Revert the import changes.

## Step B1.B5
1. **Step ID:** B1.B5  
2. **Step name:** Expand mode model to five supported classes  
3. **REQUIRED**  
4. **Files to modify:**  
   - existing mode state files / app shell files as needed  
5. **Goal:** Extend the existing mode system from Day/Night/Red into the five-mode architecture required by Phase B.  
6. **Why now:** The repo currently documents a three-mode implementation; this step expands that without redesigning app logic. citeturn232743view1  
7. **Implementation notes:**  
   - Preserve persistence behavior already in localStorage.
   - Preserve existing control behavior where practical.
   - Map existing modes into the new naming system cleanly.
   - Do not yet redesign the mode-control UI unless required for correctness.
8. **Verification:**  
   - Start frontend.
   - Toggle through all five modes.
   - Refresh and confirm persistence remains correct.
9. **Suggested commit message:**  
   - `B1.B5: frontend(mode): expand mode system to five themes`
10. **Rollback:**  
   - Revert the mode-state and persistence changes.

---

# PHASE B2 — Shared Primitives

## Step B2.C1
1. **Step ID:** B2.C1  
2. **Step name:** Create GlassPanel primitive  
3. **REQUIRED**  
4. **Files to modify:**  
   - `frontend/src/components/ui/GlassPanel.jsx` (new)  
6. **Goal:** Create the shared surface primitive for all major cards and modules.  
6. **Why now:** Panel language is the foundation of the new visual system.  
7. **Implementation notes:**  
   - Support at minimum `standard` and `hero` variants.
   - Use semantic tokens only.
   - Support `className` and children.
   - Prefer a clean API over heavy abstraction.
8. **Verification:**  
   - Import the component in one existing module temporarily or in a test render.
   - Confirm build succeeds.
9. **Suggested commit message:**  
   - `B2.C1: frontend(ui): add GlassPanel primitive`
10. **Rollback:**  
   - Remove the file or revert.

## Step B2.C2
1. **Step ID:** B2.C2  
2. **Step name:** Create SectionHeader primitive  
3. **REQUIRED**  
4. **Files to modify:**  
   - `frontend/src/components/ui/SectionHeader.jsx` (new)  
5. **Goal:** Standardize module header structure for titles, optional subtitles, and optional right-side actions/meta.  
6. **Why now:** Module rhythm depends on a consistent header language.  
7. **Implementation notes:**  
   - Support `title`, optional `subtitle`, optional `action`.
   - Use semantic tokens and tokenized spacing.
8. **Verification:**  
   - Import into one module or a temporary test render.
9. **Suggested commit message:**  
   - `B2.C2: frontend(ui): add SectionHeader primitive`
10. **Rollback:**  
   - Remove the file or revert.

## Step B2.C3
1. **Step ID:** B2.C3  
2. **Step name:** Create StatusBadge primitive  
3. **REQUIRED**  
4. **Files to modify:**  
   - `frontend/src/components/ui/StatusBadge.jsx` (new)  
5. **Goal:** Standardize status chip styling for good/warning/danger/info roles.  
6. **Why now:** The hero and supporting modules need shared status semantics.  
7. **Implementation notes:**  
   - Use semantic status tokens.
   - Support at minimum `good`, `warning`, `danger`, `info` variants.
8. **Verification:**  
   - Render multiple variants in a temporary test surface.
9. **Suggested commit message:**  
   - `B2.C3: frontend(ui): add StatusBadge primitive`
10. **Rollback:**  
   - Remove the file or revert.

## Step B2.C4
1. **Step ID:** B2.C4  
2. **Step name:** Create AppButton primitive  
3. **REQUIRED**  
4. **Files to modify:**  
   - `frontend/src/components/ui/AppButton.jsx` (new)  
5. **Goal:** Standardize primary and secondary action styling.  
6. **Why now:** The hero CTA and future module actions need consistent state behavior.  
7. **Implementation notes:**  
   - Support at least `primary` and `secondary`.
   - Include hover, focus-visible, and disabled behavior.
8. **Verification:**  
   - Render test variants and confirm no build errors.
9. **Suggested commit message:**  
   - `B2.C4: frontend(ui): add AppButton primitive`
10. **Rollback:**  
   - Remove the file or revert.

## Step B2.C5
1. **Step ID:** B2.C5  
2. **Step name:** Create RowItem primitive  
3. **REQUIRED**  
4. **Files to modify:**  
   - `frontend/src/components/ui/RowItem.jsx` (new)  
5. **Goal:** Introduce a shared repeated-row structure for lists like targets, passes, and alerts where applicable.  
6. **Why now:** This reduces drift between repeated list patterns across modules.  
7. **Implementation notes:**  
   - Support left content cluster, right meta/action cluster, optional thumbnail/icon, and interactive state hooks.
8. **Verification:**  
   - Temporary render with sample content.
9. **Suggested commit message:**  
   - `B2.C5: frontend(ui): add RowItem primitive`
10. **Rollback:**  
   - Remove the file or revert.

---

# PHASE B3 — Shell & Layout Rebuild

## Step B3.D1
1. **Step ID:** B3.D1  
2. **Step name:** Create AppShell layout component  
3. **REQUIRED**  
4. **Files to modify:**  
   - `frontend/src/components/layout/AppShell.jsx` (new)  
5. **Goal:** Centralize page background, max-width, side padding, and vertical rhythm in one layout wrapper.  
6. **Why now:** Layout must become structural rather than incidental.  
7. **Implementation notes:**  
   - AppShell should own the page background and content width constraint.
   - Consume page-level semantic tokens.
8. **Verification:**  
   - Temporary wrap app content with AppShell.
   - Confirm no build errors.
9. **Suggested commit message:**  
   - `B3.D1: frontend(layout): add AppShell`
10. **Rollback:**  
   - Remove or revert the file.

## Step B3.D2
1. **Step ID:** B3.D2  
2. **Step name:** Create TopBar layout component  
3. **REQUIRED**  
4. **Files to modify:**  
   - `frontend/src/components/layout/TopBar.jsx` (new)  
5. **Goal:** Formalize the page header into a shared shell component.  
6. **Why now:** The app header should be part of the design system rather than ad hoc layout markup.  
7. **Implementation notes:**  
   - Preserve current controls and content.
   - Focus on structure and styling, not feature expansion.
8. **Verification:**  
   - Render in app shell.
   - Confirm existing controls remain usable.
9. **Suggested commit message:**  
   - `B3.D2: frontend(layout): add TopBar`
10. **Rollback:**  
   - Remove or revert the file.

## Step B3.D3
1. **Step ID:** B3.D3  
2. **Step name:** Create content grid wrapper  
3. **REQUIRED**  
4. **Files to modify:**  
   - `frontend/src/components/layout/ContentGrid.jsx` (new) or equivalent  
5. **Goal:** Define the lower-page support grid as a reusable layout primitive.  
6. **Why now:** Two-column support layout must be explicit and token-driven.  
7. **Implementation notes:**  
   - Support desktop two-column and responsive collapse.
   - Keep the API simple.
8. **Verification:**  
   - Render placeholder children and confirm stacking behavior.
9. **Suggested commit message:**  
   - `B3.D3: frontend(layout): add content grid primitive`
10. **Rollback:**  
   - Remove or revert the file.

## Step B3.D4
1. **Step ID:** B3.D4  
2. **Step name:** Wrap existing app in AppShell and TopBar without visual restyle of modules yet  
3. **REQUIRED**  
4. **Files to modify:**  
   - main app composition file(s)  
5. **Goal:** Establish the new shell composition before module-by-module conversion.  
6. **Why now:** The shell must exist before the hero and modules are placed into the final hierarchy.  
7. **Implementation notes:**  
   - Keep existing module rendering functional.
   - Accept transitional visuals.
8. **Verification:**  
   - Run frontend and confirm app still works.
9. **Suggested commit message:**  
   - `B3.D4: frontend(layout): wrap app in new shell structure`
10. **Rollback:**  
   - Revert app composition changes.

---

# PHASE B4 — Hero System

## Step B4.E1
1. **Step ID:** B4.E1  
2. **Step name:** Create ObservingHero component  
3. **REQUIRED**  
4. **Files to modify:**  
   - `frontend/src/components/hero/ObservingHero.jsx` (new)  
5. **Goal:** Create the primary decision surface component for the page.  
6. **Why now:** The hero is the defining structural and visual change of Phase B.  
7. **Implementation notes:**  
   - Use `GlassPanel` hero variant.
   - Support status, time context, title, summary, and CTA.
   - It may initially use placeholder-composed values if existing data wiring is not yet finalized.
8. **Verification:**  
   - Render the component in app without breaking build.
9. **Suggested commit message:**  
   - `B4.E1: frontend(hero): add ObservingHero component`
10. **Rollback:**  
   - Remove or revert the file.

## Step B4.E2
1. **Step ID:** B4.E2  
2. **Step name:** Wire hero into top-of-page composition  
3. **REQUIRED**  
4. **Files to modify:**  
   - app composition file(s)  
5. **Goal:** Place the hero above the support grid so page hierarchy matches the Phase B spec.  
6. **Why now:** Page hierarchy must be corrected before lower modules are converted.  
7. **Implementation notes:**  
   - Hero must render first below the top bar.
   - Support grid must render beneath hero.
8. **Verification:**  
   - Run frontend and visually confirm hero-first composition.
9. **Suggested commit message:**  
   - `B4.E2: frontend(layout): place hero above support grid`
10. **Rollback:**  
   - Revert composition changes.

## Step B4.E3
1. **Step ID:** B4.E3  
2. **Step name:** Tune hero spacing and emphasis tokens  
3. **REQUIRED**  
4. **Files to modify:**  
   - semantic/theme files and/or hero component  
5. **Goal:** Make the hero clearly dominant without over-decoration.  
6. **Why now:** Initial hero placement often still looks like just another card unless emphasis is tuned.  
7. **Implementation notes:**  
   - Increase hero padding, border strength, glow, and typography where needed.
   - Avoid adding animation-heavy treatments.
8. **Verification:**  
   - Visual review in all supported modes.
9. **Suggested commit message:**  
   - `B4.E3: frontend(hero): tune hero emphasis and hierarchy`
10. **Rollback:**  
   - Revert token and hero changes.

---

# PHASE B5 — Module Conversion

## Step B5.F1
1. **Step ID:** B5.F1  
2. **Step name:** Convert Conditions module to shared panel system  
3. **REQUIRED**  
4. **Files to modify:**  
   - existing Conditions component(s)  
   - optionally shared UI imports  
5. **Goal:** Replace module-specific wrapper styling with `GlassPanel` and `SectionHeader`.  
6. **Why now:** Conditions is compact and makes a good first full module conversion.  
7. **Implementation notes:**  
   - Preserve existing data fetching and content logic.
   - Change presentation only.
8. **Verification:**  
   - Conditions still renders valid data in all modes.
9. **Suggested commit message:**  
   - `B5.F1: frontend(conditions): migrate to shared panel system`
10. **Rollback:**  
   - Revert the module changes.

## Step B5.F2
1. **Step ID:** B5.F2  
2. **Step name:** Convert Targets module to shared panel and row system  
3. **REQUIRED**  
4. **Files to modify:**  
   - existing Targets component(s)  
6. **Goal:** Refactor the targets module into the new panel language and shared row structure.  
6. **Why now:** Targets is one of the most important support modules and should align closely with the hero.  
7. **Implementation notes:**  
   - Preserve inline expansion behavior if already present.
   - Keep feature logic intact.
   - Use `RowItem` where it fits cleanly.
8. **Verification:**  
   - Target list renders and interactions still work.
9. **Suggested commit message:**  
   - `B5.F2: frontend(targets): migrate to shared panel and row system`
10. **Rollback:**  
   - Revert the module changes.

## Step B5.F3
1. **Step ID:** B5.F3  
2. **Step name:** Convert Alerts module to shared panel and row system  
3. **REQUIRED**  
4. **Files to modify:**  
   - existing Alerts component(s)  
5. **Goal:** Refactor alerts/events to the shared system while keeping them visually subordinate to primary observing content.  
6. **Why now:** Alerts should look unified without competing with hero and targets.  
7. **Implementation notes:**  
   - Preserve counts and existing logic.
   - Use rows where appropriate.
8. **Verification:**  
   - Alerts still render valid content.
9. **Suggested commit message:**  
   - `B5.F3: frontend(alerts): migrate to shared panel system`
10. **Rollback:**  
   - Revert the module changes.

## Step B5.F4
1. **Step ID:** B5.F4  
2. **Step name:** Convert Passes module to shared panel and row system  
3. **REQUIRED**  
4. **Files to modify:**  
   - existing Passes component(s)  
5. **Goal:** Move passes into the shared presentation system.  
6. **Why now:** Passes benefit strongly from a repeated row structure and consistent metadata formatting.  
7. **Implementation notes:**  
   - Preserve timing and list content.
8. **Verification:**  
   - Passes render as expected.
9. **Suggested commit message:**  
   - `B5.F4: frontend(passes): migrate to shared panel and row system`
10. **Rollback:**  
   - Revert the module changes.

## Step B5.F5
1. **Step ID:** B5.F5  
2. **Step name:** Convert Moon Summary to shared panel system  
3. **REQUIRED**  
4. **Files to modify:**  
   - existing Moon Summary component(s)  
5. **Goal:** Bring the moon module into the shared panel family.  
6. **Why now:** This completes the visual unification of the Phase 1 module set documented in the current project state. citeturn232743view1  
7. **Implementation notes:**  
   - Preserve existing derived-data behavior.
8. **Verification:**  
   - Moon summary still renders correctly.
9. **Suggested commit message:**  
   - `B5.F5: frontend(moon): migrate to shared panel system`
10. **Rollback:**  
   - Revert the module changes.

---

# PHASE B6 — Interaction, Polish, and Responsive Stabilization

## Step B6.G1
1. **Step ID:** B6.G1  
2. **Step name:** Add consistent hover and focus-visible states across primitives  
3. **REQUIRED**  
4. **Files to modify:**  
   - primitive components
   - semantic/theme token files as needed  
5. **Goal:** Standardize interaction feedback across buttons, panels, and row items.  
6. **Why now:** Interaction consistency should be refined after primitives and modules exist.  
7. **Implementation notes:**  
   - Focus-visible must be clearly visible.
   - Hover should be subtle and token-driven.
8. **Verification:**  
   - Keyboard-tab through the app.
   - Hover panels/buttons/rows.
9. **Suggested commit message:**  
   - `B6.G1: frontend(ui): standardize hover and focus states`
10. **Rollback:**  
   - Revert primitive/token changes.

## Step B6.G2
1. **Step ID:** B6.G2  
2. **Step name:** Tune desktop spacing and module rhythm  
3. **REQUIRED**  
4. **Files to modify:**  
   - layout and token files  
5. **Goal:** Ensure the desktop view feels balanced, premium, and intentional.  
6. **Why now:** Once modules are converted, rhythm tuning becomes meaningful.  
7. **Implementation notes:**  
   - Adjust gaps, panel padding, and hero/support spacing only through tokens or shared layout components.
8. **Verification:**  
   - Visual review at common desktop widths.
9. **Suggested commit message:**  
   - `B6.G2: frontend(layout): tune desktop spacing and vertical rhythm`
10. **Rollback:**  
   - Revert token/layout changes.

## Step B6.G3
1. **Step ID:** B6.G3  
2. **Step name:** Implement tablet collapse behavior  
3. **REQUIRED**  
4. **Files to modify:**  
   - layout files
   - responsive CSS rules  
5. **Goal:** Ensure hierarchy survives intermediate widths cleanly.  
6. **Why now:** Tablet layouts often expose structural weaknesses in wide dashboard compositions.  
7. **Implementation notes:**  
   - Hero must remain first.
   - Support grid may collapse as one column depending on width.
8. **Verification:**  
   - Resize browser or use responsive tools.
9. **Suggested commit message:**  
   - `B6.G3: frontend(layout): add tablet responsive behavior`
10. **Rollback:**  
   - Revert layout changes.

## Step B6.G4
1. **Step ID:** B6.G4  
2. **Step name:** Implement mobile stack behavior  
3. **REQUIRED**  
4. **Files to modify:**  
   - layout files
   - responsive CSS rules  
5. **Goal:** Ensure the app remains coherent on small screens.  
6. **Why now:** Mobile must be validated separately from tablet because touch density and text wrapping differ.  
7. **Implementation notes:**  
   - One-column stack.
   - Preserve module order intentionally.
   - Avoid clipped text or unusable actions.
8. **Verification:**  
   - Responsive review on narrow widths.
9. **Suggested commit message:**  
   - `B6.G4: frontend(layout): add mobile stacking behavior`
10. **Rollback:**  
   - Revert responsive changes.

## Step B6.G5
1. **Step ID:** B6.G5  
2. **Step name:** Tune high-contrast theme behavior  
3. **REQUIRED**  
4. **Files to modify:**  
   - `frontend/src/design/themes.css`
   - semantic tokens if needed  
5. **Goal:** Make both high-contrast modes meaningfully more legible without changing design structure.  
6. **Why now:** High contrast must be validated once the full system exists.  
7. **Implementation notes:**  
   - Increase contrast through tokens only.
   - Avoid introducing theme-specific structure.
8. **Verification:**  
   - Review in both high-contrast modes and compare with standard modes.
9. **Suggested commit message:**  
   - `B6.G5: frontend(theme): tune high-contrast modes`
10. **Rollback:**  
   - Revert theme changes.

## Step B6.G6
1. **Step ID:** B6.G6  
2. **Step name:** Tune red mode fidelity under new system  
3. **REQUIRED**  
4. **Files to modify:**  
   - `frontend/src/design/themes.css`
   - semantic tokens if needed  
5. **Goal:** Ensure red mode remains astronomy-safe and visually coherent under the new design language.  
6. **Why now:** The current project state explicitly notes red mode as part of the implemented mode system, and earlier project guidance already called for improving red mode polish as a next step. citeturn232743view1  
7. **Implementation notes:**  
   - Limit blue/cyan emphasis.
   - Preserve hierarchy with red-safe accents and readable neutrals.
8. **Verification:**  
   - Visual review in red mode, especially hero, buttons, borders, and metadata.
9. **Suggested commit message:**  
   - `B6.G6: frontend(theme): tune red mode under new design system`
10. **Rollback:**  
   - Revert theme changes.

---

# PHASE B7 — Cleanup and Validation

## Step B7.H1
1. **Step ID:** B7.H1  
2. **Step name:** Remove obsolete module-local visual rules that conflict with new system  
3. **REQUIRED**  
4. **Files to modify:**  
   - old global/module CSS files as needed  
5. **Goal:** Eliminate stale styles that override or fight the new system.  
6. **Why now:** Cleanup should happen only after the new system is visibly in place.  
7. **Implementation notes:**  
   - Remove only styling rules made obsolete by the new primitives.
   - Do not remove still-needed functional layout or utility rules without confirming replacements exist.
8. **Verification:**  
   - Search for obsolete old theme selectors or duplicate panel styles.
   - Run app and visually check for regressions.
9. **Suggested commit message:**  
   - `B7.H1: frontend(css): remove obsolete pre-rebaseline visual rules`
10. **Rollback:**  
   - Revert CSS cleanup.

## Step B7.H2
1. **Step ID:** B7.H2  
2. **Step name:** Run visual system validation pass  
3. **REQUIRED**  
4. **Files to modify:**  
   - none required unless issues are found  
5. **Goal:** Confirm the new system is coherent before Phase B is considered complete.  
6. **Why now:** Final validation should happen after cleanup, not before.  
7. **Implementation notes:**  
   - Review all five modes.
   - Review desktop/tablet/mobile.
   - Review keyboard focus.
   - Review hero-first hierarchy.
8. **Verification checklist:**  
   - Hero is dominant.
   - Support modules feel unified.
   - No theme looks like a separate design.
   - No major module uses hardcoded theme styling.
   - Text remains readable in all modes.
   - Hover and focus behavior are consistent.
9. **Suggested commit message:**  
   - `B7.H2: review(ui): validate Phase B design system completeness`
10. **Rollback:**  
   - N/A for review-only step; create targeted fix steps if needed.

---

## Phase B completion criteria

Do not mark UI Phase B complete until all REQUIRED steps are done and the following are true:

- The app no longer visually reads as a generic dashboard.
- The app clearly matches the grand design intent.
- The hero-first structure is implemented.
- The theming engine supports all five modes.
- Shared primitives are actually used across modules.
- Responsive hierarchy is correct.
- Accessibility/high-contrast behavior is integrated.
- Existing functionality remains intact.
- Old conflicting styling has been cleaned up.

---

## Notes for BitFrog / coding-agent execution

- Read `docs/product/ui/UI_PHASE_B_SPEC.md` before touching frontend styling.
- Execute one step per request unless the architect explicitly bundles two tiny adjacent steps.
- Do not invent extra files unless necessary.
- Do not replace feature logic while doing presentation steps.
- Prefer small, reviewable diffs.
- If a step exposes a spec ambiguity, stop and surface the ambiguity rather than inventing a direction.
