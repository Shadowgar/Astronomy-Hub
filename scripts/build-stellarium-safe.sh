#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
app_dir="$repo_root/vendor/stellarium-web-engine/apps/web-frontend"
dist_dir="$app_dir/dist"
staging_root="${STELLARIUM_BUILD_WORK_ROOT:-/var/tmp/astronomy-hub-stellarium-build}"
staging_app_dir="$staging_root/web-frontend"
npm_cache_dir="$staging_root/npm-cache"
hash_file="$staging_root/.package-lock.sha256"
build_marker="oras-runtime-build.json"
docker_image="${STELLARIUM_BUILD_IMAGE:-node:20-bookworm-slim}"
memory_mb="${STELLARIUM_BUILD_MEMORY_MB:-4096}"
memory_swap_mb="${STELLARIUM_BUILD_MEMORY_SWAP_MB:--1}"
cpus="${STELLARIUM_BUILD_CPUS:-1.5}"
node_old_space_mb="${STELLARIUM_BUILD_NODE_OLD_SPACE_MB:-3072}"
allow_host_fallback="${STELLARIUM_BUILD_ALLOW_HOST_FALLBACK:-1}"
host_node_old_space_mb="${STELLARIUM_BUILD_HOST_NODE_OLD_SPACE_MB:-8192}"
dry_run=0

usage() {
  cat <<'EOF'
Usage: bash scripts/build-stellarium-safe.sh [--dry-run]

Build the vendored Stellarium web frontend in a throttled Docker container,
using internal staging storage so the live external-drive working tree is not
the active build workspace.

Environment overrides:
  STELLARIUM_BUILD_WORK_ROOT
  STELLARIUM_BUILD_IMAGE
  STELLARIUM_BUILD_MEMORY_MB
  STELLARIUM_BUILD_MEMORY_SWAP_MB (-1 keeps Docker swap unlimited)
  STELLARIUM_BUILD_CPUS
  STELLARIUM_BUILD_NODE_OLD_SPACE_MB
  STELLARIUM_BUILD_ALLOW_HOST_FALLBACK
  STELLARIUM_BUILD_HOST_NODE_OLD_SPACE_MB
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      dry_run=1
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

if [[ ! -f "$app_dir/package.json" ]]; then
  echo "Stellarium web frontend not found at $app_dir" >&2
  exit 1
fi

run_cmd() {
  if [[ "$dry_run" -eq 1 ]]; then
    printf '[dry-run] '
    printf '%q ' "$@"
    printf '\n'
    return 0
  fi
  "$@"
}

package_lock_hash="$(
  sha256sum "$app_dir/package-lock.json" | awk '{print $1}'
)"

echo "Preparing Stellarium reference workspace"
run_cmd env \
  STELLARIUM_SKIP_HOST_NPM_INSTALL=1 \
  bash "$repo_root/scripts/prepare-stellarium-reference.sh"

echo "Staging web frontend on internal storage: $staging_app_dir"
run_cmd mkdir -p "$staging_app_dir" "$npm_cache_dir"
run_cmd rsync -a --delete \
  --exclude 'dist/' \
  --exclude 'node_modules/' \
  "$app_dir/" "$staging_app_dir/"
if [[ -L "$app_dir/vue.config.js" ]]; then
  run_cmd rm -f "$staging_app_dir/vue.config.js"
  run_cmd cp -L "$app_dir/vue.config.js" "$staging_app_dir/vue.config.js"
fi

needs_install=1
if [[ -d "$staging_app_dir/node_modules" && -f "$hash_file" ]]; then
  if [[ "$(cat "$hash_file")" == "$package_lock_hash" ]]; then
    needs_install=0
  fi
fi

