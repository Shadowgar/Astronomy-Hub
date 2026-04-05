
#`STACK_OVERVIEW.md`

---

# STACK OVERVIEW

---

## 1. PURPOSE

Defines the **complete, locked technical stack** for Astronomy Hub.

This document is authoritative.

* No alternative technologies may be introduced without approval
* No conflicting rendering systems may be introduced
* All implementation must conform to this stack

If implementation conflicts with this document, the implementation is invalid.

---

## 2. SYSTEM MODEL

The system is structured as:

```text id="y4g1v2"
Ingestion → Normalization → Storage → Cache → API → Client Rendering
```

And logically:

```text id="p7r9ka"
Scope → Engine → Filter → Scene → Object → Detail
```

---

## 3. BACKEND STACK (LOCKED)

---

### 3.1 Core Runtime

* Framework: FastAPI
* Server: Uvicorn
* Language: Python

Rules:

* FastAPI is the only backend runtime
* All endpoints must exist inside FastAPI routers
* No secondary runtime allowed

---

### 3.2 Data Validation

* Library: Pydantic

Rules:

* All request/response models must use Pydantic
* No untyped responses allowed

---

### 3.3 Configuration

* Library: pydantic-settings

Rules:

* All configuration via environment variables
* No hardcoded config

---

### 3.4 Database

* Database: PostgreSQL
* Spatial: PostGIS

Rules:

* PostgreSQL is the single source of truth
* PostGIS required for all spatial data

---

### 3.5 ORM / Access

* ORM: SQLAlchemy
* Driver: psycopg
* Spatial ORM: GeoAlchemy2

---

### 3.6 Migrations

* Tool: Alembic

Rules:

* All schema changes must use migrations

---

### 3.7 Cache Layer

* System: Redis

Rules:

* Used for caching only
* Not a source of truth

---

### 3.8 API Structure

* Base path: `/api/v1`

Rules:

* All endpoints versioned
* No unversioned routes

---

### 3.9 Response Model

```json id="k9q3ds"
{
  "data": {},
  "error": null,
  "meta": {}
}
```

---

### Error Format

```json id="l0x2af"
{
  "code": "string",
  "message": "string",
  "details": {},
  "request_id": "string"
}
```

---

### 3.10 Logging

* Python logging
* structlog
* OpenTelemetry

Must include:

* timestamp
* request_id
* route
* duration
* errors

---

### 3.11 Testing

* pytest

---

### 3.12 Containerization

* Docker Compose

Services:

* backend
* PostgreSQL/PostGIS
* Redis

---

## 4. FRONTEND STACK (LOCKED)

---

### 4.1 Core

* Framework: React
* Build Tool: Vite
* Language: TypeScript

---

### 4.2 Data Layer

* TanStack Query

Rules:

* All API calls go through query layer

---

### 4.3 State Management

* Zustand

---

### 4.4 Routing

* React Router

---

## 5. RENDERING STACK (CRITICAL)

---

### PRIMARY RENDERING ENGINE

```text id="gnw2xz"
Babylon.js
```

---

### Responsibilities

Babylon.js handles:

* Sky rendering (Sky Engine)
* Solar system rendering
* Object interaction
* Scene transitions
* Future Earth rendering (if unified approach maintained)

---

### WHY BABYLON

* modern WebGL engine
* actively maintained
* supports complex 3D scenes
* flexible for all engines
* single unified rendering layer

---

### RULES

* Babylon.js is the **primary rendering system**
* All engines must integrate into Babylon rendering pipeline
* No competing 3D engines allowed

---

### PROHIBITED

Do NOT use:

* Three.js as a separate rendering system
* Cesium as a competing rendering layer

(If Earth rendering later requires Cesium-level precision, it must be integrated carefully—not replace Babylon as system core.)

---

## 6. UI SYSTEM

---

### Layout Model

The frontend follows a **command center layout**:

* central engine viewport
* surrounding context panels
* feed-driven interaction

---

### Viewport Rule

```text id="n8y4kc"
Center Viewport = Active Engine Scene
```

---

## 7. ASSET STRATEGY

---

### Storage

* Metadata → PostgreSQL
* Files → filesystem

---

### Delivery

* streaming responses
* lazy loading

---

## 8. INGESTION MODEL

---

### Sources

* APIs
* catalogs
* data feeds

---

### Processing

```text id="bq7h1m"
Raw → Normalize → Database → Cache → API
```

---

### Rules

* no raw external data to frontend
* all data normalized

---

## 9. PERFORMANCE MODEL

---

### Core Rule

```text id="v3m9rt"
The system computes only the active scene.
```

---

### Constraints

* one active engine
* one active scene
* visible objects only
* detail loaded on demand

---

## 10. HARD RULES

---

1. No duplicate rendering systems
2. No competing architectures
3. No undocumented technologies
4. No bypassing API contracts
5. No bypassing normalization
6. No direct frontend data hacks

---

## 11. FAILURE CONDITIONS

Implementation is invalid if:

* multiple rendering engines compete
* API contracts are inconsistent
* backend is bypassed
* rendering is duplicated
* system behavior is ambiguous

---

## 12. FINAL PRINCIPLE

```text id="x7w2pd"
One system. One rendering core. One source of truth.
```

---