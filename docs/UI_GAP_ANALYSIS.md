# UI Gap Analysis — Phase A

This analysis compares the current `frontend/` implementation with the UI Phase A spec.

## Summary
Frontend is largely present: dashboard shell, mode system, location override, and modules exist. Several small refactors and visual improvements are needed to meet the Phase A acceptance criteria cleanly.

## Completed items
- Dashboard shell and page structure (`App.jsx`) present and wired
- Mode system (Day / Night / Red) implemented and persisted to `localStorage`
- Active Observing Location default (ORAS) and manual numeric override implemented
- Modules implemented (Conditions, Recommended Targets, Alerts/Events, Satellite Passes, Moon Summary)
- Responsive grid and basic styles exist (`styles.css`)
- Density rules enforced in module rendering (components cap lists)

## Missing / Incomplete items for Phase A
- Clean component-level layout primitives (shared `Card` and `SectionHeader`) are not present
- Some inline styles in `App.jsx` should be moved to CSS for consistent spacing and theme handling
- Module headings and timestamps need clearer typographic hierarchy
- Slight layout polish required for module sizing and consistent padding across narrow screens

## Visually broken / primitive items
- The header location inputs use inline widths and mixed spacing — move to CSS classes
- The aside `MoonSummary` sizing and placement could be clearer on wide vs narrow screens
- Some modules lack clear `h2` headings or consistent subheading styles

## Cleanup items (small, Phase A scope)
- Add a small `tokens.css` or tokens JS to centralize spacing and colors
- Add a `components/common/Card.jsx` to standardize card presentation and ensure consistent padding/radius
- Move inline inline-style attributes in `App.jsx` to class-based styles in `styles.css`
- Add ARIA labels/landmarks for header and main regions

## What belongs in UI Phase B instead of Phase A
- Full design system or theming framework (Phase B)
- Comprehensive accessibility audit and ARIA refinements (Phase B deliverable)
- Visual polish animations or motion (deferred)
- Advanced layout breakpoints and micro-typography tuning (Phase B)

## Recommendation
Implement small, local refactors now to standardize layout primitives (Card, SectionHeader, tokens), move inline styles into CSS, and improve headings. Preserve current behavior and mock data compatibility. Avoid adding new features or API calls.


