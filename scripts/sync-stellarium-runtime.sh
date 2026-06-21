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

if [[ ! -f "$runtime_dist_dir/oras-runtime-build.json" ]]; then
  echo "Same-origin runtime build marker is missing: $runtime_dist_dir/oras-runtime-build.json" >&2
  echo "Run: cd $repo_root && npm run build:stellarium" >&2
  exit 1
fi

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required to synchronize the ORAS Sky-Engine runtime." >&2
  echo "Install it with: sudo apt-get install rsync" >&2
  exit 1
fi

mkdir -p "$target_dir"
# Keep mounted skydata intact while replacing generated runtime shell files.
rsync -a --delete --exclude 'skydata/' "$runtime_dist_dir/." "$target_dir/"

echo "Synced ORAS Sky-Engine runtime to $target_dir"
