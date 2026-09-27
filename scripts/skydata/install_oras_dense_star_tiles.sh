#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <source-release-dir> <target-runtime-dir>" >&2
  exit 2
fi

source_dir="$(realpath "$1")"
target_dir="$(realpath -m "$2")"
target_parent="$(dirname "$target_dir")"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
staging_dir="${target_dir}.staging-${timestamp}"
catalog_dir="${ORAS_CATALOG_PACKS_HOST_DIR:-$PWD/data/runtime-packs/catalog-packs}"
python_bin="${PYTHON_BIN:-.venv/bin/python}"

if [[ ! -d "$source_dir" ]]; then
  echo "Source release directory does not exist: $source_dir" >&2
  exit 1
fi

if find "$source_dir" -type l -print -quit | grep -q .; then
  echo "Source release contains symlinks; refusing install" >&2
  exit 1
fi

lock_file="${ORAS_STAR_RELEASE_LOCK_FILE:-$root_dir/data/runtime-packs/.star-release-promotion.lock}"
mkdir -p "$(dirname "$lock_file")"
if [[ -L "$lock_file" ]]; then
  echo "Refusing symlink star release lock: $lock_file" >&2
  exit 1
fi
exec {star_release_lock_fd}>"$lock_file"
flock -x "$star_release_lock_fd"

mkdir -p "$target_parent"
rm -rf "$staging_dir"

"$python_bin" scripts/skydata/validate_oras_dense_star_tiles.py "$source_dir"
if [[ -f "$catalog_dir/manifest.json" ]]; then
  "$python_bin" scripts/skydata/star_release_compatibility.py "$catalog_dir" "$source_dir"
fi

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

"$python_bin" scripts/skydata/validate_oras_dense_star_tiles.py "$staging_dir"

chmod -R a+rX "$staging_dir"
promoted=0
validate_runtime() {
  "$python_bin" scripts/skydata/validate_oras_dense_star_tiles.py "$target_dir" >/dev/null || return
  if [[ -f "$catalog_dir/manifest.json" ]]; then
    "$python_bin" scripts/skydata/star_release_compatibility.py \
      "$catalog_dir" "$target_dir" || return
  fi
}
rollback_dense() {
  if [[ -n "$backup_path" && -d "$backup_path" ]]; then
    "$python_bin" scripts/skydata/promote_runtime_release.py \
      "$backup_path" "$target_dir" >/dev/null || return
  else
    mv "$target_dir" "$staging_dir" || return
    rm -rf "$staging_dir" || return
  fi
  if [[ -f "$target_dir/manifest.json" ]]; then
    validate_runtime || return
  else
    [[ ! -e "$target_dir" ]] || return
    if [[ -f "$catalog_dir/manifest.json" ]]; then
      "$python_bin" -m scripts.skydata.build_oras_catalog_release \
        --validate-only --output "$catalog_dir" >/dev/null || return
    fi
  fi
}
cleanup() {
  local status="$1"
  trap - EXIT
  set +e
  if [[ "$promoted" == 1 ]]; then
    echo "Final dense-star/pair validation failed; restoring previous generation" >&2
    rollback_dense
    if [[ $? -ne 0 ]]; then
      echo "Dense-star rollback or restored runtime validation failed" >&2
      status=1
    fi
  fi
  exit "$status"
}
trap 'cleanup $?' EXIT
backup_path="$("$python_bin" scripts/skydata/promote_runtime_release.py \
  "$staging_dir" "$target_dir" --print-backup-only)"
promoted=1
if ! validate_runtime; then
  exit 1
fi
promoted=0
