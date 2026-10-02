
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

Report conflicts against proven current implementation; do not force runtime
code to match stale text. [Unified Universe Architecture](UNIFIED_UNIVERSE_ARCHITECTURE.md)
defines approved future renderer direction, not installed integrations or permission
to add packages in this docs-only checkpoint.

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

* FastAPI remains the only canonical Astronomy Hub backend. It owns canonical
  Hub APIs, astronomy/science contracts, normalized Hub data authority and
  ORAS-specific backend behavior. Hub endpoints remain inside FastAPI routers.
* The bounded Earth runtime provider sidecar below is the sole approved
  renderer-specific provider exception; it cannot become a competing Hub backend.

#### Planned Earth runtime provider sidecar

The Phase B study approves a bounded sidecar behind the Earth runtime boundary,
independently versioned with Earth. It may be Node-based only where required to
preserve qualified God's Eye upstream JavaScript/Node provider/proxy behavior
with minimal divergence. This is renderer-specific upstream compatibility/service
infrastructure, not a second canonical Astronomy Hub backend or authorization
for arbitrary new Node services or backend functionality.

The sidecar may acquire, cache and proxy provider data using God's Eye-compatible
behavior. It exposes only bounded Earth runtime interfaces and/or a normalized
adapter into FastAPI; it must not define competing Hub science/data contracts.
The intended aircraft path is God's Eye provider stack → Earth provider sidecar →
normalized aircraft observations → FastAPI/Hub science consumers where needed.
Avoid duplicate upstream polling in Earth and FastAPI.

This is PLANNED Phase C/later infrastructure, neither implemented nor
production-qualified. Provider licensing/access, server-side credentials, public
tokens, quotas, rate limits, origin/access controls, abuse/spend exposure and
production hosting/hardening remain qualification gates. Same-origin placement
is not a security boundary. Implementation requires a separately authorized,
bounded task; this docs-only correction adds no service or runtime dependency.

Sections 3.2–3.12 govern the canonical FastAPI backend; the sidecar's internal
upstream implementation does not replace those Hub contracts or stack rules.

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

* Legacy API routes use `/api/v1`. Current public astronomy surfaces include
  `/api/sky/object`, `/api/above-me`, and `/api/tonight`, with their existing contracts.
* This architecture checkpoint does not rename/version or change backend APIs.

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

### ACTIVE SKY RENDERING ENGINE

```text id="gnw2xz"
Stellarium Web / Stellarium Web Engine
```

---

### Active Runtime

The ORAS Sky Engine at `/oras-sky-engine/` owns:

* Sky Engine runtime rendering
* sky object interaction and selection
* camera, projection, and scene lifecycle
* survey imagery and runtime data loading

---

### Approved Future Renderer Directions

* Earth: complete applicable God's Eye View runtime with its Cesium foundation,
  external Hub adapter and additive astronomy extensions. Integration not started.
* Planet: body-aware Cesium surface runtime with qualified body-specific data,
  first proof Mars; not implemented.
* Solar-system scale: renderer OPEN; study SWE sufficiency versus a dedicated scene.

Phase B selected external SHA-pinned God's Eye source, an independent full-app
build/external ORAS wrapper and same-origin disposable frames with a versioned
Hub bridge and active-only heavy-renderer lifetime. These are PLANNED directions;
exact bridge schema, adapter/extension APIs and runtime qualification remain OPEN.
No new dependencies or vendor changes occur in this checkpoint. Upstream SWE/God's Eye source is immutable by default;
qualified revision upgrades repair adapters rather than repeat widespread patches.
Provider/data/asset terms remain separate from source-code licensing.

---

### RULES

* each primary engine owns its renderer and runtime lifecycle
* `/oras-sky-engine/` remains isolated from Hub rendering abstractions
* approved future directions above still require compatibility qualification and a bounded implementation task
* The Hub must not become a shared universal 3D rendering core

---

### PROHIBITED

Do NOT replace Stellarium Web Engine at `/oras-sky-engine/` with a Hub-owned or
shared renderer.

---

## 6. UI SYSTEM

---

### Layout Model

The public frontend uses a shared ORAS shell with Home, Observe, Tonight and
Sky navigation. Home is a compact astronomy decision surface; Observe and
Tonight expose qualified facts and planning workflows. The Sky host mounts the
contained runtime. Legacy command-center components remain reusable code, not
the public homepage presentation.

The approved future flagship is a renderer-centered full viewport with contextual
floating controls, hide/edge-return/pin/immersive chrome, and progressive disclosure.
Hub-owned universal product state/chrome does not transfer rendering ownership.
Home/Sky may converge conceptually; Observe/Tonight remain routes and also gain
workspace drawers. Approved visual mockups precede future UX coding. None of this
workspace redesign has been implemented.

---

### Viewport Rule

```text id="n8y4kc"
Mounted Sky Viewport = Contained Stellarium Runtime
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
Focus renderer work on the active domain scene; background data services remain independent.
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

1. No competing/duplicated renderer ownership; controlled specialized renderer handoffs are approved
2. No competing architectures
3. No undocumented technologies
4. No bypassing API contracts
5. No bypassing normalization
6. No direct frontend data hacks

---

## 11. FAILURE CONDITIONS

Implementation is invalid if:

* multiple renderers compete for the same scene or product-state authority
* API contracts are inconsistent
* backend is bypassed
* rendering is duplicated
* system behavior is ambiguous

---

## 12. FINAL PRINCIPLE

```text id="x7w2pd"
One system. Engine-owned rendering. One source of truth.
```

---
