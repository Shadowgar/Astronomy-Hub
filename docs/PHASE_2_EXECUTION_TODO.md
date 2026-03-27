# 🌌 ASTRONOMY HUB — PHASE 2 EXECUTION TODO (AUTHORITATIVE)

---

# 0. PURPOSE

This document defines:

> **Exactly how to execute Phase 2.5 (Backend Stabilization) step-by-step**

It translates:

* architecture
* contracts
* phase rules

into **safe, controlled implementation steps**

---

# 1. 🧠 CORE RULE

```text id="q8x3m2"
Execute ONE step at a time.
Verify before continuing.
Do NOT batch steps.
```

---

# 2. 📍 CURRENT TARGET

```text id="m2p9x7"
PHASE: 2.5C — Backend Framework Migration (FastAPI)
```

---

# 3. ⚠️ HARD CONSTRAINTS

---

## MUST NOT

* add features
* change UI behavior
* introduce new engines
* redesign architecture
* break existing endpoints

---

## MUST

* keep system running
* maintain compatibility
* use minimal diffs
* verify each step

---

# 4. 🧱 TARGET BACKEND STRUCTURE

---

## Goal Structure

```text id="p7k3x9"
backend/
  app/
    main.py
    api/
    engines/
    contracts/
    services/
    cache/
```

---

## Rule

```text id="x4m8p2"
Do NOT move everything at once.
Migrate incrementally.
```

---

# 5. 🔄 EXECUTION PHASES

---

# ✅ STEP 1 — Introduce FastAPI Skeleton

---

## Goal

Add FastAPI WITHOUT breaking existing system.

---

## Actions

* create:

```text
backend/app/main.py
```

* initialize FastAPI app
* add basic health endpoint

---

## Verify

* FastAPI server runs
* `/health` returns success
* existing system still runs

---

## Done when

* FastAPI is live alongside existing backend

---

---

# ✅ STEP 2 — Wire Docker to FastAPI

---

## Goal

Switch backend container to FastAPI entry.

---

## Actions

* update Dockerfile
* update docker-compose command
* point to `app/main.py`

---

## Verify

* container starts
* FastAPI is reachable
* no crashes

---

## Done when

* FastAPI is official runtime

---

---

# ✅ STEP 3 — Add `/api/scene` Route (Wrapper Only)

---

## Goal

Introduce canonical route WITHOUT rewriting logic.

---

## Actions

* create:

```text
backend/app/api/scene.py
```

* route:

```text
GET /api/scene/{scope}
```

* internally call existing logic

---

## Verify

* response matches existing output
* no frontend break

---

## Done when

* new route works identically

---

---

# ✅ STEP 4 — Add `/api/object` Route

---

## Goal

Introduce object detail endpoint.

---

## Actions

* create:

```text
backend/app/api/object.py
```

* route:

```text
GET /api/object/{id}
```

* return stub if needed

---

## Verify

* endpoint responds
* no system break

---

## Done when

* endpoint exists and stable

---

---

# ✅ STEP 5 — Introduce Normalization Layer

---

## Goal

Start enforcing contracts.

---

## Actions

* create:

```text
backend/app/services/normalizer.py
```

* wrap scene response
* map fields to contract format

---

## Verify

* response structure consistent
* no missing fields

---

## Done when

* normalization applied to scene

---

---

# ✅ STEP 6 — Introduce Validator

---

## Goal

Ensure contract compliance.

---

## Actions

* reuse or move validator
* validate responses before return

---

## Verify

* invalid data rejected
* valid data passes

---

## Done when

* contract enforcement active

---

---

# ✅ STEP 7 — Introduce Caching Layer

---

## Goal

Prevent repeated computation.

---

## Actions

* move simple_cache into new structure
* wrap scene endpoint

---

## Verify

* repeated calls faster
* no stale data issues

---

## Done when

* caching active

---

---

# ✅ STEP 8 — Migrate One Engine (Pilot)

---

## Goal

Test engine-based structure.

---

## Actions

* create:

```text
backend/app/engines/conditions/
```

* move logic into engine
* connect to scene route

---

## Verify

* output unchanged
* logic isolated

---

## Done when

* one engine fully migrated

---

---

# ✅ STEP 9 — Remove Direct Data Files (Gradual)

---

## Goal

Eliminate mock-style architecture.

---

## Actions

* replace direct imports
* route through engine

---

## Verify

* no direct data usage
* system still works

---

## Done when

* engine owns data

---

---

# ✅ STEP 10 — Expand Engine Migration

---

## Goal

Apply pattern to all engines.

---

## Engines

* satellites
* targets
* passes
* alerts

---

## Verify

* each engine isolated
* outputs consistent

---

## Done when

* all engines migrated

---

---

# 6. 🧪 VERIFICATION AFTER EACH STEP

---

## Must Check

```text id="v3k7p2"
- system runs
- no crashes
- API responds
- frontend still works
```

---

## If ANY fail

```text id="x8p2m4"
STOP
ROLL BACK
FIX
RETEST
```

---

# 7. 🚫 AUTOMATIC STOP CONDITIONS

---

Stop immediately if:

* frontend breaks
* API shape changes unexpectedly
* contracts violated
* system crashes

---

# 8. 🎯 DEFINITION OF COMPLETE

---

Phase 2.5 is complete ONLY IF:

---

## Backend

* FastAPI fully active
* all routes stable
* normalization enforced
* validation enforced
* caching active

---

## Architecture

* engines isolated
* no direct data files
* no mock-style responses

---

## Frontend

* no data patching
* stable rendering

---

# 9. 🔥 FINAL RULE

```text id="k9p3x7"
Do not move to Phase 3
until ALL steps are verified complete.
```

---

# 10. 🔥 FINAL STATEMENT

```text id="m4q8p2"
This document controls execution.

Follow it exactly.

No shortcuts.
No assumptions.
No skipping.
```

---

## Where you are now

You now have:

* full architecture
* full UI system
* full styling system
* full validation
* full execution plan

---
