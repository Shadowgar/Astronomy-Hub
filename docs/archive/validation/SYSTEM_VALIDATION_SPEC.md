# System Validation Spec (Authoritative)

## 1. Validation Principle
A claim is valid only when it is:
1. implemented
2. architecture-aligned
3. runtime-proven
4. source-traceable
5. evidence-backed

If any dimension is missing, status must be `PARTIAL`, `FAKE`, or `BLOCKED`.

## 2. Proof Requirements (mandatory)
Every completion claim must include:
- exact file references
- exact commands run
- exact observed outputs
- explicit pass/fail statement

Preferred proof bundle:
- API response snippet(s)
- UI screenshot(s) when UI behavior is claimed
- test output
- build output

## 3. Authority Resolution
On conflict, resolve in this order:
1. this file
2. `docs/context/CORE_CONTEXT.md`
3. `docs/context/LIVE_SESSION_BRIEF.md`
4. `docs/context/CONTEXT_MANIFEST.yaml`
5. `docs/execution/PROJECT_STATE.md`
6. `docs/execution/MASTER_PLAN.md`
7. `docs/features/*`
8. `docs/architecture/*` + `docs/contracts/*`
9. legacy planning/vision docs

## 4. Architecture Validation
Must preserve:
- `Scope -> Engine -> Filter -> Scene -> Object -> Detail -> Assets`
- `Ingestion -> Normalization -> Storage -> Cache -> API -> Client Rendering`

Hard failures:
- UI invents scene truth outside backend-authoritative contracts
- raw provider payload leaks to UI
- object/detail identity chain breaks

## 5. Runtime Validation
Minimum runtime checks for feature claims:
- backend route(s) respond for claimed feature
- frontend renders claimed feature behavior
- deterministic variation works for relevant inputs (scope/engine/filter/time/location)
- fallback/degraded behavior is explicit and truthful

## 6. Feature Classification Law
Use only these states:
- `REAL`: complete and proven
- `PARTIAL`: implementation exists but proof/coverage/contract is incomplete
- `FAKE`: placeholder behavior or unverifiable claim
- `BLOCKED`: cannot proceed due dependency/conflict/failure

## 7. Required Feature Evidence Card
Each tracked feature must declare:
- Feature
- User-visible output
- Endpoint or UI entry
- Backend path
- Data source provenance
- What is still fake
- Proof artifacts
- Status (`REAL`/`PARTIAL`/`FAKE`/`BLOCKED`)

## 8. Execution Block Rule
If any fail condition is triggered:
- stop
- record failure and scope
- fix only the failure
- re-validate before status changes

## 9. Non-Negotiable Rule
If it cannot be proven from running behavior and evidence, it is not complete.

## 10. ROLE BOUNDARY

This document defines validation authority and truth classification.

It does NOT:

* define what should be built
* define execution order
* replace feature definitions
* act as a planning document

Validation determines status, not scope.

