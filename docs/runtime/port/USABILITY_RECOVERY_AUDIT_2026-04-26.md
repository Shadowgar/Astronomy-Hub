# Usability Recovery Audit — 2026-04-26

Mode: Stellarium Port Mode ACTIVE  
Scope: runtime/usability audit only. No implementation changes.

## Files Read

1. `docs/runtime/port/CODEX-HANDOFF.md`
2. `docs/runtime/port/PORT_DRIFT_AUDIT_2026-04-26.md`
3. `docs/runtime/port/S1_POINT_ITEM_PIPELINE_AUDIT_2026-04-26.md`
4. `docs/runtime/port/S2_RENDER_GL_ITEM_LIFECYCLE_AUDIT_2026-04-26.md`
5. `docs/runtime/port/S3_RENDER_GL_FLUSH_LIFECYCLE_AUDIT_2026-04-26.md`
6. `docs/runtime/port/S4_PAINTER_CLIP_CULL_AUDIT_2026-04-26.md`
7. `docs/runtime/port/S5_CLIP_CAP_GEOMETRY_AUDIT_2026-04-26.md`
8. `docs/runtime/port/S6_FRAME_CONVERSION_CLIP_INFO_AUDIT_2026-04-26.md`
9. `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts`
10. `frontend/src/features/sky-engine/engine/sky/runtime/modules/StarsModule.ts`
11. `frontend/src/features/sky-engine/directStarLayer.ts`
12. `frontend/src/features/sky-engine/engine/sky/runtime/SkyCore.ts`
13. `frontend/scripts/profile_sky_engine_runtime_perf.mjs`

## Runtime Execution Performed

1. Started frontend runtime at `http://127.0.0.1:4173/sky-engine?debugTelemetry=1`.
2. Captured baseline profile with:
   - `cd frontend && npm run profile:sky-engine-runtime`
   - artifact: `.cursor-artifacts/parity-compare/module2-live-runtime-profile-2026-04-26.json`
3. Captured pan/zoom interaction profile (Playwright scripted drag + wheel) with:
   - `node --input-type=module` scripted capture against same URL
   - artifact: `.cursor-artifacts/parity-compare/module2-live-runtime-profile-interaction-2026-04-26.json`

## Current Runtime Profile Summary

## Normal view (baseline capture)

Observed state:
- `dataMode`: `loading` for full baseline window.
- `sourceLabel`: `Loading tiles…`.
- rendered stars: `0` (`starThinInstanceCount=0`, painter payload star count `0`).

Performance (baseline sample window):
- `frameTotalMs`: avg `1.678`, p95 `2.4`, max `4.8`
- `sceneRenderMs`: avg `0.414`, p95 `0.7`, max `0.8`
- `projectionMs`: avg `0.049`
- `collectProjectedStarsMs`: avg `0`
- `starLayerSyncMs`: avg `0`

UI/overlay telemetry (from `uiPerf`) during same mode shows low React commit cost and mutation counts present, but no rendering load due zero stars.

## Post pan/zoom interaction

Observed state transition:
- moved from `loading` to `hipparcos`.
- `sourceLabel`: `Hipparcos · 8,870 stars`.
- rendered stars rose to ~`424` (`starThinInstanceCount`, painter payload, backend mapped stars all aligned).

Performance (post-interaction samples):
- `frameTotalMs`: avg `4.621`, p95 `12.7`, max `23.6`
- `sceneRenderMs`: avg `0.683`, p95 `1.0`, max `1.1`
- `projectionMs`: avg `5.312`, p95 `10.8`, max `12.2`
- `collectProjectedStarsMs`: avg `5.233`, p95 `10.6`, max `12.0`
- `starLayerSyncMs`: avg `0.137`, p95 `0.2`, max `1.5`
- React commit (`reactLastCommitMs`): avg `0.363`, max `0.5`
- overlay mutations (`overlayMutationCount`): high count during interaction (avg ~205), but no direct mutation-time metric is currently exposed.

## Peak-frame evidence

Worst captured frame (`frameTotalMs=23.6`) had:
- `sky-stars-runtime-module` total `18.4ms` (update `17.7ms`)
- `sceneRenderMs=1.1ms`
- `starLayerSyncMs=0ms`
- projection marked reused (`starsProjectionReused=1`, `collectProjectedStarsMs=0`)

