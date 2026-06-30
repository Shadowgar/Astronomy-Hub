#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
PYTHON_BIN="${PYTHON_BIN:-$ROOT_DIR/.venv/bin/python}"
SOURCE_DIR="${1:-${ORAS_CATALOG_RELEASE_SOURCE_DIR:-$ROOT_DIR/data/runtime-packs/catalog-packs}}"
TARGET_INPUT="${2:-${ORAS_CATALOG_PACKS_HOST_DIR:-$ROOT_DIR/data/runtime-packs/catalog-packs}}"

if [[ ! -x "$PYTHON_BIN" ]]; then
  echo "Python runtime not found: $PYTHON_BIN" >&2
  exit 1
fi

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Source catalog release directory does not exist: $SOURCE_DIR" >&2
  exit 1
fi

SOURCE_DIR="$(cd "$SOURCE_DIR" && pwd -P)"
TARGET_PARENT_INPUT="$(dirname "$TARGET_INPUT")"
TARGET_NAME="$(basename "$TARGET_INPUT")"
mkdir -p "$TARGET_PARENT_INPUT"
TARGET_PARENT="$(cd "$TARGET_PARENT_INPUT" && pwd -P)"
TARGET_DIR="$TARGET_PARENT/$TARGET_NAME"

if [[ -L "$TARGET_DIR" ]]; then
  echo "Refusing to install into symlink target: $TARGET_DIR" >&2
  exit 1
fi
if [[ -e "$TARGET_DIR" && "$(cd "$TARGET_DIR" && pwd -P)" == "$SOURCE_DIR" ]]; then
  echo "Source and target catalog release directories must be different for install" >&2
  exit 1
fi
if [[ ! -f "$SOURCE_DIR/manifest.json" ]]; then
  echo "Source catalog release is missing manifest.json: $SOURCE_DIR" >&2
  exit 1
fi
if find "$SOURCE_DIR" -type l -print -quit | grep -q .; then
  echo "Refusing to install catalog release containing symlinks: $SOURCE_DIR" >&2
  exit 1
fi

"$PYTHON_BIN" -m scripts.skydata.build_oras_catalog_release \
  --validate-only \
  --output "$SOURCE_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
STAGING="$(mktemp -d "$TARGET_PARENT/.catalog-pack-install-$STAMP.XXXXXX")"
BACKUP=""
cleanup() {
  if [[ -n "${STAGING:-}" && -d "$STAGING" ]]; then
    rm -rf "$STAGING"
  fi
}
trap cleanup EXIT

# Copy all chunk/payload artifacts first; manifest.json is installed last so
# readers never see a new manifest pointing at incomplete chunk files.
find "$SOURCE_DIR" -mindepth 1 -maxdepth 1 ! -name manifest.json -exec cp -a {} "$STAGING/" \;
cp -a "$SOURCE_DIR/manifest.json" "$STAGING/manifest.json"
chmod -R a+rX "$STAGING"

"$PYTHON_BIN" -m scripts.skydata.build_oras_catalog_release \
  --validate-only \
  --output "$STAGING"

if [[ -e "$TARGET_DIR" ]]; then
  BACKUP="$TARGET_PARENT/$TARGET_NAME.previous-$STAMP"
  mv "$TARGET_DIR" "$BACKUP"
fi
mv "$STAGING" "$TARGET_DIR"
STAGING=""

"$PYTHON_BIN" -m scripts.skydata.build_oras_catalog_release \
  --validate-only \
  --output "$TARGET_DIR"

if [[ -n "$BACKUP" ]]; then
  echo "Previous ORAS catalog release moved to $BACKUP"
fi
echo "Installed ORAS catalog release from $SOURCE_DIR to $TARGET_DIR"
