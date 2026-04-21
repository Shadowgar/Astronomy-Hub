#!/usr/bin/env bash
# Track A: minimal Docker stack so `cd frontend && npm run dev` can proxy /api to a live backend.
# Does not start the frontend container (local Vite on 4173 is the usual dev loop).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker: command not found. Install Docker / enable WSL integration, then retry." >&2
  exit 1
fi

echo "Starting postgres, redis, backend (docker compose)..."
docker compose up -d postgres redis backend

echo "Waiting for http://127.0.0.1:8000/ ..."
for _ in $(seq 1 90); do
  if curl -sf "http://127.0.0.1:8000/" >/dev/null 2>&1; then
    echo "Backend is ready."
    echo "Next: cd frontend && npm run dev   (Vite proxies /api to http://127.0.0.1:8000)"
    exit 0
  fi
  sleep 1
done

echo "Timed out waiting for backend on :8000. Check: docker compose logs backend" >&2
exit 1
