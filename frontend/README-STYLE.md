# Frontend Styling Guide — Developer Operating Rules

Purpose: concise operational guidance for day-to-day styling work under the canonical token/CSS system chosen in `docs/STYLING_DECISION.md`.

Styling authority (where to edit)
- Primitive tokens: `frontend/src/design/tokens.css` — add or update primitive token values here only after discussion.
- Theme definitions: `frontend/src/design/themes.css` — theme-scoped variable groups.
- Runtime/global classes & runtime-facing tokens: `frontend/src/styles.css` — use this file for global module classes and runtime token mappings.

How to add new styles (day-to-day)
- Prefer tokens over literal values. Use token names (e.g. `var(--space-2)`, `var(--text-primary)`) for spacing, color, radii, and typography.
- Add new global module classes in `frontend/src/styles.css` when multiple components share layout or visual patterns.
- For component-specific layout or behavior that must be encapsulated, create a component-local CSS file (adjacent to the component) but reference tokens for any visual values.
- Inline `style` props are allowed only for runtime-computed values that cannot be expressed with tokens. Document such uses in the PR and prefer CSS variables where possible.

Tokens and primitives
- Tokens live in `frontend/src/design/tokens.css` and are surfaced through `frontend/src/styles.css` for runtime usage. Do not create parallel token definitions in new locations.
- When adding a token, use descriptive, stable names (e.g., `--space-3`, `--radius-card`, `--font-ui`) and document the intent in the PR description.

Developer rules (quick)
- DO: reference tokens in CSS and JSX (`style={{ color: 'var(--text-primary)' }}` is acceptable when necessary).
- DO: add shared classes to `frontend/src/styles.css` for reuse.
- DO NOT: hard-code visual constants (colors, px values) in components or new CSS without using tokens.
- DO NOT: introduce Tailwind or other utility frameworks in this phase.

Separation of concerns
- Styling is independent of data and adapters. Continue to keep data/adapters/contracts in backend and TypeScript types in the frontend; styling changes must not modify data contracts.

Forbidden hybrid rule (operational)
- No new token files outside the canonical locations.
- No adding utility frameworks, new build-time styling tools, or new global style sources without explicit approval and a migration plan.

Do / Do Not (short)
- Do: Use `var(--...)` tokens; add classes to `frontend/src/styles.css`; create component CSS only when encapsulation requires it.
- Do Not: Add hard-coded values in JSX/CSS; scatter token copies across the repo; change build config to add a new styling tool in this step.

If in doubt
- Open a short RFC or PR describing the change and tag the UI owners. Small token additions can be approved via PR, larger pattern changes require an explicit design decision.

This guide is intentionally minimal and operational. It supports the decision in `docs/STYLING_DECISION.md` and is the developer-facing checklist for Step 3 when migration scaffolding is introduced.
