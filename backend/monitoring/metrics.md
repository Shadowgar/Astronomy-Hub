# Observability / Metrics Notes (Phase 2F.F4)

This document lists small, manual observability notes to look for during local runs and debugging.

Key events to monitor
- cache hit / miss
  - Metric: presence of `cache.hit` logging or headers (`X-Cache-Hit`) on responses
  - Example log: `req=REQID cache.hit key=conditions:oras`

- normalize.fail
  - Indicates the normalizer raised an exception when assembling provider data
  - Example log (exception): `req=REQID normalize.fail` or `req=REQID module.conditions.assembly.fail`

- module.error
  - High-level marker emitted when a module assembly fails and a controlled error contract is returned
  - Example JSON response body: `{ "error": "module_error", "module": "conditions", "message": "failed to assemble conditions payload" }`

Example messages to inspect in logs
- `2026-03-23T... INFO backend.server req=... START GET /api/conditions q={}`
- `2026-03-23T... INFO backend.server req=... cache.hit key=conditions:oras`
- `2026-03-23T... ERROR backend.server req=... normalize.fail` (inspect stacktrace)
- `2026-03-23T... ERROR backend.server req=... module.conditions.assembly.fail` (module-level assembly failure)
- `2026-03-23T... INFO backend.server req=... END status=500 duration_ms=12`

Notes
- This file is documentation only and should be updated with more examples as observability is expanded.
