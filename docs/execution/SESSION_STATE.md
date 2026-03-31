````markdown
# SESSION STATE — ASTRONOMY HUB (AUTHORITATIVE)

---

# 1. PURPOSE

This document tracks:

- execution progress
- completed steps
- current position in workflow

It is a **tracking document**, not a control document.

---

# 🚨 CORE RULE

```text
LIVE_SESSION_BRIEF.md defines execution.

SESSION_STATE.md records execution.
````

If this document conflicts with LIVE_SESSION_BRIEF.md:

👉 THIS DOCUMENT IS WRONG

---

# 2. ROLE IN SYSTEM

This document exists to:

* provide continuity between steps
* record completed work
* show current execution position

It does NOT:

* define tasks
* authorize actions
* override execution rules

---

# 3. STRUCTURE

---

## CURRENT POSITION

* current task: PHASE 2 EXECUTION
* current step: STEP 5 — SCENE GENERATION (COMPLETE / LOCKED)

---

## COMPLETED STEPS

* step: STEP 1 — AUTHORITATIVE RUNTIME
  * result: LOCKED
  * validation: Docker runtime verified with `docker compose ps`; backend/frontend reachable in canonical runtime.

* step: STEP 2 — PIPELINE ENFORCEMENT
  * result: LOCKED
  * validation: `test_api_scene_above_me.py` + `test_phase1_scene_assembly.py` prove `Scope -> Engine -> Filter -> Scene -> Object -> Detail`.

* step: STEP 3 — SCOPE DISCIPLINE
  * result: LOCKED
  * validation: scene contract scope fixed to `above_me`; no scope-switching UI in mounted Phase 1 surface.

* step: STEP 4 — ENGINE PARTICIPATION
  * result: LOCKED
  * validation: independent Phase 1 engine slices (`satellite`, `solar_system`, `deep_sky`, `earth conditions`) merged by backend scene assembly.

* step: STEP 5 — INTERNAL FILTER ENFORCEMENT
  * result: LOCKED
  * validation: horizon filter + relevance ranking + time-relevance/detail-route enforcement in backend scene object contract.

* step: STEP 6 — SCENE AUTHORITY
  * result: LOCKED
  * validation: backend-owned scene assembly and scene-first frontend consumption (`useSceneAboveMeDataQuery`) with no frontend scene construction.

* step: STEP 7 — OBJECT CONTRACT INTEGRITY
  * result: LOCKED
  * validation: `test_contracts_phase1.py` + runtime scene contract check confirm required object fields and stable object-detail compatibility.

* step: STEP 8 — DECISION SYSTEM
  * result: LOCKED
  * validation: decision outputs present (`observing_score`, top target, opportunities, events) in `PrimaryDecisionPanel`/scene/supporting modules.

* step: STEP 9 — UI HIERARCHY
  * result: LOCKED
  * validation: mounted order is command bar -> primary scene -> decision panel -> supporting panels; runtime structure verified.

* step: STEP 10 — INTERACTION LOOP
  * result: LOCKED
  * validation: Playwright proof confirms `Scene -> Object -> Detail -> Return` with state-preserving close flow.

* step: STEP 11 — DATA BOUNDARY ENFORCEMENT
  * result: LOCKED
  * validation: backend assembles scene/detail; frontend uses query-boundary normalization and does not parse raw provider payloads in components.

* step: STEP 12 — PERFORMANCE DISCIPLINE
  * result: LOCKED
  * validation: backend limits scene objects (`<=10`), computes active scene only, and loads detail on demand by object selection.

* step: STEP 13 — TESTING AND VERIFICATION
  * result: LOCKED
  * validation: `pytest -q backend/tests` pass; `npm --prefix frontend run test`, `type-check`, and `build` pass; runtime responsive/flow checks pass.

* step: STEP 14 — ANTI-SCOPE ENFORCEMENT
  * result: LOCKED
  * validation: no mounted scope/engine/filter selectors or Phase 2+ controls; no mounted 3D globe/timeline/prediction/personalization surfaces.

* step: PHASE 2 STEP 1 — STATE FOUNDATION
  * result: LOCKED
  * validation: `frontend/src/state/globalUiState.js` tracks `activeScope`, `activeEngine`, `activeFilter`, `selectedObjectId`, `activeSceneState`; Docker runtime reload proof (Playwright) shows `selectedObjectId` and `activeSceneState` restored from `astronomyHub.globalUiState`; deterministic state behavior re-verified with `npm --prefix frontend run test`, `npm --prefix frontend run type-check`, and `npm --prefix frontend run build`.

* step: PHASE 2 STEP 2 — SCOPE SYSTEM
  * result: LOCKED
  * validation: `GET /api/v1/scopes` now exposes required scopes (`above_me`, `earth`, `sun`, `satellites`, `flights`, `solar_system`, `deep_sky`); `setActiveScope` resets `activeEngine`, `activeFilter`, and `selectedObjectId`; Docker runtime Playwright proof shows scope selector updates context and triggers scene regeneration (`/api/v1/scene?scope=...`) with visible scene output changes.

* step: PHASE 2 STEP 3 — ENGINE SYSTEM
  * result: LOCKED
  * validation: scope-engine routing is deterministic and single-engine (`/api/v1/scopes?scope=...&engine=...` returns one engine record with `allowed_filters`); out-of-scope engines return stable `engine_out_of_scope` JSON 400; composite `earth` scope now resolves valid single-engine selection (`engine=satellites`) in both local tests and Docker runtime; `activeEngine` remains single-value state in `frontend/src/state/globalUiState.js`.

* step: PHASE 2 STEP 4 — FILTER SYSTEM
  * result: LOCKED
  * validation: one filter is active at a time (`activeFilter` in `frontend/src/state/globalUiState.js` and single-value `#scene-filter-selector`); filters visibly change mounted scene output (`Visible: 4` with `visible_now` -> `Visible: 2` with `short_window` in Docker runtime Playwright); filter execution is backend-authored and deterministic (`GET /api/v1/scene?scope=above_me&engine=above_me&filter=...` + `backend/tests/test_phase2_filter_system.py`).

