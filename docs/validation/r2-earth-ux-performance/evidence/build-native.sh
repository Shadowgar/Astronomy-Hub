#!/bin/bash
set -eu
artifact_name="$1"
docker run --rm --user 1001:1001 -v /var/tmp/oras-cesium/gods-eye:/source:ro -v "$PWD":/hub:ro -v "$PWD/output/r2-earth-ux":/proof -w /hub -e GODS_EYE_SOURCE=/source -e ORAS_EARTH_OUT="/proof/$artifact_name" node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8 node /source/node_modules/vite/bin/vite.js build --configLoader native --config /hub/runtimes/earth-runtime/vite.config.mjs
python3 output/r2-earth-ux/finish-earth.py "output/r2-earth-ux/$artifact_name"
