# Phase 2 — Implementation Plan (Version 2)

Overview
---
This document is the execution-safe Phase 2 implementation plan for Astronomy Hub. It follows the locked design in `docs/PHASE_2_SPEC.md` and is mapped exactly to the repository structure. It is a planning-only artifact — no code changes or execution are performed here.

Guiding constraints
- Contracts first; backend before frontend; failure handling last.
- Do not add new top-level directories.
- Minimize new files in early passes; prefer existing files and patterns.
- Steps are atomic, reversible, and labelled REQUIRED or OPTIONAL.

Structure
---
Phase 2A — Contracts & Types
Phase 2B — Backend Normalization Layer
Phase 2C — Drill-Down UI Expansion
Phase 2D — Location Intelligence
Phase 2E — Caching Layer
Phase 2F — Failure & Degraded Mode

For every step below:
- Purpose: one or two sentences.
- Files to modify: exact repo-relative paths (create only under existing folders).
- What to change: descriptive (no code).
- Verification: concrete checks/commands.
- Rollback: how to undo.
- Flag: REQUIRED or OPTIONAL (later hardening).

PHASE 2A — Contracts & Types
1) A1 — Create contracts index (tiny, REQUIRED)
- Purpose: Provide a minimal index so later steps can add schemas incrementally.
- Files to modify (new):
  - `docs/contracts/index.json`
- What to change: Add a small JSON file listing upcoming schema filenames (empty list OK to start).
- Verification: `ls docs/contracts && cat docs/contracts/index.json` (file exists and contains a JSON list).
- Rollback: `git rm docs/contracts/index.json` or revert commit.

2) A2 — Add error schema (atomic, REQUIRED)
- Purpose: Formalize the error contract used by backend endpoints.
- Files to modify (new):
  - `docs/contracts/error.schema.json`
  - `docs/contracts/sample_error.json` (small example)
- What to change: Add JSON Schema for `{ error: { code, message } }` and a sample payload.
- Verification: `npx ajv validate -s docs/contracts/error.schema.json -d docs/contracts/sample_error.json`.
- Rollback: remove files or revert commit.

3) A3 — Add `conditions` schema (very small, REQUIRED)
- Purpose: Start with Conditions contract (Phase 2 needs Conditions correctness first).
- Files to modify (new):
  - `docs/contracts/conditions.schema.json`
  - (update) `docs/contracts/index.json` — add `conditions.schema.json`
- What to change: Add a minimal, strict JSON Schema for the Conditions response (matching PHASE_2_SPEC examples); reject unknown fields.
- Verification: validate current `curl http://localhost:8000/api/conditions` output against the schema using the validator (see Phase 2B steps for validator tool).
- Rollback: remove the schema and index entry or revert commit.

4) A4 — Add common fragments (small, OPTIONAL later hardening)
- Purpose: Centralize shared primitives (timestamp, enums) once module schemas are stable.
- Files to modify (new if needed):
  - `docs/contracts/common.schema.json`
  - update `docs/contracts/index.json`
- What to change: Provide $ref-able fragments for reuse. This step can be delayed until multiple schemas exist.
- Verification: run ajv validation with $ref resolution.
- Rollback: remove file or revert.

5) A5 — Contracts review checklist (required, tiny)
- Purpose: Record a lightweight verification checklist mapping Phase 1 mock outputs to the new conditions schema.
- Files to modify (new):
  - `docs/contracts/review_notes.md`
- What to change: Minimal checklist and sign-off line once manual verification is done.
- Verification: run manual validation command and add sign-off entry.
- Rollback: remove file or revert.

PHASE 2B — Backend Normalization Layer
Note: keep changes localized to existing `backend/` files. The single server file is `backend/server.py` which routes all Phase 1 endpoints.

6) B1 — Add normalizers package (small stubs, REQUIRED)
- Purpose: Create a local `backend.normalizers` package with tiny, importable stubs so code can be wired safely later.
- Files to modify (new):
  - `backend/normalizers/__init__.py`
  - `backend/normalizers/conditions_normalizer.py` (stub only)
- What to change: Add module files containing docstrings and a `normalize_to_contract(payload)` signature that currently returns the input (no transformation).
- Verification: `python3 -c "import backend.normalizers.conditions_normalizer; print('ok')"` returns `ok`.
- Rollback: remove the package directory or revert commit.

