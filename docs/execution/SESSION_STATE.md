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
* current step: PHASE 2 STEP 3 — DETAIL PANEL SYSTEM (UI ONLY)

Rebase note:
* Phase 2 step sequence has been restructured.
* Prior tracked progress was recorded under the legacy step order.
* Prior progress is not discarded, but must be revalidated against the rebased execution model.
* Rebased Step 0, Step 1, and Step 2 are locked.

---

## COMPLETED STEPS

* step: PHASE 2 STEP 0 — CONTRACT LOCK (REBASED)
  * result: LOCKED
  * validation: rebased scope/engine/filter/scene contract inputs reconciled and engine-spec placeholders established.

* step: PHASE 2 STEP 1 — UI LAYOUT FOUNDATION (REBASED)
  * result: LOCKED
  * validation: static command-center foundation is implemented as decomposed components under `frontend/src/components/layout/foundation/` and mounted in `frontend/src/App.jsx` with no API/data wiring.

* note: legacy Phase 2 entries below were recorded under a pre-rebase sequence and are retained as history only; Step 2+ must be revalidated in the rebased sequence.

* step: PHASE 2 STEP 2 — UI STANDARDIZATION (REBASED)
  * result: LOCKED
  * validation: command-center foundation is standardized using shared, phase-agnostic UI primitives and centralized placeholder data (`frontend/src/components/layout/foundation/foundationData.js`, `PanelSection.jsx`); module/grid/item presentation is consistent across all required engine modules and right-context/Now-Above-Me/detail shell sections with item+reason rows.

* step: PHASE 2 STEP 3 — DETAIL PANEL SYSTEM (REBASED)
  * result: LEGACY HISTORY (REVALIDATION REQUIRED)
  * validation: reusable static detail panel shell implemented on the isolated Step 1/2 foundation path with header identity placeholders, “Why it matters”, tab/section placeholders (`Overview`, `Sky Position`, `Images`, `Data`), and no backend/data wiring.

* step: PHASE 2 STEP 4 — DATA PIPELINE (REBASED)
  * result: LEGACY HISTORY (REVALIDATION REQUIRED)
  * validation: backend pipeline foundation is established in `backend/app/services/live_ingestion.py` with explicit Provider -> Adapter -> Normalizer -> Validator -> Cache -> Engine Input boundary and provider trace pipeline metadata; provider/cache layer is present in `backend/app/services/live_providers.py` and `backend/app/cache/redis_cache.py`; verification passed with `.venv/bin/pytest -q backend/tests/test_phase2_data_ingestion_pipeline.py backend/tests/test_phase2_provider_cache_ttl.py backend/tests/test_cache_foundation.py` (10 passed).

* step: PHASE 2 STEP 5 — CONDITIONS ENGINE (REBASED)
  * result: LEGACY HISTORY (REVALIDATION REQUIRED)
  * validation: Open-Meteo ingestion path is active through `backend/app/services/live_ingestion.py` and consumed by `backend/app/services/conditions_service.py`; observing score and summary are emitted in conditions payload assembly; `/api/v1/conditions` contract path remains stable in `backend/app/routes/conditions.py`; verification passed with `.venv/bin/pytest -q backend/tests/test_fastapi_conditions.py backend/tests/test_conditions_schema.py backend/tests/test_conditions_cache_integration.py backend/tests/test_phase2_mock_data_removal.py backend/tests/test_phase2_data_ingestion_pipeline.py` (12 passed).

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

* step: PHASE 2 STEP 15 — DATA INGESTION SYSTEM
  * result: LOCKED
  * validation: ingestion boundary is now explicit in `backend/app/services/live_ingestion.py` as `Provider -> Adapter -> Normalizer -> Validator -> Cache -> Engine Input`; scene assembly consumes only normalized ingestion outputs via `backend/app/services/_legacy_scene_logic.py::_fetch_live_inputs` and no direct provider/raw payloads; ingestion pipeline proofs pass in `.venv/bin/pytest -q backend/tests/test_phase2_data_ingestion_pipeline.py` (whitelisting/normalization, stale rejection, cache-hit behavior) plus regression suites `.venv/bin/pytest -q backend/tests/test_phase2_scene_scope_switch.py backend/tests/test_phase2_filter_system.py backend/tests/test_phase2_object_resolution.py` and Docker runtime `/api/v1/scene` provider-trace stage checks.

* step: PHASE 2 STEP 16 — CACHE SYSTEM
  * result: LOCKED
  * validation: provider-specific TTL controls are explicit and enforced in `backend/app/services/live_providers.py` via `PROVIDER_CACHE_TTL_SECONDS` (`open_meteo=300`, `opensky=90`, `celestrak=3600`, `jpl_ephemeris=1800`, `noaa_swpc=3600`); ingestion cache freshness metadata is exposed in `backend/app/services/live_ingestion.py` under `provider_trace.freshness` with cache state + TTL map; stale-input detection remains enforced (`open_meteo` stale rejection) and cache refresh behavior is proven by `.venv/bin/pytest -q backend/tests/test_phase2_data_ingestion_pipeline.py backend/tests/test_phase2_provider_cache_ttl.py` (5 passed) plus regression suite `.venv/bin/pytest -q backend/tests/test_phase2_scene_scope_switch.py backend/tests/test_phase2_filter_system.py backend/tests/test_phase2_object_resolution.py` (12 passed) and Docker runtime `/api/v1/scene` proof showing first-call `ingestion_cache.state=miss`, second-call `ingestion_cache.state=hit`, and provider cache-stage hits.

