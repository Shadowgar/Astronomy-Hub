# Frontend Style Inventory

Purpose: concise, developer-facing map of current styling usage. Organized by component or styling surface. This is an inventory only — no changes.

## Global surfaces
- File: `frontend/src/styles.css`
  - Role: global layout, theme tokens, mode overrides, many utility classes (e.g., `.dashboard`, `.panel`, `.app-shell`, `.primary-decision-panel`).
  - Notable tokens/classes: `--gap`, `--page-bg`, `--text-primary`, `.app-shell.mode-light`, `.app-shell.mode-dark`, `.primary-decision-panel`, `.module-shell`, `.panel`.
  - Inline usage in code expects these global classes/variables.

## Token sources
- `frontend/src/design/tokens.css` — low-level primitive tokens (`--space-*`, `--radius-*`, `--font-*`).
- `frontend/src/design/themes.css` — theme groups (`.theme-dark`, `.theme-light`, etc.).
- `frontend/src/styles/tokens.css` — small bridge token file mapping token names (existing migration artifact).

## Component inventory (representative)
- `frontend/src/components/ModuleShell.jsx`
  - Style sources: `frontend/src/styles.css` (global `.module-shell`, `.panel` rules).
  - Notable class usage: `module-shell`, `module-shell-header`, `module-shell-body`.
  - Inline styles: none in this file.

- `frontend/src/components/PrimaryDecisionPanel.jsx`
  - Style sources: `frontend/src/styles.css` (uses `.primary-decision-panel` and CSS variables for tokens).
  - Notable class usage: `primary-decision-panel`, `pdp-left`, `pdp-center`, `pdp-right`, `.pdp-cta`.
  - Inline styles: occasional single-line adjustments in child elements; predominant reliance on classes.

- `frontend/src/components/Conditions.jsx`
  - Style sources: `frontend/src/styles.css` (global `.conditions-body`, `.cond-row`, etc.).
  - Notable class usage: `conditions-body`, `cond-row`, `cond-summary`.
  - Inline styles: uses inline `style` props for layout (flex), badges, and small visual tweaks (e.g., `style={{ padding: '6px 10px' }}` and color via `var(--text-muted)`).

- `frontend/src/components/MoonSummary.jsx` (and migrated `MoonSummary.tsx`)
  - Style sources: `frontend/src/styles.css` (global module-level classes) + uses `GlassPanel` wrapper.
  - Notable class usage: `moon-summary`, `moon-line`.
  - Inline styles: uses inline flex layout styles with `gap: var(--space-2)` etc.

- `frontend/src/components/RecommendedTargets.jsx` / `TargetRow.jsx`
  - Style sources: `frontend/src/styles.css` for global module rules; `TargetRow` relies on class names like `target-row__meta`, `target-row__title`.
  - Inline styles: image sizing and list element style attributes (e.g., `style={{ width: 48, height: 48 }}` and `style={{ listStyle: 'none' }}`).

- `frontend/src/components/LocationSelector/LocationSelector.jsx`
  - Style sources: `frontend/src/components/LocationSelector/locationSelector.css` (component-local CSS) and global `styles.css` tokens.
  - Notable class usage: `location-selector`, `ls-row`, `ls-input`, `ls-apply`, `ls-suggestion`.
  - Inline styles: none (component uses local CSS classes).

- `frontend/src/components/common/InlineExpansion.jsx`
  - Style sources: `frontend/src/components/common/InlineExpansion.css`.
  - Notable class usage: `inline-expansion`, `inline-expansion__toggle`, `inline-expansion__content`.
  - Inline styles: toggles `display` on content with inline style.

- `frontend/src/components/ui/GlassPanel.jsx` and `ui/*` components
  - Style sources: `frontend/src/styles.css` (panel and glass rules) and inline styles for dynamic visual variants.
  - Notable patterns: `GlassPanel` accepts `className` and sometimes applies inline `style` for translucency or layout.

## Inline style hotspots (files with `style={{...}}` usage)
- `frontend/src/components/Conditions.jsx`
- `frontend/src/components/RecommendedTargets.jsx`
- `frontend/src/components/TargetRow.jsx`
- `frontend/src/components/SatellitePasses.jsx`
- `frontend/src/components/AlertsEvents.jsx`
- `frontend/src/components/common/InlineExpansion.jsx`
- `frontend/src/components/ui/AppButton.jsx`, `SectionHeader.jsx`, `RowItem.jsx`, `StatusBadge.jsx` (small inline style objects present)

## Compiled output evidence
- `frontend/dist/assets/index-*.css` contains a flattened/compiled version of tokens and class rules; it includes `:root` variables and theme blocks. This file is runtime evidence but not a source-of-authorship.

## Hybrid/mixed observations
- Global tokens + local component CSS + inline styles coexist. Token definitions appear in at least two different source locations (`styles.css` and `design/tokens.css`) plus a token bridge file.

## Notes
- Inventory is intentionally concise and component-focused to support Step 2 (decision) and Step 3 (scaffold) without performing code edits now.

Generated for 2.5F Step 1: evidence-only inventory.
