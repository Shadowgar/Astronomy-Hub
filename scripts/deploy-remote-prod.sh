#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

REMOTE_HOST="${REMOTE_HOST:-100.88.0.20}"
REMOTE_USER="${REMOTE_USER:-}"
REMOTE_PORT="${REMOTE_PORT:-22}"
REMOTE_DIR="${REMOTE_DIR:-/home/rocco/astronomy-hub}"
PUBLIC_HTTP_PORT="${PUBLIC_HTTP_PORT:-4173}"
REMOTE_USE_SUDO="${REMOTE_USE_SUDO:-0}"
MIRROR_AUTOSTART="${MIRROR_AUTOSTART:-0}"
MIRROR_PROFILE="${MIRROR_PROFILE:-live_stream}"
CLOUDFLARE_TUNNEL_TOKEN="${CLOUDFLARE_TUNNEL_TOKEN:-}"
START_PAGE_ONLY="${START_PAGE_ONLY:-0}"
SKIP_PAGE_START="${SKIP_PAGE_START:-0}"
REQUIRE_TEMP_PAGE="${REQUIRE_TEMP_PAGE:-0}"
FORCE_TEMP_PAGE_PORT="${FORCE_TEMP_PAGE_PORT:-1}"

if [[ -z "${REMOTE_USER}" ]]; then
  echo "REMOTE_USER is required. Example: REMOTE_USER=ubuntu $0" >&2
  exit 1
fi

REMOTE_TARGET="${REMOTE_USER}@${REMOTE_HOST}"
REMOTE_SETUP_PREFIX=""
REMOTE_DOCKER_PREFIX=""
DEPLOY_TEMP_PAGE_STARTED=0

cleanup() {
  stop_temp_progress_page || true
}

trap cleanup EXIT INT TERM

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

wait_for_mirror_page() {
  local try
  for try in $(seq 1 60); do
    if curl -fsS --max-time 4 "http://${REMOTE_HOST}:${PUBLIC_HTTP_PORT}/sky-engine/mirror-progress" >/dev/null 2>&1; then
      echo "Mirror progress page is reachable"
      return 0
    fi
    sleep 2
  done

  echo "Mirror progress page did not become reachable in time." >&2
  return 1
}

is_private_host() {
  local host="$1"
  [[ "$host" =~ ^10\. ]] && return 0
  [[ "$host" =~ ^192\.168\. ]] && return 0
  [[ "$host" =~ ^172\.(1[6-9]|2[0-9]|3[0-1])\. ]] && return 0
  [[ "$host" =~ ^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\. ]] && return 0
  return 1
}

compute_sync_totals() {
  local dryrun stats total_bytes total_files
  dryrun="$(rsync -az --delete --dry-run --stats \
    "${RSYNC_EXCLUDES[@]}" \
    -e "ssh -p ${REMOTE_PORT}" \
    "${ROOT_DIR}/" "${REMOTE_TARGET}:${REMOTE_DIR}/" 2>/dev/null || true)"

  stats="$(printf '%s\n' "${dryrun}" | tr -d ',')"
  total_bytes="$(printf '%s\n' "${stats}" | awk -F: '/Total file size:/ {gsub(/^[ \t]+/,"",$2); print $2; exit}')"
  total_files="$(printf '%s\n' "${stats}" | awk -F: '/Number of files:/ {gsub(/^[ \t]+/,"",$2); print $2; exit}')"

  if [[ -z "${total_bytes}" ]]; then
    total_bytes=0
  fi
  if [[ -z "${total_files}" ]]; then
    total_files=0
  fi

  echo "${total_bytes}:${total_files}"
}

push_deploy_meta() {
  local totals total_bytes total_files
  totals="$(compute_sync_totals)"
  total_bytes="${totals%%:*}"
  total_files="${totals##*:}"

  ssh -p "${REMOTE_PORT}" "${REMOTE_TARGET}" "cat > '${REMOTE_DIR}/.deploy-status/meta.json' <<'EOF'
{
  \"phase\": \"uploading\",
  \"target_bytes\": ${total_bytes},
  \"target_files\": ${total_files},
  \"public_port\": ${PUBLIC_HTTP_PORT}
}
EOF"
}

