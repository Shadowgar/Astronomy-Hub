#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <source-release-dir> <target-runtime-dir>" >&2
  exit 2
fi

source_dir="$(realpath "$1")"
target_dir="$(realpath -m "$2")"
target_parent="$(dirname "$target_dir")"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
staging_dir="${target_dir}.staging-${timestamp}"

if [[ ! -d "$source_dir" ]]; then
  echo "Source release directory does not exist: $source_dir" >&2
  exit 1
fi

if find "$source_dir" -type l -print -quit | grep -q .; then
  echo "Source release contains symlinks; refusing install" >&2
  exit 1
fi

mkdir -p "$target_parent"
rm -rf "$staging_dir"

.venv/bin/python scripts/skydata/validate_oras_dense_star_tiles.py "$source_dir"

mkdir -p "$staging_dir"
(
  cd "$source_dir"
  find . -type d -exec mkdir -p "$staging_dir/{}" \;
  find . -type f ! -name manifest.json -exec cp -p "{}" "$staging_dir/{}" \;
  cp -p manifest.json "$staging_dir/manifest.json"
)

.venv/bin/python scripts/skydata/validate_oras_dense_star_tiles.py "$staging_dir"

if [[ -e "$target_dir" ]]; then
  mv "$target_dir" "${target_dir}.previous-${timestamp}"
fi
mv "$staging_dir" "$target_dir"
chmod -R a+rX "$target_dir"

.venv/bin/python scripts/skydata/validate_oras_dense_star_tiles.py "$target_dir"
