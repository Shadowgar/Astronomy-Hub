# PHASE_STRUCTURE.md

## 1. PURPOSE

This document defines the **complete execution phase structure** for Astronomy Hub.

This document is authoritative.

* All work MUST occur within a defined phase.
* No work may occur outside a phase.
* No phase may be skipped.
* No phase may expand beyond its defined scope.

---

## 2. PHASE MODEL

Two independent phase tracks exist:

```text
Backend Engineering (BE)
Frontend Engineering (FE)
```

Execution order:

```text
BE phases MUST be completed before FE phases begin.
```

Exception:

* FE1 (frontend stack setup) may begin after BE1 is complete.

---

## 3. BACKEND ENGINEERING (BE)

---

### BE1 — Canonical Backend Runtime

#### Goal

Establish FastAPI as the single backend runtime.

#### Includes

* FastAPI app creation
* Canonical app entrypoint
* Uvicorn execution
* Health endpoint

#### Excludes

* Database
* Redis
* Logging system
* Business logic migration

#### Completion Criteria

* FastAPI app runs via Uvicorn
* `/api/v1/health` endpoint returns valid response
* No alternative backend runtime exists

#### Fail Conditions

* Multiple backend entry points exist
* `server.py` is still used as primary runtime

---

### BE2 — Route Migration

#### Goal

Move existing backend functionality into FastAPI.

#### Includes

* Route definitions
* Endpoint migration
* Separation into routers
* Basic service layer extraction

#### Excludes

* Database integration
* Logging system
* Performance optimization

#### Completion Criteria

* All active endpoints exist in FastAPI
* Functional parity with previous backend behavior

#### Fail Conditions

* Missing endpoints
* Logic lost during migration

---

### BE3 — Testing Alignment

#### Goal

Make backend testable and verified.

#### Includes

* pytest configuration
* TestClient usage
* Import path fixes

#### Excludes

* New feature tests
* Performance testing

#### Completion Criteria

* pytest runs successfully
* All existing tests pass

#### Fail Conditions

* Tests fail due to import/runtime mismatch
* Tests depend on legacy backend

---

### BE4 — Configuration System

#### Goal

Standardize configuration management.

#### Includes

* pydantic-settings setup
* environment variables
* config classes

#### Completion Criteria

* All configuration comes from environment
* No hardcoded values remain

#### Fail Conditions

* Mixed configuration sources
* Missing environment support

---

### BE5 — Logging and Error System

#### Goal

Implement production-grade observability.

#### Includes

* structured logging
* JSON logs
* request IDs
* error contract

#### Completion Criteria

* All requests logged
* All errors logged with stack trace
* Error responses match contract

#### Fail Conditions

* Missing logs
* inconsistent error responses

---

### BE6 — Database Integration

#### Goal

Introduce PostgreSQL with ORM.

#### Includes

* SQLAlchemy setup
* database connection
* initial models
* Alembic migrations

#### Completion Criteria

* DB connection working
* migrations functional
* basic models persisted

#### Fail Conditions

* manual schema changes
* missing migrations

---

### BE7 — Spatial Layer

#### Goal

Enable geospatial functionality.

#### Includes

* PostGIS activation
* GeoAlchemy2 integration
* spatial models

#### Completion Criteria

* spatial queries functional
* location-based queries operational

#### Fail Conditions

* spatial data not queryable

---

### BE8 — Cache Layer

#### Goal

Introduce Redis caching.

#### Includes

* Redis connection
* cache logic
* scene caching

#### Completion Criteria

* cache hit/miss observable
* performance improvement measurable

#### Fail Conditions

* cache used as source of truth

---

### BE9 — Asset System

#### Goal

Support large-scale asset delivery.

#### Includes

* asset metadata model
* streaming endpoints
* file handling

#### Completion Criteria

* assets served via streaming
* metadata stored in DB

#### Fail Conditions

* assets stored in database
* JSON used for asset delivery

---

### BE10 — Docker Stack

#### Goal

Complete backend runtime environment.

#### Includes

* Docker Compose setup
* service orchestration
* environment wiring

#### Completion Criteria

* full stack runs via Docker
* behavior matches local execution

#### Fail Conditions

* Docker differs from local runtime

---

## 4. FRONTEND ENGINEERING (FE)

---

### FE1 — Frontend Stack Foundation

#### Goal

Establish frontend architecture.

#### Includes

* React
* Vite
* TypeScript
* folder structure

#### Completion Criteria

* app builds successfully
* TypeScript active

---

### FE2 — Data Layer

#### Goal

Standardize API communication.

#### Includes

* TanStack Query
* API client structure

#### Completion Criteria

* all API calls use query system

---

### FE3 — State Layer

#### Goal

Standardize UI state.

#### Includes

* Zustand setup
* global state structure

#### Completion Criteria

* no prop drilling for global state

---

### FE4 — Design System

#### Goal

Establish UI consistency.

#### Includes

* design tokens
* themes

#### Completion Criteria

* no hardcoded styling

---

### FE5 — Command Center Shell

#### Goal

Replace dashboard layout.

#### Includes

* layout hierarchy
* primary panel
* supporting panels

#### Completion Criteria

* one dominant UI focus exists

#### Fail Conditions

* equal-weight grid layout

---

### FE6 — Scene/Object Flow

#### Goal

Implement core product interaction.

#### Includes

* scene rendering
* object selection
* detail views

#### Completion Criteria

* full flow functional

---

### FE7 — 3D Space Rendering

#### Goal

Implement spatial visualization.

#### Includes

* Three.js integration

---

### FE8 — Earth/Globe Rendering

#### Goal

Implement geospatial visualization.

#### Includes

* CesiumJS integration

---

### FE9 — Asset UI

#### Goal

Support media display.

#### Includes

* lazy loading
* streaming handling

---

### FE10 — Frontend Testing

#### Goal

Ensure frontend reliability.

#### Includes

* Vitest
* Playwright

---

## 5. GLOBAL RULES

1. Phases must be completed sequentially
2. No skipping phases
3. No combining phases
4. Each phase must meet completion criteria
5. Failure conditions must be resolved before proceeding

---

## 6. FINAL PRINCIPLE

```text
A phase is not complete until it is verifiable.
```