7) B2 — Add validator utility (tiny, REQUIRED)
- Purpose: Provide a test-time validator that loads schemas from `docs/contracts` for use in unit tests.
- Files to modify (new):
  - `backend/normalizers/validator.py`
  - `backend/tests/test_validator.py` (small test that imports the validator and loads `error.schema.json`)
- What to change: Implement an interface `validate(schema_path, payload)` used only in tests; no server integration yet.
- Verification: run `python3 -m pytest backend/tests/test_validator.py -q` and expect import/validation-run pass.
- Rollback: remove files or revert.

8) B3 — Wire normalizer callpoints in `backend/server.py` (non-destructive, REQUIRED)
- Purpose: Call normalizer stubs before returning mock data, but keep behavior identical if stubs are no-ops.
- Files to modify:
  - `backend/server.py`
- What to change: In each `/api/*` branch (conditions, targets, passes, alerts) call `backend.normalizers.<module>.normalize_to_contract(mock_payload)` inside a try; on exception, log and return original mock payload. Do not change route behavior or response shapes.
- Verification:
  - Start server and `curl /api/conditions` — response unchanged.
  - Confirm server logs show normalization attempt (informational only).
- Rollback: revert `backend/server.py` change.

9) B4 — Add normalization unit test for Conditions (REQUIRED)
- Purpose: Validate that the normalizer stub integrates and that mock payloads can be validated by schema via the `validator` utility.
- Files to modify (new):
  - `backend/tests/test_normalizers_conditions.py`
- What to change: Test reads `backend/conditions_data.py` mock and calls normalize + validator.
- Verification: `python3 -m pytest backend/tests/test_normalizers_conditions.py -q` passes.
- Rollback: remove test or revert.

10) B5 — Document unknown-field policy (small, REQUIRED)
- Purpose: Record normalization policy: unknown provider fields must not be forwarded; default policy: drop unknowns.
- Files to modify (new):
  - `backend/normalizers/README.md` (short policy note)
- What to change: Add a short policy note and link to `docs/PHASE_2_SPEC.md` section on contracts.
- Verification: file exists and referenced from tests/docs review.
- Rollback: remove file or revert.

PHASE 2C — Drill-Down UI Expansion
Note: Use existing frontend structure under `frontend/src/components` and `frontend/src/lib`.

11) C1 — Add frontend adapters folder and one adapter (very small, REQUIRED)
- Purpose: Prepare client-side adapter pattern; start with Conditions adapter only.
- Files to modify (new):
  - `frontend/src/lib/adapters/conditionsAdapter.js`
- What to change: Add a small adapter skeleton `toUi(payload)` that for now returns payload unchanged and logs schema mismatches to `frontend/src/lib/logger.js`.
- Verification: `npm run dev` or a simple bundler import smoke-check; ensure no import errors.
- Rollback: remove the file or revert.

12) C2 — Add InlineExpansion UI pattern (skeleton, REQUIRED)
- Purpose: Provide a reusable level-2 expansion pattern without data logic.
- Files to modify (new):
  - `frontend/src/components/common/InlineExpansion.jsx`
  - `frontend/src/components/common/InlineExpansion.css`
- What to change: Add accessible component skeleton (toggle state, ARIA) with no data assumptions.
- Verification: Import into an existing module (e.g., `RecommendedTargets.jsx`) temporarily to ensure bundle compiles.
- Rollback: remove files or revert.

13) C3 — Targets UI skeleton (minimal, REQUIRED)
- Purpose: Add expansion placeholders for Targets without adding data-fetch changes.
- Files to modify:
  - `frontend/src/components/RecommendedTargets.jsx` (modify)
  - `frontend/src/components/TargetRow.jsx` (new)
  - `frontend/src/components/TargetDetail.jsx` (new)
- What to change: Render `TargetRow` skeletons and wire `InlineExpansion` for row-level expansion. Keep summary-first rendering identical.
- Verification: Start dev server, open Targets area; ensure no runtime errors and summary view unchanged.
- Rollback: revert `RecommendedTargets.jsx` and remove new files.

14) C4 — Passes & Alerts UI skeletons (mirror pattern, OPTIONAL)
- Purpose: Same skeletons for Passes and Alerts/Events; can be done after Targets if team prefers incremental rollout.
- Files to modify (new/modify):
  - `frontend/src/components/PassRow.jsx` (new)
  - `frontend/src/components/PassDetail.jsx` (new)
  - `frontend/src/components/EventRow.jsx` (new)
  - `frontend/src/components/EventDetail.jsx` (new)
  - modify `SatellitePasses.jsx` and `AlertsEvents.jsx` accordingly
