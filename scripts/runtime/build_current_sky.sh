#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
work_root="${ORAS_SKY_BUILD_DIR:-/var/tmp/oras-phase-c/sky-reconstruction}"
anchor=023e3b26babf7ffddf45f39293230b14cfe96993
expected_builder="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["sky"]["reconstruction"]["build_image_id"])' "$repo_root/integrations/renderers.lock.json")"
[[ "$(docker image inspect astronomy-hub-stellarium-jsbuild --format '{{.Id}}')" == "$expected_builder" ]] || { echo 'Sky builder identity differs from qualified lock' >&2; exit 1; }
if [[ -e "$work_root" ]]; then echo 'Choose a fresh ORAS_SKY_BUILD_DIR' >&2; exit 1; fi
mkdir -p "$work_root"
git clone --no-checkout https://github.com/Stellarium/stellarium-web-engine.git "$work_root/upstream"
git -C "$work_root/upstream" checkout --detach "$anchor"
python3 "$repo_root/scripts/runtime/apply_sky_overlay.py" "$work_root/upstream"
docker run --rm -v "$work_root/upstream:/app" astronomy-hub-stellarium-jsbuild /bin/bash -lc 'source /emsdk/emsdk_env.sh && make js-es6'
app="$work_root/upstream/apps/web-frontend"
python3 "$repo_root/scripts/runtime/integrate_sky_bridge.py" "$app"
mkdir -p "$app/src/assets/js"
cp "$work_root/upstream/build/stellarium-web-engine.js" "$work_root/upstream/build/stellarium-web-engine.wasm" "$app/src/assets/js/"
docker run --rm -v "$app:/work" -w /work -e ORAS_RUNTIME_PUBLIC_PATH=/oras-sky-engine/ -e ORAS_RUNTIME_COPY_SKYDATA=0 -e NODE_OPTIONS='--openssl-legacy-provider --max-old-space-size=4096' node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0 bash -lc 'npm ci --no-audit --loglevel=error && npm run build'
echo "RECONSTRUCTION READY FOR QUALIFICATION ONLY: $app/dist"
