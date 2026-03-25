# 📄 `docs/PHASE_2_5_SPEC.md`

# **PHASE 2.5 — FOUNDATION REALIGNMENT & SYSTEM HARDENING**

---

# 🧠 PHASE INTENT

Phase 2.5 exists to transition Astronomy Hub from a **functional prototype system** into a **controlled, deterministic, production-grade foundation**.

This phase is not optional.

This phase ensures that all future capabilities—especially:

* sky visualization (Phase 3)
* time navigation
* multi-location intelligence
* advanced decision logic

—are built on a system that is:

* **contract-enforced**
* **type-safe**
* **predictable**
* **observable**
* **deployable**

---

# 🔒 PRIMARY DOCTRINE

This phase enforces the following system law:

> **No meaningful system behavior may exist outside of defined contracts, typed models, and controlled runtime layers.**

---

# 🚫 WHAT THIS PHASE IS NOT

This phase does NOT:

* add new user features
* introduce new data domains
* expand astronomy intelligence
* redesign UI behavior

If any of the above occur → **this phase has failed**

---

# 📍 POSITION IN SYSTEM LIFECYCLE

```text
Phase 1 — Local Sky MVP
Phase 2 — Structured Decision System
Phase 2.5 — FOUNDATION REALIGNMENT (THIS PHASE)
Phase 3 — Visualization + Exploration
Phase 4 — Intelligence + Prediction
```

---

# 🧱 SYSTEM TRANSFORMATION OVERVIEW

| Layer     | Before Phase 2.5         | After Phase 2.5                |
| --------- | ------------------------ | ------------------------------ |
| Backend   | loose Python server      | FastAPI contract-driven API    |
| Contracts | informal JSON            | enforced Pydantic schemas      |
| Frontend  | JS + implicit shapes     | TypeScript + strict interfaces |
| Data flow | loosely structured       | adapter-controlled pipeline    |
| Infra     | manual startup           | Dockerized environment         |
| Runtime   | flexible but drift-prone | deterministic and constrained  |

---

# ⚙️ BACKEND FOUNDATION — AUTHORITATIVE REQUIREMENTS

---

## 🔹 1. FRAMEWORK MIGRATION (MANDATORY)

Backend MUST migrate to:

```text
FastAPI + Uvicorn + Pydantic
```

### Rationale

* enforce schema contracts
* standardize request/response lifecycle
* prepare for async + scaling
* eliminate implicit runtime behavior

---

## 🔹 2. CANONICAL BACKEND STRUCTURE

Backend must be reorganized into:

```text
backend/
  app/
    main.py                ← FastAPI entrypoint
    api/
      routes/
    schemas/               ← Pydantic models ONLY
    services/              ← business logic ONLY
    core/                  ← config, logging, errors
    dependencies/          ← shared injection logic
```

---

## 🔹 3. CONTRACT AUTHORITY (NON-NEGOTIABLE)

### All outbound data MUST:

* originate from Pydantic models
* pass validation before leaving backend
* conform to versioned contract definitions

---

## 🔹 4. RESPONSE ENVELOPE STANDARD

Every API response MUST follow:

```json
{
  "status": "ok | degraded | error",
  "data": {},
  "meta": {
    "timestamp": "",
    "source": "",
    "confidence": ""
  },
  "errors": []
}
```

---

## 🔹 5. STRICT VALIDATION RULES

Pydantic models MUST:

* forbid unknown fields (`extra = "forbid"`)
* enforce required fields
* define explicit optionality
* include field descriptions

---

## 🔹 6. ERROR SYSTEM (CENTRALIZED)

Introduce:

```text
core/errors.py
```

Responsibilities:

* map exceptions → API-safe responses
* define error codes
* support degraded mode signaling

---

## 🔹 7. SERVICE LAYER DOCTRINE

Rules:

* ALL business logic lives in `/services`
* route handlers = thin wrappers only
* no data shaping in routes
* no logic in schemas

---

## 🔹 8. CACHING CONSISTENCY

Phase 2 cache system must be:

* isolated in `services/cache`
* controlled via TTL
* transparent to routes

---

## 🔹 9. ASYNC PREPARATION

Even if not fully async:

* endpoints must be async-ready
* no blocking architecture patterns

---

# ⚡ FRONTEND FOUNDATION — AUTHORITATIVE REQUIREMENTS

---

