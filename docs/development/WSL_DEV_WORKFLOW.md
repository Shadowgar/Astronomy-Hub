# WSL Development Workflow

## Development Principle

- WSL is the primary development environment.
- Docker is not used for daily development.
- Frontend runs directly in WSL.
- Backend/API runs directly in WSL.
- Tests run directly in WSL.
- Runtime profiling runs against a WSL-hosted frontend server.

This workflow does not change runtime behavior or Stellarium port logic.

## Frontend WSL Commands

Development server:

```bash
cd /home/rocco/Astronomy-Hub/frontend
npm install
npm run dev -- --host 0.0.0.0
```

Expected frontend URL:
- http://127.0.0.1:4173/sky-engine

Build/profile workflow:

```bash
cd /home/rocco/Astronomy-Hub/frontend
npm run build
npm run preview -- --host 0.0.0.0
npm run profile:sky-engine-runtime
```

## Backend/API WSL Commands

Backend code is under:
- /home/rocco/Astronomy-Hub/backend

Actual run command verified in this repo:
- `backend/app/main.py` imports package paths as `backend.*`, so run from repo root using module `backend.app.main:app`.

Setup and run:

```bash
cd /home/rocco/Astronomy-Hub
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

Direct executable form (when `.venv` already exists):

```bash
cd /home/rocco/Astronomy-Hub
.venv/bin/python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

## Environment Variables

### Frontend

Commonly used:
- `FRONTEND_PORT` (default 4173)
- `VITE_DEV_PROXY_TARGET` (optional API proxy override)
- `API_URL` (optional fallback proxy target)
- `SKY_ENGINE_PROFILE_URL` (optional profile target override)

Defaults from Vite config:
- frontend port: `4173`
- API proxy target: `http://127.0.0.1:8000`

### Backend

Commonly used:
- `LOG_LEVEL` (default `INFO`)
- `REDIS_URL` (default `redis://localhost:6379/0`)
- optional provider keys for live integrations:
  - `SPACE_TRACK_IDENTITY` / `SPACE_TRACK_USERNAME`
  - `SPACE_TRACK_PASSWORD`
  - `N2YO_API_KEY`

Database default used by backend DB helpers:
- `postgresql+psycopg://postgres:postgres@localhost:5432/astronomy_hub`

Notes:
- Route handlers used in normal frontend sky-engine flow are available without requiring Docker.
- If local PostgreSQL/Redis is not running, features that depend on them may degrade depending on route/service path.

### Local Asset/Artifact Paths

- profile artifact output:
  - `/home/rocco/Astronomy-Hub/.cursor-artifacts/parity-compare/module2-live-runtime-profile-2026-04-26.json`

### Expected Ports

- Frontend dev/preview: `4173`
- Backend API: `8000`

## Testing In WSL

Frontend:

```bash
cd /home/rocco/Astronomy-Hub/frontend
npm run typecheck
npm run test -- tests/sky-engine-runtime-frame-projection.test.js tests/sky-engine-stars-runtime.test.js tests/test_scene_query_state.test.js tests/test_painter_backend_port.test.js
npm run build
```

Backend (actual command in this repo):

```bash
cd /home/rocco/Astronomy-Hub
.venv/bin/python -m pytest backend/tests -q
```

Current repo note:
- This command is WSL-runnable, but currently fails on existing backend test issues unrelated to Docker (contract/object-resolution failures).

## Profiling In WSL

Profile requires a frontend server listening on:
- http://127.0.0.1:4173

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

Optional override:

```bash
SKY_ENGINE_PROFILE_URL=http://127.0.0.1:4173/sky-engine?debugTelemetry=1 npm run profile:sky-engine-runtime
```

## Docker Removal From Dev Loop

Daily development policy:
- Do not use Docker for normal frontend/backend development.
- Do not use Docker for normal testing.
- Do not use Docker for normal sky-engine profiling.

Use WSL-native commands above instead.

## Script Shortcuts

Root `package.json` now includes WSL-native helpers:
- `npm run dev:frontend`
- `npm run dev:backend`
- `npm run dev:wsl` (start full stack)
- `npm run dev:wsl:status`
- `npm run dev:wsl:logs`
- `npm run dev:wsl:restart`
- `npm run dev:wsl:down`
- `npm run dev:stellarium`
- `npm run dev:stellarium:status`
- `npm run dev:stellarium:logs`
- `npm run dev:stellarium:restart`
- `npm run dev:stellarium:down`
- `npm run dev:parity` (start sky-engine stack + Stellarium reference)
- `npm run validate:sky-fast`
- `npm run profile:sky-local`

These are convenience wrappers; they do not change runtime behavior.

One-command daily startup from repo root:

```bash
npm run dev:wsl
```

Then use:

```bash
npm run dev:wsl:status
npm run dev:wsl:logs
npm run dev:wsl:restart
npm run dev:wsl:down
npm run dev:stellarium
npm run dev:stellarium:status
npm run dev:stellarium:restart
npm run dev:stellarium:down
```

Parity comparison URLs:
- Sky Engine: `http://127.0.0.1:4173/sky-engine`
- Stellarium reference: `http://127.0.0.1:8080`

## Docker Status

Docker files are retained for production/deployment/reference checks only; they are not used for normal development.

## When To Use Docker

Use Docker only for:
- production/deployment parity checks,
- Stellarium reference stack checks,
- explicit integration verification outside daily WSL dev loop.

## Troubleshooting

Profile fails with connection refused:
- ensure preview/dev server is running on port 4173.

Backend fails from `/home/rocco/Astronomy-Hub/backend` with `ModuleNotFoundError: backend`:
- run from repo root with `backend.app.main:app` (documented above).

Port 8000 already in use:
- stop existing process or run a different port and update frontend proxy target:

```bash
VITE_DEV_PROXY_TARGET=http://127.0.0.1:8001 npm run dev -- --host 0.0.0.0
```

## Validation Checklist

- [ ] Frontend dev server runs in WSL (`npm run dev -- --host 0.0.0.0`)
- [ ] Frontend tests/typecheck/build run in WSL
- [ ] Backend starts in WSL via `uvicorn backend.app.main:app`
- [ ] Backend tests run in WSL via `pytest backend/tests -q`
- [ ] Profile runs against `http://127.0.0.1:4173`
- [ ] Docker is not required for normal development loop
