# UI Phase A — Information Architecture & MVP Shell

## Objective
Deliver a calm, mobile-friendly dashboard that implements the Phase 1 information architecture with clear hierarchy and drill-down affordances.

## Status
- **UI Phase A:** COMPLETE

## Scope (Phase 1 alignment)
- Dashboard page with header (location + mode) and module grid
- Phase 1 primary mount is `ObservingHero` + module grid
- `AboveMeScene` exists but is not the default primary mount in Phase 1
- Modules: Conditions, Recommended Targets, Alerts/Events, Satellite Passes, Moon Summary
- Manual coordinate override (session-only)
- Mode system: Day, Night, Red (frontend-only) with localStorage persistence
- Mock-data compatibility only; no external APIs

## Page structure
- Header
  - App title
  - Active Observing Location label and manual override controls
  - Mode selector (Day / Night / Red)
- Main dashboard
  - Primary content column: Conditions, Targets, Alerts, Passes
  - Secondary column / aside: Moon Summary
- Footer: Phase 1 cue

## Visual rules
- Max 5 recommended targets, max 5 passes, max 3 alerts shown on dashboard
- Compact cards with clear headings, timestamps, and short summaries
- Provide clear drill-down affordances (buttons or inline links)

## Accessibility
- Color contrasts checked for Day/Night modes; Red mode uses only low-luminance reds
- Inputs and controls must be keyboard accessible and fully labeled