This indicates uninstrumented or non-step-accounted StarsModule/update cost spikes can dominate isolated worst frames.

## What Is Making the App Feel Unusable

Primary blockers observed now:

1. **Startup empty-sky interval**
- Normal-view profile stayed in `loading` with `0` visible stars.
- User sees an effectively empty star field until catalog state advances.

2. **Interaction-time StarsModule CPU spikes**
- Typical pan/zoom cost is projection-heavy (`collectProjectedStarsMs` frequently 5–12ms).
- Additional large stars-module outliers occur even when projection is reported reused (peak `17.7ms` update), producing choppy frames.

3. **Visible-star density remains low for expected Stellarium feel**
- Even after load: ~`424` rendered stars, with source noted as `Hipparcos · 8,870 stars`.
- This is usable for debug validation, but still visually sparse for expected Stellarium-like sky richness.

## Bottleneck Classification

Based on captured telemetry:

- Star projection: **Yes, major during interaction** (`collectProjectedStarsMs` dominates typical interaction-cost frames).
- Star sync/GPU upload: **No, minor** (`starLayerSyncMs` small; upload not dominant).
- React/UI commits: **No, minor** (sub-ms commit durations).
- Scene render: **No, minor** (`sceneRenderMs` ~0.4–1.1ms).
- Repeated allocation/GC/uninstrumented work: **Likely contributing** (large stars-update spikes with projection reuse flag set).
- Background/landscape: **Secondary** (landscape module contributes sub-ms to ~1ms).
- Pointer/label overlays: **Secondary/unclear** (mutation count high, but no direct mutation-time metric exposed here).

## Why Visible Star Count Is Low (Current Evidence)

1. Runtime transitions through a loading phase with zero rendered stars.
2. Loaded mode in this capture is Hipparcos only (`sourceLabel: Hipparcos · 8,870 stars`), not richer combined surveys.
3. Rendered-star count at this FOV/limit stayed near `424`, constrained by current magnitude/view filtering and available loaded survey state.

Important nuance:
- `sceneState.backendStarCount` remained `0` even while 424 stars rendered; this field is not a trustworthy loaded-catalog proxy for this runtime path.
- Practical loaded-source indicator in this capture is `sourceLabel` plus painter/direct rendered counts, not `backendStarCount`.

## Active Visual Path (Direct vs Painter)

Current visual ownership is still **direct star layer**:
- `painterStarTelemetry.directStarLayerStillActive = true`
- `backendExecutionStatus = execution_disabled`
- painter stars batches are mapped but not executed as backend draw path.

So visible stars are coming from `directStarLayer`, with painter path currently acting as mirrored telemetry/batch shaping rather than active backend renderer.

## What Is Not Yet Proven

Because star count and source mode are bounded in this capture:

1. Full high-density star behavior under richer survey mix (beyond Hipparcos) is not proven.
2. Whether overlay mutation volume becomes a hard frame-time bottleneck at higher label/object density is not proven (count available, mutation-time not exposed).
3. Whether worst-frame stars-update spikes are allocation/GC versus missing timing buckets is not proven from existing step metrics.

## Immediate Usability Recovery Recommendations (Not Parity Claims)

Smallest safe recovery sprint (usability-first, non-parity-claiming):

1. **Eliminate startup empty-sky stall as first priority**
- Reduce/avoid prolonged `dataMode=loading` with zero stars at `/sky-engine` entry.
- Target user-visible result: stars appear quickly and consistently after page load.

2. **Stabilize StarsModule interaction cost**
- Focus on reducing the non-render stars-update spikes that currently produce worst-frame choppiness.
- Keep scope inside existing stars update path; avoid wrapper-stage additions.

3. **Increase practical visible star density within current loaded source constraints**
- Tune current runtime thresholds/path so loaded Hipparcos mode does not feel visually sparse at common FOV ranges.
- This is a usability stabilization move, not a parity-complete claim.

4. **Keep direct-star visual path as active stability path during recovery**
- Do not switch user-visible ownership to painter backend yet.
- Maintain current direct path while reducing lag and empty-state pain.

