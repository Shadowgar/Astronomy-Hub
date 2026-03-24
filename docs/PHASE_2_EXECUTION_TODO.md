# Phase 2 — Execution HISTORY (COMPLETED)

This file records the Phase 2 execution steps for historical reference. Phase 2 execution is COMPLETE; the entries below remain for traceability only and are not an active TODO list.

Rules enforced here:
- Contracts first, backend before frontend, location after base UI/data shape is stable, caching after correctness, failure handling last.
- Each step touches the minimal number of files (preferably 1).
- All paths align to the repository structure.

Format for each entry:
1. Step ID
2. Step Name
3. REQUIRED / OPTIONAL
4. Files to modify (exact relative paths)
5. Goal (one sentence)
6. Verification (commands / checks)
7. Suggested commit message
8. Rollback note

---

PHASE 2A — Contracts & Types

Step 2A.A1
1. Step ID: 2A.A1
2. Step name: Create contracts index (empty)
3. REQUIRED
4. Files to modify:
   - docs/contracts/index.json (new)
   - Create directory if missing: `mkdir -p docs/contracts`
5. Goal: Add an index file that lists contract schema filenames (empty array is acceptable initially).
6. Verification:
   - `ls docs/contracts`
   - `cat docs/contracts/index.json` (should be valid JSON array `[]`)
7. Suggested commit message: "2A.A1: docs(contracts): add index.json (initial empty list)"
8. Rollback: `git rm docs/contracts/index.json` or `git revert` the commit.

Step 2A.A2
1. Step ID: 2A.A2
2. Step name: Add error schema and sample
3. REQUIRED
4. Files to modify:
   - docs/contracts/error.schema.json (new)
   - docs/contracts/sample_error.json (new)
   - Create directory if missing: `mkdir -p docs/contracts`
5. Goal: Create a strict JSON Schema for the error contract and a small example payload.
6. Verification:
   - If `ajv` is available: `npx ajv validate -s docs/contracts/error.schema.json -d docs/contracts/sample_error.json`
   - Otherwise verify JSON syntax: `python3 -c "import json; json.load(open('docs/contracts/error.schema.json')); json.load(open('docs/contracts/sample_error.json')); print('ok')"`
7. Suggested commit message: "2A.A2: docs(contracts): add error.schema.json and example"
8. Rollback: remove the two files or revert the commit.

Step 2A.A3
1. Step ID: 2A.A3
2. Step name: Add Conditions schema and index entry
3. REQUIRED
4. Files to modify:
   - docs/contracts/conditions.schema.json (new)
   - docs/contracts/index.json (update)
5. Goal: Add a minimal strict schema for the Conditions response and register it in the index.
6. Verification:
   - `cat docs/contracts/index.json` contains "conditions.schema.json"
   - Use validator utility later to validate `curl http://localhost:8000/api/conditions` (validation step executed when validator exists).
7. Suggested commit message: "2A.A3: docs(contracts): add conditions.schema.json and index entry"
8. Rollback: remove added schema and restore index.json to previous content.

Step 2A.A4
1. Step ID: 2A.A4
2. Step name: Add contracts review note file
3. REQUIRED
4. Files to modify:
   - docs/contracts/review_notes.md (new)
5. Goal: Create a short checklist file to record manual schema verification steps and sign-off.
6. Verification:
   - `cat docs/contracts/review_notes.md` shows checklist content.
7. Suggested commit message: "2A.A4: docs(contracts): add review_notes.md"
8. Rollback: remove file or revert commit.

PHASE 2B — Backend Normalization Layer

Step 2B.B1
1. Step ID: 2B.B1
2. Step name: Add normalizers package (stubs)
3. REQUIRED
4. Files to modify:
   - backend/normalizers/__init__.py (new — file must be named `__init__.py`)
   - backend/normalizers/conditions_normalizer.py (new, stub)
   - Create directory if missing: `mkdir -p backend/normalizers`
5. Goal: Provide importable stubs for normalizers with `normalize_to_contract(payload)` signature; stubs may return the input unchanged.
6. Verification:
   - `python3 -c "import backend.normalizers.conditions_normalizer; print('ok')"` prints `ok`.
7. Suggested commit message: "2B.B1: backend(normalizers): add condition normalizer stub"
8. Rollback: remove created files or revert commit.

Step 2B.B2
1. Step ID: 2B.B2
2. Step name: Add validator utility (test-only)
3. REQUIRED
4. Files to modify:
   - backend/normalizers/validator.py (new)
   - backend/tests/test_validator.py (new, minimal)
   - Create directory if missing: `mkdir -p backend/tests`
5. Goal: Provide a small test-only utility that can validate JSON payloads against schemas in `docs/contracts/`.
6. Verification:
   - `python3 -m pytest backend/tests/test_validator.py -q` (test imports validator and loads `error.schema.json`)
