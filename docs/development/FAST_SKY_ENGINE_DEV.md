# Fast Sky Engine Development Workflow

Primary guidance has moved to [docs/development/WSL_DEV_WORKFLOW.md](docs/development/WSL_DEV_WORKFLOW.md).

This file remains as a short index so local sky-engine development does not drift back into container rebuild loops.

## Daily Dev Rule

- Use WSL-native frontend and backend commands.
- Do not use Docker for normal development, testing, or profiling.
- Keep Docker only for production/deployment/reference checks.

## Fast Start

One-command stack control from repo root:

```bash
npm run dev:wsl
npm run dev:wsl:restart
npm run dev:wsl:down
```

Use `npm run dev:wsl:restart` after frontend code/config changes if the page looks stale.

Frontend:

```bash
cd /home/rocco/Astronomy-Hub/frontend
npm install
npm run dev -- --host 0.0.0.0
```

Backend:

```bash
cd /home/rocco/Astronomy-Hub
.venv/bin/python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

Validation/profile:

```bash
cd /home/rocco/Astronomy-Hub/frontend
npm run typecheck
npm run test -- tests/sky-engine-runtime-frame-projection.test.js tests/sky-engine-stars-runtime.test.js tests/test_scene_query_state.test.js tests/test_painter_backend_port.test.js
npm run build
npm run preview -- --host 0.0.0.0
npm run profile:sky-engine-runtime
```

## Docker Status

Docker files and compose config are retained for production/deployment/reference checks only; they are not part of the WSL daily development loop.
