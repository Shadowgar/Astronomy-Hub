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
- Not allowed in Phase 1: browser geolocation, map pickers, reverse geocoding, saved locations, accounts or preferences

Default ORAS Observatory (Phase 1 default values):
- label: ORAS Observatory
- address: 4249 Camp Coffman Road, Cranberry, PA 16319
- latitude: 41.321903
- longitude: -79.585394
- elevation_ft: 1420

The Active Observing Location is defined as a minimal object with fields: `label`, `latitude`, `longitude`, and optional `elevation_ft` (the ORAS default populates elevation_ft).

---

## Current Phase

Phase 1 — Local Sky MVP

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

---

### Backend

- Runs locally during Phase 1
- Provides REST endpoints
- Returns mocked JSON initially
- Responsible for:
  - normalization
  - caching (conceptually)
  - stable data contracts

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