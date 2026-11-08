#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
source_dir="${GODS_EYE_SOURCE:-/var/tmp/oras-cesium/gods-eye}"
out_dir="${ORAS_PLANET_OUT:?Set an isolated output directory}"
[[ "$(git -C "$source_dir" rev-parse HEAD)" == e7707d9a0f34d9fbffc300023c319f95caa5be30 ]]
[[ -z "$(git -C "$source_dir" status --porcelain)" ]]
mkdir -p "$out_dir"
docker run --rm --network none --user 1001:1001 -v "$source_dir:/source:ro" -v "$repo_root:/hub:ro" -v "$out_dir:/output" -e GODS_EYE_SOURCE=/source -e ORAS_PLANET_OUT=/output node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 node /source/node_modules/vite/bin/vite.js build --configLoader native --config /hub/runtimes/planet-runtime/vite.config.mjs
[[ -z "$(git -C "$source_dir" status --porcelain)" ]]
