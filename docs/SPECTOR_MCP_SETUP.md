# Spector.js MCP Server — Local install helper

This document explains how to install and run the Spector.js MCP server locally from this repository.

Files added:
- `scripts/install_spector_mcp.sh` — clones Spector.js into `third_party/spectorjs`, installs dependencies, runs Playwright browser install, and builds the MCP server.

Usage

1. Run the installer (from repository root):

```bash
bash scripts/install_spector_mcp.sh
```

2. On success, the built MCP entrypoint will be at `third_party/spectorjs/mcp/dist/index.js`.

MCP client configuration examples (replace `<SPECTOR_REPO>` with the full path to this clone):

Claude Code / Copilot CLI style:

```json
{
  "mcpServers": {
    "spector": {
      "command": "node",
      "args": ["<SPECTOR_REPO>/third_party/spectorjs/mcp/dist/index.js"]
    }
  }
}
```

VS Code (Copilot) — add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "spector": {
      "type": "stdio",
      "command": "node",
      "args": ["<SPECTOR_REPO>/third_party/spectorjs/mcp/dist/index.js"]
    }
  }
}
```

Notes
- The script clones the official Spector.js repo; keep `third_party/spectorjs` up-to-date if you want the latest fixes.
- You can also run the MCP server directly from the Spector.js repo using `npm run dev` inside `mcp/` for rapid iteration.
