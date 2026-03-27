# Phase 2.5 — Foundation Realignment Execution TODO

## Status
Planned

## 1. Mission

Phase 2.5 upgrades Astronomy Hub from an unstable, drift-prone codebase into a controlled platform foundation. This phase does not expand the product. It hardens the substrate under the product.

The mission is to deliver a repeatable runtime, explicit contracts, typed frontend boundaries, and an implementation stack that matches the intended architecture.

---

## 2. Phase law

No Phase 2.5 task may introduce new astronomy features, new dashboard modules, or Phase 3 exploration behavior.

If a task changes what the user can do rather than how the system is structured, it is out of scope unless it is necessary to preserve existing behavior or fix a defect.

---

## 3. Preservation guarantees

The migration must preserve the following:

- dashboard-first product shape
- decision-support-first philosophy
- current domains already in scope
- Phase 2 degraded-mode behavior
- UI Phase B directional gains, even if UI work is paused
- core user-facing behavior from completed phases unless intentionally corrected

---

## 4. Required outputs

This phase must produce:

- `docs/PHASE_2_5_SPEC.md`
- `docs/PHASE_2_5_EXECUTION_TODO.md`
- `docs/PHASE_2_5_IMPLEMENTATION_PLAN.md`
- architecture updates in current project docs
- backend FastAPI structure
- Pydantic schema modules
- TypeScript frontend configuration and migrated files
- Dockerfiles and `docker-compose.yml`
- environment documentation
- validation artifacts and migration notes

---

## 5. Workstream structure

Phase 2.5 executes through seven workstreams:

- 2.5A — Planning, audit, and baseline freeze
- 2.5B — Docker and environment foundation
- 2.5C — Backend framework migration
- 2.5D — Contract and schema enforcement
- 2.5E — Frontend TypeScript migration
- 2.5F — Styling system formalization
- 2.5G — Validation, cleanup, and cutover

Each workstream has mandatory entry conditions, task boundaries, and exit checks.

---

## 6. 2.5A — Planning, audit, and baseline freeze

### Goal
Establish exact current-state truth before migration begins.

### Tasks

#### 2.5A.1 Capture current runtime truth
Document:
- current startup commands
- current backend startup path
- current frontend startup path
- ports in use
- known instability points
- current tests and their status

#### 2.5A.2 Capture baseline behavior
Record:
- endpoint list
- expected domain outputs
- screenshots or notes of key modules
- degraded-mode examples if available

#### 2.5A.3 Create migration inventory
List current backend files, frontend files, adapters, styles, and service-like logic that must be migrated or rehomed.

#### 2.5A.4 Establish branch and commit discipline
Document branch model and small-commit expectations.

### Exit check
A reviewer can describe current system truth without guessing.

---

## 7. 2.5B — Docker and environment foundation

### Goal
Make startup and restart predictable and make containerized execution the standard path.

### Tasks

#### 2.5B.1 Add environment model
Create or update:
- `.env.example`
- env variable notes
- frontend/backend env separation

#### 2.5B.2 Add backend Dockerfile
Build a backend image that supports the current migration state and the FastAPI target.

#### 2.5B.3 Add frontend Dockerfile
Build a frontend image that supports local dev and later production flow.

#### 2.5B.4 Add `docker-compose.yml`
Define frontend and backend services with stable ports and sane logging.

#### 2.5B.5 Add convenience scripts
Optional helper scripts may be added, but Compose remains canonical.

#### 2.5B.6 Add startup runbook
Document first-time setup, common daily commands, rebuild steps, and log inspection flow.

### Exit check
`docker compose up` starts both services reliably and predictably.

---

## 8. 2.5C — Backend framework migration

### Goal
Move to FastAPI + Uvicorn without losing current product behavior.

### Tasks

#### 2.5C.1 Add canonical backend package structure
Introduce layered app folders for routes, schemas, services, core, and dependencies.

#### 2.5C.2 Add FastAPI entrypoint
Create the canonical app startup path.

#### 2.5C.3 Add health route
Use a minimal health endpoint to verify runtime sanity.

#### 2.5C.4 Migrate existing domains one by one
Allowed migration domains:
- conditions
- targets
- passes
- alerts
- moon
- location-related behavior already in scope

