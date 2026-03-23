```md
# UI Information Architecture

## Goal

Provide a clean, non-overwhelming interface.

---

## Primary Layout

- Header (location + mode toggle)
- Dashboard modules
- Action button
- Navigation tabs

Note: The header must display the current Active Observing Location's `label` (default: ORAS Observatory). The UI should provide a minimal manual-coordinate override control (latitude/longitude input) — this is a simple text input, not a map picker, and replaces the active location only for the current session.

Default ORAS Observatory (Phase 1 default values):
- label: ORAS Observatory
- address: 4249 Camp Coffman Road, Cranberry, PA 16319
- latitude: 41.321903
- longitude: -79.585394
- elevation_ft: 1420

---

## Module Order (LOCKED)

1. Observing Score + Conditions
2. Targets
3. Alerts
4. Passes

---

## UI Modes

- Day
- Night
- Red

---

## Time Context

- Now
- Tonight
- Next 24h

---

## Density Rules

- Max 5 targets
- Max 5 passes
- Max 3 alerts

---

## Interaction Model

- Click → drill down
- No nested complexity
- No cluttered screens