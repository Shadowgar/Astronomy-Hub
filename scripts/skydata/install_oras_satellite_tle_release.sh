#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
PYTHON_BIN="${PYTHON_BIN:-$ROOT_DIR/.venv/bin/python}"
SOURCE_INPUT="${1:-${ORAS_SATELLITE_RELEASE_SOURCE_DIR:-$ROOT_DIR/data/runtime-packs/satellite-tle/build}}"
TARGET_INPUT="${2:-${ORAS_SATELLITE_TLE_HOST_DIR:-$ROOT_DIR/data/runtime-packs/satellite-tle/current}}"
MINIMUM_COUNT="${ORAS_SATELLITE_MINIMUM_COUNT:-1}"
BUILDER="$ROOT_DIR/scripts/skydata/build_oras_satellite_tle_release.py"

if [[ ! -x "$PYTHON_BIN" ]]; then
  echo "Python runtime not found: $PYTHON_BIN" >&2
  exit 1
fi
if [[ ! -d "$SOURCE_INPUT" ]]; then
  echo "Source satellite release directory does not exist: $SOURCE_INPUT" >&2
  exit 1
fi

SOURCE_DIR="$(cd "$SOURCE_INPUT" && pwd -P)"
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
  echo "Source and target satellite release directories must be different" >&2
  exit 1
fi
if [[ ! -f "$SOURCE_DIR/tle_satellite.jsonl.gz" || ! -f "$SOURCE_DIR/manifest.json" ]]; then
  echo "Source satellite release requires tle_satellite.jsonl.gz and manifest.json" >&2
  exit 1
fi
if find "$SOURCE_DIR" -type l -print -quit | grep -q .; then
  echo "Refusing to install satellite release containing symlink content: $SOURCE_DIR" >&2
  exit 1
fi

"$PYTHON_BIN" "$BUILDER" --validate-only --output "$SOURCE_DIR" --minimum-count "$MINIMUM_COUNT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
STAGING="$(mktemp -d "$TARGET_PARENT/.satellite-tle-install-$STAMP.XXXXXX")"
BACKUP=""
cleanup() {
  if [[ -n "${BACKUP:-}" && -d "$BACKUP" && ! -e "$TARGET_DIR" ]]; then
    mv "$BACKUP" "$TARGET_DIR"
  fi
  if [[ -n "${STAGING:-}" && -d "$STAGING" ]]; then
    rm -rf "$STAGING"
  fi
}
trap cleanup EXIT

# The payload is copied first. Manifest publication is the activation marker.
cp -a "$SOURCE_DIR/tle_satellite.jsonl.gz" "$STAGING/tle_satellite.jsonl.gz"
cp -a "$SOURCE_DIR/manifest.json" "$STAGING/manifest.json"
chmod -R a+rX "$STAGING"

"$PYTHON_BIN" "$BUILDER" --validate-only --output "$STAGING" --minimum-count "$MINIMUM_COUNT"

if [[ -e "$TARGET_DIR" ]]; then
  BACKUP="$TARGET_PARENT/$TARGET_NAME.previous-$STAMP"
  mv "$TARGET_DIR" "$BACKUP"
fi
mv "$STAGING" "$TARGET_DIR"
STAGING=""

"$PYTHON_BIN" "$BUILDER" --validate-only --output "$TARGET_DIR" --minimum-count "$MINIMUM_COUNT"

if [[ -n "$BACKUP" ]]; then
  echo "Previous ORAS satellite release moved to $BACKUP"
fi
echo "Installed ORAS satellite release from $SOURCE_DIR to $TARGET_DIR"
