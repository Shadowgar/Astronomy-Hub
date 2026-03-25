# Phase 2.5 — Backend Inventory

Source: repository inspection of `backend/` files and backend tests.

Runtime entry files
- `backend/server.py` — canonical current runtime script implementing a small HTTP server and the observable API paths. Usage comment: `python3 backend/server.py`. Reads `PORT` env var.

Route / service / helper modules (observable)
- `backend/conditions_data.py` — mock payload for `/api/conditions` (provider mock data).
- `backend/targets_data.py` — mock payload and `get_targets()` helper that optionally enriches targets using `backend.services.imageResolver`.
- `backend/passes_data.py` — mock payload for `/api/passes`.
- `backend/alerts_data.py` — mock payload for `/api/alerts`.
- `backend/location_suggestions.json` — dataset used by `/api/location/search`.
- `backend/cache/simple_cache.py` — simple in-process TTL cache used by `server.py` for caching responses.
- `backend/services/imageResolver.py` — image resolver service used by `targets_data.get_targets` (lazy-imported; failures are silent).
- `backend/logging_config.py` — centralized logging configuration and observations about log markers used for degraded behavior signaling.

Normalizer / validator / contract-related files
- `backend/normalizers/conditions_normalizer.py` — `normalize_to_contract(payload)` stub (returns payload unchanged; used by `server.py` before returning conditions payload).
- `backend/normalizers/validator.py` — `load_schema(name)` that reads JSON schemas from `docs/contracts/` and a `validate` wrapper (uses `jsonschema` if available, else a minimal check).
- `docs/contracts/` — schema files (e.g., `conditions.schema.json`, `error.schema.json`) referenced by normalizers/validator.

Backend tests relevant to current behavior
- `backend/tests/test_degraded_mode.py` — starts `HTTPServer` with `backend.server.SimpleHandler` to assert degraded-mode error contract when normalization fails (sets `SIMULATE_NORMALIZER_FAIL`).
- `backend/tests/test_normalizers_conditions.py` — imports `backend.normalizers.conditions_normalizer` and `backend.normalizers.validator` and asserts they return a dict and load schemas.
- `backend/tests/test_validator.py` — ensures validator can load `error.schema.json`.

Brief role summary for each major file (concise)
- `server.py`: runtime HTTP GET handler for API paths; lightweight dispatcher and module assembly point; performs cache usage and normalization calls.
- `cache/simple_cache.py`: small in-memory TTL cache; used to avoid repeated expensive assembly during requests.
- `normalizers/conditions_normalizer.py`: adapter point where provider payloads should be normalized to canonical contract (currently a stub).
- `normalizers/validator.py`: authoritative loader for JSON schema files under `docs/contracts` and optional runtime validation.
- `targets_data.py`: domain helper to assemble targets payload and optionally call `services.imageResolver` for `imageUrl` enrichment.
- `services/imageResolver.py`: helper resolving object images; errors are handled silently by callers.
- `logging_config.py`: central logging setup and documented log markers used by server modules to expose degraded/error signals.

Unknowns / ambiguities (explicit)
- Whether there is any alternate backend runtime entry (e.g., a FastAPI `app` module) elsewhere in the repo is unknown from this step — no FastAPI app file was observed in `backend/` during this inventory.
- Ownership/ownership mapping for some helper files (which service 'owns' a given mock file) is inferred from filenames but may be ambiguous and is therefore labeled as inferred in reviewer conversation.
