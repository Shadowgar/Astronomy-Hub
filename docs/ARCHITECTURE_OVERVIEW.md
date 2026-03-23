# Astronomy Hub — Architecture Overview

## Overview

Astronomy Hub is a two-layer system:

- Frontend (UI + interaction layer)
- Backend (data aggregation + normalization + API layer)

For Phase 1, both run locally.

---

## High-Level Architecture

Frontend
↓
Local API (backend)
↓
Mocked / later real data sources

---

## Frontend Responsibilities

- Render dashboard and pages
- Handle user input (location, mode, time context)
- Display modules:
  - conditions
  - targets
  - passes
  - alerts
- Consume API endpoints
- Apply UI modes (Day / Night / Red)

Active Observing Location handling (Phase 1 refinement):
- Frontend displays the Active Observing Location label (default ORAS Observatory) in the header.
- Frontend offers a simple manual numeric `latitude` and `longitude` override (both required for an override) and optional `elevation_ft`. No custom freeform label is provided in Phase 1. The override applies for the current session only.
- Phase 1 exclusions: no browser geolocation, no map picker, no reverse geocoding, no saved locations, no account/preferences, no address lookup/autocomplete, and no external geocoding APIs.
- Backend endpoints should default to the ORAS Observatory values when no override is provided.

#### Deferred Feature — Address Search & Geocoded Location Selection (Phase 2 candidate)

- Intent: preserve the concept of allowing users to type an address, view autocomplete suggestions, select a result, and have the system resolve that address to coordinates used as the Active Observing Location.
- Note: This is explicitly NOT part of Phase 1 and should be scoped and implemented in Phase 2 or later.

Default ORAS Observatory (Phase 1 default values):
- label: ORAS Observatory
- address: 4249 Camp Coffman Road, Cranberry, PA 16319
- latitude: 41.321903
- longitude: -79.585394
- elevation_ft: 1420

---

## Backend Responsibilities

- Provide JSON endpoints
- Normalize all data into stable schemas
- Cache responses
- Provide deterministic outputs (no AI)

---

## Phase 1 Backend Scope

Backend must support:

- `/api/conditions`
- `/api/targets`
- `/api/passes`
- `/api/alerts`

These can initially return mocked data.

---

## Data Flow

1. Frontend requests data from API
2. Backend returns normalized JSON
3. Frontend renders modules
4. User interacts with UI

---

## Key Design Rules

- Frontend must never depend on raw external APIs
- Backend must always normalize data
- UI must not break if backend fails
- Backend must be stateless for Phase 1
- All responses must match defined contracts

---

## Failure Strategy

If backend fails:
- return cached data
- return last-known-good response
- frontend displays “last updated”

---

## Phase Separation

Phase 1:
- local backend
- mock-first approach

Phase 2+:
- real ingestion
- expanded endpoints
- stronger backend architecture

---

## Deployment Strategy (Future)

- Backend runs on Raspberry Pi
- Frontend served via ORAS site
- Backend accessed through controlled endpoint (not direct exposure)

---

## Non-Goals (Phase 1)

- no database required yet
- no distributed systems
- no real-time streaming
- no WebSockets required