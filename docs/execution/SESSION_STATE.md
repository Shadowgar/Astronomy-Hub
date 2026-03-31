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
* current step: PHASE 2 STEP 15 — DATA INGESTION SYSTEM (IN PROGRESS)

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

* step: PHASE 2 STEP 6 — ABOVE ME MERGE MODE
  * result: LOCKED
  * validation: Above Me returns one scene payload from backend (`/api/v1/scene?scope=above_me&engine=above_me&filter=...`) with merged object types (`planet`, `satellite`, `deep_sky`) under `visible_now`; Above Me filtering remains active (`short_window` narrows to satellite subset); runtime payload checks confirm merged multi-engine behavior and single-scene output.

* step: PHASE 2 STEP 7 — COMMAND BAR ACTIVATION
  * result: LOCKED
  * validation: command bar now includes scope (`Scope selector`), engine (`Engine selector`), filter (`Filter selector`), location controls (`Latitude`/`Longitude` + apply), and mode (`Display mode`) in `frontend/src/components/layout/CommandCenterHeader.jsx`; runtime Playwright proof confirms each control updates state and triggers scene rebuild requests (`/api/v1/scene` transitions through scope/engine/filter/location updates plus mode-triggered refetch via query invalidation).

* step: PHASE 2 STEP 8 — SCENE TRANSITIONS
  * result: LOCKED
  * validation: sequential scope/engine/filter transitions in Docker runtime (Playwright) produce clean scene refreshes with matching context (`deep_sky` -> `earth`, `satellites` -> `flights`, `visible_now` -> `short_window`); transition network trace shows fresh `/api/v1/scene` requests for each state change; control state and scene state remain synchronized (no stale scope/engine/filter carry-over).

* step: PHASE 2 STEP 9 — OBJECT SYSTEM
  * result: LOCKED
  * validation: object IDs and detail routes are scene-derived and stable in backend contract tests (`pytest -q backend/tests/test_phase2_object_resolution.py`); Docker runtime API checks across valid scope/engine pairs confirm scene object IDs map deterministically to `/object/{id}` and resolve via `/api/v1/object/{id}`; Playwright runtime proof confirms object selection routing remains valid across context transitions (`earth/flights` -> `earth/satellites` -> `deep_sky/deep_sky`) with successful detail fetches (`/api/v1/object/iss`, `/api/v1/object/m13`).

* step: PHASE 2 STEP 10 — DATA BOUNDARY ENFORCEMENT
  * result: LOCKED
  * validation: backend remains sole scene assembly source in `backend/app/routes/scene.py` + `backend/app/services/scene_service.py`; frontend consumes normalized scene/detail payloads through query-boundary selectors (`frontend/src/features/scene/queries.ts`, `frontend/src/features/objects/queries.ts`) with no component-level envelope parsing; minimal fix removed frontend scene-object filtering for briefing meaning in `frontend/src/components/AboveMeScene.jsx` (no `objects.find/filter/sort/reduce`); Docker runtime re-check confirms command-center rendering and object detail routing remain valid after rebuild.

* step: PHASE 2 STEP 11 — PERFORMANCE CONTROL
  * result: LOCKED
  * validation: frontend issues only active-scope scene requests in runtime (`/api/v1/scene?scope=deep_sky...` then `/api/v1/scene?scope=earth...`) with no all-scope preloading; backend scene route computes one requested scope/engine/filter payload per request (`backend/app/routes/scene.py`, `backend/app/services/scene_service.py`); scene payload sizes remain bounded across all valid scope/engine defaults (max observed objects = 4, below Phase 1 cap), and backend determinism/limited scene assembly checks pass (`pytest -q backend/tests/test_phase2_scene_scope_switch.py backend/tests/test_phase1_scene_assembly.py`).

