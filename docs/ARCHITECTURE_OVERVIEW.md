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