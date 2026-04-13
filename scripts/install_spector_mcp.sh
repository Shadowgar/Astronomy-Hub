#!/usr/bin/env bash
set -euo pipefail

# Simple installer for Spector.js MCP server
# Clones the Spector.js repo into third_party/spectorjs and builds the MCP server

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SPECTOR_DIR="$ROOT_DIR/third_party/spectorjs"

echo "Spector MCP installer"
echo "Target dir: $SPECTOR_DIR"

if [ -d "$SPECTOR_DIR" ]; then
  echo "Directory exists — fetching latest changes"
  git -C "$SPECTOR_DIR" fetch --all --prune
  git -C "$SPECTOR_DIR" checkout origin/master || true
  git -C "$SPECTOR_DIR" pull || true
else
  git clone https://github.com/BabylonJS/Spector.js.git "$SPECTOR_DIR"
fi

cd "$SPECTOR_DIR/mcp"

echo "Installing npm deps..."
npm install

echo "Installing Playwright browsers (chromium)..."
npx playwright install chromium

echo "Building MCP server..."
npm run build

DIST_INDEX="$SPECTOR_DIR/mcp/dist/index.js"
if [ -f "$DIST_INDEX" ]; then
  echo "Build OK — MCP entry: $DIST_INDEX"
  echo "You can configure your MCP client to run: node $DIST_INDEX"
else
  echo "Build failed: $DIST_INDEX not found" >&2
  exit 1
fi

echo "Done."