7. Suggested commit message: "2B.B2: backend(normalizers): add schema validator and test"
8. Rollback: remove files or revert.

Step 2B.B3
1. Step ID: 2B.B3
2. Step name: Wire normalizer callpoints in server (safe, non-destructive)
3. REQUIRED
4. Files to modify:
   - backend/server.py (modify small callpoints to invoke stubs inside try/except)
5. Goal: Ensure `backend.normalizers.conditions_normalizer.normalize_to_contract` is called before returning mock payloads but fall back to original mock on any error.
6. Verification:
   - Start server in one terminal: `python3 backend/server.py`
   - In another terminal: `curl http://localhost:8000/api/conditions` and confirm HTTP 200 and JSON response.
   - Observe server terminal stdout for normalization log lines (look for `req=` or `normalize` entries emitted by `logging_config`).
7. Suggested commit message: "2B.B3: backend(server): call normalizer stubs with safe fallback"
8. Rollback: revert `backend/server.py` to prior version.

Step 2B.B4
1. Step ID: 2B.B4
2. Step name: Add normalization unit test for Conditions
3. REQUIRED
4. Files to modify:
   - backend/tests/test_normalizers_conditions.py (new)
   - Create directory if missing: `mkdir -p backend/tests`
5. Goal: Test that `conditions_data` can be fed to the normalizer and validated via validator utility.
6. Verification:
   - If `pytest` is available: `python3 -m pytest backend/tests/test_normalizers_conditions.py -q`
   - Otherwise, run an import check: `python3 -c "import sys; sys.path.insert(0, '.'); from backend.normalizers.conditions_normalizer import normalize_to_contract; print('ok')"`
7. Suggested commit message: "2B.B4: tests(normalizers): add conditions normalizer test"
8. Rollback: remove test or revert.

Step 2B.B5
1. Step ID: 2B.B5
2. Step name: Document unknown-field policy
3. REQUIRED
4. Files to modify:
   - backend/normalizers/README.md (new)
   - Create directory if missing: `mkdir -p backend/normalizers`
5. Goal: Add a short note documenting that unknown provider fields must not be forwarded and default policy is to drop unknowns.
6. Verification:
   - `cat backend/normalizers/README.md` shows the policy.
7. Suggested commit message: "2B.B5: backend(normalizers): add unknown-field policy note"
8. Rollback: remove file or revert.

PHASE 2C — Drill-Down UI Expansion

Step 2C.C1
1. Step ID: 2C.C1
2. Step name: Add Conditions adapter skeleton
3. REQUIRED
4. Files to modify:
   - frontend/src/lib/adapters/conditionsAdapter.js (new)
   - Create directory if missing: `mkdir -p frontend/src/lib/adapters`
5. Goal: Add small adapter skeleton `toUi(payload)` returning payload unchanged and logging validation warnings to existing frontend logger (`frontend/src/lib/logger.js`).
6. Verification:
   - `npm run dev` (or bundle) should not error due to missing file import if temporarily imported; otherwise, import check in editor.
   - To inspect logger output in the browser, enable dev logger by adding `?devlog=1` to the app URL or setting `localStorage['astroHub.devLog']='1'`, then check browser console for single-line JSON log entries.
7. Suggested commit message: "2C.C1: frontend(adapters): add conditionsAdapter skeleton"
8. Rollback: remove file or revert.

Step 2C.C2
1. Step ID: 2C.C2
2. Step name: Add InlineExpansion component skeleton
3. REQUIRED
4. Files to modify:
   - frontend/src/components/common/InlineExpansion.jsx (new)
   - frontend/src/components/common/InlineExpansion.css (new)
   - Create directory if missing: `mkdir -p frontend/src/components/common`
5. Goal: Provide an accessible expansion component skeleton to be reused by module rows.
6. Verification:
   - Temporary import into an existing component to ensure build succeeds; inspect in dev server.
7. Suggested commit message: "2C.C2: frontend(ui): add InlineExpansion skeleton"
8. Rollback: remove files or revert.

Step 2C.C3
1. Step ID: 2C.C3
2. Step name: Add Target row/detail skeletons and wire InlineExpansion
3. REQUIRED
4. Files to modify:
   - frontend/src/components/RecommendedTargets.jsx (modify small)
   - frontend/src/components/TargetRow.jsx (new)
   - frontend/src/components/TargetDetail.jsx (new)
5. Goal: Render target rows using `InlineExpansion` with placeholder detail content, without changing data fetching.
6. Verification:
   - Start frontend dev and view Targets module — confirm no runtime errors and summary view unchanged.
