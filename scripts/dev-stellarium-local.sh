#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/study/stellarium-web-engine/source/stellarium-web-engine-master/apps/web-frontend"
RUN_DIR="$ROOT_DIR/.run/dev-stellarium"
LOG_DIR="$RUN_DIR/logs"
PID_FILE="$RUN_DIR/stellarium.pid"
LOG_FILE="$LOG_DIR/stellarium.log"
PORT="8080"

mkdir -p "$LOG_DIR"

is_running() {
  local pid="$1"
  [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1
}

port_in_use() {
  ss -ltn "sport = :$PORT" 2>/dev/null | tail -n +2 | grep -q LISTEN
}

read_pid() {
  if [[ -f "$PID_FILE" ]]; then
    cat "$PID_FILE"
  fi
}

kill_pattern() {
  local pattern="$1"
  local pids

  pids="$(pgrep -f "$pattern" || true)"
  if [[ -z "$pids" ]]; then
    return
  fi

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

start() {
  if [[ ! -f "$APP_DIR/package.json" ]]; then
    echo "Stellarium app not found at $APP_DIR" >&2
    exit 1
  fi

  if [[ ! -d "$APP_DIR/node_modules" ]]; then
    echo "Missing Stellarium dependencies. Run: cd $APP_DIR && npm install" >&2
    exit 1
  fi

  if [[ ! -f "$APP_DIR/src/assets/js/stellarium-web-engine.js" || ! -f "$APP_DIR/src/assets/js/stellarium-web-engine.wasm" ]]; then
    echo "Missing Stellarium engine assets in $APP_DIR/src/assets/js" >&2
    echo "Run: bash scripts/prepare-stellarium-reference.sh" >&2
    exit 1
  fi

  local pid
  pid="$(read_pid)"
  if is_running "$pid"; then
    echo "Stellarium already running with PID $pid"
    return
  fi

  if port_in_use; then
    echo "Port $PORT already in use; assuming Stellarium is already running"
    rm -f "$PID_FILE"
    return
  fi

  : > "$LOG_FILE"
  (
    cd "$APP_DIR"
    nohup npm run dev -- --host 0.0.0.0 --port "$PORT" >>"$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
  )

  echo "Stellarium started. Log: $LOG_FILE"
}

stop() {
  local pid
  pid="$(read_pid)"

  if [[ -z "$pid" ]]; then
    echo "Stellarium not running"
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
    echo "Stellarium stopped"
  else
    echo "Stellarium not running"
  fi

  rm -f "$PID_FILE"
}

hard_stop_external() {
  kill_pattern "vue-cli-service serve.*--port $PORT"
  kill_pattern "npm run dev -- --host 0.0.0.0 --port $PORT"
}

status() {
  local pid wsl_ip
  pid="$(read_pid)"
  wsl_ip="$(hostname -I 2>/dev/null | awk '{print $1}')"

  if is_running "$pid"; then
    echo "Stellarium: running (PID $pid)"
  elif port_in_use; then
    echo "Stellarium: running (external process on port $PORT)"
  else
    echo "Stellarium: stopped"
  fi

  echo "Stellarium URL: http://127.0.0.1:$PORT"
  if [[ -n "$wsl_ip" ]]; then
    echo "Stellarium URL (WSL IP): http://$wsl_ip:$PORT"
  fi
}

logs() {
  touch "$LOG_FILE"
  echo "--- stellarium log: $LOG_FILE ---"
  tail -n 60 "$LOG_FILE"
}

usage() {
  echo "Usage: $0 {up|down|status|logs|restart}"
}

cmd="${1:-up}"
case "$cmd" in
  up)
    start
    echo ""
    status
    ;;
  down)
    stop
    ;;
  status)
    status
    ;;
  logs)
    logs
    ;;
  restart)
    hard_stop_external
    "$0" down
    "$0" up
    ;;
  *)
    usage
    exit 1
    ;;
esac
