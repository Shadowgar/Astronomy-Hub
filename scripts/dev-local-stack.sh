#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
started=$SECONDS
# Stable location only: inherited qualification settings must not select /var/tmp.
export ORAS_EARTH_ARTIFACT_DIR="$ROOT_DIR/data/runtime-artifacts/earth"
export COMPOSE_BAKE=false
compose=(docker compose --project-name astronomy-hub -f docker-compose.yml -f docker-compose.dev.yml)
case "${1:-up}" in
  status) "${compose[@]}" ps; exit ;;
  logs) "${compose[@]}" logs --tail 60 frontend backend earth-runtime; exit ;;
  up|--build) ;;
  *) echo "Usage: $0 [up|--build|status|logs]" >&2; exit 2 ;;
esac
python3 scripts/runtime/earth_artifact.py install
python3 scripts/runtime/earth_artifact.py verify
# Preserve existing anonymous DB/data volumes and their container identity.
# No down, renewal, or forced recreation of either datastore.
"${compose[@]}" up -d --no-recreate postgres redis
args=(up -d --no-deps)
if [[ "${1:-}" == --build ]]; then args+=(--build); fi
"${compose[@]}" "${args[@]}" backend earth-runtime frontend
ready=false
for _ in {1..60}; do
  if curl --silent --fail --max-time 2 http://127.0.0.1:4173/ >/dev/null &&
     curl --silent --fail --max-time 2 http://127.0.0.1:4173/api/v1/health >/dev/null &&
     curl --silent --fail --max-time 2 http://127.0.0.1:4173/earth-runtime/health | grep -q 'ORAS Earth runtime ready' &&
     "${compose[@]}" exec -T postgres pg_isready -U postgres -d astronomy_hub >/dev/null &&
     "${compose[@]}" exec -T redis redis-cli ping | grep -q PONG; then
    ready=true; break
  fi
  sleep 1
done
if [[ "$ready" != true ]]; then
  echo "Local stack did not become ready; inspect npm run dev:local:logs" >&2
  "${compose[@]}" ps
  exit 1
fi
"${compose[@]}" ps
python3 - <<'PY'
import json
from pathlib import Path
from urllib.request import urlopen
lock = json.loads(Path('integrations/renderers.lock.json').read_text())['earth']
with urlopen('http://127.0.0.1:4173/earth-runtime/release.json', timeout=5) as response:
    release = json.load(response)
with urlopen('http://127.0.0.1:4173/runtime-versions.json', timeout=5) as response:
    served = json.load(response)['earth']
if release['artifact_sha256'] != lock['artifact_sha256'] or served != lock:
    raise SystemExit('Local served artifact/metadata differs from qualified lock')
print('SERVED VERIFIED', release['artifact_sha256'])
PY
echo "Local Hub ready: http://localhost:4173 (startup $((SECONDS-started))s)."
