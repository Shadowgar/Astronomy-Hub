#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
PYTHON_BIN="${PYTHON_BIN:-$ROOT_DIR/.venv/bin/python}"
SOURCE_ROOT="${ORAS_CATALOG_SOURCE_ROOT:-$ROOT_DIR/data/catalog-sources/oras-major-catalog-update-1}"
OUTPUT_DIR="${ORAS_CATALOG_RELEASE_DIR:-$ROOT_DIR/data/runtime-packs/catalog-pack-build}"
RELEASE_VERSION="${ORAS_CATALOG_RELEASE_VERSION:-2026.06.1}"

if [[ ! -x "$PYTHON_BIN" ]]; then
  echo "Python runtime not found: $PYTHON_BIN" >&2
  exit 1
fi

echo "Acquiring ORAS catalog sources into $SOURCE_ROOT"
"$PYTHON_BIN" -m scripts.skydata.acquire_oras_catalog_sources \
  --output "$SOURCE_ROOT"

echo "Building ORAS catalog release $RELEASE_VERSION into $OUTPUT_DIR"
"$PYTHON_BIN" -m scripts.skydata.build_oras_catalog_release \
  --source-backed \
  --source-root "$SOURCE_ROOT" \
  --repo-root "$ROOT_DIR" \
  --release-version "$RELEASE_VERSION" \
  --output "$OUTPUT_DIR"

"$ROOT_DIR/scripts/skydata/validate_oras_catalog_release.sh" "$OUTPUT_DIR"
