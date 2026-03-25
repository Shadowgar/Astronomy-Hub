# Styling Audit — Evidence (Phase 2.5 Package 5 Step 1)

This file records factual observations about the current frontend styling surface to inform a later styling decision. No recommendations or decisions are included here — only repo-based evidence.

Files inspected (primary):
- `frontend/src/styles.css`
- `frontend/src/design/tokens.css`
- `frontend/src/design/themes.css`
- `frontend/src/design/semantic.css`
- `frontend/src/main.jsx` (root imports)
- `frontend/index.html` (app entry)
- a sample of component files using inline styles: `frontend/src/components/Conditions.jsx`, `frontend/src/components/AlertsEvents.jsx`, `frontend/src/components/MoonSummary.jsx`, `frontend/src/components/SatellitePasses.jsx`, `frontend/src/components/ui/RowItem.jsx`, `frontend/src/components/ui/SectionHeader.jsx`
- compiled artifact (read-only): `frontend/dist/assets/index-*.css` (seen in repo)

Main CSS / style entry points
- `frontend/src/main.jsx` imports the primary style modules in this order:
  - `./design/tokens.css`
  - `./design/themes.css`
  - `./design/semantic.css`
  - `./styles.css`
- `frontend/src/styles.css` appears to be the main global stylesheet containing many layout rules, component-level selectors, and mode-specific variables and rules.
- `frontend/src/design/tokens.css` defines a dedicated set of CSS custom properties (spacing, radii, font sizes, durations, etc.).
- `frontend/src/design/themes.css` contains theme-specific CSS variables (multiple themes) and appears to define color tokens per theme.
- `frontend/src/design/semantic.css` is present and imported at root (not inspected in detail here; included in root imports).
- Compiled bundle `frontend/dist/assets/index-*.css` exists and mirrors many of the same variables and rules (evidence of a build output containing flattened tokens).

Token-like variables detected
- `frontend/src/styles.css` defines a large `:root` with many CSS variables (examples): `--gap`, `--container-max-width`, `--module-padding`, `--base-font-size`, `--page-bg`, `--text-primary`, `--accent-blue`, `--stale-bg`, etc.
- `frontend/src/design/tokens.css` defines a clear token system for spacing and typography: `--space-1` .. `--space-9`, `--radius-xs` .. `--radius-pill`, `--font-1` .. `--font-7`, `--weight-regular` etc.
- `frontend/src/design/themes.css` defines theme-specific variables (repeated sections with `--bg-base`, `--panel-bg`, `--text-primary`, `--accent`, `--success`, etc.) for several theme variants.

One-off color / spacing patterns (examples)
- Inline hard-coded colors appear in CSS rules (e.g., `background-image: radial-gradient(...)`, `box-shadow: 0 6px 18px rgba(47,129,247,0.02)`), which are present in `styles.css` and theme sections.
- Some components still use inline style objects in JSX with string values or `var(--...)` references, for example:
  - `frontend/src/components/Conditions.jsx` uses inline style objects and `style={{ padding: '6px 10px', borderRadius: 999, ... }}`
  - `frontend/src/components/AlertsEvents.jsx`, `MoonSummary.jsx`, `SatellitePasses.jsx` show inline style usage with `gap: 'var(--space-2)'` etc.
- There are mixed spacing variables: `styles.css` uses `--gap` and `--module-padding`, while `design/tokens.css` uses `--space-*` token names; both sets are in use.

Component-local styling hotspots (observed)
- `frontend/src/components/Conditions.jsx` — several inline `style={{ ... }}` uses and conditional rendering relying on CSS classes defined in `styles.css`.
- `frontend/src/components/AlertsEvents.jsx` — inline layout styles (`display: 'flex'`, `gap: 'var(--space-2)'`).
- `frontend/src/components/MoonSummary.jsx` — inline layout and color usage referencing CSS variables.
- `frontend/src/components/ui/RowItem.jsx`, `SectionHeader.jsx` — inline style objects referencing `var(--space-2)` and `var(--font-4)`.
- Many components use a mix of named CSS classes (from `styles.css`) and inline style objects; this creates multiple places to update when tokens change.

Tailwind presence
- No Tailwind configuration or obvious Tailwind utility classes detected in repository checks:
  - No `tailwind.config.*` file found.
  - No `@tailwind` usage found in inspected CSS files.
  - Package.json does not declare `tailwindcss` as a dependency.
- Conclusion: Tailwind is absent from the current repo.

Root/global style import points
- Primary root import is `frontend/src/main.jsx`, which imports token and theme CSS prior to `styles.css` (see list above). This means the token and theme variables are available globally for component styles that render after root import.
- `index.html` loads the module `src/main.jsx` as the boot entry, so the single import point is `src/main.jsx`.

Likely migration risk areas (factual)
- Dual token systems: presence of both `styles.css` `--*` variables and `design/tokens.css` `--space-*` variables suggests overlapping token namespaces; migration must reconcile these to avoid duplication.
- Inline styles in many components are a risk: they must be audited when tokens are standardized because they are spread across JSX files (component-local hotspots above).
- Complex dark-mode decorative rules in `styles.css` (starfield layers, radial-gradient heavy rules, animations) may be performance-sensitive and require special handling during migration.
- Compiled `dist` CSS duplicates many styles; build artifacts should not be the primary source of truth but indicate what has been emitted historically.
- `design/themes.css` contains multiple theme variants; ensure chosen system accommodates theme switching without duplicating tokens in multiple places.

Notes (constraints for later steps)
- This audit is evidence-only. Do not treat any item here as a recommendation — it is a factual inventory to support the subsequent styling decision.
- Do not perform any component markup edits or bulk CSS rewrites in Step 1; this document intentionally avoids proposing the decision.

End of audit.
