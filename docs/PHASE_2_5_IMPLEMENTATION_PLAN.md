# Phase 2.5 — Implementation Plan

## 1. Purpose of this plan

This document translates the Phase 2.5 specification into an execution-ready plan with ordered work packages, review boundaries, and commit-sized milestones. It is the practical bridge between doctrine and implementation.

The plan assumes:

- Phase 1 is complete
- Phase 2 is complete
- UI Phase B is paused
- the system is unstable enough that foundation work must begin immediately

This plan is intentionally more operational than the spec and more structured than the execution TODO. It is designed to guide controlled implementation, including BitFrog or Copilot-assisted work.

---

## 2. Planning assumptions

### 2.1 Current-state assumption
The repo currently contains a React + Vite frontend and a Python backend that does not yet reflect the intended FastAPI/Uvicorn/Pydantic architecture as runtime truth.

### 2.2 Migration philosophy
The system should be migrated in a way that preserves known behavior while progressively replacing unstable foundations.

### 2.3 Non-goal
This plan does not pursue UI redesign, feature expansion, or Phase 3 exploration work.

---

## 3. Implementation sequence

The implementation is split into six major implementation packages plus final cutover.

- Package 0 — Baseline capture and migration audit
- Package 1 — Docker and environment foundation
- Package 2 — FastAPI runtime introduction
- Package 3 — Pydantic contract enforcement
- Package 4 — Frontend TypeScript migration
- Package 5 — Styling system formalization
- Package 6 — Cleanup, regression review, and authority cutover

Each package should be completed and reviewed before the next begins.

---

## 4. Package 0 — Baseline capture and migration audit

### Objective
Freeze current-state truth before changing the stack.

### Deliverables
- baseline runtime notes
- current startup notes
- endpoint inventory
- frontend module inventory
- backend migration inventory
- known instability log

### Tasks
1. document current backend startup path
2. document current frontend startup path
3. list current ports and env assumptions
4. record known startup bugs and inconsistent behaviors
5. inventory current backend files and likely service ownership
6. inventory current frontend files, adapters, CSS files, and module structure
7. capture representative screenshots or notes for key modules

### Review criteria
A reviewer can explain the current app shape and migration surface without guessing.

### Commit recommendation
- docs: add phase 2.5 baseline audit notes

---

## 5. Package 1 — Docker and environment foundation

### Objective
Standardize execution first so the rest of the migration happens inside a controlled environment.

### Deliverables
- backend Dockerfile
- frontend Dockerfile
- root `docker-compose.yml`
- `.env.example`
- startup runbook
- optional helper scripts

### Tasks
1. define required frontend and backend env variables
2. add `.env.example`
3. add backend Dockerfile for current runtime path
4. add frontend Dockerfile for current Vite runtime path
5. add compose file with stable ports and service names
6. verify both services start together
7. verify each service can be rebuilt and restarted independently
8. document daily commands and common failure recovery

### Review criteria
`docker compose up` works as the canonical startup path.

### Commit recommendations
- infra: add env example and compose baseline
- infra: add backend Dockerfile
- infra: add frontend Dockerfile and startup docs

---

## 6. Package 2 — FastAPI runtime introduction

### Objective
Introduce the target backend framework without rewriting everything at once.

### Deliverables
- `backend/app/main.py`
- FastAPI application object
- health endpoint
- layered backend package folders
- first migrated domain route/service pair

### Tasks
1. create backend app package structure
2. add canonical FastAPI entrypoint
3. add health endpoint for runtime sanity
4. configure Uvicorn startup path
5. connect Compose backend service to the new runtime
6. migrate one low-risk domain first to validate the structure
7. document migration pattern for remaining domains

### Migration strategy
Begin with the simplest domain that exercises the pattern without forcing major refactors. Then migrate remaining domains incrementally.

### Review criteria
FastAPI starts reliably in containerized dev mode and serves at least one migrated domain plus a health route.

### Commit recommendations
- backend: add FastAPI entrypoint and health route
- backend: add initial layered package structure
- backend: migrate first domain to route/service pattern

---

## 7. Package 3 — Pydantic contract enforcement

### Objective
Convert backend data shape from informal structure into runtime-enforced schema authority.

### Deliverables
- schema modules per domain
- canonical response envelope
- model-bound route responses
- schema tests
- degraded/error contract tests

### Tasks
1. define canonical response envelope
2. add base response schemas
3. add domain schemas incrementally
4. bind route outputs to response models
5. add validation tests for valid and invalid payloads
6. add degraded-state response tests
7. align docs contracts with runtime schemas

### Review criteria
Response drift becomes detectable in development and test runs.

### Commit recommendations
- backend: add base response schemas and envelope
- backend: add domain schemas for conditions and targets
- tests: add schema validation and degraded-response coverage

---

