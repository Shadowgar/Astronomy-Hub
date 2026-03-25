# Environment setup

This document describes the minimal local environment setup for development.

1. Create your local env file

- Copy the example: `cp .env.example .env`
- Edit `.env` to adjust any values (e.g., `PORT` or `BACKEND_URL`).

2. Running the backend

- Simple (one-off):

  PORT=8000 LOG_LEVEL=INFO python3 backend/server.py

- If you use the repository virtualenv, run with its Python:

  .venv/bin/python backend/server.py

3. Running the frontend

- Development (Vite dev server with API proxy):

  cd frontend && npm install && npm run dev

- Preview (production-built static server):

  cd frontend && npm run build && npm run preview

4. Notes

- Do not commit `.env`; `.gitignore` excludes it. Keep secrets out of the repo.
- The frontend dev server proxies `/api` to `http://127.0.0.1:8000` by default; keep `BACKEND_URL` and `PORT` coordinated when using a different host/port.
- Tests may set or respect `SIMULATE_NORMALIZER_FAIL`; set to `true` only when intentionally exercising degraded mode.