7. Suggested commit message: "2C.C3: frontend(targets): add row/detail skeletons and use InlineExpansion"
8. Rollback: revert `RecommendedTargets.jsx` and remove new files.

Step 2C.C4
1. Step ID: 2C.C4
2. Step name: Add Pass row/detail skeletons (OPTIONAL)
3. OPTIONAL
4. Files to modify:
   - frontend/src/components/SatellitePasses.jsx (modify small)
   - frontend/src/components/PassRow.jsx (new)
   - frontend/src/components/PassDetail.jsx (new)
5. Goal: Add skeletons mirroring Targets pattern; optional in initial pass.
6. Verification:
   - Dev server smoke-check of Passes module.
7. Suggested commit message: "2C.C4: frontend(passes): add row/detail skeletons"
8. Rollback: revert changes.

Step 2C.C5
1. Step ID: 2C.C5
2. Step name: Add basic detail-view test scaffold (OPTIONAL)
3. OPTIONAL
4. Files to modify:
   - frontend/tests/test_detail_views.test.js (new)
   - Create directory if missing: `mkdir -p frontend/tests`
5. Goal: Add small tests asserting default collapsed detail sections and density constraints.
6. Verification:
   - `npm test -- --testPathPattern=test_detail_views` executes the test.
7. Suggested commit message: "2C.C5: tests(ui): add detail-view test scaffold"
8. Rollback: remove file or revert.

PHASE 2D — Location Intelligence

Step 2D.D1
1. Step ID: 2D.D1
2. Step name: Add backend mock location suggestions
3. REQUIRED
4. Files to modify:
   - backend/server.py (modify to add `/api/location/search` handling)
   - backend/location_suggestions.json (new)
5. Goal: Serve mock suggestions for `q` >= 3 chars from `backend/location_suggestions.json`.
6. Verification:
   - `curl 'http://localhost:8000/api/location/search?q=York'` returns JSON array of suggestions
   - `curl 'http://localhost:8000/api/location/search?q=ab'` returns 400 + error contract
7. Suggested commit message: "2D.D1: backend(server): add mock /api/location/search using local suggestions"
8. Rollback: revert server.py and remove JSON file.

Step 2D.D2
1. Step ID: 2D.D2
2. Step name: Add LocationSelector component (skeleton)
3. REQUIRED
4. Files to modify:
   - frontend/src/components/LocationSelector/LocationSelector.jsx (new)
   - frontend/src/components/LocationSelector/locationSelector.css (new)
   - Create directory if missing: `mkdir -p frontend/src/components/LocationSelector`
5. Goal: Input + suggestion list + explicit `Apply` button; do not replace App's existing inputs.
6. Verification:
   - Mount behind a feature flag or temporary import; typing >=3 chars shows suggestions from backend.
7. Suggested commit message: "2D.D2: frontend(location): add LocationSelector skeleton"
8. Rollback: remove files and undo imports.

Step 2D.D3
1. Step ID: 2D.D3
2. Step name: Add minimal pending/apply state module and wire optional mount
3. REQUIRED
4. Files to modify:
   - frontend/src/state/locationState.js (new)
   - frontend/src/App.jsx (small, optional mount behind flag)
   - Create directory if missing: `mkdir -p frontend/src/state`
5. Goal: Provide `pendingLocation` in-memory and ensure `Apply` sets pending without auto-applying.
6. Verification:
   - Select suggestion and press Apply; confirm `activeLocation` unchanged until explicit confirm.
   - To observe the dev logger: open the app with `?devlog=1` and check browser console for a JSON log entry indicating the pending/apply action (entries are single-line JSON from `frontend/src/lib/logger.js`).
7. Suggested commit message: "2D.D3: frontend(location): add pending location state and optional mount"
8. Rollback: revert App.jsx and delete state file.

Step 2D.D4
1. Step ID: 2D.D4
2. Step name: Server-side suggestion coordinate validation
3. REQUIRED
4. Files to modify:
   - backend/server.py (extend suggestion handling to validate coords)
5. Goal: Return 400 + error contract for malformed or out-of-range coordinates in suggestion payloads.
6. Verification:
   - Craft a request producing malformed coords; expect 400 + error schema.
7. Suggested commit message: "2D.D4: backend(server): validate suggestion coordinates for /api/location/search"
8. Rollback: revert server change.

PHASE 2E — Caching Layer

Step 2E.E1
1. Step ID: 2E.E1
2. Step name: Add simple in-process cache utility
3. REQUIRED
4. Files to modify:
   - backend/cache/simple_cache.py (new — `backend/cache/` directory already exists)
5. Goal: Implement minimal `SimpleCache` with `get/set` and TTL in-process (small, documented).
6. Verification:
   - `python3 -c "from backend.cache.simple_cache import SimpleCache; c=SimpleCache(); c.set('k',1,ttl=1); print(c.get('k'))"`
