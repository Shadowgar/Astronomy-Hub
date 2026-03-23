# Coding Guardrails

## Purpose

Prevent AI drift and overengineering.

---

## Rules

- Do NOT implement Phase 2 features
- Do NOT introduce new data fields without updating contracts
- Do NOT add new pages outside defined structure
- Do NOT add complex rendering systems
- Do NOT introduce heavy libraries
- Do NOT build globe/3D systems

---

## Development Rules

- Mock-first always
- One module at a time
- Validate before moving on
- Keep files small and focused

---

## Backend Rules

- Only build required endpoints
- Return static/mock data first
- No database in Phase 1

## Location Rules (LOCKED)

- Default observing location: ORAS Observatory (locked default). Use the coordinates and label defined in PROJECT_STATE.md.
- Allow a minimal, manual latitude/longitude override from the UI for the active session only.
- Disallow browser geolocation, map pickers, reverse geocoding, saved locations, accounts/preferences, and any location database in Phase 1.
 - Default observing location: ORAS Observatory (locked default). Use the coordinates and label defined in PROJECT_STATE.md.
 - Allow a minimal, manual latitude/longitude override from the UI for the active session only. Functional inputs for the override: `latitude` (required), `longitude` (required), `elevation_ft` (optional).
 - Disallow browser geolocation, map pickers, reverse geocoding, saved locations, accounts/preferences, freeform custom labels, address lookup/autocomplete, and any external geocoding APIs in Phase 1.
 - Default ORAS Observatory values (for reference): label `ORAS Observatory`, address `4249 Camp Coffman Road, Cranberry, PA 16319`, latitude `41.321903`, longitude `-79.585394`, elevation_ft `1420`.
 - Phase 1 is mock-first: do not call real external APIs for location or observability data during Phase 1 development. Use mocked or local data sources only.