#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
source_root="$repo_root/vendor/stellarium-web-engine"
app_dir="$source_root/apps/web-frontend"
assets_dir="$app_dir/src/assets/js"
build_dir="$source_root/build"
skydata_dir="$source_root/apps/test-skydata"
js_image="astronomy-hub-stellarium-jsbuild"
js_dockerfile="$repo_root/scripts/Dockerfile.stellarium-jsbuild"
expected_vue_version="2.6.12"

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

if [[ ! -d "$app_dir/node_modules" || "$vue_version" != "$expected_vue_version" || "$compiler_version" != "$expected_vue_version" ]]; then
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

# Build a compatibility satellite feed for this pinned SWE version.
# New upstream JSONL entries include launch_date values in a format that this
# runtime cannot parse; stripping the field avoids rejecting most satellites.
tmp_tle_gz="$(mktemp)"
curl -fsSL "https://stellarium.sfo2.cdn.digitaloceanspaces.com/skysources/v1/tle_satellite.jsonl.gz" -o "$tmp_tle_gz"
python3 - "$tmp_tle_gz" "$skydata_dir/tle_satellite.jsonl.gz" <<'PY'
import gzip
import json
import os
import sys

src_path = sys.argv[1]
dst_path = sys.argv[2]
tmp_path = f"{dst_path}.tmp"

with gzip.open(src_path, "rt", encoding="utf-8", errors="ignore") as source_stream, gzip.open(tmp_path, "wt", encoding="utf-8") as output_stream:
    for raw_line in source_stream:
        line = raw_line.strip()
        if not line:
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError:
            continue
        model_data = record.get("model_data")
        if isinstance(model_data, dict):
            model_data.pop("launch_date", None)
        output_stream.write(json.dumps(record, separators=(",", ":")) + "\n")

os.replace(tmp_path, dst_path)
PY
rm -f "$tmp_tle_gz"

echo "Stellarium reference workspace is prepared."
