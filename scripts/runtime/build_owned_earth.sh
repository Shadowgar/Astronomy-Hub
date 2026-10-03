#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
source_dir="${GODS_EYE_SOURCE:-/var/tmp/oras-cesium/gods-eye}"
out_dir="${ORAS_EARTH_OUT:-/var/tmp/oras-cesium/earth-candidate}"
pin=e7707d9a0f34d9fbffc300023c319f95caa5be30
if [[ ! -d "$source_dir/.git" ]]; then mkdir -p "$(dirname "$source_dir")"; git clone --no-checkout https://github.com/bilawalsidhu/gods-eye-view "$source_dir"; git -C "$source_dir" checkout --detach "$pin"; fi
[[ "$(git -C "$source_dir" rev-parse HEAD)" == "$pin" ]]
[[ -z "$(git -C "$source_dir" status --porcelain)" ]]
mkdir -p "$out_dir"
docker run --rm -v "$source_dir:/source" -w /source -e PUPPETEER_SKIP_DOWNLOAD=true node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 npm ci --no-audit --loglevel=error
docker run --rm -v "$source_dir:/source:ro" -v "$repo_root:/hub:ro" -v "$out_dir:/output" -e GODS_EYE_SOURCE=/source -e ORAS_EARTH_OUT=/output node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 node /source/node_modules/vite/bin/vite.js build --configLoader native --config /hub/runtimes/earth-runtime/vite.config.mjs
display_config="${ORAS_EARTH_DISPLAY_CONFIG:-$repo_root/runtimes/earth-runtime/display-config.json}"
# Only deliberately attested, publishable browser credentials can enter a deployed artifact.
node --input-type=module - "$display_config" "$repo_root" "$out_dir/display-config.json" <<'NODE'
import fs from 'node:fs';import {pathToFileURL} from 'node:url';
const [config,repo,output]=process.argv.slice(2);const {isPublicDisplayConfig}=await import(pathToFileURL(repo+'/runtimes/earth-runtime/core/displayConfig.mjs'));const text=fs.readFileSync(config,'utf8');if(text.length>4096)throw Error('Display config too large');const value=JSON.parse(text);if(!isPublicDisplayConfig(value))throw Error('Unqualified display configuration');fs.writeFileSync(output,JSON.stringify(value,null,2)+'\n');
NODE
mkdir -p "$out_dir/cesium"
for item in Assets ThirdParty Workers Widgets; do cp -a "$source_dir/node_modules/cesium/Build/Cesium/$item" "$out_dir/cesium/"; done
cp "$source_dir/LICENSE" "$out_dir/LICENSE-gods-eye.txt"
printf '%s\n' 'ORAS Earth runtime ready' > "$out_dir/health"
python3 "$repo_root/scripts/runtime/copy_dependency_licenses.py" "$source_dir" "$out_dir"
python3 "$repo_root/scripts/runtime/record_owned_earth.py" "$source_dir" "$out_dir"
[[ -z "$(git -C "$source_dir" status --porcelain)" ]]
