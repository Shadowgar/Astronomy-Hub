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
python3 - "$source_dir" "$staging_dir" <<'PY'
import json
import shutil
import sys
from pathlib import Path

source = Path(sys.argv[1])
staging = Path(sys.argv[2])


def safe_path(rel_path: str) -> Path:
    rel = Path(rel_path)
    if rel.is_absolute() or ".." in rel.parts:
        raise ValueError(f"unsafe release path: {rel_path}")
    return rel


manifest = json.loads((source / "manifest.json").read_text(encoding="utf-8"))
for profile in (manifest.get("profiles") or {}).values():
    profile_root = safe_path(str(profile.get("path", "")))
    profile_manifest_path = source / profile_root / "manifest.json"
    profile_manifest = json.loads(profile_manifest_path.read_text(encoding="utf-8"))
    for rel_path in [profile_root / "manifest.json", profile_root / "properties"]:
        destination = staging / rel_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source / rel_path, destination)
    for entry in profile_manifest.get("tile_entries", []):
        tile_path = profile_root / safe_path(str(entry.get("path", "")))
        destination = staging / tile_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source / tile_path, destination)

shutil.copy2(source / "manifest.json", staging / "manifest.json")
PY

.venv/bin/python scripts/skydata/validate_oras_dense_star_tiles.py "$staging_dir"

previous_dir=""
if [[ -e "$target_dir" ]]; then
  previous_dir="${target_dir}.previous-${timestamp}"
  mv "$target_dir" "$previous_dir"
fi
rollback() {
  if [[ -n "$previous_dir" && -e "$previous_dir" ]]; then
    rm -rf "$target_dir"
    mv "$previous_dir" "$target_dir"
  fi
}
trap rollback ERR

mv "$staging_dir" "$target_dir"
chmod -R a+rX "$target_dir"

.venv/bin/python scripts/skydata/validate_oras_dense_star_tiles.py "$target_dir"
trap - ERR
