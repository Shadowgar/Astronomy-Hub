#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

REMOTE_HOST="${REMOTE_HOST:-100.88.0.20}"
REMOTE_USER="${REMOTE_USER:-}"
REMOTE_PORT="${REMOTE_PORT:-22}"
REMOTE_DIR="${REMOTE_DIR:-/opt/astronomy-hub}"
PUBLIC_HTTP_PORT="${PUBLIC_HTTP_PORT:-4173}"
REMOTE_USE_SUDO="${REMOTE_USE_SUDO:-1}"

if [[ -z "${REMOTE_USER}" ]]; then
  echo "REMOTE_USER is required. Example: REMOTE_USER=ubuntu $0" >&2
  exit 1
fi

REMOTE_TARGET="${REMOTE_USER}@${REMOTE_HOST}"
REMOTE_SETUP_PREFIX=""
REMOTE_DOCKER_PREFIX=""

if [[ "${REMOTE_USE_SUDO}" == "1" ]]; then
  REMOTE_SETUP_PREFIX="sudo"
  REMOTE_DOCKER_PREFIX="sudo"
fi

resolve_postgres_password() {
  if [[ -n "${POSTGRES_PASSWORD:-}" ]]; then
    return
  fi

  local remote_password
  remote_password="$(ssh -p "${REMOTE_PORT}" "${REMOTE_TARGET}" "if [ -f '${REMOTE_DIR}/.env.prod' ]; then awk -F= '/^POSTGRES_PASSWORD=/{print substr(\$0, index(\$0, \"=\") + 1)}' '${REMOTE_DIR}/.env.prod'; fi" 2>/dev/null || true)"

  if [[ -n "${remote_password}" ]]; then
    POSTGRES_PASSWORD="${remote_password}"
    export POSTGRES_PASSWORD
    echo "Using existing POSTGRES_PASSWORD from remote .env.prod"
    return
  fi

  # New installs can safely bootstrap with a generated password.
  POSTGRES_PASSWORD="$(python3 - <<'PY'
import secrets
print(secrets.token_urlsafe(24))
PY
)"
  export POSTGRES_PASSWORD
  echo "Generated a new POSTGRES_PASSWORD for remote deployment"
}

RSYNC_EXCLUDES=(
  --exclude ".git/"
  --exclude ".agents/"
  --exclude ".cursor*/"
  --exclude ".github/"
  --exclude ".playwright*/"
  --exclude ".pytest_cache/"
  --exclude ".venv/"
  --exclude ".vscode/"
  --exclude "node_modules/"
  --exclude "frontend/node_modules/"
  --exclude "vendor/**/node_modules/"
  --exclude "frontend/dist/"
  --exclude "backend/__pycache__/"
  --exclude "**/__pycache__/"
  --exclude "test-results/"
  --exclude "output/"
  --exclude ".run/"
)

echo "Ensuring remote directory exists at ${REMOTE_TARGET}:${REMOTE_DIR} ..."
if [[ "${REMOTE_USE_SUDO}" == "1" ]]; then
  ssh -tt -p "${REMOTE_PORT}" "${REMOTE_TARGET}" "${REMOTE_SETUP_PREFIX} mkdir -p '${REMOTE_DIR}' && ${REMOTE_SETUP_PREFIX} chown -R '${REMOTE_USER}:${REMOTE_USER}' '${REMOTE_DIR}'"
else
  ssh -p "${REMOTE_PORT}" "${REMOTE_TARGET}" "mkdir -p '${REMOTE_DIR}'"
fi

resolve_postgres_password

echo "Syncing repository to remote host ..."
rsync -az --delete \
  "${RSYNC_EXCLUDES[@]}" \
  -e "ssh -p ${REMOTE_PORT}" \
  "${ROOT_DIR}/" "${REMOTE_TARGET}:${REMOTE_DIR}/"

echo "Starting production stack on remote host ..."
ssh -tt -p "${REMOTE_PORT}" "${REMOTE_TARGET}" "cd '${REMOTE_DIR}' && cat > .env.prod <<'EOF'
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
PUBLIC_HTTP_PORT=${PUBLIC_HTTP_PORT}
EOF
${REMOTE_DOCKER_PREFIX} docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build"

echo "Deployment complete."
echo "Public URL: http://${REMOTE_HOST}:${PUBLIC_HTTP_PORT}/sky-over-oras-now"
