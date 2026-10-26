# Satellite observing independent pre-delivery review

**Two actionable P2 findings. Not exact-HEAD approval.** Reviewed uncommitted application changes against `d2909a52d3f747c555ca87eff112bab83c064779` on `sky-satellite-observing-1`, 2026-10-26. No P1 identified. Reviewer changed this report only.

## P2: Pending selection overwrites newer Play/Pause/Live intent

Location: `frontend/src/features/workspace/WorkspaceShell.tsx:94-98`, reached through the new SimulationControls `onSelect`; interaction with `simulationAction` at line102 and `workspaceRuntimeAdapter.ts:52-60`.

Reproduce: start a paused pass; choose **Select satellite** with its source lookup delayed; choose **Play Simulation** or **Return to Live UTC** before selection finishes. Selection does not set `passBusy`, so the controls remain usable. `select()` captured `location.search` before its asynchronous native source lookup. Its late response navigates with the old `date` and `simulation=1`, replacing the newer time choice. The URL effect then dispatches `setSimulation({utc: oldUtc, playing:false})`. The native clock jumps backward and pauses, or leaves Live despite the newer user choice.

Confirmed using the actual transpiled `select` and `simulationAction` handlers in a Node VM, with a deferred `selectEntity` response. Observed navigation order:

```text
/sky-engine?date=2026-10-26T10%3A22%3A02.000Z&simulation=1
/sky-engine?date=2026-10-26T10%3A22%3A00.000Z&simulation=1&catalog=Satellite&source_id=25544&model=tle_satellite
```

Minimal repair: after selection acknowledges, merge identity into the latest route/time intent only while route/client/selection generation remains valid. Preserve newer temporal intent instead of replaying captured query state; discard continuations superseded by navigation. Add deferred-selection regressions for Play and Live before acknowledgement. Disabling only simulation controls does not protect history or the separate Time surface.

## P2: Watch can restore an old observer and superseded pass geometry

Location: `frontend/src/features/workspace/WorkspaceShell.tsx:103-108`.

Reproduce: open passes at observer A, choose **Watch simulation**, then change observer or perform same-Sky history navigation before a bridge acknowledgement completes. Observer/time/history controls are not protected by `passBusy`. `watchPass()` checks only the client, which remains unchanged for in-place observer/history changes. It continues clearing selection, applying the old pass epoch and A's azimuth/altitude, then navigates with the original query. This replaces the newer observer URL and can temporarily apply A's geometry at observer B. Its captured camera also overwrites FOV/display changes made during the pending sequence.

Confirmed with actual transpiled `watchPass()`, deferring `getNavigationState` while a newer observer URL was applied. The old operation still dispatched `clearSelection` and `setNavigationView`. Observed navigation order:

```text
/sky-engine?lat=35&lng=-120&elev=0
/sky-engine?lat=40&lng=-80&elev=300&date=2026-10-26T10%3A22%3A00.000Z&simulation=1
```

Minimal repair: bind Watch to the exact client, location generation, observer and pass-query generation; recheck after every await and invalidate on newer observer/time/navigation intent. Verify the native observer matches the observer that produced the pass before applying its geometry. The neighboring `solarSource`/`onSolar` path demonstrates location-generation guarding. Add a deferred-ack regression that changes observer/history and proves no subsequent simulation/camera/URL mutation.

## Context and scope

Loaded documents: `docs/context/CORE_CONTEXT.md`, `docs/context/LIVE_SESSION_BRIEF.md`, `docs/context/CONTEXT_MANIFEST.yaml`, `docs/validation/satellite-observing/PLAN.md`, `docs/validation/SYSTEM_VALIDATION_SPEC.md`, and relevant sections of `docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md`. This matches the explicitly delegated bounded review context. No unrelated packs or broad docs scan. At initial loading CORE/LIVE still described the previous pilot stop; PLAN supplied the new observing authorization. Governance files were being reconciled concurrently and were not final review inputs. `using-superpowers/SKILL.md` was inspected; its subagent exception applies.

Inspected requested frontend time/simulation/panel/CSS, bridge/protocol, native adapter selection/camera/time behavior, backend pass service/route/main registration, relevant tests, preview delivery configuration, and browser qualification script without executing it.

No additional actionable backend finding identified. Code inspection found explicit pilot-profile/hash/inventory qualification, freshness checks at pass endpoints, string identities, local Skyfield/DE442s geometry, sampled optical conditions separated from unknown brightness/weather, bounded calculation/results/cache, and final mounted-generation checking. These are review observations, not newly executed scientific qualification.

## Commands and evidence

Working directory: `/home/rocco/Astronomy-Hub/.worktrees/sky-satellite-observing-1`.

- `git rev-parse HEAD` → `d2909a52d3f747c555ca87eff112bab83c064779`.
- `git branch --show-current` → `sky-satellite-observing-1`.
- `git status --short`, `git diff --stat d2909a52`, scoped `git diff d2909a52 -- ...` → uncommitted application/test changes; governance edits appeared during review.
- `git diff --check` → exit0, no output.
- `git diff --name-only d2909a52 -- vendor frontend/public integrations runtimes/sky-adapter/plugin.js` → exit0, no paths. Tracked native source/assets/pins/plugin unchanged in those scopes; this does not independently inventory mounted data.
- `node --test tests/runtime/satellite-simulation.test.mjs` → exit0; TAP reports1 test file passed,0 failed,0 skipped. Existing protocol/native-clock cases pass; the async races are not covered there.
- Two `node <<'JS'` read-only reproductions loaded actual WorkspaceShell handlers with `fs.readFileSync`, transpiled using `frontend/node_modules/typescript.transpileModule`, evaluated with `vm.runInContext`, and deferred bridge promises. Both exited0 and produced the stale navigation sequences quoted above. No reproduction files were created.
- Targeted `cat`, `sed`, `nl -ba`, and `rg -n` inspected the named paths and direct supporting source. Initial `cat PLAN.md` failed because the plan is under `docs/validation/satellite-observing/PLAN.md`; the correct file was then read. Initial report write using `python` failed because only `python3` is installed; no report bytes were written by that command, then `apply_patch` created this report.

No browser, Docker, backend scientific suite, broad frontend suite or build was run by this reviewer, to avoid competing with frozen application qualification. No source acquisition, native clock injection, source promotion, commit, push or PR action. Application files were not edited.

Recommended next task: repair these async intent races, add deterministic regressions, rerun affected qualification, then request the separately planned immutable exact-HEAD review. Owner/device acceptance remains separate.