container_cmd=$'set -euo pipefail\n'
container_cmd+="cd /work"$'\n'
container_cmd+="export CI=1"$'\n'
container_cmd+="export ORAS_RUNTIME_PUBLIC_PATH=/oras-sky-engine/"$'\n'
container_cmd+="export ORAS_RUNTIME_COPY_SKYDATA=0"$'\n'
container_cmd+="export NODE_OPTIONS=\"--openssl-legacy-provider --max-old-space-size=$node_old_space_mb\""$'\n'
if [[ "$needs_install" -eq 1 ]]; then
  container_cmd+="npm ci --prefer-offline --no-audit --loglevel=error"$'\n'
else
  container_cmd+="echo \"Reusing cached node_modules in /work/node_modules\""$'\n'
fi
container_cmd+="npm run build"$'\n'

docker_run_cmd=(
  docker run --rm
  --cpus "$cpus"
  --memory "${memory_mb}m"
  --memory-swap "$([[ "$memory_swap_mb" == "-1" ]] && printf -- "-1" || printf '%sm' "$memory_swap_mb")"
  -e HOME=/tmp
  -v "$staging_app_dir:/work"
  -v "$npm_cache_dir:/tmp/.npm"
  -w /work
  "$docker_image"
  bash -lc "$container_cmd"
)

echo "Building Stellarium in throttled container"
if ! run_cmd nice -n 15 "${docker_run_cmd[@]}"; then
  if [[ "$allow_host_fallback" != "1" ]]; then
    echo "Docker Stellarium build failed and host fallback is disabled." >&2
    exit 1
  fi
  echo "Docker Stellarium build failed; retrying in staged workspace on host Node."
  run_cmd docker run --rm \
    -v "$staging_app_dir:/work" \
    "$docker_image" \
    bash -lc "rm -rf /work/dist"
  run_cmd bash -lc "
    set -euo pipefail
    cd '$staging_app_dir'
    export CI=1
    export ORAS_RUNTIME_PUBLIC_PATH=/oras-sky-engine/
    export ORAS_RUNTIME_COPY_SKYDATA=0
    export NODE_OPTIONS='--openssl-legacy-provider --max-old-space-size=$host_node_old_space_mb'
    npm run build
  "
fi

if [[ "$needs_install" -eq 1 ]]; then
  run_cmd bash -lc "printf '%s\n' '$package_lock_hash' > '$hash_file'"
fi

echo "Syncing built dist back to working tree"
run_cmd mkdir -p "$dist_dir"
run_cmd rsync -a --delete "$staging_app_dir/dist/" "$dist_dir/"

if [[ "$dry_run" -eq 0 ]]; then
  source_hash="$(
    {
      find "$app_dir/src" -type f -print0
      printf '%s\0' "$app_dir/package.json" "$app_dir/package-lock.json"
    } | sort -z | xargs -0 sha256sum | sha256sum | awk '{print $1}'
  )"
  node - "$dist_dir/$build_marker" "$source_hash" "$docker_image" "$memory_mb" "$memory_swap_mb" "$node_old_space_mb" "$allow_host_fallback" "$host_node_old_space_mb" <<'NODE'
const fs = require('fs')

const [
  markerPath,
  sourceHash,
  dockerImage,
  memoryMb,
  memorySwapMb,
  nodeOldSpaceMb,
  allowHostFallback,
  hostNodeOldSpaceMb,
] = process.argv.slice(2)

const marker = {
  runtime: 'oras-sky-engine',
  source: 'vendor/stellarium-web-engine/apps/web-frontend',
  source_hash: sourceHash,
  docker_image: dockerImage,
  memory_mb: Number(memoryMb),
  memory_swap_mb: memorySwapMb === '-1' ? -1 : Number(memorySwapMb),
  node_old_space_mb: Number(nodeOldSpaceMb),
  host_fallback_enabled: allowHostFallback === '1',
  host_node_old_space_mb: Number(hostNodeOldSpaceMb),
  built_at: new Date().toISOString(),
}

fs.writeFileSync(markerPath, `${JSON.stringify(marker, null, 2)}\n`)
NODE
fi

echo "Refreshing ORAS runtime shell"
run_cmd npm --prefix "$repo_root" run prepare:stellarium-runtime

echo "Safe Stellarium build complete."
