#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
source_root="$repo_root/vendor/stellarium-web-engine"
app_dir="$source_root/apps/web-frontend"
assets_dir="$app_dir/src/assets/js"
build_dir="$source_root/build"
js_image="astronomy-hub-stellarium-jsbuild"
js_dockerfile="$repo_root/scripts/Dockerfile.stellarium-jsbuild"
expected_vue_version="2.6.12"
skip_host_npm_install="${STELLARIUM_SKIP_HOST_NPM_INSTALL:-0}"

read_package_version() {
    local package_dir="$1"

    PACKAGE_DIR="$package_dir" node <<'NODE'
const fs = require('fs')

const packageDir = process.env.PACKAGE_DIR
const packageJson = `${packageDir}/package.json`

if (!fs.existsSync(packageJson)) {
    process.exit(1)
}

const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'))
process.stdout.write(pkg.version || '')
NODE
}

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

vue_version="$(read_package_version "$app_dir/node_modules/vue" || true)"
compiler_version="$(read_package_version "$app_dir/node_modules/vue-template-compiler" || true)"

if [[ "$skip_host_npm_install" == "1" ]]; then
    echo "Skipping host-side Stellarium npm install; safe builder will install in staged workspace."
elif [[ ! -d "$app_dir/node_modules" || "$vue_version" != "$expected_vue_version" || "$compiler_version" != "$expected_vue_version" ]]; then
    echo "Installing Stellarium web-frontend dependencies in $app_dir"
    (
        cd "$app_dir"
        npm install
    )
fi

if [[ ! -f "$assets_dir/stellarium-web-engine.js" || ! -f "$assets_dir/stellarium-web-engine.wasm" ]]; then
  echo "Preparing Stellarium engine assets in $assets_dir"
  docker build -f "$js_dockerfile" -t "$js_image" "$repo_root"
  docker run --rm -v "$source_root:/app" "$js_image" /bin/bash -lc "source /emsdk/emsdk_env.sh && make js-es6"
  mkdir -p "$assets_dir"
  cp "$build_dir/stellarium-web-engine.js" "$assets_dir/stellarium-web-engine.js"
  cp "$build_dir/stellarium-web-engine.wasm" "$assets_dir/stellarium-web-engine.wasm"
fi

# Satellite releases are acquired independently and mounted at runtime. Keeping
# network data out of the runtime build makes builds reproducible and prevents
# unreviewed upstream data from being baked into Docker images.
echo "Satellite feed is managed by npm run satellites:build and a read-only runtime mount."

echo "Stellarium reference workspace is prepared."
