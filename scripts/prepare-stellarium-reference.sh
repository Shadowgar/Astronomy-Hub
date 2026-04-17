#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
source_root="$repo_root/study/stellarium-web-engine/source/stellarium-web-engine-master"
app_dir="$source_root/apps/web-frontend"
assets_dir="$app_dir/src/assets/js"
build_dir="$source_root/build"
js_image="astronomy-hub-stellarium-jsbuild"
js_dockerfile="$repo_root/scripts/Dockerfile.stellarium-jsbuild"

if [[ ! -f "$app_dir/package.json" ]]; then
  echo "Stellarium reference app not found at $app_dir" >&2
  exit 1
fi

PACKAGE_JSON="$app_dir/package.json" node <<'NODE'
const fs = require('fs')

const path = process.env.PACKAGE_JSON
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'))

pkg.dependencies = pkg.dependencies || {}
pkg.devDependencies = pkg.devDependencies || {}
pkg.dependencies.vue = '2.6.12'
pkg.devDependencies['vue-template-compiler'] = '2.6.12'

fs.writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`)
NODE

if [[ ! -f "$assets_dir/stellarium-web-engine.js" || ! -f "$assets_dir/stellarium-web-engine.wasm" ]]; then
  echo "Preparing Stellarium engine assets in $assets_dir"
  docker build -f "$js_dockerfile" -t "$js_image" "$repo_root"
  docker run --rm -v "$source_root:/app" "$js_image" /bin/bash -lc "source /emsdk/emsdk_env.sh && make js-es6"
  mkdir -p "$assets_dir"
  cp "$build_dir/stellarium-web-engine.js" "$assets_dir/stellarium-web-engine.js"
  cp "$build_dir/stellarium-web-engine.wasm" "$assets_dir/stellarium-web-engine.wasm"
fi

echo "Stellarium reference workspace is prepared."