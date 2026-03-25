# Environment setup

This document describes the minimal local environment setup for development.

1. Create your local env file

- Copy the example: `cp .env.example .env`
- Edit `.env` to adjust any values (for local development update `BACKEND_PORT`, `FRONTEND_PORT`, `API_URL`, or `NODE_ENV`).

2. Minimal canonical variables

- `BACKEND_PORT` — port backend will bind to (e.g., `8000`)
- `FRONTEND_PORT` — port used for frontend preview/static server (e.g., `4173`)
- `API_URL` — base URL the frontend uses to reach the backend (e.g., `http://127.0.0.1:8000`)
- `NODE_ENV` — Node environment, typically `development` or `production`

3. Running the backend

- One-off using the environment (example):

  BACKEND_PORT=8000 NODE_ENV=development python3 backend/server.py

- If you use the repository virtualenv, run with its Python:

  .venv/bin/python backend/server.py

4. Running the frontend

- Development (Vite dev server with API proxy):

  cd frontend && npm install && npm run dev

- Preview (production-built static server):

  cd frontend && npm run build && npm run preview

5. Notes

- Do not commit `.env`; `.gitignore` excludes it. Keep secrets out of the repo.
- The frontend dev server proxies `/api` to `http://127.0.0.1:8000` by default; keep `API_URL` and `BACKEND_PORT` coordinated when using a different host/port.
- Tests may set or respect `SIMULATE_NORMALIZER_FAIL`; set to a non-empty value only when intentionally exercising degraded mode.
