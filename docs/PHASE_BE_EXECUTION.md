# PHASE_BE_EXECUTION.md

## 1. PURPOSE

This document defines the **exact execution steps** for Backend Engineering (BE).

This document is authoritative.

* Follow steps in order
* Do not skip steps
* Do not combine steps
* Do not expand scope
* Do not introduce new tech

---

## 2. GLOBAL RULES

1. Only one step is active at a time
2. Each step must meet completion criteria before continuing
3. If a step fails, fix it before proceeding
4. Do not modify unrelated files
5. Do not introduce new architecture decisions

---

## 3. BE1 — CANONICAL BACKEND RUNTIME

### Step BE1.1 — Create FastAPI App

Create:

```text id="be1p1"
backend/app/main.py
```

Must contain:

* FastAPI app instance
* `/api/v1/health` endpoint

Health response MUST return:

```json id="be1p2"
{
  "status": "ok"
}
```

---

### Step BE1.2 — Verify Uvicorn

Command:

```bash id="be1p3"
uvicorn backend.app.main:app --reload
```

Verification:

* server starts
* `/api/v1/health` returns valid response

---

### Step BE1.3 — Remove Runtime Ambiguity

Rules:

* `server.py` MUST NOT be used as runtime
* FastAPI app is the ONLY runtime

Completion:

* no command uses `server.py` to run backend

---

## 4. BE2 — ROUTE MIGRATION

### Step BE2.1 — Create Router Structure

Create:

```text id="be2p1"
backend/app/api/routes/
```

Files required:

```text id="be2p2"
health.py
conditions.py
scene.py
objects.py
targets.py
passes.py
alerts.py
scopes.py
location.py
```

---

### Step BE2.2 — Register Routers

All routers MUST be registered in:

```text id="be2p3"
main.py
```

Under `/api/v1`

---

### Step BE2.3 — Migrate Endpoints

For each existing endpoint in `server.py`:

* Move logic into corresponding router
* Preserve behavior
* Use Pydantic models

Rules:

* No logic may remain in `server.py`
* No endpoint duplication allowed

---

### Step BE2.4 — Extract Services

Move business logic into:

```text id="be2p4"
backend/app/services/
```

Rules:

* Route handlers MUST remain thin
* No heavy logic inside routers

---

## 5. BE3 — TESTING ALIGNMENT

### Step BE3.1 — Fix Import Paths

Tests MUST import:

```python id="be3p1"
from backend.app.main import app
```

---

### Step BE3.2 — Configure Test Client

Use FastAPI TestClient.

---

### Step BE3.3 — Run Tests

Command:

```bash id="be3p2"
pytest
```

Completion:

* All tests run
* All tests pass

---

## 6. BE4 — CONFIGURATION

### Step BE4.1 — Create Settings

Create:

```text id="be4p1"
backend/app/core/settings.py
```

Use `pydantic-settings`

---

### Step BE4.2 — Environment Files

Create:

* `.env`
* `.env.example`

Rules:

* No hardcoded config
* All config via environment

---

## 7. BE5 — LOGGING & ERRORS

### Step BE5.1 — Logging Setup

Create:

```text id="be5p1"
backend/app/core/logging.py
```

Requirements:

* JSON logs
* request_id support

---

### Step BE5.2 — Middleware

Add request logging middleware.

Must log:

* request start
* request end
* duration
* route

---

### Step BE5.3 — Error Handler

Implement global exception handler.

Must:

* return standardized error response
* log full stack trace

---

## 8. BE6 — DATABASE

### Step BE6.1 — DB Setup

Create:

```text id="be6p1"
backend/app/db/
```

Include:

* engine
* session

---

### Step BE6.2 — Models

Create initial models.

---

### Step BE6.3 — Alembic

Initialize migrations:

```bash id="be6p2"
alembic init
```

---

### Step BE6.4 — Migration Test

Run:

```bash id="be6p3"
alembic upgrade head
```

---

## 9. BE7 — POSTGIS

### Step BE7.1 — Enable Extension

Enable PostGIS in database.

---

### Step BE7.2 — Spatial Models

Use GeoAlchemy2 for geometry fields.

---

### Step BE7.3 — Test Queries

Verify:

* location-based query works

---

## 10. BE8 — REDIS

### Step BE8.1 — Redis Connection

Create:

```text id="be8p1"
backend/app/cache/
```

---

### Step BE8.2 — Cache Logic

Implement:

* get/set cache
* TTL support

---

### Step BE8.3 — Scene Cache

Apply caching to scene endpoints.

---

## 11. BE9 — ASSETS

### Step BE9.1 — Asset Model

Create asset metadata model.

---

### Step BE9.2 — Streaming Endpoint

Create endpoint using streaming/file response.

Rules:

* no JSON wrapping

---

## 12. BE10 — DOCKER

### Step BE10.1 — Compose File

Create:

```text id="be10p1"
docker-compose.yml
```

Services:

* backend
* postgres/postgis
* redis

---

### Step BE10.2 — Run Stack

Command:

```bash id="be10p2"
docker-compose up
```

---

### Step BE10.3 — Verify

* backend reachable
* DB connected
* Redis connected

---

## 13. FINAL COMPLETION

Phase BE is complete when:

* FastAPI is canonical runtime
* All routes migrated
* Tests pass
* DB works
* Redis works
* Logging works
* Docker runs full stack

---

## 14. FAILURE CONDITIONS

Phase BE is invalid if:

* multiple backend runtimes exist
* tests do not pass
* logging missing
* DB unmanaged
* assets mishandled
* Redis used as source of truth

---

## 15. FINAL PRINCIPLE

```text id="beend"
Backend must be deterministic, observable, and verifiable at all times.
```