## Next True Stellarium Source-Port Slice (Separate Track)

From S6 decision context, the next parity slice remains:
- **S7 target: `stars.c` traversal (`render_visitor` / `stars_render`)**

But this should start **after** the short usability recovery sprint above, so user-facing runtime is not blocked by current startup sparsity and frame-time spikes.

## Separation: Usability Now vs Parity Continuation

## Make app usable now
- Address startup no-stars state duration.
- Reduce StarsModule interaction spikes and frame-time outliers.
- Improve visible star density under active source mode.
- Keep direct-star path as production-visible safety path.

## Continue Stellarium parity
- Proceed with S7 `stars.c render_visitor` traversal port slice.
- Keep parity assertions source-cited and bounded.
- Do not treat usability recovery as parity completion.

## Final Audit Conclusion

Current primary bottleneck is **not scene render, GPU sync, or React commit overhead**.  
Current usability pain is dominated by:
1. **initial loading interval with zero visible stars**, and
2. **StarsModule update/projection-side CPU spikes during interaction**.

This yields a clear, short recovery sprint before deeper parity continuation, without claiming Stellarium parity completion.

## Recovery Sprint 1 Implementation

### Scope Implemented

- Frontend/runtime-only sky-engine changes.
- No backend/API or deployment changes.
- Direct star layer remains active visual path.
- Painter backend rendering remains disabled by default.
- No Stellarium parity completion claims.

### What Changed

1. Startup non-empty star fallback while loading (no loading-state masking)
- Added a bounded startup fallback path that projects non-engine star objects when `scenePacket` is unavailable.
- Added temporary viewport-centered seed stars only for initial loading when both conditions hold:
  - no `scenePacket`,
  - no backend star catalog stars available.
- Loading state is still reported as loading (`dataMode=loading`, `sourceLabel=Loading tiles…`), but star output is no longer forced to zero.

2. StarsModule interaction stability
- Relaxed projection-reuse thresholds and increased max reuse streak in `framePacingDecisions` to reduce unnecessary full reprojection churn:
  - center threshold `0.002 -> 0.0035` rad
  - FOV threshold `0.2 -> 0.35` deg
  - reuse streak cap `2 -> 6`
- Kept existing reuse decision structure; no wrapper stage added.
- Added loading-safe projected-star retention:
  - if loading returns empty projected stars, preserve last projected stars from cache.

3. Practical visible-star density tuning (bounded, non-parity)
- Added a small Hipparcos-mode usability boost for limiting magnitude in StarsModule:
  - `+0.3` mag, bounded by `hardLimitMag`.
- This is explicitly usability tuning, not a Stellarium parity claim.

4. Minor hot-path allocation reduction
- Replaced per-frame `map` allocation in painter point emission with a pre-sized loop.

### Tests Added/Updated

- `frontend/tests/sky-engine-runtime-frame-projection.test.js`
  - added startup fallback projection coverage for `scenePacket=null`.
- `frontend/tests/sky-engine-stars-runtime.test.js`
  - added cache-preservation coverage when loading returns empty projection.
- `frontend/tests/test_module2_frame_pacing_decisions.test.js`
  - updated thresholds/reuse-cap expectations.
- `frontend/tests/test_module2_stars_projection_reuse.test.js`
  - updated streak-cap and fov-threshold expectations.

### Validation Run

- `npm run typecheck` ✅
- `npm run test -- tests/sky-engine-stars-runtime.test.js tests/test_painter_backend_port.test.js` ✅
- `npm run build` ✅
- `npm run profile:sky-engine-runtime` ✅
- post pan/zoom interaction profile recaptured ✅

### Before/After Profile Summary

Baseline (normal view):
- Before: rendered stars avg `0`, `dataMode=loading`, `sourceLabel=Loading tiles…`
- After: rendered stars avg `6` while still `dataMode=loading` / `sourceLabel=Loading tiles…`

Interaction phase (post pan/zoom):
- Frame total:
  - Before: avg `4.621`, p95 `12.7`, max `23.6`
  - After: avg `2.621`, p95 `4.2`, max `4.3`