- Verification: dev server smoke-check.
- Rollback: revert changes.
- Flag: OPTIONAL for initial pass; REQUIRED before full module drill-down release.

15) C5 — UI tests (small, OPTIONAL)
- Purpose: Add lightweight test scaffolding for detail collapse behavior.
- Files to modify (new):
  - `frontend/tests/test_detail_views.test.js`
- What to change: Add tests asserting detail components default to collapsed state and respect density rules.
- Verification: `npm test` (may require CI environment); tests should be small and run fast.
- Rollback: remove tests.

PHASE 2D — Location Intelligence
Note: Keep frontend-first UX; backend provides a mock-first `/api/location/search` route implemented inside `backend/server.py` (no external provider calls in Phase 2 initial pass).

16) D1 — Add mock location suggestions in backend (tiny, REQUIRED)
- Purpose: Provide a mock-backed `/api/location/search` implementation in the existing server.
- Files to modify:
  - `backend/server.py` (modify to handle `/api/location/search`)
  - `backend/location_suggestions.json` (new small sample file)
- What to change: Add path handling that returns suggestions from `backend/location_suggestions.json` when `q` >= 3 chars; return error contract if q < 3.
- Verification: `curl 'http://localhost:8000/api/location/search?q=York'` returns JSON suggestions; `q=ab` returns 400 + error schema.
- Rollback: revert `backend/server.py` and delete JSON file.

17) D2 — LocationSelector component (skeleton, REQUIRED)
- Purpose: UI for searching suggestions and explicit Apply flow; do not replace existing `App.jsx` inputs yet.
- Files to modify (new):
  - `frontend/src/components/LocationSelector/LocationSelector.jsx`
  - `frontend/src/components/LocationSelector/locationSelector.css`
- What to change: Implement input + suggestions list + explicit `Apply` button; for Phase 2 initial pass, `Apply` will call a callback provided by `App.jsx` to set a pending location. Do not persist to localStorage here.
- Verification: mount behind a feature flag or temporary import; type >= 3 chars and confirm suggestions appear from backend mock.
- Rollback: remove files and undo imports.

18) D3 — Pending / Apply flow (very small integration, REQUIRED)
- Purpose: Keep Active Observing Location changes explicit: selection → pending → confirm.
- Files to modify:
  - `frontend/src/App.jsx` (small, non-destructive modification behind flag or optional mount)
  - `frontend/src/state/locationState.js` (new, minimal in-memory state module)
- What to change: Add `pendingLocation` in `locationState.js` and wire LocationSelector `Apply` to set pending; `App.jsx` must require an explicit confirm action to move pending → active.
- Verification: select suggestion, click `Apply`, confirm `activeLocation` unchanged until confirm; behavior logged to `frontend/src/lib/logger.js`.
- Rollback: revert `App.jsx` and remove `locationState.js`.

19) D4 — Server-side suggestion validation (small, REQUIRED)
- Purpose: Ensure returned suggestion coordinates are numeric and within range.
- Files to modify:
  - `backend/server.py` (extend suggestion handling to validate coords)
- What to change: Validate lat/lon numeric and in-range when serving suggestions; respond 400 + error contract for malformed data.
- Verification: craft a malformed suggestion request and confirm 400 + error schema.
- Rollback: revert server change.

PHASE 2E — Caching Layer
Note: Keep cache simple and local (no external infra). Use `backend/cache/` which already exists in repo.

20) E1 — Add simple_cache utility (very small, REQUIRED)
- Purpose: Provide a tiny in-process TTL cache for Conditions only in the first pass.
- Files to modify (new):
  - `backend/cache/simple_cache.py`
- What to change: Add a compact `SimpleCache` class with `get/set` and TTL semantics (in-process only). Keep implementation minimal and documented. No invalidation endpoint is added for Phase 2 initial pass — rely on TTL.
- Verification: REPL smoke: import and basic set/get.
- Rollback: remove file or revert.

21) E2 — Use cache for `/api/conditions` only (minimal, REQUIRED)
- Purpose: Apply caching where freshness is shortest and clear: Conditions.
- Files to modify:
  - `backend/server.py` (modify `/api/conditions` branch)
  - `backend/cache/simple_cache.py` (from E1)
