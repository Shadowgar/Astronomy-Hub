# Environment Setup (WSL Primary)

## Purpose

This document defines the default development environment for Astronomy Hub.

## Core Rule

WSL is the primary development environment.

- Frontend runs in WSL.
- Backend runs in WSL.
- Tests run in WSL.
- Profiling runs against a WSL-hosted frontend server.
- Docker is not part of the daily development loop.

## Daily Development Runtime

One-command stack helpers from repo root:

```bash
npm run dev:wsl
npm run dev:wsl:restart
npm run dev:wsl:down
```

Use restart when local services get stale after dependency/config/code changes.

Frontend:

```bash
cd /home/rocco/Astronomy-Hub/frontend
npm install
npm run dev -- --host 0.0.0.0
```

Backend:

```bash
cd /home/rocco/Astronomy-Hub
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

## Testing and Build (WSL)

Frontend:

```bash
cd /home/rocco/Astronomy-Hub/frontend
npm run typecheck
npm run test -- tests/sky-engine-runtime-frame-projection.test.js tests/sky-engine-stars-runtime.test.js tests/test_scene_query_state.test.js tests/test_painter_backend_port.test.js
npm run build
```

Backend:

```bash
cd /home/rocco/Astronomy-Hub
.venv/bin/python -m pytest backend/tests -q
```

## Profiling (WSL)

Terminal 1:

```bash
cd /home/rocco/Astronomy-Hub/frontend
npm run build
npm run preview -- --host 0.0.0.0
```

Terminal 2:

```bash
cd /home/rocco/Astronomy-Hub/frontend
npm run profile:sky-engine-runtime
```

Expected local target:
- http://127.0.0.1:4173/sky-engine?debugTelemetry=1

## Environment Notes

Frontend defaults:
- `FRONTEND_PORT=4173`
- API proxy defaults to `http://127.0.0.1:8000`

Backend defaults:
- API on port `8000`
- Redis fallback URL `redis://localhost:6379/0`
- DB helper default URL `postgresql+psycopg://postgres:postgres@localhost:5432/astronomy_hub`

## Docker Status

Docker files are retained for production/deployment/reference checks only.

Docker is not used for normal development, testing, or profiling.

## Related Documents

- WSL workflow details: `docs/development/WSL_DEV_WORKFLOW.md`
- Fast sky-engine loop index: `docs/development/FAST_SKY_ENGINE_DEV.md`