- Rendered stars:
  - Before: avg `388.667`, p95 `424`, max `424`
  - After: avg `456.625`, p95 `522`, max `522`
- StarsModule spikes:
  - Before: observed worst `sky-stars-runtime-module` ~`18.4ms` update-heavy outlier
  - After: post-interaction `sky-stars-runtime-module` avg `0.246`, p95 `0.5`, max `0.6`

### What Was Not Claimed As Parity

- No claim of Stellarium frame/projection/render parity completion.
- No claim that startup seed stars represent full survey/catalog behavior.
- No claim that painter backend execution is active parity renderer.

### Remaining Risks

1. Projection cost remains significant when full reprojection does run (`collectProjectedStarsMs` still non-trivial under interaction).
2. Startup seed stars are a temporary usability bridge and may require future tuning/removal once load reliability is improved.
3. Overlay mutation cost is still count-only in this capture path (not direct mutation-time cost).

## Recovery Sprint 1 Verification

Verification date: 2026-05-01  
Scope: stability/regression verification only. No new features.

### Validation Commands Run

- `cd frontend && npm run typecheck` ✅
- `cd frontend && npm run test -- tests/sky-engine-stars-runtime.test.js tests/test_painter_backend_port.test.js tests/test_module2_frame_pacing_decisions.test.js tests/test_module2_stars_projection_reuse.test.js` ✅
- `cd frontend && npm run build` ✅
- `cd frontend && npm run profile:sky-engine-runtime` ✅
- post pan/zoom interaction profile recapture (Playwright scripted) ✅

Artifacts used:
- `.cursor-artifacts/parity-compare/module2-live-runtime-profile-2026-04-26.json`
- `.cursor-artifacts/parity-compare/module2-live-runtime-profile-interaction-2026-04-26.json`

### 1) Loading-state honesty check

Result: **PASS**

- Baseline profile still reports:
  - `sceneState.dataMode = loading`
  - `sceneState.sourceLabel = Loading tiles…`
- At the same time, stars are non-empty (`starThinInstanceCount` summary avg `6`), which confirms fallback output does not mask loading state.
- Fallback is explicitly tagged in code as temporary:
  - `source: 'temporary_scene_seed'` in `SkyEngineScene.tsx`.

### 2) Fallback superseded by real catalog check

Result: **PASS by code/test behavior; NOT runtime-observed in this local capture**

- Runtime capture on 2026-05-01 remained in `loading` (`Loading tiles…`) for sampled windows, so this run did not directly observe a `hipparcos` transition.
- Code path verification shows fallback cannot persist once `scenePacket` exists:
  - `buildStartupLoadingStarSceneObjects(...)` returns `[]` when `scenePacket` is present.
  - `collectProjectedStars(...)` fallback branch is only used when `scenePacket == null`.
  - With `scenePacket`, projection uses packet/tile visitor entries (real catalog path).
- No evidence of permanent fallback mixing that would inflate catalog counts after packet takeover.

### 3) Visual ownership check (directStarLayer vs painter backend)

Result: **PASS**

- Baseline profile last sample reports:
  - `painterStarTelemetry.directStarLayerStillActive = true`
  - `painterStarTelemetry.backendExecutionStatus = execution_disabled`
- Painter backend default remains OFF (`resolvePainterBackendExecutionEnabled()` defaults false; covered by `test_painter_backend_port`).
- No ownership replacement occurred.

### 4) Projection reuse thresholds / stale behavior guard

Result: **PASS**

- Thresholds currently:
  - center: `0.0035` rad
  - fov: `0.35` deg
  - reuse streak cap: `6`
- Reuse cap remains enforced (`starsProjectionReuseStreak >= 6` blocks reuse).
- Focused tests pass:
  - reuse inside thresholds,
  - forced reproject at streak cap,
  - forced reproject on timestamp/fov/magnitude drift.
- No indefinite stale-projection path found.

### 5) Hipparcos density bump boundedness

Result: **PASS**

- `HIPPARCOS_USABILITY_LIMITING_MAG_DELTA = 0.3` applies only when `sceneDataMode === 'hipparcos'`.
- Limiting magnitude is bounded via `Math.min(..., hardLimitMag)`.
- In this capture window (loading mode), no uncontrolled star-count growth occurred.