- What to change: Use cache.get/set keyed by location; include non-invasive metadata in response (e.g., `meta: { cached: true, cached_at: ISO }`) without changing core contract fields.
- Verification: two sequential `curl /api/conditions` calls show second has `meta.cached: true`; TTL expiration yields fresh data.
- Rollback: revert `backend/server.py` change.

22) E3 — Cache for passes/events (OPTIONAL for initial pass)
- Purpose: Medium TTL caching for passes/alerts; defer until conditions cache behavior is validated in production/dev.
- Files to modify (if enabled later):
  - `backend/server.py` (passes/alerts branches)
- What to change: Mirror pattern from E2 with longer TTLs.
- Verification: cached metadata present and TTL behavior as expected.
- Rollback: revert changes.

PHASE 2F — Failure & Degraded Mode
23) F1 — Per-module isolation wrapper (very small, REQUIRED)
- Purpose: Ensure an exception while producing one module's payload does not crash the whole server — return error contract for that module path only.
- Files to modify:
  - `backend/server.py`
- What to change: Surround per-path handler logic with try/except that returns the standard error contract on exception. No central router changes.
- Verification: induce a controlled exception in a normalization call and confirm only that endpoint returns `error` while other endpoints still return valid responses.
- Rollback: revert change in `backend/server.py`.

24) F2 — Frontend Module wrapper for partial/stale UI (small, REQUIRED)
- Purpose: Add a minimal wrapper component to show partial data, `stale` badge, and `retry` action; avoid wide UI surgery.
- Files to modify:
  - `frontend/src/components/ModuleShell.jsx` (new minimal wrapper)
  - `frontend/src/components/Conditions.jsx` (minimal update to render through ModuleShell)
- What to change: Implement `ModuleShell` that accepts `data`, `meta`, and `onRetry` props; `Conditions.jsx` should render using this wrapper but otherwise keep summary-first output identical.
- Verification: Simulate partial payload and confirm wrapper shows `stale` badge and `retry` logs or triggers re-fetch.
- Rollback: revert `Conditions.jsx` and delete `ModuleShell.jsx`.

25) F3 — Degraded-mode tests (OPTIONAL but recommended)
- Purpose: Add small integration tests ensuring module isolation and graceful UI degradation.
- Files to modify (new):
  - `backend/tests/test_degraded_mode.py` (new)
  - `frontend/tests/test_degraded_ui.test.js` (new)
- What to change: Add minimal tests that simulate error conditions and assert endpoints/UI behave per spec.
- Verification: run backend pytest and frontend jest tests locally.
- Rollback: remove tests or revert.

26) F4 — Observability notes (documentation-only, REQUIRED)
- Purpose: Ensure logs include clear markers for normalization failures and cache hits/misses; add minimal docs to support triage.
- Files to modify (update):
  - `backend/logging_config.py` (existing) — small comment additions only; avoid large refactors.
  - `backend/monitoring/metrics.md` (new, tiny)
- What to change: Add short doc describing the log keys to look for and example log message formats. Do not wire in metrics infra.
- Verification: After changes, a developer can search logs for the documented keys.
- Rollback: revert `logging_config.py` edits and remove `metrics.md`.

Execution notes
- Each numbered step is intended to be a single git commit. Keep commits small and atomic and include the step tag in the commit message (e.g., `2A.A3: docs(contracts): add conditions.schema.json`).
- Prefer manual verification before merging: start backend locally (`python3 backend/server.py`) and frontend (`npm run dev`) and run the small tests added under `backend/tests/` and `frontend/tests/` where present.
- Update `docs/PROJECT_STATE.md` after each verified step with a single-line status and commit hash.

Major changes from the prior floating plan
- Incremental contracts: The plan now creates contract artifacts in very small steps (index → error → conditions) instead of adding many schemas at once.
- Minimized early surface area: early steps create only the smallest necessary files.
- Removed dev-only endpoints: no dev-only cache-invalidate endpoint. Cache invalidation relies on TTL for the initial pass.
- Repo-aligned: All file paths reference existing repo folders only (`docs/`, `backend/`, `frontend/src/`).
- Optional items deferred: passes/events adapters and some tests are now optional in the first pass.

Final notes
- This document was written into `docs/PHASE_2_IMPLEMENTATION_PLAN.md` inside the repository. No code has been edited or executed as part of creating this plan.
