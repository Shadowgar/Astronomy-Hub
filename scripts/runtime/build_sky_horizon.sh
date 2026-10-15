#!/usr/bin/env bash
# One isolated downstream native patch, pinned offline builds, existing dependencies.
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
source_repo="${ORAS_SKY_SOURCE_REPO:-/var/tmp/oras-phase-c/sky-reconstruction/upstream}"
work_root="${ORAS_SKY_BUILD_DIR:-$repo_root/output/n1/native-horizon-build}"
anchor=023e3b26babf7ffddf45f39293230b14cfe96993
builder="$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["sky"]["reconstruction"]["build_image_id"])' "$repo_root/integrations/renderers.lock.json")"
[[ "$(docker image inspect astronomy-hub-stellarium-jsbuild --format '{{.Id}}')" == "$builder" ]]
[[ "$(git -C "$source_repo" rev-parse HEAD)" == "$anchor" ]]
[[ ! -e "$work_root" ]] || { echo 'Choose a fresh ORAS_SKY_BUILD_DIR' >&2; exit 1; }
mkdir -p "$work_root/upstream"
git -C "$source_repo" archive "$anchor" | tar -x -C "$work_root/upstream"
python3 "$repo_root/scripts/runtime/apply_sky_overlay.py" "$work_root/upstream"
patch --directory "$work_root/upstream" --strip 1 --fuzz=0 --input "$repo_root/integrations/sky-patches/0001-configurable-zero-horizon.patch"
docker run --rm --network none -v "$work_root/upstream:/app" "$builder" /bin/bash -lc 'source /emsdk/emsdk_env.sh && make js-es6'
app="$work_root/upstream/apps/web-frontend"
python3 "$repo_root/scripts/runtime/integrate_sky_bridge.py" "$app"
mkdir -p "$app/src/assets/js"
# Docker build files are read only inputs from this point.
cp "$work_root/upstream/build/stellarium-web-engine.js" "$work_root/upstream/build/stellarium-web-engine.wasm" "$app/src/assets/js/"
docker run --rm --network none --user 1001:1001 -v "$app:/work" -v "$source_repo/apps/web-frontend/node_modules:/work/node_modules:ro" -w /work -e ORAS_RUNTIME_PUBLIC_PATH=/oras-sky-engine/ -e ORAS_RUNTIME_COPY_SKYDATA=0 -e NODE_OPTIONS='--openssl-legacy-provider --max-old-space-size=4096' node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0 npm run build
python3 "$repo_root/scripts/runtime/attest_sky_horizon.py" "$work_root/upstream"
echo "NATIVE HORIZON BUILD READY: $app/dist"
