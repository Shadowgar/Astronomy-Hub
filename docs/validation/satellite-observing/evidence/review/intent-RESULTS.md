# Deferred intent race repair

Branch sky-satellite-observing-1. No commit/push/PR action by delegated agent.

Loaded current WorkspaceShell/adapter/SatellitePasses and protocol source, frontend/AGENTS.md, existing focused tests, and output/satellite-observing/pre-review.md under root's already-loaded bounded observing context. Applied systematic-debugging, receiving-code-review and previously loaded test-driven-development skills. Historical frontend Babylon/module2 guidance is superseded by current root authority; no renderer/source/protocol changes.

Changed only frontend/src/features/workspace/WorkspaceShell.tsx and new frontend/tests/workspaceIntentRaces.test.tsx for this repair. Tests invoke actual WorkspaceShell child handlers using the repository's existing deterministic hook harness pattern; deferred promises control bridge acknowledgements. No copied implementation handlers, arbitrary sleeps, runtime build or browser injection.

Confirmed failures before repair:12of12 regressions failed on meaningful assertions (stale Play/Live dates, departed route/client/new-selection overwrites, obsolete Watch commands after history/observer/time/query/client changes, native observer mismatch, stale FOV). Saved red.log.

Repair: latest route/client and explicit selection/watch/time revisions guard async continuations. Selection merges identity into the latest time query; obsolete selection work cannot persist. Watch checks validity after every await, is invalidated immediately by newer observer/time intent and satellite-query fetches, verifies native observer, and fetches current complete camera after time/selection acknowledgements before updating yaw/pitch. Protocol requires full camera; partial yaw/pitch payload is not supported. Existing camera/display values from this latest snapshot are preserved. Requested mobile selected-object launcher is hidden while dedicated simulation controls are displayed.

Commands/results:
- `node frontend/node_modules/vitest/vitest.mjs run tests/workspaceIntentRaces.test.tsx --root frontend`:12failed before repair (red.log),12passed immediately after (green-first.log).
- `node frontend/node_modules/vitest/vitest.mjs run tests/workspaceIntentRaces.test.tsx tests/workspaceRuntimeAdapter.test.ts tests/workspaceSelectionSync.test.ts tests/workspaceTime.test.tsx tests/workspace.test.tsx tests/satellitePasses.test.tsx --root frontend`:6files/93tests passed,0failed;19new tests cover deferred boundaries plus successful Watch from an already selected identity. green.log.
- `node frontend/node_modules/typescript/bin/tsc --noEmit -p frontend/tsconfig.json`:exit0,no output;typecheck.log.
- `git diff --check`:exit0,no output.

Existing native deselection synchronization suppresses Watch's own clear acknowledgement: acknowledged selection becomes null, pending/revision barriers reject older polls, and changing product selection alone does not change the guarded route. The explicit already-selected positive regression completes and removes URL selection.

Remaining validation: parent owns final frontend build and three-viewport Docker/browser qualification after source freeze, then immutable-head review. Unit/typechecking is supporting evidence only; no browser, owner or physical-device acceptance is claimed here. No dependencies or protocol expanded. A camera change after the final native snapshot and before its following full-camera command cannot be made atomic by WorkspaceShell alone; this repair preserves changes during earlier acknowledgements using the latest supported full-state protocol.
