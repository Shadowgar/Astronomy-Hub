# Phase 2.5 — Backend Startup Runbook (Package 1)

Purpose: minimal backend-focused startup steps for Phase 2.5 Package 1. Uses files added in Package 1 only.

Quick start (local)

1. Copy environment example to `.env` and edit if needed:

```bash
cp .env.example .env
# edit .env if you need non-default values
```

2. Build and start only the backend service via Compose:

```bash
docker compose up --build backend
```

3. Confirm the backend is reachable (default port 8000):

```bash
curl -sS http://127.0.0.1:8000/api/conditions | jq '.'
```

Notes and verification guidance
- The Compose service runs the repository's existing backend runtime (`python3 backend/server.py`). No application code changes are made in Package 1.
- If your environment requires a different port, edit `.env` and re-run Compose. The backend reads `PORT` from the environment.
- Use `docker compose logs -f backend` to view backend logs. Look for `Starting server on http://` messages from `backend/server.py`.

If Compose is not available in your environment, you can run the backend directly as in Package 0:

```bash
python3 backend/server.py
```

Note: An additive FastAPI entrypoint now exists at `backend/app/main.py`.
It exposes the minimalist endpoints `/`, `/health`, and `/api/conditions` for
incremental migration and smoke-testing. The legacy runtime (`backend/server.py`)
is still the primary runtime for Phase 2.5 — FastAPI is being introduced
incrementally and does not replace the existing server yet.