* step: PHASE 2 STEP 17 — ENGINE INPUT REFACTOR
  * result: LOCKED
  * validation: runtime static-engine dependencies were removed from `backend/app/services/_legacy_scene_logic.py` (`get_targets` and `MOCK_ALERTS` no longer used in scene/detail assembly); deep-sky/solar-system engine inputs now resolve from provider-backed ingestion (`live_inputs.alerts` and `live_inputs.ephemeris`) with no static target dataset fallback; object detail related entries now derive from scene objects instead of static alert mocks; proof includes `.venv/bin/pytest -q backend/tests/test_phase2_engine_input_refactor.py backend/tests/test_phase2_data_ingestion_pipeline.py backend/tests/test_phase2_provider_cache_ttl.py backend/tests/test_phase2_scene_scope_switch.py backend/tests/test_phase2_filter_system.py backend/tests/test_phase2_object_resolution.py backend/tests/test_api_scene_above_me.py` (20 passed), and Docker runtime check showing no `engine=mock` scene objects and object-detail `related_objects` typed as scene-linked `object`.

* step: PHASE 2 STEP 18 — REMOVE MOCK DATA
  * result: LOCKED
  * validation: remaining FastAPI runtime mock dependency was removed from `backend/app/services/conditions_service.py` (`backend.conditions_data.MOCK_CONDITIONS` import deleted) and replaced with provider-backed ingestion (`fetch_normalized_live_inputs`) with explicit degraded payloads when live inputs are unavailable; route contract remains stable in `backend/app/routes/conditions.py` with no static mock success path; proof includes `.venv/bin/pytest -q backend/tests/test_phase2_mock_data_removal.py backend/tests/test_conditions_cache_integration.py backend/tests/test_fastapi_conditions.py backend/tests/test_degraded_mode.py` (8 passed), regression suite `.venv/bin/pytest -q backend/tests/test_phase2_engine_input_refactor.py backend/tests/test_phase2_data_ingestion_pipeline.py backend/tests/test_phase2_provider_cache_ttl.py backend/tests/test_phase2_scene_scope_switch.py backend/tests/test_phase2_filter_system.py backend/tests/test_phase2_object_resolution.py backend/tests/test_api_scene_above_me.py` (20 passed), `docker compose up -d --build backend`, runtime `/api/v1/conditions` showing provider-backed source + degraded fields, and `rg -n "MOCK_" backend/app` returning no matches.

* step: PHASE 2 STEP 19 — ABOVE ME ORCHESTRATION
  * result: LOCKED
  * validation: Above Me orchestration behavior is already valid in runtime with no implementation changes required; proof includes `.venv/bin/pytest -q backend/tests/test_phase2_filter_system.py backend/tests/test_phase2_scene_scope_switch.py backend/tests/test_api_scene_above_me.py` (9 passed), runtime `/api/v1/scene?scope=above_me&engine=above_me&filter=visible_now` showing merged multi-engine object output (`engine` set includes `deep_sky` and `satellite`) in a single scene, `/api/v1/scene?...&filter=short_window` showing time-oriented narrowing to satellite subset (`short_count=2`, `short_all_satellite=True`), relevance ordering check (`sorted_desc=True`), and visibility enforcement check (`visibility_violations=[]`).

* step: PHASE 2 STEP 20 — SCENE AUTHORITY ENFORCEMENT
  * result: LOCKED
  * validation: scene authority behavior is already valid in runtime with no implementation changes required; proof includes `.venv/bin/pytest -q backend/tests/test_phase2_filter_system.py backend/tests/test_phase2_scene_scope_switch.py backend/tests/test_api_scene_above_me.py` (9 passed), runtime cross-endpoint check for `lat=40.0&lon=-75.0&at=2026-03-31T12:00:00Z` showing `/api/v1/targets` IDs and `/api/v1/passes` object_ids are subsets of `/api/v1/scene` object IDs (`targets_subset_scene=True`, `passes_subset_scene=True`), object detail resolution from scene ID via `/api/v1/object/{id}` (`status=ok`, matching `data.id`), and frontend-mounted scene rendering in `frontend/src/components/AboveMeScene.jsx` consuming `scene.objects` from `useSceneByScopeDataQuery` with no component-level object assembly.

* step: PHASE 2 STEP 21 — TRACEABILITY SYSTEM
  * result: LOCKED
  * validation: provider-source traceability is now enforced in contracts (`backend/app/contracts/phase1.py`) and scene/detail assembly (`backend/app/services/_legacy_scene_logic.py`); object-level source proof plus scene-level timestamp/degraded trace proof pass via `.venv/bin/pytest -q backend/tests/test_contracts_phase1.py backend/tests/test_phase2_scene_scope_switch.py backend/tests/test_phase2_object_resolution.py backend/tests/test_api_scene_above_me.py backend/tests/test_phase2_filter_system.py` (19 passed); runtime check on `/api/v1/scene?scope=above_me&engine=above_me&filter=visible_now&lat=40&lon=-75&at=2026-03-31T12:00:00Z` confirms `provider_trace.timestamp_utc`, degraded/missing-source exposure, and `all_objects_have_provider_source=True`, with `/api/v1/object/{id}` returning matching `provider_source`.

---

## NEXT STEP (REFERENCE ONLY)

* next step: execute Phase 2 STEP 3 — DETAIL PANEL SYSTEM (UI ONLY).

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