mark_deploy_phase() {
  local phase="$1"
  ssh -p "${REMOTE_PORT}" "${REMOTE_TARGET}" "python3 - <<'PY'
import json
from pathlib import Path

meta_path = Path('${REMOTE_DIR}/.deploy-status/meta.json')
meta = {}
if meta_path.exists():
    try:
        meta = json.loads(meta_path.read_text(encoding='utf-8'))
    except Exception:
        meta = {}
meta['phase'] = '${phase}'
meta_path.write_text(json.dumps(meta, indent=2), encoding='utf-8')
PY"
}

start_temp_progress_page() {
  local output
  output="$(ssh -p "${REMOTE_PORT}" "${REMOTE_TARGET}" "set -e
mkdir -p '${REMOTE_DIR}/.deploy-status'
# If a previous interrupted deploy left the temporary server alive, stop it now.
if [ -f '${REMOTE_DIR}/.deploy-status/server.pid' ]; then
  kill \"\$(cat '${REMOTE_DIR}/.deploy-status/server.pid')\" >/dev/null 2>&1 || true
  rm -f '${REMOTE_DIR}/.deploy-status/server.pid'
fi
if ss -ltn 'sport = :${PUBLIC_HTTP_PORT}' | tail -n +2 | grep -q LISTEN; then
  if [ '${FORCE_TEMP_PAGE_PORT}' = '1' ]; then
    pids=\"\$(ss -ltnp 'sport = :${PUBLIC_HTTP_PORT}' | sed -n 's/.*pid=\([0-9][0-9]*\).*/\1/p' | sort -u)\"
    if [ -n \"\${pids:-}\" ]; then
      for pid in \${pids}; do
        kill \"\${pid}\" >/dev/null 2>&1 || true
      done
      sleep 1
    fi
  fi
  if ss -ltn 'sport = :${PUBLIC_HTTP_PORT}' | tail -n +2 | grep -q LISTEN; then
    echo '__DEPLOY_PAGE_SKIPPED__'
    exit 0
  fi
fi
cat > '${REMOTE_DIR}/.deploy-status/server.py' <<'PY'
#!/usr/bin/env python3
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import shutil
import time

ROOT = Path('${REMOTE_DIR}')
STATUS_DIR = ROOT / '.deploy-status'
META_PATH = STATUS_DIR / 'meta.json'

def dir_size_bytes(root: Path) -> int:
    total = 0
    for current_root, dirs, files in os.walk(root):
        if '/.deploy-status' in current_root:
            continue
        for name in files:
            try:
                total += (Path(current_root) / name).stat().st_size
            except OSError:
                pass
    return total

def read_meta() -> dict:
    if not META_PATH.exists():
        return {'phase': 'starting', 'target_bytes': 0, 'target_files': 0}
    try:
        return json.loads(META_PATH.read_text(encoding='utf-8'))
    except Exception:
        return {'phase': 'starting', 'target_bytes': 0, 'target_files': 0}

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/status'):
            meta = read_meta()
            target = int(meta.get('target_bytes') or 0)
            current = dir_size_bytes(ROOT)
            usage = shutil.disk_usage(ROOT)
            pct = 0.0 if target <= 0 else min(100.0, (current / target) * 100.0)
            payload = {
                'phase': meta.get('phase', 'uploading'),
                'target_bytes': target,
                'current_bytes': current,
                'percent': pct,
                'target_files': int(meta.get('target_files') or 0),
                'disk_total_bytes': usage.total,
                'disk_used_bytes': usage.used,
                'disk_free_bytes': usage.free,
                'timestamp': int(time.time()),
            }
            data = json.dumps(payload).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return

        html = '''<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Astronomy Hub Deploy Progress</title>
    <style>
      body{font-family:system-ui,sans-serif;background:#0b1422;color:#e5ecff;margin:0;padding:24px}
      .card{max-width:860px;margin:28px auto;background:#122039;border:1px solid #27415f;border-radius:12px;padding:20px}
      .bar{height:10px;background:#1b2f4d;border-radius:5px;overflow:hidden;margin:10px 0}
      .fill{height:100%;width:0;background:#36d399;transition:width .5s}
      .row{display:flex;gap:12px;flex-wrap:wrap}
      .item{background:#0f1c31;border:1px solid #203652;border-radius:8px;padding:10px;min-width:170px}
      code{color:#9fc2ff}
    </style>
  </head>
  <body>
    <div class="card">
      <h1 style="margin-top:0">Astronomy Hub deployment in progress</h1>
      <p>Upload progress and remote disk space are updated every 2 seconds.</p>
      <div class="bar"><div id="fill" class="fill"></div></div>
      <div id="pct">0%</div>
      <div class="row">
        <div class="item">Phase: <strong id="phase">starting</strong></div>
        <div class="item">Uploaded: <strong id="uploaded">0 B</strong></div>
        <div class="item">Target: <strong id="target">0 B</strong></div>
        <div class="item">Disk Free: <strong id="free">0 B</strong></div>
      </div>
      <p>Once complete, open <code>/sky-engine/download-progress</code> or <code>/sky-engine/mirror-progress</code>.</p>
    </div>
    <script>
      function fmt(bytes){ if(!bytes||bytes<=0) return '0 B'; const u=['B','KB','MB','GB','TB']; let v=bytes,i=0; while(v>=1024&&i<u.length-1){v/=1024;i++;} return v.toFixed(i===0?0:1)+' '+u[i]; }
      async function tick(){
        try{
          const r=await fetch('/status',{cache:'no-store'}); const d=await r.json();
          const pct=Math.max(0,Math.min(100,d.percent||0));
          document.getElementById('fill').style.width=pct.toFixed(2)+'%';
          document.getElementById('pct').textContent=pct.toFixed(2)+'%';
          document.getElementById('phase').textContent=d.phase||'uploading';
          document.getElementById('uploaded').textContent=fmt(d.current_bytes||0);
          document.getElementById('target').textContent=fmt(d.target_bytes||0);
          document.getElementById('free').textContent=fmt(d.disk_free_bytes||0);
        }catch(_e){}
      }
      tick(); setInterval(tick,2000);
    </script>
  </body>
</html>'''
        data = html.encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

if __name__ == '__main__':
    ThreadingHTTPServer(('0.0.0.0', ${PUBLIC_HTTP_PORT}), Handler).serve_forever()
PY
chmod +x '${REMOTE_DIR}/.deploy-status/server.py'
nohup python3 '${REMOTE_DIR}/.deploy-status/server.py' >/tmp/astronomy-hub-deploy-page.log 2>&1 < /dev/null &
echo \$! > '${REMOTE_DIR}/.deploy-status/server.pid'
echo '__DEPLOY_PAGE_STARTED__'")"

  if echo "${output}" | grep -q '__DEPLOY_PAGE_STARTED__'; then
    DEPLOY_TEMP_PAGE_STARTED=1
    echo "Temporary deploy page started on remote port ${PUBLIC_HTTP_PORT}"
  elif [[ "${REQUIRE_TEMP_PAGE}" == "1" ]]; then
    echo "Failed to start temporary deploy page because port ${PUBLIC_HTTP_PORT} already has a listener." >&2
    return 1
  else
    echo "Remote port ${PUBLIC_HTTP_PORT} already had a listener; deploy page skipped"
  fi
}

stop_temp_progress_page() {
  if [[ "${DEPLOY_TEMP_PAGE_STARTED}" != "1" ]]; then
    return
  fi

  ssh -p "${REMOTE_PORT}" "${REMOTE_TARGET}" "if [ -f '${REMOTE_DIR}/.deploy-status/server.pid' ]; then kill \"\$(cat '${REMOTE_DIR}/.deploy-status/server.pid')\" >/dev/null 2>&1 || true; rm -f '${REMOTE_DIR}/.deploy-status/server.pid'; fi"
  echo "Temporary deploy page stopped"
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

if [[ "${SKIP_PAGE_START}" != "1" ]]; then
  echo "Starting temporary deploy page on remote host ..."
  start_temp_progress_page
fi

echo "Preparing live deploy metadata for progress page ..."
push_deploy_meta

if [[ "${START_PAGE_ONLY}" == "1" ]]; then
  echo "Temporary deploy page is ready. Exiting before upload by request (START_PAGE_ONLY=1)."
  trap - EXIT INT TERM
  exit 0
fi

echo "Syncing repository to remote host ..."
rsync -az --delete --partial --append-verify --info=progress2 --human-readable \
  "${RSYNC_EXCLUDES[@]}" \
  -e "ssh -p ${REMOTE_PORT}" \
  "${ROOT_DIR}/" "${REMOTE_TARGET}:${REMOTE_DIR}/"

echo "Starting production stack on remote host ..."
mark_deploy_phase "starting_stack"
stop_temp_progress_page
ssh -tt -p "${REMOTE_PORT}" "${REMOTE_TARGET}" "cd '${REMOTE_DIR}' && cat > .env.prod <<'EOF'
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
PUBLIC_HTTP_PORT=${PUBLIC_HTTP_PORT}
CLOUDFLARE_TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
EOF
if [ -n '${CLOUDFLARE_TUNNEL_TOKEN}' ]; then
  ${REMOTE_DOCKER_PREFIX} docker compose --env-file .env.prod -f docker-compose.prod.yml -f docker-compose.tunnel.yml up -d --build
else
  ${REMOTE_DOCKER_PREFIX} docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
fi"

echo "Waiting for mirror progress web page to become available ..."
wait_for_mirror_page

if [[ "${MIRROR_AUTOSTART}" == "1" ]]; then
  echo "Triggering mirror autostart profile '${MIRROR_PROFILE}' ..."
  curl -fsS -X POST "http://${REMOTE_HOST}:${PUBLIC_HTTP_PORT}/api/sky/mirror/start-all" \
    -H "Content-Type: application/json" \
    -d "{\"autostart\":true,\"profile\":\"${MIRROR_PROFILE}\"}" >/dev/null
fi

trap - EXIT INT TERM

echo "Deployment complete."
echo "Public URL: http://${REMOTE_HOST}:${PUBLIC_HTTP_PORT}/sky-over-oras-now"
echo "Mirror progress URL: http://${REMOTE_HOST}:${PUBLIC_HTTP_PORT}/sky-engine/mirror-progress"
echo "Resume tomorrow at any time from the mirror page (Resume/Resume All), or run:"
echo "  curl -X POST http://${REMOTE_HOST}:${PUBLIC_HTTP_PORT}/api/sky/mirror/resume -H 'Content-Type: application/json' -d '{\"class\":\"dss_survey\"}'"

if is_private_host "${REMOTE_HOST}"; then
  echo ""
  echo "Note: ${REMOTE_HOST} is a private-network address, so the URLs above are not internet-public by default."
  if [[ -n "${CLOUDFLARE_TUNNEL_TOKEN}" ]]; then
    echo "Cloudflare Tunnel is enabled in this deployment. Use your configured Cloudflare hostname for public access."
  else
    echo "To make this internet-accessible without router changes, redeploy with CLOUDFLARE_TUNNEL_TOKEN set."
    echo "Example:"
    echo "  CLOUDFLARE_TUNNEL_TOKEN='<token>' REMOTE_USER=${REMOTE_USER} REMOTE_HOST=${REMOTE_HOST} REMOTE_DIR=${REMOTE_DIR} REMOTE_USE_SUDO=${REMOTE_USE_SUDO} npm run deploy:remote:prod"
  fi
fi
