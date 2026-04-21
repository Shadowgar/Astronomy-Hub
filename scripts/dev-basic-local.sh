#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  if [[ -n "${FRONTEND_PID}" ]] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
    kill "${FRONTEND_PID}" 2>/dev/null || true
  fi
  if [[ -n "${BACKEND_PID}" ]] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

if [[ ! -x "${ROOT_DIR}/.venv/bin/python" ]]; then
  echo "Creating Python virtualenv and installing backend requirements..."
  python3 -m venv "${ROOT_DIR}/.venv"
  "${ROOT_DIR}/.venv/bin/pip" install -r "${ROOT_DIR}/backend/requirements.txt"
fi

echo "Starting backend API on http://127.0.0.1:8000 ..."
"${ROOT_DIR}/.venv/bin/python" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

echo "Starting frontend on http://127.0.0.1:4173 ..."
(
  cd "${ROOT_DIR}/frontend"
  npm run dev
) &
FRONTEND_PID=$!

wait "${BACKEND_PID}" "${FRONTEND_PID}"
