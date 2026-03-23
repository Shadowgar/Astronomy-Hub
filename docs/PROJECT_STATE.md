# Astronomy Hub — Project State

## Purpose

This file preserves the current state of the project so that any new AI session can resume work without losing context.

The assistant must treat this file as authoritative context before taking any action.

---

## Project Name

Astronomy Hub

---

## Vision

Astronomy Hub is a unified, field-ready astronomy dashboard for the Oil Region Astronomical Society (ORAS).

It answers:

> What should I know about the sky right now from where I am, and what should I look at?

This is a **decision-support system**, not a data dump.

---

## Active Observing Location (LOCKED REFINEMENT)

Phase 1 uses a single concept called the "Active Observing Location" to determine what is shown across the dashboard. This refinement is locked for Phase 1 and defines a default site and allowed user override.

- Default: ORAS Observatory (used when the user does not provide manual coordinates)
- Manual override: user may enter latitude/longitude to temporarily override the default for the current session
   - Functional inputs for manual override (Phase 1):
      - `latitude` (required)
      - `longitude` (required)
      - `elevation_ft` (optional)
   - Not allowed in Phase 1: browser geolocation, map pickers, reverse geocoding, saved locations, accounts or preferences, freeform custom label entry, address lookup/autocomplete, or external geocoding APIs

Default ORAS Observatory (Phase 1 default values):
- label: ORAS Observatory
- address: 4249 Camp Coffman Road, Cranberry, PA 16319
- latitude: 41.321903
- longitude: -79.585394
- elevation_ft: 1420

The Active Observing Location is defined as a minimal object with fields: `label`, `latitude`, `longitude`, and optional `elevation_ft` (the ORAS default populates elevation_ft).

---

## Deferred Feature (Roadmap)

Address Search & Geocoded Location Selection (DEFERRED — Phase 2 recommendation)

- Summary: preserve the idea of an address autocomplete + geocoding flow for a later phase. Not part of Phase 1. See Phase 2 roadmap.
- Intent: allow users to type an address and select an autocomplete suggestion that resolves to coordinates used as the Active Observing Location.
- Phase 1 status: explicitly excluded from Phase 1 (no address autocomplete or external geocoding APIs allowed).

---

## Current Phase

Phase 1 — Local Sky MVP

---

## CURRENT IMPLEMENTATION STATUS

The Phase 1 MVP features below reflect the code and documentation currently implemented in this workspace. Marked items are COMPLETE for Phase 1.

- **Backend endpoints (mock)**: COMPLETE — `/api/conditions`, `/api/targets`, `/api/passes`, `/api/alerts` return mocked JSON.
- **Frontend dashboard shell**: COMPLETE — Vite + React app with dashboard layout.
- **Conditions module**: COMPLETE — fetches `/api/conditions` and renders contract fields.
- **Targets module**: COMPLETE — fetches `/api/targets` and renders recommended targets.
- **Alerts module**: COMPLETE — fetches `/api/alerts` and renders alerts/events.
- **Passes module**: COMPLETE — fetches `/api/passes` and renders upcoming satellite passes.
- **Moon Summary (derived)**: COMPLETE — `MoonSummary` fetches `/api/conditions` and renders moon-related fields.
- **Mode system (Day/Night/Red)**: COMPLETE — app-level mode state and CSS theming implemented.
- **Mode persistence (localStorage)**: COMPLETE — selected mode persists across refresh in `localStorage`.
- **Active Observing Location (default ORAS + manual override)**: COMPLETE — App UI supports ORAS default and session-only numeric lat/lon/elev override.
- **Backend query param support (lat/lon/elevation_ft)**: COMPLETE — backend accepts and validates `lat`, `lon`, and optional `elevation_ft` and returns 400 JSON on invalid params.
- **Frontend query param wiring**: COMPLETE — frontend app appends `lat`, `lon`, and optional `elevation_ft` query params to module requests when a manual override is active.

---

## Phase 1 Objective

Deliver a clean, usable dashboard that provides:

- observing conditions
- recommended targets
- upcoming satellite passes
- alerts / notable events
- moon summary
- simple drill-down pages

---

## Phase 1 Constraints

The following are explicitly NOT allowed in Phase 1:

- globe view
- 3D Earth visualization
- aircraft tracking
- AR features
- global observatory systems
- advanced astrophotography tools
- heavy backend architecture
- database systems (Postgres/PostGIS)
- real-time streaming systems
- AI-driven recommendation engines
 - real external APIs (Phase 1 is mock-first)

---

## Architecture

### Frontend

- Runs locally during development
- Renders dashboard UI
- Uses modular components
- Consumes backend JSON
- Supports:
  - Day mode
  - Night mode
  - Red mode
  - Time context (Now / Tonight / 24h)
 - Location-aware request handling: frontend appends optional `lat`/`lon`/`elevation_ft` when a session override is active

---

### Backend

- Runs locally during Phase 1
- Provides REST endpoints
- Returns mocked JSON initially
- Responsible for:
  - normalization
  - caching (conceptually)
  - stable data contracts

- Location-aware query handling: endpoints accept optional `lat`, `lon`, and `elevation_ft` query params (validated); responses remain mocked and contract shapes unchanged.

No database in Phase 1.

---

## Core System Loop (LOCKED)

1. User opens Astronomy Hub
2. Confirms location
3. Sees observing conditions
4. Sees recommended targets
5. Sees passes and alerts
6. Drills deeper if needed

Any feature outside this loop is not part of Phase 1.

---

## KNOWN LIMITATIONS (Phase 1)

- Mock data only: No real astronomy calculations or live data sources yet.
- Address autocomplete / geocoding: DEFERRED to Phase 2; explicitly excluded from Phase 1.
- No browser geolocation: Phase 1 does not use device geolocation.
- No saved locations: session-only manual override only; no account-based persistence.
- No telemetry: no frontend telemetry/analytics in Phase 1.
- Logging: backend-only, minimal request logging; no frontend telemetry layer yet.

---

## NEXT PHASE ENTRY POINT (Phase 2 candidate work)

Recommended next development steps when moving to Phase 2:

- Improve Red mode visual accuracy and final polish.
- Add a frontend developer logging layer (dev-only) to aid debugging and usage telemetry during development.
- Introduce real data sources and replace mock endpoints with normalized ingestion pipelines.
- Implement Address Search & Geocoded Location Selection (autocomplete + geocoding) using a vetted external provider; ensure privacy and API usage policies are defined.
- Improve UI polish, responsiveness, and layout refinements across modules.

---

---

## Data Contracts (Summary)

All backend responses must follow strict schemas.

Core endpoints:

- `/api/conditions`
- `/api/targets`
- `/api/passes`
- `/api/alerts`

Frontend must rely ONLY on these contracts.

---

## Development Rules

1. MOCK FIRST  
   No real APIs until UI is complete

2. CONTRACT FIRST  
   Do not change response shapes mid-build

3. NO SCOPE CREEP  
   Do not implement Phase 2 features

4. ONE MODULE AT A TIME  
   Build, validate, then move on

5. SIMPLE FIRST  
   Deterministic logic only

---

## Current Repository Structure

```text
Astronomy-Hub/
  docs/
  frontend/
  backend/
    docs/
    api/
    cache/
    scripts/