#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
runtime_dist_dir="$repo_root/vendor/stellarium-web-engine/apps/web-frontend/dist"
target_dir="$repo_root/frontend/public/oras-sky-engine"

if [[ ! -f "$runtime_dist_dir/index.html" ]]; then
  echo "Same-origin runtime dist is missing: $runtime_dist_dir/index.html" >&2
  echo "Run: cd $repo_root && npm run build:stellarium" >&2
  exit 1
fi

rm -rf "$target_dir"
mkdir -p "$target_dir"
cp -a "$runtime_dist_dir/." "$target_dir/"

echo "Synced ORAS Sky-Engine runtime to $target_dir"