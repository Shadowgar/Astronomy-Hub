# 🌌 PHASE 1 BUILD SEQUENCE (AUTHORITATIVE — VERIFY-FIRST EXECUTION)

---

# 0. PURPOSE

This document defines:

```text
The exact execution procedure for Phase 1.
```

Phase 1 MUST be executed as:

```text
VERIFY → ACCEPT or REBUILD → VERIFY → LOCK
```

---

# 🚨 GLOBAL RULE (NON-NEGOTIABLE)

```text
NO component may be rebuilt if it already satisfies Phase 1 Spec + Acceptance.
```

```text
ALL components MUST be verified before any rebuild is allowed.
```

---

# EXECUTION MODE

Each step MUST follow:

```text
1. VERIFY (against Phase 1 Spec + Acceptance)
2. IF VALID → MARK COMPLETE (no changes)
3. IF INVALID → REBUILD MINIMALLY
4. RE-VERIFY
5. LOCK STEP
```

---

# FAILURE RULE

```text
If verification cannot prove correctness → treat as INVALID → rebuild.
```

---

# STEP 1 — CANONICAL RUNTIME (DOCKER)

---

## VERIFY

* Docker Compose starts:

  * frontend
  * backend (FastAPI)
  * postgres/postgis
  * redis
* frontend is reachable
* backend API responds

---

## IF VALID

```text
Mark COMPLETE — DO NOT MODIFY
```

---

## IF INVALID

* Fix Docker configuration
* Ensure services connect
* Re-test runtime

---

## LOCK CONDITION

```text
System runs fully via Docker
```

---

# STEP 2 — BACKEND PIPELINE (CRITICAL)

---

## VERIFY

* System follows:

```text
Scope → Engine → Filter → Scene → Object → Detail
```

Check:

* engines return structured data only
* scene assembled in backend
* filters applied before scene output
* scene is merged (multi-engine)
* scene is ranked

---

## IF VALID

```text
Mark COMPLETE — DO NOT MODIFY
```

---

## IF INVALID

* Extract or fix services
* enforce engine boundaries
* enforce scene assembly

---

## LOCK CONDITION

```text
Backend fully enforces pipeline
```

---

# STEP 3 — API CONTRACTS

---

## VERIFY

* endpoints exist:

  * `/api/v1/scene/above-me`
  * `/api/v1/object/{id}`
* responses are stable JSON
* no raw provider data leaks
* contract shape consistent

---

## IF VALID

```text
Mark COMPLETE — DO NOT MODIFY
```

---

## IF INVALID

* normalize responses
* fix schema inconsistencies

---

## LOCK CONDITION

```text
Contracts stable and deterministic
```

---

# STEP 4 — SCENE MODEL

---

## VERIFY

* scene contains:

  * mixed engine objects
  * above-horizon objects only
  * ranked results
* objects include:

  * id, type, engine, summary, position

---

## IF VALID

```text
Mark COMPLETE — DO NOT MODIFY
```

---

## IF INVALID

* fix merge logic
* enforce filtering
* enforce ranking

---

## LOCK CONDITION

```text
Scene is correct and constrained
```

---

# STEP 5 — FRONTEND DATA LAYER (FE2)

---

## VERIFY

* ALL data via TanStack Query
* normalization exists in:

  * `features/*/queries.ts`
* NO component contains:

  * payload.data fallback
  * raw parsing

---

## IF VALID

```text
Mark COMPLETE — DO NOT MODIFY
```

---

## IF INVALID

* move normalization to query layer
* remove fallback logic from components

---

## LOCK CONDITION

```text
UI consumes normalized data only
```

---

# STEP 6 — STATE MANAGEMENT (FE3)

---

## VERIFY

* Zustand used for UI/global state
* Query used for server data
* React state used locally only

---

## IF VALID

```text
Mark COMPLETE — DO NOT MODIFY
```

---

## IF INVALID

* refactor state ownership
* remove duplication

---

## LOCK CONDITION

```text
State ownership is correct and isolated
```

---

# STEP 7 — UI STRUCTURE (COMMAND CENTER)

---

## VERIFY

UI layout follows:

```text
Command Bar
Primary Scene (dominant)
Live Decision Panel
Supporting Panels
```

Check:

* scene is visually dominant
* no equal-weight grid
* decision panel exists
* panels are subordinate

---

## IF VALID

```text
Mark COMPLETE — DO NOT MODIFY
```

---

## IF INVALID

* restructure layout
* remove grid-based layout
* enforce hierarchy

---

## LOCK CONDITION

```text
UI matches command-center architecture
```

---

# STEP 8 — SCENE INTERACTION

---

## VERIFY

* objects clickable
* detail loads via API
* return restores state

---

## IF VALID

```text
Mark COMPLETE — DO NOT MODIFY
```

---

## IF INVALID

* fix routing
* fix state persistence

---

## LOCK CONDITION

```text
Scene → object → detail loop works
```

---

# STEP 9 — MEDIA SYSTEM (FE9)

---

## VERIFY

* `AssetImage` exists
* media rendering centralized
* no direct `<img>` in core flows

---

## IF VALID

```text
Mark COMPLETE — DO NOT MODIFY
```

---

## IF INVALID

* introduce wrapper
* refactor usage

---

## LOCK CONDITION

```text
Media standardized
```

---

# STEP 10 — VISUAL FOUNDATIONS (FE7 + FE8)

---

## VERIFY

* Three.js starfield exists and bounded
* Cesium component exists and isolated

---

## IF VALID

```text
Mark COMPLETE — DO NOT MODIFY
```

---

## IF INVALID

* implement minimal foundation only
* DO NOT integrate deeply

---

## LOCK CONDITION

```text
Foundations present but non-invasive
```

---

# STEP 11 — TESTING (FE10)

---

## VERIFY

* passes:

  * `npm run test`
  * `npm run build`
  * `npm run type-check`
  * `npm run test:e2e`

* coverage includes:

  * scene load
  * object detail
  * navigation
  * responsive layout
  * error fallback

---

## IF VALID

```text
Mark COMPLETE — DO NOT MODIFY
```

---

## IF INVALID

* add minimal tests
* verify core flows only

---

## LOCK CONDITION

```text
Core flows verified
```

---

# STEP 12 — SCOPE DISCIPLINE

---

## VERIFY

System does NOT include:

* globe UI
* aircraft tracking
* Phase 2 features
* predictive systems

---

## IF VALID

```text
Mark COMPLETE — DO NOT MODIFY
```

---

## IF INVALID

* remove violating features

---

## LOCK CONDITION

```text
Phase 1 scope clean
```

---

# FINAL PHASE LOCK

---

Phase 1 is COMPLETE ONLY IF:

```text
ALL steps are LOCKED
NO step required rebuild OR all rebuilds passed re-verification
```

---

# 🚨 FINAL RULE

```text
Do NOT proceed to Phase 2 unless Phase 1 is fully verified and locked.
```

---