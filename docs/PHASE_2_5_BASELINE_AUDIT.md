# Phase 2.5 — Baseline runtime audit

Purpose: capture the current runtime truth from repository inspection only. Do not change code.

## Files inspected
- `backend/server.py`
- `backend/tests/test_degraded_mode.py`
- `backend/tests/test_normalizers_conditions.py`
- `backend/tests/test_validator.py`
- `frontend/package.json`
- `frontend/vite.config.mjs`
- `.gitignore`

## 1) Current backend startup path
- Observed: `backend/server.py` is a minimal Python HTTP server exposing `/api/*` endpoints.
- Confirmed script usage comment: "Usage: python3 backend/server.py"
- Observed `if __name__ == "__main__"` entry that calls `run()`.

## 2) Current frontend startup path
- Observed: frontend is a Vite + React project located in `frontend/`.
- `frontend/package.json` provides scripts: `dev` (vite), `build` (vite build), `preview` (vite preview --port 4173).

## 3) Current backend run command(s) (visible in repo)
- `python3 backend/server.py` (documented in `backend/server.py` and implemented by its `__main__`).
- Tests and examples invoke the handler directly (tests start an `HTTPServer` with `backend.server.SimpleHandler`).

## 4) Current frontend run command(s) (visible in repo)
- From `frontend/package.json`:
  - `npm run dev` → runs `vite` (development server)
  - `npm run build` → runs `vite build`
  - `npm run preview` → `vite preview --port 4173`
- Typical dev invocation (repo-relative): `cd frontend && npm run dev` (or use an npm client with `--prefix frontend`).

## 5) Current ports in use (observable in repo)
- Backend: `backend/server.py` reads `PORT` env var and defaults to `8000` when absent → default bind port = 8000.
- Frontend preview: `vite preview` is configured to use port `4173` via the preview script.
- Vite dev server: `vite.config.mjs` does not set `server.port`; repo does not explicitly declare the dev port (not specified in repo files).
- Tests: `backend/tests/test_degraded_mode.py` starts a test server on port `8050` (test-only port).

## 6) Current environment / configuration assumptions (visible from repo)
- `backend/server.py` reads `PORT` from environment to override default port.
- `backend/logging_config.py` reads `LOG_LEVEL` from environment (default `INFO`).
- Tests set `SIMULATE_NORMALIZER_FAIL` (see `backend/tests/test_degraded_mode.py`).
- `vite.config.mjs` proxies `/api` to `http://127.0.0.1:8000` for local development (frontend expects backend on 127.0.0.1:8000).
- `.gitignore` includes `.env` entries, but there is no `.env` or `.env.example` present in the repo.

## 7) Current test command(s) that appear to exist
- Repository contains Python `pytest` tests under `backend/tests/`.
- Docs and repo examples reference running tests with `python3 -m pytest backend/tests -q`.
- A Python virtual environment `.venv/` exists in the repo and includes pytest (observed `.venv/bin/pytest`).

## 8) Current observed status (repo inspection only)
- Backend runtime is a custom minimal `http.server`-based script (`backend/server.py`) implementing specific API paths (`/api/conditions`, `/api/targets`, `/api/location/search`, `/api/passes`, `/api/alerts`).
- Frontend is a React + Vite app with a dev script that proxies API calls to `127.0.0.1:8000`.
- There is an existing `backend/normalizers` module and JSON schema files that tests load; tests assert the normalizer and validator utilities can be invoked.

## 9) Known unknowns (require later confirmation or runtime checks)
- Is there an intended canonical production startup path (e.g., a FastAPI + Uvicorn entrypoint) already present but not yet discovered in non-obvious location? (No FastAPI app file was found in the inspected files; confirm globally.)
- Are there environment variables used in production that are documented elsewhere (no `.env.example` present in repo)?
- Frontend dev server port at runtime: `vite.config.mjs` does not declare `server.port` here; the actual dev port used on contributors' machines may differ (not asserted in repo files).
- Any Docker / Compose files or infra startup scripts: none observed in repo root (no `docker-compose.yml` or `Dockerfile` inspected in this step); confirm if present elsewhere before Package 1.

---

Notes: This document contains only facts observed in repository files and tests. Where repository information is absent or ambiguous the item is marked as unknown and requires confirmation during the Package 0 review.
