# Phase 2.5 — Endpoint Inventory

Source: repository inspection of `backend/server.py` and backend test files.

Observable endpoints (repo-backed)

- Path: `/api/conditions`
  - Method: GET (implemented in `backend/server.py`)
  - Implementing file/module: `backend/server.py` (uses `MOCK_CONDITIONS` from `backend/conditions_data.py` and may call `backend.normalizers.conditions_normalizer.normalize_to_contract`)
  - Current response shape summary: returns a JSON object based on `MOCK_CONDITIONS` with added `location_label` and `meta` fields; expected fields include summary, last_updated, darkness_window, cloud metrics (see `docs/contracts/conditions.schema.json` for intended schema).
  - Degraded/error behavior: if normalization fails the server returns a 500 JSON error payload with `error: { code: 'module_error', ... }`; invalid location params return 400 with `error.code: 'invalid_parameters'`; cached responses are returned with meta indicating cached status.

- Path: `/api/targets`
  - Method: GET
  - Implementing file/module: `backend/server.py` (calls `backend.targets_data.get_targets`, with `MOCK_TARGETS` defined in `backend/targets_data.py`)
  - Current response shape summary: array of target objects (fields like `name`, `category`, `direction`, `elevation_band`, `best_time`, `difficulty`, `reason`); `imageUrl` may be present when `backend.services.imageResolver` resolves images.
  - Degraded/error behavior: image enrichment failures are caught and omitted; server falls back to `MOCK_TARGETS` on internal error.

- Path: `/api/location/search`
  - Method: GET
  - Implementing file/module: `backend/server.py` (loads `backend/location_suggestions.json`)
  - Current response shape summary: array of suggestion objects from `location_suggestions.json` (each suggestion may include `name`, coordinates, etc.).
  - Degraded/error behavior: returns 400 JSON error with `error.code: 'invalid_request'` when `q` param is too short; returns 400 with `error.code: 'invalid_suggestion'` when suggestion coordinates are malformed; internal load failures produce 500 with `error.code: 'load_failed'`.

- Path: `/api/passes`
  - Method: GET
  - Implementing file/module: `backend/server.py` (returns `MOCK_PASSES` from `backend/passes_data.py`)
  - Current response shape summary: array/object of pass predictions (mock data); exact fields in `backend/passes_data.py`.
  - Degraded/error behavior: none specialized beyond generic exception handling in `server.py` (unhandled exceptions produce 500 via server error response).

- Path: `/api/alerts`
  - Method: GET
  - Implementing file/module: `backend/server.py` (returns `MOCK_ALERTS` from `backend/alerts_data.py`)
  - Current response shape summary: array/object of alert entries (mock data).
  - Degraded/error behavior: generic internal error handling applies (500 on unhandled exceptions).

Other notes and unknowns

- The above list is derived solely from `backend/server.py` and backend tests. There may be other backend entrypoints or routes that are not implemented in `server.py` or are present elsewhere; those are unknown from this inspection.
- Methods other than GET are not observed for these paths (server.py implements GET handlers only). If additional methods exist for any path they are unknown.
