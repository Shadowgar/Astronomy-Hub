#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
PYTHON_BIN="${PYTHON_BIN:-$ROOT_DIR/.venv/bin/python}"
RELEASE_DIR="${1:-${ORAS_CATALOG_RELEASE_DIR:-$ROOT_DIR/data/runtime-packs/catalog-packs}}"

if [[ ! -x "$PYTHON_BIN" ]]; then
  echo "Python runtime not found: $PYTHON_BIN" >&2
  exit 1
fi

"$PYTHON_BIN" -m scripts.skydata.build_oras_catalog_release \
  --validate-only \
  --output "$RELEASE_DIR"

if [[ -n "${ORAS_CATALOG_STATUS_URL:-}" ]]; then
  "$PYTHON_BIN" - "$ORAS_CATALOG_STATUS_URL" <<'PY'
from __future__ import annotations

import json
import sys
from urllib.request import urlopen

url = sys.argv[1]
with urlopen(url, timeout=10) as response:
    payload = json.loads(response.read().decode("utf-8"))
data = payload.get("data") or {}
if not data.get("mounted"):
    raise SystemExit(f"catalog status is not mounted: {payload}")
if int(data.get("object_count") or 0) < 1:
    raise SystemExit(f"catalog status has no objects: {payload}")
print(f"Catalog status endpoint mounted objects={data.get('object_count')}")
PY
fi