## 8. Package 4 — Frontend TypeScript migration

### Objective
Move the frontend to explicit types and safer data boundaries before more UI complexity returns.

### Deliverables
- TypeScript config
- renamed `.ts` / `.tsx` files as needed
- shared domain types
- typed adapter layer
- typed components
- type-check command

### Migration order
1. shared utilities
2. API client helpers
3. adapters
4. shared types/models
5. low-risk presentational components
6. domain modules
7. app composition layer

### Tasks
1. install TypeScript tooling
2. add `tsconfig`
3. add standard type-check script
4. convert current adapter files first
5. add shared domain type folder
6. convert common presentational components
7. convert domain modules incrementally
8. remove implicit-any leaks
9. verify build and type-check after each group

### Review criteria
The frontend compiles under strict typing and components rely on typed inputs rather than raw backend payloads.

### Commit recommendations
- frontend: add TypeScript config and type-check script
- frontend: migrate adapters and shared domain types
- frontend: migrate common components to TSX
- frontend: migrate domain modules to TSX

---

## 9. Package 5 — Styling system formalization

### Objective
Make the styling system deliberate instead of accidental.

### Deliverables
- styling decision memo
- either Tailwind setup or formalized token/CSS doctrine
- updated style guidance docs
- reduced styling ambiguity

### Decision framework
Before choosing Tailwind, audit what the current UI already uses and what UI Phase B established. If the current CSS/token model is working and can be governed cleanly, it may be better to formalize it than to force Tailwind churn.

### Tasks
1. inventory current CSS and token patterns
2. write short decision memo
3. adopt chosen path consistently
4. ensure module hierarchy and spacing rules survive
5. reduce one-off styling drift

See `docs/STYLING_DECISION.md` for the formal decision memo produced in Package 5 Step 2.

### Review criteria
A reviewer can look at the frontend and clearly describe its design system approach.

### Commit recommendations
- docs: add styling decision memo
- frontend: formalize chosen styling system foundation

---

## 10. Package 6 — Cleanup, regression review, and authority cutover

### Objective
Finish the migration, remove dead paths, and align all authoritative docs.

### Deliverables
- dead code removal
- retired legacy startup paths
- updated architecture docs
- updated project state docs
- smoke and regression checklist
- phase completion note

### Tasks
1. run full compose-based smoke test
2. compare behavior against baseline package 0 notes
3. remove obsolete startup files and duplicate logic paths
4. update stack authority in project docs
5. update setup instructions
6. verify final test and type-check commands
7. record Phase 2.5 completion criteria outcome

### Review criteria
Repo truth, runtime truth, and documentation truth all match.

### Commit recommendations
- cleanup: remove deprecated backend runtime path
- docs: update architecture overview and project state
- phase: mark 2.5 completion evidence

---

## 11. Suggested implementation order by repo area

### Docs first
Start by creating or updating phase docs so implementation is governed.

### Infra second
Get Docker and env control in place before deeper migrations.

### Backend third
Establish FastAPI runtime and schema authority before frontend typing tries to mirror unstable shapes.

### Frontend fourth
Convert to TypeScript only after backend contract direction is stable enough to map.

### Styling fifth
Do not let styling decisions interrupt backend and type migration.

### Cleanup last
Remove old runtime paths only after parity is proven.

---

## 12. Review rhythm

Recommended review cadence:

- after Package 0
- after Package 1
- after first FastAPI domain migration in Package 2
- after first major schema coverage in Package 3
- after adapter and type foundation in Package 4
- after styling decision in Package 5
- after final cleanup in Package 6

This prevents the migration from becoming an opaque long-running blob of changes.

---

## 13. Risks and controls

### Risk 1 — migration churn breaks behavior
Control: baseline capture, domain-by-domain migration, frequent smoke checks.

### Risk 2 — TypeScript migration hides problems with loose settings
Control: strict mode from the start and tracked exceptions only.

### Risk 3 — Tailwind creates unnecessary UI churn
Control: delay styling decision until backend and typing foundations are stable.

### Risk 4 — docs drift again
Control: authority cutover in Package 6 is mandatory, not optional.

### Risk 5 — mixed runtime paths create confusion
Control: transition intentionally, then retire legacy startup paths cleanly.

---

## 14. Completion definition

The implementation plan is successful when:

- the app starts reliably through Compose
- the backend is FastAPI/Uvicorn-based
- backend outputs are schema-bound with Pydantic
- the frontend is TypeScript-based and type-checked
- adapters own API-to-UI translation
- one styling system is explicitly chosen
- docs accurately describe the resulting stack

---

## 15. Final guidance

This phase should be executed as architecture work, not as cosmetic modernization. The point is not to say the stack sounds more current. The point is to make Astronomy Hub sturdy enough that later product ambition is worth the effort.