7. Suggested commit message: "2E.E1: backend(cache): add simple in-process SimpleCache"
8. Rollback: remove file or revert.

Step 2E.E2
1. Step ID: 2E.E2
2. Step name: Use cache for /api/conditions only
3. REQUIRED
4. Files to modify:
   - backend/server.py (modify /api/conditions branch)
5. Goal: Cache conditions responses briefly; include non-invasive `meta` metadata stating `cached` and `cached_at` without changing main contract fields.
6. Verification:
   - Two sequential `curl /api/conditions` calls show `meta.cached: true` on the second call.
7. Suggested commit message: "2E.E2: backend(server): add short TTL cache for /api/conditions"
8. Rollback: revert server.py change.

Step 2E.E3
1. Step ID: 2E.E3
2. Step name: Cache passes/alerts (OPTIONAL)
3. OPTIONAL
4. Files to modify:
   - backend/server.py (passes/alerts branches)
5. Goal: Add medium TTL caching for passes and alerts if desired after validating conditions cache.
6. Verification:
   - Confirm cached responses include `meta.cached: true` and TTL behavior.
7. Suggested commit message: "2E.E3: backend(server): add medium TTL cache for passes and alerts"
8. Rollback: revert changes.

PHASE 2F — Failure & Degraded Mode

Step 2F.F1
1. Step ID: 2F.F1
2. Step name: Add per-module isolation guard in server
3. REQUIRED
4. Files to modify:
   - backend/server.py
5. Goal: Wrap per-path payload assembly in try/except returning the standard error contract when exceptions occur.
6. Verification:
   - Simulate a normalization exception for one path and confirm that endpoint returns `error` while others remain functional.
7. Suggested commit message: "2F.F1: backend(server): add per-module isolation guard"
8. Rollback: revert server.py change.

Step 2F.F2
1. Step ID: 2F.F2
2. Step name: Add ModuleShell wrapper and integrate into Conditions only
3. REQUIRED
4. Files to modify:
   - frontend/src/components/ModuleShell.jsx (new — create in `frontend/src/components/`)
   - frontend/src/components/Conditions.jsx (small modification to render via ModuleShell)
5. Goal: Provide minimal UI wrapper for partial/stale display and retry action for Conditions module without wide UI changes.
6. Verification:
   - Simulate partial payloads and confirm ModuleShell displays a visible `stale` badge in the DOM and that a `retry` action triggers either a re-fetch or emits a dev-log entry.
   - If using dev logger, open app with `?devlog=1` and check browser console for a single-line JSON entry when retry is used.
7. Suggested commit message: "2F.F2: frontend(ui): add ModuleShell and integrate into Conditions"
8. Rollback: revert Conditions.jsx and remove ModuleShell.jsx.

Step 2F.F3
1. Step ID: 2F.F3
2. Step name: Add small degraded-mode tests (OPTIONAL)
3. OPTIONAL
4. Files to modify:
   - backend/tests/test_degraded_mode.py (new)
   - frontend/tests/test_degraded_ui.test.js (new)
   - Create directories if missing: `mkdir -p backend/tests` and `mkdir -p frontend/tests`
5. Goal: Add tests that assert server returns error contract on per-module failure and UI renders stale/partial states without crashing.
6. Verification:
   - If `pytest` is available: `python3 -m pytest backend/tests -q`
   - If `npm test` is available: `npm test -- --testPathPattern=test_degraded_ui`
   - Otherwise perform manual import/build checks:
      - `python3 -c "import sys; sys.path.insert(0, '.'); print('ok')"`
      - `npm run build` (or `npm run dev`) to ensure frontend compiles
7. Suggested commit message: "2F.F3: tests: add degraded-mode tests (small)"
8. Rollback: remove tests or revert.

Step 2F.F4
1. Step ID: 2F.F4
2. Step name: Observability notes (docs only)
3. REQUIRED
4. Files to modify:
   - backend/logging_config.py (small comment additions only)
   - backend/monitoring/metrics.md (new)
   - Create directory if missing: `mkdir -p backend/monitoring`
5. Goal: Add brief documentation of log keys to look for (cache hit/miss, normalize.fail, module.error) and example messages.
6. Verification:
   - `cat backend/monitoring/metrics.md` and inspect comments in `backend/logging_config.py`.
7. Suggested commit message: "2F.F4: backend(monitoring): add metrics.md and logging notes"
8. Rollback: revert logging_config.py edits and remove metrics.md.

---

Global notes
- Each step must be a single commit. Keep messages small and reference the Step ID.
- After each step verification, append a single-line status to `docs/PROJECT_STATE.md` (commit separately).
- No step should touch more than 1–3 files. Prefer 1 file.

End of TODO list.
