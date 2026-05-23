# STACK_OVERVIEW.md

## 1. PURPOSE

This document defines the **complete, locked technical stack** for Astronomy Hub.

This document is authoritative.

* No alternative technologies may be introduced.
* No substitutions may be made.
* No additional frameworks may be added unless explicitly approved.

If implementation conflicts with this document, the implementation is invalid.

---

## 2. SYSTEM MODEL

The system is structured as:

```
Ingestion → Normalization → Storage → Cache → API → Client Rendering
```

Additionally:

```
Engines → Filters → Scenes → Objects → Details → Assets
```

All technical decisions must support this model.

---

## 3. BACKEND STACK (LOCKED)

### 3.1 Core Runtime

* Framework: FastAPI
* Server: Uvicorn
* Language: Python

Rules:

* FastAPI is the **only canonical backend runtime**
* No secondary server (e.g., http.server) may act as a primary runtime
* All API endpoints must be defined within FastAPI routers

---

### 3.2 Data Validation

* Library: Pydantic

Rules:

* All request and response models MUST use Pydantic
* No untyped dictionaries may be returned from API endpoints
* Validation must occur at API boundaries

---

### 3.3 Configuration

* Library: pydantic-settings

Rules:

* All configuration MUST come from environment variables
* No hardcoded configuration values allowed
* All environments must be supported:

  * local
  * test
  * docker
  * production

---

### 3.4 Database

* Database: PostgreSQL
* Spatial Extension: PostGIS

Rules:

* PostgreSQL is the **single source of truth**
* PostGIS MUST be used for all spatial data
* No alternative database systems allowed

---

### 3.5 ORM / Database Access

* ORM: SQLAlchemy
* Driver: psycopg
* Spatial ORM: GeoAlchemy2

Rules:

* All database access MUST go through SQLAlchemy
* Direct SQL is allowed only when necessary and must be isolated
* Spatial queries MUST use GeoAlchemy2

---

### 3.6 Migrations

* Tool: Alembic

Rules:

* All schema changes MUST use Alembic migrations
* Manual schema changes are forbidden
* Database schema must always be reproducible from migrations

---

### 3.7 Cache Layer

* System: Redis

Rules:

* Redis is used ONLY for:

  * caching
  * transient data
  * performance optimization
* Redis MUST NOT be used as a source of truth

---

### 3.8 API Structure

* Base path: `/api/v1`

Rules:

* All endpoints MUST be versioned under `/api/v1`
* No unversioned endpoints allowed

---

### 3.9 Response Model Strategy

#### JSON Endpoints

Must use Pydantic models.

Response MUST follow:

```
{
  data: <object or list>,
  error: null OR error_object,
  meta: optional
}
```

#### Error Object

```
{
  code: string,
  message: string,
  details: optional,
  request_id: string
}
```

Rules:

* All errors MUST follow this structure
* No raw exception messages returned

---

#### Asset Endpoints

Rules:

* MUST use streaming/file responses
* MUST NOT use JSON envelopes
* MUST support large payload delivery

---

### 3.10 Logging (MANDATORY)

System:

* Python logging
* structlog
* JSON output
* OpenTelemetry (traces + metrics)

Every log MUST include:

* timestamp
* level
* event name
* request_id
* route
* duration (if applicable)
* error details (if applicable)

Rules:

* All exceptions MUST log full stack trace
* All API requests MUST log start and completion
* All DB interactions SHOULD log duration
* All cache interactions SHOULD log hit/miss

Failure to log critical operations = invalid implementation

---

### 3.11 Testing

* Framework: pytest

Rules:

* All endpoints MUST be testable
* Tests MUST target the FastAPI app
* Tests MUST NOT depend on legacy server code
* Test categories:

  * API tests
  * service tests
  * integration tests

---

### 3.12 Containerization

* System: Docker Compose

Services MUST include:

* backend (FastAPI)
* PostgreSQL + PostGIS
* Redis

Rules:

* Docker environment MUST match local runtime behavior
* No environment-specific logic differences allowed

---

## 4. FRONTEND STACK (LOCKED)

### 4.1 Core

* Framework: React
* Build tool: Vite
* Language: TypeScript

Rules:

* TypeScript is required for all new code
* No untyped components allowed long-term

---

### 4.2 Data Layer

* TanStack Query

Rules:

* All API calls MUST go through query layer
* No direct fetch calls in components

---

### 4.3 State Management

* Zustand

Rules:

* Global UI state MUST use Zustand
* No prop-drilling for global state

---

### 4.4 Routing

* React Router

Rules:

* All navigation MUST use router
* No manual pathname logic allowed

---

### 4.5 Visualization

#### Space / Sky

* Three.js

#### Earth / Satellites

* CesiumJS

Rules:

* Three.js MUST handle spatial/astronomy rendering
* Cesium MUST handle globe/geospatial rendering
* Do NOT mix responsibilities

---

### 4.6 Styling

* Token-based design system

Rules:

* All spacing, color, typography MUST use tokens
* No hardcoded styling values allowed

---

### 4.7 Testing

* Vitest (unit)
* Playwright (E2E)

---

## 5. ASSET STRATEGY (LOCKED)

### Storage

* Metadata → PostgreSQL
* Files → filesystem (initially)

Rules:

* Large files MUST NOT be stored in database
* Database stores references only

---

### Delivery

* Streaming/file responses

Rules:

* Assets MUST be lazily loaded
* Frontend MUST NOT preload large datasets

---

## 6. INGESTION MODEL (LOCKED)

### Sources

* External APIs
* Data feeds
* Catalog imports

### Processing

```
Raw Data → Normalization → Database → Cache → API
```

Rules:

* All external data MUST be normalized before use
* No direct external data exposure to frontend

---

## 7. HARD RULES

1. No duplicate runtime paths
2. No competing architectures
3. No undocumented technology additions
4. No bypassing validation layers
5. No bypassing logging requirements
6. No direct frontend-backend contract violations

---

## 8. FAILURE CONDITIONS

Implementation is invalid if:

* Multiple backend runtimes exist
* API responses are inconsistent
* Logging is missing or incomplete
* Database schema is unmanaged
* Assets are incorrectly stored
* Frontend bypasses data layer
* Any ambiguity exists in behavior

---

## 9. FINAL PRINCIPLE

```
If interpretation is required, the system is incorrectly defined.
```