* step: PHASE 2 STEP 5 — SCENE GENERATION
  * result: LOCKED
  * validation: scene payload is produced by backend from the scope/engine/filter pipeline in `backend/app/routes/scene.py` + `backend/app/services/scene_service.py`; identical inputs now return identical payloads (`test_same_scope_engine_filter_returns_identical_scene_payload`) and non-pipeline query deltas do not change scene output (`test_non_pipeline_query_params_do_not_change_scene_payload`) in `backend/tests/test_phase2_scene_scope_switch.py`; Docker runtime re-check confirms deterministic payload equality and filter-bound output differences.

---

## NEXT STEP (REFERENCE ONLY)

* next step: execute PHASE 2 STEP 6 — ABOVE ME MERGE MODE (verify first, fix minimally only if invalid).

⚠️ This must match LIVE_SESSION_BRIEF.md
If it does not → STOP and resolve conflict

---

# 4. RELATION TO OTHER DOCUMENTS

---

### LIVE_SESSION_BRIEF.md (AUTHORITY)

Defines:

* execution mode
* active task
* allowed actions
* next required step

---

### SYSTEM_VALIDATION_SPEC.md

Defines:

* what qualifies as completion
* what must be proven

---

### CONTEXT_MANIFEST.yaml

Defines:

* what documents were loaded during execution

---

# 5. UPDATE RULES

This document MUST be updated:

* after each completed step
* after validation is confirmed

Each update MUST include:

* step name
* result
* validation status

---

# 6. PROHIBITIONS

* Do NOT define new tasks
* Do NOT modify execution flow
* Do NOT contradict LIVE_SESSION_BRIEF.md
* Do NOT log unverified work

---

# 7. FAILURE CONDITIONS

Execution MUST STOP if:

* SESSION_STATE conflicts with LIVE_SESSION_BRIEF
* steps are recorded without validation
* execution position is unclear

---

# FINAL RULE

```text
This document tracks what happened.

It does NOT decide what happens.
```

---

```

---
