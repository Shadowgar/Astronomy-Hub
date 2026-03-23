# Astronomy Hub — Master Plan

## Vision

Astronomy Hub is a unified, field-ready astronomy intelligence interface for ORAS members. It is designed to answer the most practical question first:

> What should I know about the sky right now, from where I am, and what should I look at next?

The system is intended to begin as a calm, local, decision-support dashboard and later expand into a broader astronomy intelligence platform that can surface satellites, celestial events, observing conditions, space weather, and curated ORAS knowledge.

This is not intended to begin as a giant global command center. It begins as a practical observing assistant and grows outward in phases.

---

## Product Goals

- Give members a simple, useful astronomy dashboard
- Prioritize field usability over raw data volume
- Support both beginners and experienced observers
- Keep the backend lightweight and deployable later to Raspberry Pi
- Keep the frontend visually modern, clean, and expandable
- Use deterministic logic first, not AI-first design
- Build in strict phases to reduce drift and token waste

---

## Core Product Principles

- Decision support first
- Local sky first
- Drill-down over overload
- Curated ORAS value over raw feed dumping
- Mock-first development
- Stable data contracts before live integrations
- Frontend and backend separation of concerns
- Build locally first, deploy later

---

## Phase Overview

### Phase 1 — Local Sky MVP
Deliver a practical local observing dashboard:
- observing conditions
- recommended targets
- upcoming visible satellite passes
- alerts / notable events
- moon summary
- local drill-down pages

Phase 1 is the foundation for all future phases.

### Phase 2 — Data and System Expansion
Expand backend shape and data breadth:
- stronger backend structure
- more robust endpoint planning
- broader local astronomy data coverage
- first expansion beyond basic local summary

### Phase 3 — Richer Exploration
Add deeper exploration tools:
- richer target detail
- more advanced satellite detail
- stronger event exploration
- more refined user controls

### Phase 4 — Global and Advanced Views
Move beyond strictly local dashboards:
- wider regional/global context
- more advanced visualization layers
- more dynamic exploration patterns

### Phase 5 — Specialized Astronomy Intelligence
Potential later additions:
- solar/space weather deep views
- observatory-related layers
- astrophotography-support features
- historical replay / trend analysis

### Phase 6 — Public-Ready / Production Hardening
- deployment architecture
- caching strategy hardening
- performance tuning
- reliability and failure handling
- public-safe exposure model

---

## Phase 1 Priority

Phase 1 is the most important phase.

If Phase 1 is weak:
- future phases become harder to integrate
- UI becomes harder to fix
- data contracts drift
- token cost rises

Therefore Phase 1 must be treated as the execution foundation, not a prototype to throw away.

---

## Technical Direction

### Frontend
Initially built locally inside the main Astronomy-Hub workspace.

Responsibilities:
- render the dashboard
- present clean module-based UI
- consume mocked and later live backend endpoints
- support Day / Night / Red modes
- support responsive/mobile-friendly layout

### Backend
Initially built locally inside the same workspace.

Responsibilities:
- provide mock and later live JSON endpoints
- normalize incoming data shapes
- cache data
- serve simple API responses
- stay lightweight enough for later Raspberry Pi deployment

### Deployment Strategy
Do not optimize for remote deployment yet.

Current strategy:
- build locally
- validate locally
- harden Phase 1 locally
- move backend to Raspberry Pi only after Phase 1 stabilizes

---

## Documentation Strategy

The docs folder is the source of truth.

Required documents:
- `MASTER_PLAN.md`
- `PHASE_1_SPEC.md`
- `PHASE_1_ACCEPTANCE_CRITERIA.md`
- `ARCHITECTURE_OVERVIEW.md`
- `DATA_CONTRACTS.md`
- `UI_INFORMATION_ARCHITECTURE.md`
- `CODING_GUARDRAILS.md`
- `VALIDATION_CHECKLIST.md`
- `SESSION_CONTINUITY_BRIEF.md`

Backend-specific docs:
- `backend/docs/BACKEND_ARCHITECTURE.md`
- `backend/docs/API_ENDPOINT_PLAN.md`
- `backend/docs/CACHE_STRATEGY.md`
- `backend/docs/INGESTION_PLAN.md`

---

## Build Order

1. Lock docs
2. Lock Phase 1 scope
3. Lock data contracts
4. Create mocked backend responses
5. Build frontend shell
6. Wire local backend endpoints
7. Validate Phase 1 locally
8. Only then discuss Pi deployment

---

## Non-Goals Right Now

Not part of the immediate build:
- globe view
- global satellite map
- Cesium / heavy 3D rendering
- AR mode
- aircraft layers
- large-scale distributed ingestion
- AI assistant features
- public internet exposure of backend

---

## Definition of Success

Astronomy Hub succeeds when an ORAS member can open one page and quickly understand:

- whether tonight is good for observing
- what to look at
- when to look
- what nearby-relevant events matter
- where to go next for more detail