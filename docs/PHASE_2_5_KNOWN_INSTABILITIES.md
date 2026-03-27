# Phase 2.5 — Known Instabilities (observed)

Source: repository inspection of `backend/`, `backend/tests/`, and `frontend/` files.

Observed risks (phrased as risks/evidence only)

- Risk: Backend runtime is a custom `http.server` script rather than a canonical framework entrypoint.
  - Evidence: `backend/server.py` is a minimal BaseHTTPRequestHandler-based server and contains the `__main__` usage comment `python3 backend/server.py`.
  - Impact: startup and routing authority is ad-hoc and may vary across environments (not yet FastAPI/Uvicorn canonicalized).

- Risk: Normalization step can cause module-level failures that surface as 500 errors.
  - Evidence: `server.py` calls `backend.normalizers.conditions_normalizer.normalize_to_contract`; on exception it logs a module assembly failure and returns a 500 `module_error` payload. `backend/tests/test_degraded_mode.py` asserts this degraded contract.
  - Impact: one module failing during assembly can return a 500 for that endpoint unless carefully contained (server attempts to contain per-module failures, but tests indicate failure modes exist).

- Risk: Runtime behavior depends on environment-driven path adjustments.
  - Evidence: `server.py` conditionally mutates `sys.path` when running as a script to allow `backend.*` package imports to resolve.
  - Impact: different execution contexts (module import vs script) may exercise different code paths and import-resolution behavior, increasing startup ambiguity.

- Risk: Adapters are present but are minimal stubs and many components still consume backend payloads directly.
  - Evidence: `frontend/src/lib/adapters/conditionsAdapter.js` returns payload unchanged; `frontend/src/components/Conditions.jsx` directly consumes backend payload fields and applies ad-hoc partial-data simulation.
  - Impact: frontend may be tightly coupled to current backend shapes; schema drift risk until adapters are authoritative.

- Risk: Environment configuration is under-specified in repo.
  - Evidence: `.gitignore` references `.env` but no `.env.example` or documented `.env` file is present; Vite proxy assumes backend at `127.0.0.1:8000`.
  - Impact: contributors may run dev servers with different envs/ports causing proxy mismatches or startup confusion.

- Risk: Caching and cache initialization can fail silently and is used in request handling.
  - Evidence: `server.py` calls `_ensure_cache()` and wraps cache operations in try/except; logging notes indicate `cache.init.fail`, `cache.hit`, and `cache.set.fail` markers.
  - Impact: inconsistent caching behavior may lead to non-deterministic responses and harder-to-reproduce bugs.

- Risk: Schema/contract validation relies on optional dependencies.
  - Evidence: `backend/normalizers/validator.py` tries to import `jsonschema` but falls back to a minimal required-field check when `jsonschema` is not installed.
  - Impact: local environments missing `jsonschema` will not perform full schema validation, hiding contract drift until proper validation is introduced in CI.

- Risk: Tests simulate special failure modes using environment flags.
  - Evidence: `backend/tests/test_degraded_mode.py` sets `SIMULATE_NORMALIZER_FAIL` in `os.environ` to force normalization failure.
  - Impact: tests reveal failure behavior but rely on explicit test-only flags rather than fully deterministic runtime configuration.

Unknowns (explicit)

- Whether a canonical FastAPI/Uvicorn entrypoint already exists elsewhere in the repo (none found in `backend/` during this inspection).
- Presence of Docker/Compose infra files in other repo locations (none found in repo root during this step).
