# Sky Engine Code Salvage Inventory Before Renderer Reset

Date: 2026-05-01
Scope: pre-reset inventory only (no deletions, no runtime implementation changes)
Mode: renderer reset planning toward Stellarium-style low-level renderer authority

## Classification Key

- KEEP: useful regardless of renderer.
- MIGRATE: feed into new Stellarium-style WebGL2/WebGPU renderer path.
- FREEZE: retain as legacy while replacement is validated.
- DELETE_LATER: likely obsolete after replacement; do not delete now.
- UNKNOWN: needs targeted investigation.

## 1. Keep Regardless of Renderer

| Path | Classification | Why | Renderer Dependency | Replacement Target | Deletion Condition | Migration Condition |
|---|---|---|---|---|---|---|
| frontend/src/features/sky-engine/SkyEngineScene.tsx | KEEP | Primary route-level orchestration shell, selection/control/state bridge, and scene ownership surface stay required even if renderer swaps. | Medium (currently mounts Babylon runtime path) | Keep as host shell that mounts new renderer adapter. | N/A | Migrate when renderer mount boundary is ready and behavior-equivalent. |
| frontend/src/features/sky-engine/SkyEngineRuntimeBridge.ts | KEEP | Runtime wiring and service sync surface remains needed for host <-> engine control flow. | Low-Medium | Host bridge for new renderer authority. | N/A | Keep API stable; migrate internals only at adapter seam. |
| frontend/src/features/sky-engine/engine/sky/contracts/** | KEEP | Canonical typed contracts (observer/stars/tiles/scene) are renderer-agnostic and required for deterministic behavior. | Low | Continue as canonical contract layer. | N/A | N/A |
| frontend/src/features/sky-engine/engine/sky/core/** | KEEP | Core selection/index/policy helpers are useful for data flow and parity validation independent of draw backend. | Low-Medium | Reused by renderer-agnostic scene assembly path. | N/A | If any helper encodes Babylon-specific assumptions, migrate or split. |
| frontend/src/features/sky-engine/engine/sky/adapters/fileTileRepository.ts | KEEP | File-backed tile ingestion is needed regardless of renderer. | Low | Remains data source adapter. | N/A | N/A |
| frontend/src/features/sky-engine/engine/sky/adapters/ephCodec.ts | KEEP | EPH decode contract is ingestion-side and renderer-independent. | Low | Remains codec utility. | N/A | N/A |
| frontend/src/features/sky-engine/engine/sky/adapters/healpix.ts | KEEP | HEALPix traversal/math remains required for source-faithful sky data flow. | Low | Reused directly. | N/A | N/A |
| frontend/src/features/sky-engine/engine/sky/adapters/starsSurveyRegistry.ts | KEEP | Survey ordering/gating logic mirrors Stellarium source behavior and should remain. | Low | Reused in renderer-reset path. | N/A | N/A |
| frontend/src/features/sky-engine/engine/sky/services/sceneAssembler.ts | KEEP | Scene packet assembly remains needed independent of draw API. | Low-Medium | Keep as packet authority feeding renderer. | N/A | Keep interfaces stable while swapping render backend. |
| frontend/src/features/sky-engine/engine/sky/runtime/StellariumCoreRuntime.ts | KEEP | Source-shaped lifecycle core is strategic for source parity and renderer-neutral control sequencing. | Low-Medium | Retain as lifecycle authority. | N/A | Continue only as source parity layer, not Babylon extension. |
| frontend/src/features/sky-engine/engine/sky/runtime/StellariumModuleRuntime.ts | KEEP | Source-shaped module lifecycle/ownership logic is parity-critical and renderer-agnostic. | Low | Retain as module authority. | N/A | N/A |
| frontend/src/features/sky-engine/engine/sky/runtime/StellariumObjectRuntime.ts | KEEP | Source-shaped object registry/lifecycle/info plumbing is foundational for any renderer path. | Low | Retain as object authority. | N/A | N/A |
| frontend/src/features/sky-engine/engine/sky/runtime/StellariumProjectionRuntime.ts | KEEP | Native projection semantics are strategic and should survive renderer reset. | Medium | Projection authority layer for new renderer path. | N/A | Expand toward full projection set as planned. |
| frontend/src/features/sky-engine/engine/sky/runtime/erfa*.ts and timeScales.ts | KEEP | Astrometry/time math is renderer-independent parity foundation. | Low | Reused directly. | N/A | N/A |
| frontend/src/features/sky-engine/engine/sky/runtime/SkyObserverService.ts + observer* helpers | KEEP | Observer-state authority is required regardless of draw backend. | Low | Reused directly. | N/A | N/A |
| frontend/src/features/sky-engine/engine/sky/runtime/SkyClockService.ts | KEEP | Time control and deterministic clock semantics remain required. | Low | Reused directly. | N/A | N/A |
| frontend/src/features/sky-engine/pickTargets.ts and useSkyEngineSelection.ts | KEEP | Selection/routing logic remains required with any renderer. | Low-Medium | Keep selection layer above renderer adapter. | N/A | N/A |
| docs/runtime/port/FULL_STELLARIUM_SOURCE_PORT_PLAN.md | KEEP | Canonical source mapping and execution order reference remains required post-reset. | None | Continue as source-of-truth plan. | N/A | N/A |
| docs/runtime/port/RENDERER_DECISION_RECORD.md | KEEP | Final renderer direction governance document. | None | Keep as reset authority record. | N/A | N/A |
| frontend/scripts/profile_sky_engine_runtime_perf.mjs | KEEP | Runtime profiling harness remains needed for parity/performance evidence across renderer swap. | Medium (current telemetry fields include Babylon-stage metrics) | Keep script; adapt telemetry adapters later. | N/A | Migrate field extraction once new renderer telemetry contract exists. |
| docs/development/WSL_DEV_WORKFLOW.md, docs/development/FAST_SKY_ENGINE_DEV.md, docs/dev/env_setup.md | KEEP | Local run/profiling workflows remain needed independent of chosen renderer. | None | Keep and update command references only when adapter changes. | N/A | N/A |

## 2. Migrate Into Low-Level Stellarium Renderer Path

| Path | Classification | Why | Renderer Dependency | Replacement Target | Deletion Condition | Migration Condition |
|---|---|---|---|---|---|---|
| frontend/src/features/sky-engine/engine/sky/runtime/modules/StarsModule.ts | MIGRATE | Owns stars runtime orchestration and source-shaped intent emission; should feed new renderer directly. | High (currently syncs directStarLayer and painter shell) | New low-level renderer draw path fed by source-shaped stars batches. | N/A | Migrate after renderer adapter can consume projected stars + painter/source intents. |
| frontend/src/features/sky-engine/engine/sky/runtime/modules/runtimeFrame.ts | MIGRATE | Central projection/filter/visibility/ranking flow for rendered entries; major parity logic source. | Medium-High | Shared frame-prep feeding low-level draw backend. | N/A | Migrate when new renderer requires same projected object contract. |
| frontend/src/features/sky-engine/engine/sky/runtime/starsRenderVisitor.ts | MIGRATE | Source-shaped stars traversal logic (render_visitor / survey walk) is key parity input. | Low | Keep as traversal producer for new renderer. | N/A | N/A |
| frontend/src/features/sky-engine/engine/sky/runtime/SkyProjectionService.ts | MIGRATE | Active viewport projection service and camera/FOV interface needed by host and renderer. | Medium | Use as interim projection gateway or wrap around full projection runtime. | N/A | Migrate when new renderer mount consumes same view/projection APIs. |
| frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts | MIGRATE | Useful as source-shaped painter API contract and command/lifecycle seam, even if backend implementation changes. | Medium-High (current behavior is CPU-modeled and legacy-stage) | New Stellarium-style low-level renderer backend behind same/source-shaped painter API. | N/A | Migrate when real draw backend is connected to painter lifecycle. |
| frontend/src/features/sky-engine/engine/sky/runtime/modules/ObjectRuntimeModule.ts | MIGRATE | Object projection/selection/render prep logic should feed new renderer as non-star path. | Medium | New backend object lane. | N/A | Migrate with runtimeFrame/object entry contract compatibility. |
| frontend/src/features/sky-engine/engine/sky/runtime/modules/PlanetRuntimeModule.ts | MIGRATE | Planet pipeline should move to new backend while preserving source-shaped thresholds. | High | New renderer planet lane. | N/A | Migrate after low-level backend supports object/disk/point transitions. |
| frontend/src/features/sky-engine/engine/sky/runtime/modules/DsoRuntimeModule.ts | MIGRATE | DSO render preparation logic remains needed independent of Babylon. | High | New renderer DSO lane. | N/A | Migrate after low-level renderer can consume DSO shape/style entries. |
| frontend/src/features/sky-engine/engine/sky/runtime/modules/OverlayRuntimeModule.ts | MIGRATE | Overlay cadence/state is needed; draw implementation should move to new path. | Medium | New renderer overlay lane. | N/A | Migrate when new backend supports overlay primitives/text paths. |
| frontend/src/features/sky-engine/engine/sky/runtime/modules/AtmosphereModule.ts, MilkyWayModule.ts, LandscapeModule.ts, SatelliteRuntimeModule.ts | MIGRATE | Domain modules remain required but current draw coupling is backend-specific. | High | Dedicated low-level renderer module lanes. | N/A | Migrate module-by-module after backend primitives exist. |
| frontend/src/features/sky-engine/engine/sky/runtime/modules/SceneReportingModule.ts and luminance modules | MIGRATE | Telemetry/evidence instrumentation needed for parity acceptance regardless of renderer. | Low-Medium | Keep instrumentation contract with backend-neutral fields. | N/A | Migrate field mapping when backend changes metric names. |
| frontend/tests/test_stellarium_core_runtime.test.js | MIGRATE | Validates source-shaped lifecycle behavior that should stay active after renderer reset. | Low | Continue unchanged unless lifecycle contract changes. | N/A | N/A |
| frontend/tests/test_stellarium_module_runtime.test.js | MIGRATE | Protects source-shaped module semantics independent of draw backend. | Low | Continue. | N/A | N/A |
| frontend/tests/test_stellarium_object_runtime.test.js | MIGRATE | Protects object lifecycle/dispatch semantics independent of renderer. | Low | Continue. | N/A | N/A |
| frontend/tests/test_stellarium_projection_runtime.test.js | MIGRATE | Protects source-shaped projection logic; needed for low-level renderer parity. | Medium | Continue and expand. | N/A | N/A |

## 3. Freeze as Legacy Babylon/Custom Renderer

| Path | Classification | Why | Renderer Dependency | Replacement Target | Deletion Condition | Migration Condition |
|---|---|---|---|---|---|---|
| frontend/src/features/sky-engine/directStarLayer.ts | FREEZE | Explicit Babylon thin-instance star ownership; required as fallback while replacement is unproven. Do not remove now. | Very High (Babylon) | Low-level Stellarium-style star draw backend. | N/A | Keep frozen until new backend passes parity and runtime stability gates. |
| frontend/src/features/sky-engine/directObjectLayer.ts | FREEZE | Babylon direct object sync path for non-star primitives; legacy fallback during transition. | Very High | New low-level object renderer path. | N/A | Freeze while replacement gains parity coverage. |
| frontend/src/features/sky-engine/directBackgroundLayer.ts | FREEZE | Babylon-oriented background implementation; retains fallback utility. | High | New low-level background/atmosphere path. | N/A | Freeze until visual parity checks pass. |
| frontend/src/features/sky-engine/directOverlayLayer.ts | FREEZE | Current overlay draw surface tied to legacy path. | High | New low-level overlay renderer path. | N/A | Freeze until overlay parity validated. |
| frontend/src/features/sky-engine/PlanetRenderer.ts, DsoRenderer.ts, MoonRenderer.ts, SatelliteRenderer.ts, PointerRenderer.ts | FREEZE | Babylon renderer implementations are legacy draw adapters and should not receive new parity-port effort. | Very High | Module-specific low-level renderer paths. | N/A | Freeze until each replacement lane is validated. |
| frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterBackendPort.ts | FREEZE | Stage shell for side-by-side mapped execution tied to legacy Babylon handoff experiments. | High | Real low-level backend execution plan and adapter. | N/A | Freeze and use only for historical telemetry context. |
| frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterStarsBackendLayer.ts | FREEZE | Explicit Stage 4D placeholder for painter-owned Babylon layer, not target final architecture. | Very High | Replace with low-level renderer-owned stars lane. | N/A | Freeze; no new features in this layer. |
| docs/runtime/port/S1_POINT_ITEM_PIPELINE_AUDIT_2026-04-26.md ... S9_STARS_LUMINANCE_MAGNITUDE_MAP_2026-04-26.md | FREEZE | Valuable historical evidence and migration context from Babylon-era staged audits; not future implementation authority. | None | Keep as baseline reference for regression checks only. | N/A | N/A |
| frontend/tests/test_painter_backend_port.test.js, frontend/tests/test_painter_port_command_queue.test.js, frontend/tests/sky-engine-stars-runtime.test.js | FREEZE | Validate current legacy staged behavior; retain for fallback/regression until replacement stable. | Medium-High | New tests for low-level backend path plus retained legacy fallback checks. | N/A | Freeze legacy expectations; add new-path tests separately. |

## 4. Delete Later After Replacement

| Path | Classification | Why | Renderer Dependency | Replacement Target | Deletion Condition | Migration Condition |
|---|---|---|---|---|---|---|
| frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterStarsBackendLayer.ts | DELETE_LATER | Placeholder adapter for painter-owned Babylon side-by-side path is likely obsolete once real low-level renderer is active. | Very High | New low-level renderer backend layer. | Delete only after new backend is default, parity-validated, and no callers remain. | N/A |
| frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterBackendPort.ts | DELETE_LATER | Mapping/execution-status shell likely redundant after direct low-level backend ownership is in place. | High | Native low-level backend execution in renderer core. | Delete only after telemetry + migration docs no longer depend on mapped/executed_side_by_side status model. | N/A |
| frontend/tests/test_painter_backend_port.test.js | DELETE_LATER | Test is tied to legacy side-by-side shell semantics rather than final renderer architecture. | High | New backend integration/parity test suite. | Delete after legacy shells are removed and equivalent new-path evidence exists. | N/A |
| frontend/tests/test_painter_port_command_queue.test.js | DELETE_LATER (conditional) | If new renderer no longer uses this command-queue abstraction, test becomes obsolete; if abstraction is retained, reclassify to KEEP. | Medium | Either retained painter API tests or new backend tests. | Delete only if painter command queue is fully retired. | N/A |

## 5. Unknown / Needs Investigation

| Path | Classification | Why | Renderer Dependency | Replacement Target | Deletion Condition | Migration Condition |
|---|---|---|---|---|---|---|
| frontend/src/features/sky-engine/objectClassRenderer.ts | UNKNOWN | Appears to provide shared visual helpers (selection ring texture) but coupling to Babylon and future renderer needs is unclear. | Medium-High | TBD: either renderer-agnostic asset utility or backend-specific artifact. | Delete only if new backend has independent equivalent and no consumers. | Migrate if reusable texture/asset semantics are backend-agnostic. |
| frontend/src/features/sky-engine/starRenderer.ts | UNKNOWN | Contains critical visual math/profile logic but may mix renderer assumptions with physics/parity math. | Medium | Split target: renderer-agnostic star visual policy vs backend draw specifics. | Delete renderer-specific parts only after split + replacement. | Migrate parity math portions if source-aligned. |
| frontend/src/features/sky-engine/projectionMath.ts | UNKNOWN | Current active projection utility may overlap with StellariumProjectionRuntime responsibilities. | Medium | Consolidated projection authority (likely runtime projection layer). | Delete only if full projection stack supersedes and callers are migrated. | Migrate whichever functions remain canonical. |
| frontend/src/features/sky-engine/sceneQueryState.ts | UNKNOWN | Query/tile resolution may stay data-side, but dependency boundaries with rendering need validation. | Low-Medium | Keep as data-stage query resolver if decoupled. | Delete only if replaced by equivalent source-shaped resolver. | Migrate after boundary audit. |
| docs/runtime/port/module-inventory.md and module-gates.md | UNKNOWN (operational) | Canonical mapping docs include stage assumptions from legacy path; need reset-era interpretation policy. | None | Keep as canonical tracker with reset annotations. | N/A | Migrate by adding renderer-reset notes, not replacing authority. |

## 6. Recommended Next Safe Step

1. Freeze policy checkpoint.
- Mark Babylon parity-port implementation lane as frozen in execution notes.
- Allow only bugfixes/stability fixes in legacy renderer path.

2. Create an explicit renderer adapter boundary contract document.
- Define host -> renderer inputs: observer/time/FOV/projection mode/selection.
- Define renderer -> host outputs: picked object IDs, diagnostics, frame telemetry.

3. Branch test strategy into two lanes.
- Legacy lane (frozen): keep directStarLayer/painter shell tests for fallback safety.
- New renderer lane: create empty test stubs for adapter contract and parity checkpoints.

4. Start migration from one bounded slice only.
- First slice candidate: StarsModule + runtimeFrame + starsRenderVisitor feeding new renderer adapter without deleting directStarLayer.

5. Deletion gate policy.
- No DELETE_LATER path is removed until:
  - new renderer is default,
  - parity checkpoints pass (visual + functional),
  - fallback rollback window is explicitly closed.

## Notes

- No files were deleted.
- No renderer runtime changes were implemented in this task.
- Route ownership remains unchanged.
- directStarLayer remains in place as requested.

## Renderer Adapter Boundary Created

Files added:
- frontend/src/features/sky-engine/engine/sky/renderer/stellariumRendererContract.ts
- frontend/src/features/sky-engine/engine/sky/renderer/renderItems.ts
- frontend/src/features/sky-engine/engine/sky/renderer/NoopStellariumRenderer.ts
- frontend/tests/test_stellarium_renderer_adapter_contract.test.js
- frontend/tests/test_stellarium_renderer_boundary_guards.test.js

What this enables:
- A renderer-neutral boundary between Sky Engine runtime and future Stellarium-style low-level rendering.
- Explicit frame input and render item submission contracts aligned to Stellarium render_gl item concepts.
- A no-op backend that validates lifecycle and item submission paths without affecting runtime visuals.
- Guardrail tests for contract usage and Babylon isolation inside the new renderer boundary folder.

What this does not enable:
- No renderer replacement is active by default.
- No new WebGL2/WebGPU draw backend is implemented.
- No route or viewport ownership changes.
- No continuation of Babylon parity-port implementation work.

Legacy path status:
- directStarLayer remains the frozen active legacy rendering path.
- No renderer replacement has occurred yet.

## Renderer Reset Step 2 - Stars Point Item Feed

Files added/changed:
- frontend/src/features/sky-engine/engine/sky/renderer/adapters/starsPointItemsAdapter.ts (added)
- frontend/src/features/sky-engine/engine/sky/runtime/modules/StarsModule.ts (changed)
- frontend/src/features/sky-engine/SkyEngineRuntimeBridge.ts (changed)
- frontend/tests/test_stellarium_renderer_adapter_contract.test.js (changed)
- frontend/tests/sky-engine-stars-runtime.test.js (changed)

What is now migrated:
- Stars runtime now emits renderer-neutral point item diagnostics from projected star entries.
- Adapter support exists for projected stars and painter 2D point command conversion.
- Emitted items conform to the renderer boundary point item model (`ITEM_POINTS`, order, point count, deterministic vertex payload, stars source module).

What remains legacy:
- directStarLayer remains the active visual star output path.
- painterPort remains active and available in the legacy runtime path.
- No low-level Stellarium renderer draw path is enabled in production runtime.

Current ownership and mode:
- directStarLayer remains active.
- Renderer boundary remains non-visual diagnostics only.
- No visual parity claim is made for this step.
