#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$ROOT_DIR/.run/dev-wsl"
LOG_DIR="$RUN_DIR/logs"
BACKEND_PID_FILE="$RUN_DIR/backend.pid"
FRONTEND_PID_FILE="$RUN_DIR/frontend.pid"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
BACKEND_PORT="8000"
FRONTEND_PORT="4173"

BACKEND_CMD=("$ROOT_DIR/.venv/bin/python" -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000)
FRONTEND_CMD=(npm run dev -- --host 0.0.0.0)

mkdir -p "$LOG_DIR"

is_running() {
  local pid="$1"
  [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1
}

port_in_use() {
  local port="$1"
  ss -ltn "sport = :$port" 2>/dev/null | tail -n +2 | grep -q LISTEN
}

read_pid() {
  local file="$1"
  if [[ -f "$file" ]]; then
    cat "$file"
  fi
}

start_backend() {
  if [[ ! -x "$ROOT_DIR/.venv/bin/python" ]]; then
    echo "Missing Python venv executable at $ROOT_DIR/.venv/bin/python" >&2
    echo "Create it first: python3 -m venv .venv && source .venv/bin/activate && pip install -r backend/requirements.txt" >&2
    exit 1
  fi

  local pid
  pid="$(read_pid "$BACKEND_PID_FILE")"
  if is_running "$pid"; then
    echo "Backend already running with PID $pid"
    return
  fi

  if port_in_use "$BACKEND_PORT"; then
    echo "Backend port $BACKEND_PORT already in use; assuming backend is already running"
    rm -f "$BACKEND_PID_FILE"
    return
  fi

  : > "$BACKEND_LOG"
  (
    cd "$ROOT_DIR"
    nohup "${BACKEND_CMD[@]}" >>"$BACKEND_LOG" 2>&1 &
    echo $! > "$BACKEND_PID_FILE"
  )

  echo "Backend started. Log: $BACKEND_LOG"
}

start_frontend() {
  if [[ ! -d "$ROOT_DIR/frontend/node_modules" ]]; then
    echo "Missing frontend dependencies. Run: cd $ROOT_DIR/frontend && npm install" >&2
    exit 1
  fi

  local pid
  pid="$(read_pid "$FRONTEND_PID_FILE")"
  if is_running "$pid"; then
    echo "Frontend already running with PID $pid"
    return
  fi

  if port_in_use "$FRONTEND_PORT"; then
    echo "Frontend port $FRONTEND_PORT already in use; assuming frontend is already running"
    rm -f "$FRONTEND_PID_FILE"
    return
  fi

  : > "$FRONTEND_LOG"
  (
    cd "$ROOT_DIR/frontend"
    nohup "${FRONTEND_CMD[@]}" >>"$FRONTEND_LOG" 2>&1 &
    echo $! > "$FRONTEND_PID_FILE"
  )

  echo "Frontend started. Log: $FRONTEND_LOG"
}

stop_process() {
  local name="$1"
  local file="$2"
  local pid
  pid="$(read_pid "$file")"

  if [[ -z "$pid" ]]; then
    echo "$name not running"
    return
  fi

  if is_running "$pid"; then
    kill "$pid" >/dev/null 2>&1 || true
    for _ in $(seq 1 20); do
      if ! is_running "$pid"; then
        break
      fi
      sleep 0.2
    done
    if is_running "$pid"; then
      kill -9 "$pid" >/dev/null 2>&1 || true
    fi
    echo "$name stopped"
  else
    echo "$name not running"
  fi

  rm -f "$file"
}

kill_pattern() {
  local name="$1"
  local pattern="$2"
  local pids

  pids="$(pgrep -f "$pattern" || true)"
  if [[ -z "$pids" ]]; then
    return
  fi

  echo "$name: stopping external process(es): $pids"
  while IFS= read -r pid; do
    [[ -z "$pid" ]] && continue
    kill "$pid" >/dev/null 2>&1 || true
  done <<< "$pids"

  for _ in $(seq 1 20); do
    if ! pgrep -f "$pattern" >/dev/null 2>&1; then
      break
    fi
    sleep 0.2
  done

  pids="$(pgrep -f "$pattern" || true)"
  if [[ -n "$pids" ]]; then
    while IFS= read -r pid; do
      [[ -z "$pid" ]] && continue
      kill -9 "$pid" >/dev/null 2>&1 || true
    done <<< "$pids"
  fi
}

hard_stop_external_dev_processes() {
  # Stop common externally-started processes so restart does not stay stale.
  kill_pattern "Frontend" "vite --port $FRONTEND_PORT"
  kill_pattern "Backend" "uvicorn backend.app.main:app.*--port $BACKEND_PORT"
}

status() {
  local backend_pid frontend_pid
  local wsl_ip
  backend_pid="$(read_pid "$BACKEND_PID_FILE")"
  frontend_pid="$(read_pid "$FRONTEND_PID_FILE")"
  wsl_ip="$(hostname -I 2>/dev/null | awk '{print $1}')"

  if is_running "$backend_pid"; then
    echo "Backend: running (PID $backend_pid)"
  elif port_in_use "$BACKEND_PORT"; then
    echo "Backend: running (external process on port $BACKEND_PORT)"
  else
    echo "Backend: stopped"
  fi

  if is_running "$frontend_pid"; then
    echo "Frontend: running (PID $frontend_pid)"
  elif port_in_use "$FRONTEND_PORT"; then
    echo "Frontend: running (external process on port $FRONTEND_PORT)"
  else
    echo "Frontend: stopped"
  fi

  echo "Backend URL: http://127.0.0.1:8000"
  echo "Frontend URL: http://127.0.0.1:4173/sky-engine"
  if [[ -n "$wsl_ip" ]]; then
    echo "Backend URL (WSL IP): http://$wsl_ip:8000"
    echo "Frontend URL (WSL IP): http://$wsl_ip:4173/sky-engine"
  fi
}

logs() {
  touch "$BACKEND_LOG" "$FRONTEND_LOG"
  echo "--- backend log: $BACKEND_LOG ---"
  tail -n 40 "$BACKEND_LOG"
  echo "--- frontend log: $FRONTEND_LOG ---"
  tail -n 40 "$FRONTEND_LOG"
}

usage() {
  echo "Usage: $0 {up|down|status|logs|restart}"
}

cmd="${1:-up}"
case "$cmd" in
  up)
    start_backend
    start_frontend
    echo ""
    status
    ;;
  down)
    stop_process "Frontend" "$FRONTEND_PID_FILE"
    stop_process "Backend" "$BACKEND_PID_FILE"
    ;;
  status)
    status
    ;;
  logs)
    logs
    ;;
  restart)
    hard_stop_external_dev_processes
    "$0" down
    "$0" up
    ;;
  *)
    usage
    exit 1
    ;;
esac
