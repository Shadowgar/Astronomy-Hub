#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
compose_file="$repo_root/docker-compose.prod.yml"
public_http_port="${PUBLIC_HTTP_PORT:-4173}"

skip_stellarium_build=0
skip_frontend_build=0
skip_recreate=0
validate_only=0

usage() {
  cat <<'EOF'
Usage: bash scripts/rebuild-oras-frontend-prod.sh [options]

Run the supported ORAS production frontend release sequence:
  1. safe Stellarium runtime build
  2. frontend Docker build
  3. frontend container recreate
  4. local ORAS runtime validation

Options:
  --skip-stellarium-build  Reuse the current synced ORAS runtime shell.
  --skip-frontend-build    Reuse the current frontend image.
  --skip-recreate          Skip the frontend container recreate step.
  --validate-only          Run only the validation checks.
  -h, --help               Show this help text.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-stellarium-build)
      skip_stellarium_build=1
      shift
      ;;
    --skip-frontend-build)
      skip_frontend_build=1
      shift
      ;;
    --skip-recreate)
      skip_recreate=1
      shift
      ;;
    --validate-only)
      validate_only=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ ! -f "$compose_file" ]]; then
  echo "Missing compose file: $compose_file" >&2
  exit 1
fi

require_body_contains() {
  local url="$1"
  local needle="$2"
  local body

  body="$(curl -fsSL --max-time 20 "$url")"
  if [[ "$body" != *"$needle"* ]]; then
    echo "Expected '$needle' in $url" >&2
    return 1
  fi
}

check_http_status() {
  local url="$1"
  local expected="$2"
  local actual

  actual="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$url")"
  if [[ "$actual" != "$expected" ]]; then
    echo "Expected HTTP $expected from $url, got $actual" >&2
    return 1
  fi
}

validate_runtime() {
  local base_url="http://127.0.0.1:${public_http_port}/oras-sky-engine"
  local bundle

  echo "Validating local ORAS runtime at $base_url"
  bundle="$(
    curl -fsSL --max-time 20 "$base_url/index.html" \
      | grep -o 'js/app[^"]*\.js' \
      | head -n 1
  )"

  if [[ -z "$bundle" ]]; then
    echo "Could not detect ORAS app bundle from $base_url/index.html" >&2
    return 1
  fi

  check_http_status "$base_url/skydata/dso/properties" "404"
  check_http_status "$base_url/skydata/packs/base/dso/properties" "200"
  check_http_status "$base_url/skydata/packs/extended/dso/properties" "200"
  require_body_contains "$base_url/skydata/packs/base/dso/properties" "hips_order               = 1"
  require_body_contains "$base_url/skydata/packs/extended/dso/properties" "hips_order               = 3"

  echo "Live bundle: $bundle"
  echo "DSO policy checks passed:"
  echo "  root dso -> 404"
  echo "  base dso -> 200 (hips_order = 1)"
  echo "  extended dso -> 200 (hips_order = 3)"
}

if [[ "$validate_only" -eq 0 ]]; then
  echo "Supported ORAS production release sequence:"
  echo "  1. npm run build:stellarium"
  echo "  2. docker compose -f docker-compose.prod.yml build frontend"
  echo "  3. docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate frontend"
  echo "  4. validate /oras-sky-engine/ and DSO pack endpoints"

  if [[ "$skip_stellarium_build" -eq 0 ]]; then
    echo "Step 1/4: building Stellarium runtime safely"
    npm --prefix "$repo_root" run build:stellarium
  fi

  if [[ "$skip_frontend_build" -eq 0 ]]; then
    echo "Step 2/4: building frontend image"
    docker compose -f "$compose_file" build frontend
  fi

  if [[ "$skip_recreate" -eq 0 ]]; then
    echo "Step 3/4: recreating frontend container"
    docker compose -f "$compose_file" up -d --no-deps --force-recreate frontend
  fi
fi

echo "Step 4/4: validating production frontend runtime"
validate_runtime