### 6) Hot-path allocation change and painter batch/command stability

Result: **PASS**

- Baseline profile summary remains structurally stable:
  - `painterStarCommandCount` avg `1`
  - `finalizedPainterStarsBatchCount` avg `1`
  - `starsBatchStarCount` avg `6`
  - `backendMappedStarsCount` avg `6`
- No command/batch inflation regression detected from the point-payload allocation change.

### Current profile summary (2026-05-01 run)

Baseline (`profile:sky-engine-runtime`):
- sampleCount: `37`
- `frameTotalMs`: avg `2.003`, p95 `3.0`, max `8.4`
- `projectionMs`: avg `0.043`
- `starThinInstanceCount`: avg `6`
- state: `loading` / `Loading tiles…`

Interaction recapture:
- baseline samples: `16`, interaction samples: `22`
- interaction `frameTotalMs`: avg `1.391`, p95 `1.7`, max `1.9`
- interaction rendered stars remained small (`~5`) and loading-labeled in this local run (no tile/catalog takeover observed during sample window).

### Regressions found

- No functional regression found in:
  - loading-state truthfulness,
  - directStarLayer ownership,
  - painter backend default-disabled behavior,
  - projection reuse safety guards,
  - bounded magnitude widening behavior.
- Limitation: this verification run did not runtime-observe transition to `hipparcos`; takeover is verified by code path and tests, not this specific live capture.

### Verification decision

Recovery Sprint 1 is **accepted as a usability-only improvement slice**, with bounded scope and no Stellarium parity claim.

## Catalog Load Transition Audit

Audit date: 2026-05-01  
Scope: transition reliability audit only (no feature implementation).

### Transition path summary

Observed transition path in current runtime code:

1. `SkyEngineScene.syncRuntimeModel()` builds `query` and computes `tileQuerySignature` via `resolveScenePacketForQuery(...)`.
2. If no resolved tile payload matches the signature, `scenePacket` remains `previousScenePacket` (or `null`) and scene state reports:
   - `dataMode=loading`
   - `sourceLabel=Loading tiles…`
3. A tile load starts when `tileQuerySignature` changes:
   - `loadSkyRuntimeTiles(query)` -> `fileBackedSkyTileRepository.loadTiles(query)`
4. On successful load:
   - `runtimeTilesRef` + `tileLoadResultRef` are updated,
   - `resolvedTileQuerySignatureRef` is set to the loaded signature,
   - `syncRuntimeModel(true)` reruns packet resolution.
5. Only when `resolvedTileQuerySignatureRef === tileQuerySignature` does `resolveScenePacketForQuery(...)` return a non-null `scenePacket`; then runtime reports real catalog mode/label.

### Why latest profiles stayed `loading`

Longer recaptures still remained loading-only:
- default URL (`debugTelemetry=1`) for 30s: `loading` only.
- `parityMode=1` for 30s: `loading` only.
- `tileMode=hipparcos` for 30s: `loading` only.

Additional network trace during loading:
- large ongoing catalog fetch volume (`/sky-engine-assets/catalog/...`),
- many Gaia tile requests while still loading-labeled,
- star render count stayed fallback-sized (`~6`), no packet takeover observed.

Primary cause from code path + runtime evidence:
- `scenePacket` promotion is strictly signature-matched.
- tile loading is heavy/ongoing in this environment while query/signature-driven refresh remains active.
- result: loading fallback can persist through long windows without observed takeover.

Important note:
- this audit confirms takeover logic exists in code, but runtime capture did not show practical completion under current live conditions.

### Is this a real user risk?

**Yes.**

- Users can remain on fallback-seed stars (`temporary_scene_seed`) for extended periods while UI stays in loading mode.
- This is not only a profiler timing artifact; it reproduced in longer captures and with deterministic parity mode.

### Can fallback persist indefinitely?

**Potentially yes in practice** (under current loader/query behavior and asset-fetch cost), because packet promotion requires timely completion of a matching tile-load cycle.

### Is fallback correctly replaced in normal logic?

**Logically yes, conditionally.**

- Replacement path is correct when matching load resolution occurs.
- In current runtime captures, that condition did not occur within sampled windows, so user-visible takeover reliability is not proven.