* step: PHASE 2 STEP 12 — TESTING
  * result: LOCKED
  * validation: scope/engine/filter/scene/object-detail verification suite passes (`pytest -q backend/tests/test_phase2_scope_routing.py backend/tests/test_phase2_filter_system.py backend/tests/test_phase2_scene_scope_switch.py backend/tests/test_phase2_object_resolution.py` => 25 passed); frontend validation lane passes (`npm --prefix frontend run test -- --run`, `npm --prefix frontend run type-check`, `npm --prefix frontend run build`); Docker runtime Playwright flow verifies transitions and detail resolution across contexts with successful network traces (`/api/v1/scene` for scope/engine/filter changes and `/api/v1/object/iss`, `/api/v1/object/m13` detail fetches).

* step: PHASE 2 STEP 13 — ANTI-SCOPE
  * result: LOCKED
  * validation: backend API surface includes no Phase 3+/4+/5+ endpoints (`backend/app/main.py` router list and `backend/app/routes/*`); frontend runtime route surface is limited to `/` and `/progress` (`frontend/src/routes/AppRouter.tsx`) with no mounted spatial/graph/prediction/personalization controls; Cesium foundation component exists only as unmounted foundation helper (`frontend/src/components/CesiumFoundation.jsx` with no imports/usages); Docker runtime Playwright check on `/` confirms no Cesium surface and no spatial/graph/prediction/personalization/watchlist/timeline controls.

* step: PHASE 2 FINAL PHASE LOCK EVALUATION
  * result: NOT LOCKED
  * validation: Phase 2 implementation and anti-scope checks are proven, but final lock is blocked by unproven acceptance Section 14 user-validation criteria in `docs/phases/PHASE_2_ACCEPTANCE_CRITERIA.md` (`[ ] switch scope and understand change instantly`, `[ ] switch engine and see meaningful difference`, `[ ] apply filter and see clear impact`, `[ ] navigate without confusion`).

* step: PHASE 2 FINAL PHASE LOCK EVALUATION (RE-RUN)
  * result: LOCKED
  * validation: Section 14 user-validation criteria are now proven with runtime evidence (scope subtitle/object change on scope switch, distinct Earth engine outputs, visible filter impact, and confusion-free detail/navigation flow); acceptance checks reconciled to `[x]` in `docs/phases/PHASE_2_ACCEPTANCE_CRITERIA.md`; regression proof includes `.venv/bin/pytest -q backend/tests/test_phase2_scope_routing.py backend/tests/test_phase2_filter_system.py backend/tests/test_phase2_scene_scope_switch.py`, `npm --prefix frontend run build`, and Docker runtime checks via `/api/v1/scene`.

* step: PHASE 2 REOPEN — STEP 14 AUTHORITY EXTENSION
  * result: NOT LOCKED
  * validation: Phase 2 docs now include explicit live-data/location-time/provider-baseline requirements (`docs/phases/PHASE_2_SPEC.md` section 11, `docs/phases/PHASE_2_BUILD_SEQUENCE.md` step 14, `docs/phases/PHASE_2_ACCEPTANCE_CRITERIA.md` section 15); implementation proof for these new checks is pending.

* step: PHASE 2 STEP 14 — LIVE DATA & LOCATION-TIME AUTHORITY
  * result: LOCKED
  * validation: Above Me scene runtime path now uses provider-backed backend inputs (`backend/app/services/live_providers.py`, `backend/app/services/_legacy_scene_logic.py`, `backend/app/services/scene_service.py`, `backend/app/routes/scene.py`) with explicit provider trace + degraded-mode signaling in `/api/v1/scene`; materially different location/time context produces different scene outputs (`backend/tests/test_phase2_scene_scope_switch.py::test_location_and_time_context_change_scene_payload` + Docker runtime curls on `lat=10,lon=20,at=2026-03-31T00:00:00Z` vs `lat=33,lon=-70,at=2026-03-31T12:00:00Z`); regression lanes pass with `.venv/bin/pytest -q backend/tests/test_phase2_scene_scope_switch.py backend/tests/test_phase2_filter_system.py backend/tests/test_phase2_object_resolution.py` and `.venv/bin/pytest -q backend/tests/test_api_scene_above_me.py backend/tests/test_phase1_scene_assembly.py backend/tests/test_contracts_phase1.py`.

---

## NEXT STEP (REFERENCE ONLY)

* next step: execute Phase 2 STEP 15 verify-first flow and lock only with implementation + tracking proof.

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