#### 2.5C.5 Move domain logic into services
Prevent route files from becoming logic buckets.

#### 2.5C.6 Add centralized config
Create a single runtime authority for env-driven settings.

#### 2.5C.7 Add centralized error mapping
Formalize backend error behavior.

#### 2.5C.8 Retire legacy startup path
Only after parity is verified.

### Exit check
FastAPI and Uvicorn are the canonical backend runtime.

---

## 9. 2.5D — Contract and schema enforcement

### Goal
Make backend outputs explicitly governed and difficult to drift.

### Tasks

#### 2.5D.1 Define canonical response envelope
Cover success, degraded, and error cases.

#### 2.5D.2 Add Pydantic schemas by domain
Represent all current response shapes explicitly.

#### 2.5D.3 Bind endpoint outputs to models
Route responses must be schema-bound.

#### 2.5D.4 Align docs contracts with runtime authority
Update `docs/contracts/` as needed.

#### 2.5D.5 Add schema validation tests
Prove valid payloads pass and malformed payloads fail.

#### 2.5D.6 Add degraded and error tests
Formalize non-happy-path behavior.

### Exit check
Malformed or drifting responses become visible during development rather than hidden.

---

## 10. 2.5E — Frontend TypeScript migration

### Goal
Move the frontend to a typed, explicit boundary model before further complexity is added.

### Tasks

#### 2.5E.1 Add TypeScript tooling
Introduce `tsconfig` and build/type-check support.

#### 2.5E.2 Convert shared foundations first
Migrate utilities, API helpers, adapters, and shared types before deep component churn.

#### 2.5E.3 Add centralized domain types
Mirror backend contract shapes cleanly.

#### 2.5E.4 Enforce adapter authority
Components must not ingest raw payloads.

#### 2.5E.5 Convert components incrementally
Move from lower-risk presentational components upward.

#### 2.5E.6 Eliminate implicit `any`
Track any temporary exceptions explicitly.

#### 2.5E.7 Add standard type-check command
Make type-check part of normal validation.

### Exit check
Frontend compiles under strict typing and uses explicit data boundaries.

---

## 11. 2.5F — Styling system formalization

### Goal
Prevent the frontend from entering a mixed or accidental styling model.

### Tasks

#### 2.5F.1 Audit current styling truth
Document existing CSS files, tokens, spacing, and visual rules from UI Phase B.

#### 2.5F.2 Make styling decision
Choose one:
- Tailwind adoption, or
- formalized token/CSS continuation

#### 2.5F.3 Apply chosen path consistently
Do not leave a hybrid mess.

#### 2.5F.4 Preserve UI Phase B hierarchy intent
Ensure the visual product direction is not lost.

### Exit check
The frontend has one intentional styling system.

---

## 12. 2.5G — Validation, cleanup, and cutover

### Goal
Verify parity, remove dead code, and update project truth.

### Tasks

#### 2.5G.1 Run full smoke test
Check container startup, backend health, frontend render, key module population, and known flows.

#### 2.5G.2 Compare against baseline
Verify the migration preserved intended behavior.

#### 2.5G.3 Remove transitional dead code
Delete obsolete startup paths and unclear duplicate authority.

#### 2.5G.4 Update docs
Ensure architecture docs reflect runtime truth.

#### 2.5G.5 Declare completion only after all gates pass
No partial completion language.

### Exit check
Repo truth, doc truth, and runtime truth match.

---

## 13. Phase gates

### Gate A — Infrastructure
- Compose starts the app
- ports are stable
- env use is documented

### Gate B — Backend
- FastAPI is canonical
- Uvicorn is canonical
- route/service separation exists

### Gate C — Contracts
- Pydantic governs payloads
- degraded and error cases are structured

### Gate D — Frontend
- TypeScript strict mode is active
- adapters are authoritative

### Gate E — Styling
- one styling system is documented and applied

### Gate F — Product preservation
- no major regression from earlier completed phases

---

## 14. Commit discipline

Use small, reviewable commits by domain. Avoid giant mixed commits touching infra, backend, frontend, and styling simultaneously.

---

## 15. Final execution statement

Phase 2.5 is the point where Astronomy Hub gains architectural authority. The success condition is not that the code looks more modern. The success condition is that the application becomes predictable, typed, validated, and operationally sane.