### Smallest fix needed before S7?

**Yes, a small catalog-transition reliability fix is recommended before S7.**

Target of the fix should be narrow and transition-focused:
- make catalog packet promotion reliable under normal runtime cadence,
- ensure loading can resolve to real catalog mode within bounded time,
- keep directStarLayer ownership and painter backend defaults unchanged.

### Recommended next step

Run a bounded “Catalog Transition Reliability” mini-sprint (pre-S7), focused only on:
1. stabilizing tile-query/load completion so `scenePacket` can be promoted reliably,
2. proving runtime transition (`loading -> hipparcos` or active catalog mode) in live profile artifacts,
3. preserving current usability fallback semantics without parity overclaims.

### Validation run for this audit

- `npm run typecheck` ✅
- `npm run test -- tests/sky-engine-stars-runtime.test.js` ✅
- `npm run build` ✅
- extended profile recaptures executed (`profile:sky-engine-runtime` with longer duration and URL variants) ✅

## Catalog Transition Reliability Fix

Fix date: 2026-05-01  
Scope: catalog transition reliability only (no renderer ownership change, no parity claim).

### Root cause

`multi-survey` startup used the full computed limiting magnitude before first packet promotion, which activates Gaia-heavy loading early.  
`scenePacket` promotion is signature-gated, so startup could stay `loading` while deep survey loads were still in flight.

In practice this created long fallback-only windows:
- `dataMode=loading`
- `sourceLabel=Loading tiles…`
- temporary seed stars still visible

### Files changed

- `frontend/src/features/sky-engine/sceneQueryState.ts`
- `frontend/src/features/sky-engine/SkyEngineScene.tsx`
- `frontend/tests/test_scene_query_state.test.js`
- `docs/runtime/port/USABILITY_RECOVERY_AUDIT_2026-04-26.md`

### Fix summary

1. Added bounded bootstrap query mode for catalog takeover:
- `resolveRepositoryQueryLimitingMagnitude(...)` now accepts `bootstrapCatalogOnly`.
- When `repositoryMode === 'multi-survey'` and `bootstrapCatalogOnly=true`, query limiting magnitude is capped to `HIPPARCOS_QUERY_LIMITING_MAGNITUDE_MAX`.

2. Enabled bootstrap cap only until first real packet:
- `SkyEngineScene.buildSceneControllerModel(...)` now passes:
  - `bootstrapCatalogOnly: config.previousScenePacket == null`
- This ensures startup promotes a usable Hipparcos packet first.
- After first packet exists, normal multi-survey limiting magnitude behavior resumes.

3. Added focused transition tests:
- bootstrap cap applies for multi-survey startup only.
- post-bootstrap multi-survey remains uncapped.
- unresolved -> resolved query path promotes from loading to hipparcos packet with expected signature.
- existing stale-signature guard remains covered.

### Before/after runtime transition behavior

Before fix (repeated long captures):
- remained `loading` / `Loading tiles…` for full sample windows.
- fallback stars remained active; no observed hipparcos takeover.

After fix:
- transition trace captured in live runtime:
  - `loading` -> `hipparcos` in ~0.6s
  - artifact: `.cursor-artifacts/parity-compare/module2-live-runtime-profile-transition-trace-post-fix.json`
- extended profile stayed catalog-backed:
  - artifact: `.cursor-artifacts/parity-compare/module2-live-runtime-profile-2026-04-26-post-transition-fix.json`
  - mode: `hipparcos`
  - sourceLabel: `Hipparcos · 8,870 stars`
  - direct star layer still active
  - painter backend status still `execution_disabled`

### Validation

- `npm run typecheck` ✅
- `npm run test -- tests/sky-engine-stars-runtime.test.js tests/test_scene_query_state.test.js` ✅
- `npm run build` ✅
- `npm run profile:sky-engine-runtime` ✅
- extended profile capture + transition trace capture ✅

### Remaining risks

1. This fix targets startup reliability only; deeper multi-survey load timing/perf remains separate.
2. Gaia/richer survey promotion behavior after Hipparcos bootstrap is not claimed as parity-complete.
3. This is a usability reliability fix, not a Stellarium parity completion claim.