## 🔹 1. FULL TYPESCRIPT MIGRATION

ALL frontend code MUST:

* be `.ts` / `.tsx`
* compile under strict mode
* contain zero implicit `any`

---

## 🔹 2. TYPE AUTHORITY MODEL

Frontend types MUST:

* mirror backend schemas
* be centrally defined
* never be duplicated inconsistently

---

## 🔹 3. DATA FLOW PIPELINE (ENFORCED)

```text
API → Adapter → Typed Model → Component
```

### Rules:

* components NEVER consume raw API data
* adapters normalize + validate
* UI only consumes clean, typed data

---

## 🔹 4. ADAPTER SYSTEM (MANDATORY)

Location:

```text
frontend/src/lib/adapters/
```

Responsibilities:

* shape backend responses
* enforce defaults
* handle degraded mode
* isolate backend changes

---

## 🔹 5. COMPONENT CONTRACT RULES

Every component must:

* define explicit Props type
* avoid hidden dependencies
* avoid inline transformation logic

---

## 🔹 6. UI STATE MODEL

Every module must support:

* loading
* error
* degraded
* empty
* success

No silent failure allowed.

---

# 🎨 STYLING SYSTEM DECISION (FORMALIZED)

---

## THIS PHASE REQUIRES A BINARY DECISION

---

### OPTION A — TAILWIND (FULL ADOPTION)

If selected:

* Tailwind becomes the ONLY styling system
* design tokens must be mapped into Tailwind config
* no standalone CSS allowed

---

### OPTION B — TOKEN-BASED CSS SYSTEM

If retained:

Must formally define:

* spacing scale
* typography system
* color tokens
* layout grid
* module hierarchy

---

### ❌ FORBIDDEN

* hybrid styling systems
* inconsistent spacing/typography
* ad hoc CSS overrides

---

# 🐳 INFRASTRUCTURE — DOCKERIZATION

---

## 🔹 REQUIRED ARCHITECTURE

```text
docker-compose.yml
```

Services:

```text
frontend
backend
```

---

## 🔹 REQUIREMENTS

* one command startup
* consistent ports
* .env driven config
* dev/prod parity

---

## 🔹 DEVELOPMENT MODE

* hot reload enabled
* volume mounts active

---

## 🔹 FUTURE READY

compose must allow:

* adding DB later
* adding reverse proxy later

---

# 🔁 RUNTIME CONTROL PRINCIPLES

---

## 🔹 NO RUNTIME GUESSING

All system behavior must be:

* explicit
* traceable
* contract-bound

---

## 🔹 NO SILENT FAILURES

Every failure must:

* surface visibly
* include structured error
* optionally degrade gracefully

---

## 🔹 NO HIDDEN TRANSFORMATIONS

Data must not be reshaped in:

* UI components
* route handlers

---

# 🧪 TESTING & VALIDATION

---

## BACKEND

* schema validation tests required
* endpoint tests required
* degraded mode tests required

---

## FRONTEND

* must pass TS compile
* no type violations allowed

---

## SYSTEM

* end-to-end sanity test must pass

---

# 🚫 HARD PROHIBITIONS

During this phase:

* no new endpoints
* no UI expansion
* no feature additions
* no Phase 3 work

---

# 🧭 EXECUTION STRATEGY

---

## ORDER OF OPERATIONS

1. Docker foundation
2. Backend migration → FastAPI
3. Schema enforcement → Pydantic
4. Frontend → TypeScript
5. Adapter enforcement
6. Styling decision
7. validation + cleanup

---

## NO PARALLEL CHAOS

Each step must be:

* completed
* validated
* committed

before next begins

---

# 🧭 EXIT CRITERIA

---

## BACKEND

* FastAPI fully implemented
* all endpoints schema-bound
* no legacy server code remains

---

## FRONTEND

* fully TypeScript
* no implicit types
* adapter layer complete

---

## INFRASTRUCTURE

* docker compose works reliably
* one command start confirmed

---

## SYSTEM

* no regression from Phase 2
* contracts preserved
* degraded mode intact

---

# 🧠 FINAL STATE

After Phase 2.5:

The system becomes:

* contract-driven
* type-safe
* infrastructure-controlled
* ready for visualization complexity
* safe for expansion

---

# 🔥 FINAL LAW

> “From this point forward, nothing enters the system unless it is typed, validated, and controlled.”
