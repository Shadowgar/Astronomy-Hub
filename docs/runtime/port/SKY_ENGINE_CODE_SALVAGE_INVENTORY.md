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

## Renderer Reset Step 3 - WebGL2 Backend Shell

Files added:
- frontend/src/features/sky-engine/engine/sky/renderer/webgl2/WebGL2StellariumRenderer.ts
- frontend/src/features/sky-engine/engine/sky/renderer/webgl2/WebGL2ShaderProgram.ts
- frontend/src/features/sky-engine/engine/sky/renderer/webgl2/WebGL2BufferPool.ts
- frontend/src/features/sky-engine/engine/sky/renderer/webgl2/WebGL2RendererState.ts
- frontend/src/features/sky-engine/engine/sky/renderer/webgl2/webgl2Capabilities.ts
- frontend/tests/test_webgl2_stellarium_renderer.test.js

Files changed:
- frontend/src/features/sky-engine/engine/sky/renderer/stellariumRendererContract.ts
- frontend/tests/test_stellarium_renderer_boundary_guards.test.js

Backend status:
- WebGL2 backend exists as a shell implementation only.
- It implements the renderer boundary contract, accepts point items, records diagnostics, supports resize, and disposes safely.
- It is not active by default and is not wired as the active visual renderer path.

Legacy ownership status:
- directStarLayer remains the active visual star output path.
- NoopStellariumRenderer remains available.
- painterPort and legacy renderer paths remain in place.

Next step:
- Feed point items into actual WebGL2 draw path (first real point rendering pass) while keeping runtime ownership gates explicit.

## Renderer Reset Step 4 - WebGL2 Point Drawing

What draws now:
- `ITEM_POINTS` submitted to `WebGL2StellariumRenderer` are uploaded into WebGL2 buffers and drawn with `gl.drawArrays(GL_POINTS, ...)`.
- Renderer diagnostics now separate submitted vs drawn point item counts and point totals.
- Unsupported item types are skipped safely and counted in diagnostics.

What does not draw yet:
- No mesh/text/texture draw implementation in WebGL2 backend shell.
- No visual owner swap for `/sky-engine`; runtime path remains legacy-owner-first.

Default ownership status:
- directStarLayer remains active default visual output.
- WebGL2 backend remains non-default and test/explicit-construction path only.

Shader parity status:
- Current point shader is an initial WebGL2 shell shader and is not declared as Stellarium shader parity.

Next step:
- Expand WebGL2 point path toward richer point styling and batching behavior, then stage additional item types without changing default visual ownership.

## Renderer Reset Step 5 - WebGL2 Side-by-Side Harness

Flag and mode:
- Query flag: `?webgl2StarsHarness=1`
- Optional mode: `?webgl2StarsHarnessMode=overlay` (default) or `?webgl2StarsHarnessMode=side-by-side`
- Harness is query-flagged and non-default.

What is rendered:
- Legacy `directStarLayer` remains active default visual output.
- A separate WebGL2 harness canvas is mounted only when the flag is enabled.
- Harness consumes `rendererBoundaryStarsPointItem` and renders point items via `WebGL2StellariumRenderer` for visual comparison.

Diagnostics surfaced:
- WebGL2 submitted point count.
- WebGL2 drawn point count.
- Direct star count (`projectedStarsFrame.projectedStars.length`) as comparison baseline.
- Active backend status/name.
- Comparison mode flag (`overlay` vs `side-by-side`).

How to test visually:
- Default route (no flag): `/sky-engine` (no harness canvas).
- Overlay comparison: `/sky-engine?webgl2StarsHarness=1`.
- Side-by-side comparison: `/sky-engine?webgl2StarsHarness=1&webgl2StarsHarnessMode=side-by-side`.

Ownership and parity status:
- `directStarLayer` remains default renderer owner.
- No renderer-owner swap is performed in this step.
- This is a diagnostic harness only and is not a parity completion claim.

Known limitations:
- Harness currently targets point item comparison only (`ITEM_POINTS`).
- Non-point item lanes (mesh/text/texture) remain unimplemented in WebGL2 harness path.
- Shader behavior remains shell-level and is not declared Stellarium parity.

## Renderer Reset Step 6 - WebGL2 Harness Visual Verification

Verification scope:
- Runtime visual verification only (no renderer feature expansion).
- Confirm harness mount gating, diagnostics counters, and side-by-side/overlay behavior while preserving default ownership.

Runtime URLs tested:
- `http://172.26.23.204:4174/sky-engine`
- `http://172.26.23.204:4174/sky-engine?webgl2StarsHarness=1&webgl2StarsHarnessMode=overlay`
- `http://172.26.23.204:4174/sky-engine?webgl2StarsHarness=1&webgl2StarsHarnessMode=side-by-side`

Screenshot artifacts (tool URI evidence):
- Default route (no harness): `vscode-chat-response-resource://7673636f64652d636861742d73657373696f6e3a2f2f6c6f63616c2f5a474a6a4d4751774e4751744e54426c5a693030597a4a6d4c5467304e5445745a5441305a4467774d6a51794d6a5269/tool/call_uY1d9MsXIzoE2jyFjNJRCjpY/0/file.jpe`
- Overlay mode: `vscode-chat-response-resource://7673636f64652d636861742d73657373696f6e3a2f2f6c6f63616c2f5a474a6a4d4751774e4751744e54426c5a693030597a4a6d4c5467304e5445745a5441305a4467774d6a51794d6a5269/tool/call_JAB4rjdAUCl3CgSzDX9reOeY/0/file.jpe`
- Side-by-side mode: `vscode-chat-response-resource://7673636f64652d636861742d73657373696f6e3a2f2f6c6f63616c2f5a474a6a4d4751774e4751744e54426c5a693030597a4a6d4c5467304e5445745a5441305a4467774d6a51794d6a5269/tool/call_oEqb9L2IPPMfqCMw2OBKQ0NS/0/file.jpe`

Diagnostics and counts observed:
- Default route:
  - Harness mount: not present.
  - Base scene canvas: present.
  - Progress chips: `Stars 2`, `Listed 0`, `Data Hipparcos`.
- Overlay mode:
  - Comparison label/status: present.
  - Mode: `overlay`.
  - Direct stars: `2`.
  - Submitted points: `2`.
  - Drawn points: `2`.
  - Backend: `webgl2-stellarium-shell`.
- Side-by-side mode:
  - Comparison label/status: present.
  - Mode: `side-by-side`.
  - Direct stars: `2`.
  - Submitted points: `2`.
  - Drawn points: `2`.
  - Backend: `webgl2-stellarium-shell`.

Visual verification results:
- `directStarLayer` remains active/visible in all tested routes.
- Harness canvas mounts only when `webgl2StarsHarness=1` is present.
- Default `/sky-engine` route remains unchanged (no harness UI/canvas).
- WebGL2 point path is active (submitted and drawn counts match in both harness modes).
- WebGL2 points are visible but sparse/faint in this runtime snapshot (low star count and bright sky scene).
- No severe global coordinate drift or full-canvas offset was observed; overlay/split views remain spatially coherent at this density.

Frame-time/regression check (quick runtime sample):
- Default mode average frame delta (sampled): ~11.83 ms.
- Overlay mode average frame delta (sampled): ~11.48 ms.
- Side-by-side mode average frame delta (sampled): ~16.48 ms.
- Result: no severe frame-time regression observed in this verification pass.

Known visual gaps recorded (no fixes in this step):
- Point visibility contrast is limited in bright-scene conditions.
- With low rendered star count (`2`), precise per-point alignment confidence is limited; no gross mismatch observed.
- Side-by-side mode currently provides hard split with tint/separator but no dedicated calibration overlay markers.

Recommended next renderer implementation step:
- Add a harness-only star debug calibration pass (toggleable crosshair/grid + configurable point size/alpha ramp) to improve visual alignment verification confidence before expanding item types.

## Renderer Reset Step 7 - Dense WebGL2 Harness Verification

Verification objective:
- Evaluate WebGL2 harness under meaningfully dense point load while preserving default directStarLayer ownership.

Routes/settings used:
- Default route (ownership baseline):
  - `http://172.26.23.204:4174/sky-engine`
- Dense overlay harness:
  - `http://172.26.23.204:4174/sky-engine?webgl2StarsHarness=1&webgl2StarsHarnessMode=overlay&webgl2StarsHarnessDenseGrid=1&webgl2StarsHarnessDenseGridSize=12`
- Dense side-by-side harness:
  - `http://172.26.23.204:4174/sky-engine?webgl2StarsHarness=1&webgl2StarsHarnessMode=side-by-side&webgl2StarsHarnessDenseGrid=1&webgl2StarsHarnessDenseGridSize=12`

Dense mode note:
- Existing runtime controls remained sparse in this environment (`Stars 2`, `Data Hipparcos`), so a dev-only deterministic synthetic verification grid was enabled for harness-only submission.
- Synthetic grid is diagnostic-only and not production sky data.

Screenshot/artifact evidence (tool URI):
- Default route:
  - `vscode-chat-response-resource://7673636f64652d636861742d73657373696f6e3a2f2f6c6f63616c2f5a474a6a4d4751774e4751744e54426c5a693030597a4a6d4c5467304e5445745a5441305a4467774d6a51794d6a5269/tool/call_S86GyCBoLBJIkLdXUzfwz329/0/file.jpe`
- Dense overlay:
  - `vscode-chat-response-resource://7673636f64652d636861742d73657373696f6e3a2f2f6c6f63616c2f5a474a6a4d4751774e4751744e54426c5a693030597a4a6d4c5467304e5445745a5441305a4467774d6a51794d6a5269/tool/call_FBSQi3TP1bu7zxcurMAm3Boc/0/file.jpe`
- Dense side-by-side:
  - `vscode-chat-response-resource://7673636f64652d636861742d73657373696f6e3a2f2f6c6f63616c2f5a474a6a4d4751774e4751744e54426c5a693030597a4a6d4c5467304e5445745a5441305a4467774d6a51794d6a5269/tool/call_GCldQJr7w73uWq2qJpBXgh7i/0/file.jpe`

Observed counts:
- Default route:
  - Harness mounted: no.
  - Direct stars chip: `Stars 2`.
- Dense overlay route:
  - Direct stars: `2`.
  - Submitted points: `144`.
  - Drawn points: `144`.
  - Dense grid mode status: `ON (144 synthetic points)`.
- Dense side-by-side route:
  - Direct stars: `2`.
  - Submitted points: `144`.
  - Drawn points: `144`.
  - Dense grid mode status: `ON (144 synthetic points)`.

Dense threshold result:
- Achieved: yes (`144` points >= target `50`).

Alignment/visual verdict:
- Harness gating remains correct: default route unchanged; overlay/split mount only when flagged.
- WebGL2 submitted and drawn counts remain equal under dense load.
- Synthetic grid appears spatially stable across viewport and side-by-side half-surface.
- Direct vs WebGL2 point counts are intentionally not close in this run due diagnostic synthetic-grid mode; this is expected and explainable.
- Under synthetic dense verification, no gross coordinate or viewport-origin mismatch was observed.

Issue classification from dense pass:
- Coordinate mapping: no severe global mismatch observed in synthetic grid mode.
- Viewport sizing: side-by-side clipping/split boundary behaves as expected.
- Point size/color/alpha: visible and consistent, but not photometric/parity tuned.
- Depth/order: no obvious ordering artifact in synthetic 2D grid mode.
- Density/limiting magnitude: real runtime density remains constrained in this environment (sparse direct star source).
- Shader behavior: shell shader remains basic and suitable for diagnostic verification only.

Step 8 recommendation:
- Prioritize real-data density enablement and point-style calibration before any ownership transition:
  - restore/verify non-sparse runtime star source path,
  - then tune WebGL2 point size/alpha/color response against directStarLayer under real dense sky frames,
  - keep ownership feature-flagged until real-data dense alignment is verified.

## Renderer Reset Step 8 - Real Star Density Restoration

Goal:
- Restore meaningful dense real-catalog WebGL2 harness input for visual comparison against `directStarLayer` without changing ownership defaults.

Stellarium reference anchor used:
- Local runtime reference: `http://localhost:8080/` (night-sky dense-star visual baseline captured).
- Source reference under study tree:
  - `study/stellarium-web-engine/source/stellarium-web-engine-master/src/core.c` (`core_render`: `stars_limit_mag`, `hard_limit_mag` inputs).
  - `study/stellarium-web-engine/source/stellarium-web-engine-master/src/modules/stars.c` (`stars_render`, `stars_list`, `survey_cmp`, Gaia `min_vmag` promotion).

Root cause of sparse real count:
- Sparse harness runs (`Direct/Submitted/Drawn = 2`) were tied to bright/daytime scene conditions and low effective limiting magnitude, not WebGL2 submission failure.
- In the sparse case, diagnostics showed:
  - query limiting magnitude near `0.64`,
  - scene data mode `hipparcos`,
  - renderer boundary points `2`,
  - submitted/drawn `2`.
- This matches Stellarium behavior where star visibility is bounded by painter limiting magnitude (`core_render`) and survey traversal/render gates (`stars_render` / `stars_list`).

Execution checks performed (real path trace):
- Scene packet loaded mode: observed `hipparcos` in both sparse and dense runs.
- Tile mode: tested `tileMode=multi-survey` and `tileMode=hipparcos`.
- Catalog source label: observed `Hipparcos · 8,870 stars`.
- Limiting magnitude: observed sparse `0.64` vs dense-night `5.78`.
- StarsModule projected/direct count: observed in harness diagnostics (`Direct stars`).
- `rendererBoundaryStarsPointItem` count: observed in harness diagnostics (`Renderer boundary points`).
- WebGL2 submit/draw count: observed in harness diagnostics (`Submitted points`, `Drawn points`).

URLs/settings tested:
- Sparse daytime control (real data):
  - `http://172.26.23.204:4173/sky-engine?webgl2StarsHarness=1&webgl2StarsHarnessMode=overlay&tileMode=multi-survey`
- Dense real control using existing params:
  - `http://172.26.23.204:4173/sky-engine?webgl2StarsHarness=1&webgl2StarsHarnessMode=overlay&tileMode=multi-survey&at=2026-05-01T02:00:00Z`
- Dense real dev preset (new, opt-in):
  - `http://172.26.23.204:4173/sky-engine?webgl2StarsHarness=1&webgl2StarsHarnessMode=overlay&tileMode=multi-survey&webgl2StarsHarnessRealCatalogDensePreset=1`
  - `http://172.26.23.204:4173/sky-engine?webgl2StarsHarness=1&webgl2StarsHarnessMode=side-by-side&tileMode=multi-survey&webgl2StarsHarnessRealCatalogDensePreset=1`

Before/after real-star counts:
- Sparse daytime (real data):
  - Direct stars: `2`
  - Renderer boundary points: `2`
  - Submitted points: `2`
  - Drawn points: `2`
- Dense real-night (existing `at` control):
  - Direct stars: `138`
  - Renderer boundary points: `138`
  - Submitted points: `138`
  - Drawn points: `138`
- Dense real-night (dev preset route, overlay):
  - Direct stars: `529`
  - Renderer boundary points: `529`
  - Submitted points: `529`
  - Drawn points: `529`
- Dense real-night (dev preset route, side-by-side):
  - Direct stars: `529`
  - Renderer boundary points: `529`
  - Submitted points: `529`
  - Drawn points: `529`

Dense target outcome:
- Achieved: yes (>= `50` real stars submitted/drawn).

Distinction: real dense mode vs synthetic dense grid:
- Real dense mode:
  - uses actual scene packet / runtime catalog stars,
  - synthetic grid stays `OFF`,
  - renderer-boundary and submitted/drawn counts match real projected stars.
- Synthetic dense grid mode:
  - explicit stress/coordinate sanity path,
  - uses deterministic generated points,
  - remains opt-in and non-real.

Artifacts:
- Sparse daytime (real):
  - `vscode-chat-response-resource://7673636f64652d636861742d73657373696f6e3a2f2f6c6f63616c2f5a474a6a4d4751774e4751744e54426c5a693030597a4a6d4c5467304e5445745a5441305a4467774d6a51794d6a5269/tool/call_3AXFUo4L5iywA4tyBsAyhxND/0/file.jpe`
- Dense real preset (overlay):
  - `vscode-chat-response-resource://7673636f64652d636861742d73657373696f6e3a2f2f6c6f63616c2f5a474a6a4d4751774e4751744e54426c5a693030597a4a6d4c5467304e5445745a5441305a4467774d6a51794d6a5269/tool/call_SZDlJ5PTWshiVqywVrWQetZh/0/file.jpe`
- Dense real preset (side-by-side):
  - `vscode-chat-response-resource://7673636f64652d636861742d73657373696f6e3a2f2f6c6f63616c2f5a474a6a4d4751774e4751744e54426c5a693030597a4a6d4c5467304e5445745a5441305a4467774d6a51794d6a5269/tool/call_IovOknbONbTuESxISlMKHxxC/0/file.jpe`
- Stellarium local reference (`localhost:8080`):
  - `vscode-chat-response-resource://7673636f64652d636861742d73657373696f6e3a2f2f6c6f63616c2f5a474a6a4d4751774e4751744e54426c5a693030597a4a6d4c5467304e5445745a5441305a4467774d6a51794d6a5269/tool/call_dyeOi9pLYWYNKTxL8QsOEfSI/0/file.jpe`

Step 9 recommendation:
- Keep default daytime route unchanged (still sparse by physics/limiting-magnitude conditions), and continue dense visual verification on explicit real-night routes (existing `at` control or the dev-only real-catalog preset) before any ownership decision.
- Investigate why `stars_list` diagnostics remain `0` while scene packet stars are populated; treat this as a diagnostics parity gap, not a WebGL2 density blocker.

## Renderer Reset Step 9 - WebGL2 Point Style Calibration + Temporary Dev Dark-Sky Override

Objective:
- Add development-only visual controls for renderer verification while keeping `directStarLayer` as the active owner and preserving default behavior when flags are absent.

Stellarium comparison anchor used:
- Local runtime reference: `http://localhost:8080/`.
- Study source references:
  - `study/stellarium-web-engine/source/stellarium-web-engine-master/src/modules/stars.c`
  - `study/stellarium-web-engine/source/stellarium-web-engine-master/src/render_gl.c`

Implemented controls:
- Temporary dark sky override (dev visual only):
  - `skyDebugDark=1`
  - applied at atmosphere/landscape visual layer only.
- Optional stars visibility override (separate explicit flag):
  - `skyDebugStarsVisible=1`
  - applies a bounded floor to rendered star limiting magnitude during projection only.
- Step 9 WebGL2 harness point-style calibration controls:
  - `webgl2StarsHarnessPointScale`
  - `webgl2StarsHarnessAlphaScale`
  - `webgl2StarsHarnessColorMode` (`payload`, `white-hot`, `grayscale`)

Safety constraints verified:
- Default behavior unchanged when flags are absent.
- No renderer ownership swap: `directStarLayer` remains active.
- Catalog/tile loading path unchanged.
- Invalid style params are clamped safely.

Runtime verification routes:
- Baseline harness (no debug overrides):
  - `http://172.26.23.204:4173/sky-engine?webgl2StarsHarness=1&webgl2StarsHarnessMode=overlay&at=2026-05-01T02:00:00Z`
- Dark + stars-visible + style calibration:
  - `http://172.26.23.204:4173/sky-engine?webgl2StarsHarness=1&webgl2StarsHarnessMode=overlay&at=2026-05-01T02:00:00Z&skyDebugDark=1&skyDebugStarsVisible=1&webgl2StarsHarnessPointScale=1.8&webgl2StarsHarnessAlphaScale=1.6&webgl2StarsHarnessColorMode=white-hot`
- Stellarium local reference:
  - `http://localhost:8080/`

Observed diagnostic status:
- Baseline harness:
  - `Debug dark mode: OFF`
  - `Debug stars-visible override: OFF`
  - `Point style: payload @ size 1.00 alpha 1.00`
- Override harness:
  - `Debug dark mode: ON`
  - `Debug stars-visible override: ON`
  - `Point style: white-hot @ size 1.80 alpha 1.60`

Screenshot artifacts (tool URI):
- Baseline harness overlay:
  - `vscode-chat-response-resource://7673636f64652d636861742d73657373696f6e3a2f2f6c6f63616c2f5a474a6a4d4751774e4751744e54426c5a693030597a4a6d4c5467304e5445745a5441305a4467774d6a51794d6a5269/tool/call_AppD3tbhQzJbTODgvzKFb7sF/0/file.jpe`
- Dark override + Step 9 calibration overlay:
  - `vscode-chat-response-resource://7673636f64652d636861742d73657373696f6e3a2f2f6c6f63616c2f5a474a6a4d4751774e4751744e54426c5a693030597a4a6d4c5467304e5445745a5441305a4467774d6a51794d6a5269/tool/call_VIghSKAFfA3yYYpmGulsor0C/0/file.jpe`
- Stellarium local reference:
  - `vscode-chat-response-resource://7673636f64652d636861742d73657373696f6e3a2f2f6c6f63616c2f5a474a6a4d4751774e4751744e54426c5a693030597a4a6d4c5467304e5445745a5441305a4467774d6a51794d6a5269/tool/call_9RP2NZpQf9jyiStPxrqVWA6S/0/file.jpe`

Validation commands (executed):
- `cd /home/rocco/Astronomy-Hub/frontend && npm run typecheck`: pass

## Renderer Reset Step 11 - WebGL2 Star Ownership Hardening + FPS Gate

Objective:
- Harden the default-off WebGL2 star ownership trial with explicit diagnostics/fallback evidence and gate the trial against the current severe lag reports.
- Do not make WebGL2 the default owner.

Files changed:
- `frontend/src/features/sky-engine/engine/sky/runtime/modules/WebGL2StarsOwnerModule.ts`
- `frontend/src/features/sky-engine/engine/sky/renderer/webgl2/WebGL2BufferPool.ts`
- `frontend/src/features/sky-engine/engine/sky/renderer/webgl2/WebGL2StellariumRenderer.ts`
- `frontend/src/features/sky-engine/engine/sky/renderer/renderItems.ts`
- `frontend/src/features/sky-engine/engine/sky/renderer/adapters/starsPointItemsAdapter.ts`
- `frontend/src/features/sky-engine/engine/sky/runtime/modules/StarsModule.ts`
- `frontend/src/features/sky-engine/SkyEngineRuntimeBridge.ts`
- `frontend/src/features/sky-engine/SkyEngineScene.tsx`
- `frontend/src/features/sky-engine/engine/sky/runtime/module2ParityFingerprint.ts`
- `frontend/tests/test_webgl2_stars_harness_module.test.js`
- `frontend/tests/test_webgl2_stars_harness_flag.test.jsx`
- `frontend/tests/test_webgl2_stellarium_renderer.test.js`
- `frontend/tests/sky-engine-stars-runtime.test.js`

What was hardened in this step:
- Owner diagnostics now surface fallback state, direct-layer availability/visibility, skipped items, frame render errors, last-success metadata, frame delta, approximate FPS, and throttled timing fields.
- WebGL2 upload churn was reduced by reusing point buffers and switching steady-state updates to `bufferSubData(...)`.
- Shared WebGL2 point submission stopped doing the extra aggregate upload in `submitFrame(...)`.
- Renderer-boundary star payload generation is now skipped entirely when no owner/harness consumer is active.
- Boundary point items are reused when the projected-star frame reference is unchanged.
- Point payloads now build directly into `Float32Array` buffers instead of sorting and pushing fresh JS arrays every frame.

Bottleneck attribution after Step 11:
- The severe lag is still on the shared WebGL2 path, not just the owner overlay plumbing.
- Harness and owner both remain materially slower than legacy under scripted pan/zoom.
- Runtime telemetry stays around `8-15 ms` frame totals while browser-observed frame deltas jump to `309-582 ms`, so a large portion of the lag sits outside the narrow sky-core timing envelope.
- The upload and payload-churn fixes removed known local waste, but they did not clear the gate.

Before/after table for the gate routes:
- Interpretation: `Before` = static route sample, `After` = scripted pan/zoom sample on the corresponding route.

| Route | Before FPS (static) | After FPS (pan/zoom) | Before frame delta ms | After frame delta ms | Result |
|---|---:|---:|---:|---:|---|
| Legacy default | 81.1 | n/a | 12.3 | n/a | Healthy idle baseline |
| Dark legacy | 68.7 | 17.8 | 14.6 | 56.3 | Degrades under interaction but remains materially faster than WebGL2 |
| Harness side-by-side | 67.3 | 3.2 | 14.9 | 309.0 | Fails gate |
| Owner trial | 2.0 | 1.7 | 504.7 | 581.9 | Fails gate |
| Owner forced fallback | 1.9 | n/a | 531.3 | n/a | Fallback wiring works but route still stalls |

Static route evidence:
- Output folder: `/home/rocco/Astronomy-Hub/output/playwright/step11-webgl2-owner-gate/`
- Screenshots:
  - `01-default.png`
  - `02-dark-legacy.png`
  - `03-harness-side-by-side.png`
  - `04-owner-trial.png`
  - `05-owner-fallback.png`
- Static metrics artifact:
  - `static-metrics.json`

Interaction evidence:
- Scripted pan/zoom screenshot:
  - `/home/rocco/Astronomy-Hub/output/playwright/step11-webgl2-owner-gate/06-owner-after-panzoom.png`
- Interaction metrics artifact:
  - `/home/rocco/Astronomy-Hub/output/playwright/step11-webgl2-owner-gate/interaction-metrics.json`
- Scripted pan/zoom results:
  - owner: `1.718 FPS`, average frame delta `581.92 ms`
  - harness: `3.236 FPS`, average frame delta `309.022 ms`
  - dark legacy: `17.776 FPS`, average frame delta `56.256 ms`

Interaction checks:
- Pan/drag: pass at functional level. The owner route remained healthy and changed FOV from `120` to `113`, but rendered at only `2.5 FPS` / `401.7 ms` frame delta after interaction.
- Zoom: pass at functional level. FOV changed from `120` to `113`.
- Resize: stable-only. The browser integration kept a fixed `635x458` viewport surface during the probe, so health stayed `healthy`/`fallback=no`, but responsive canvas resizing could not be proven in this harness.
- Default -> owner: pass.
- Owner -> fallback: pass.
- Fallback -> healthy owner: pass.

Validation commands executed:
- `cd /home/rocco/Astronomy-Hub/frontend && npm run test -- tests/sky-engine-stars-runtime.test.js tests/test_webgl2_stellarium_renderer.test.js`: pass
- `cd /home/rocco/Astronomy-Hub/frontend && npm run typecheck`: pass
- `cd /home/rocco/Astronomy-Hub/frontend && npm run build`: pass
- `cd /home/rocco/Astronomy-Hub/frontend && npm run test -- tests/test_webgl2_stars_harness_module.test.js tests/test_webgl2_stars_harness_flag.test.jsx tests/test_webgl2_stellarium_renderer.test.js tests/sky-engine-stars-runtime.test.js`: pass (`36/36`)
- `cd /home/rocco/Astronomy-Hub/frontend && npm run profile:sky-engine-runtime`: pass

Profile artifact:
- `/home/rocco/Astronomy-Hub/.cursor-artifacts/parity-compare/module2-live-runtime-profile-2026-04-26.json`

Known limitations after this step:
- Owner and harness remain too slow to be considered safe beyond the diagnostic trial routes.
- Owner diagnostics timing fields often show near-zero renderer time while browser frame delta stays above `400-500 ms`, so deeper attribution is still required.
- Resize evidence is stability-only because the integrated browser page did not expose a changing viewport during the resize probe.
- The live dense route still reports `stars_list visits: 0`, which remains a diagnostics parity gap.

Recommendation:
- `NO-GO` for any broader rollout or default-owner change.
- Keep `directStarLayer` as the default owner.
- Keep WebGL2 owner mode explicit opt-in only.
- Next bounded investigation should target the shared owner/harness runtime path that sits outside the currently measured renderer timing envelope rather than adding more owner-only diagnostics or widening scope.
- `cd /home/rocco/Astronomy-Hub/frontend && npm run test -- tests/test_webgl2_stars_harness_module.test.js tests/test_webgl2_stars_harness_flag.test.jsx tests/test_webgl2_stellarium_renderer.test.js tests/sky-engine-stars-runtime.test.js`: pass
- `cd /home/rocco/Astronomy-Hub/frontend && npm run build`: pass
- `cd /home/rocco/Astronomy-Hub/frontend && npm run profile:sky-engine-runtime`: pass
- `cd /home/rocco/Astronomy-Hub && git diff --check`: pass

## Renderer Reset Step 12 - Browser/Main-Thread Lag Attribution

Objective:
- Identify the real source of the severe Step 11 owner/harness FPS collapse without changing default renderer ownership.
- Produce explicit attribution instrumentation, measurements, a minimal proven fix, and a rollout recommendation in one pass.

Files changed:
- `frontend/src/features/sky-engine/SkyEngineScene.tsx`
- `frontend/src/features/sky-engine/SkyEngineRuntimeBridge.ts`
- `frontend/src/features/sky-engine/webgl2StarsPerfTraceConfig.ts`
- `frontend/src/features/sky-engine/webgl2StarsStatusUiThrottle.ts`
- `frontend/src/pages/SkyEnginePage.tsx`
- `frontend/tests/test_webgl2_stars_harness_flag.test.jsx`

Instrumentation added in this step:
- Dev-only query flags:
  - `?webgl2StarsPerfTrace=1`
  - `?webgl2StarsStatusUi=0`
  - `?webgl2StarsDiagnosticsWrites=0`
- Scene-root perf trace dataset:
  - `data-webgl2-stars-perf-trace`
- Perf trace payload fields:
  - status UI cadence
  - owner ingress / commit / suppressed counts
  - harness ingress / commit / suppressed counts
  - status UI and diagnostics-write enablement state

Root-cause attribution proven in this step:
- Disabling diagnostics dataset writes alone did not fix the collapse.
- Disabling the owner/harness status UI restored owner static from `1.982 FPS` to `62.143 FPS` and preserved healthy harness performance.
- The real bottleneck was owner/harness diagnostics updates propagating through the main `SkyEngineScene` React shell, not WebGL2 draw timing.
- Runtime frame totals stayed around `2 ms` after the fix, which matches the browser-visible recovery and removes the Step 11 `~2 FPS with ~0-15 ms renderer timing` contradiction.

Minimal fix proven here:
- Owner and harness diagnostics overlays are now isolated into memoized child components with imperative `publishDiagnostics(...)` handles, so owner/harness diagnostics no longer rerender the entire scene host.
- Structural changes still publish immediately.
- High-churn numeric fields are snapshotted at a `1000 ms` cadence for diagnostics continuity.
- Perf trace publication remains explicit opt-in and no longer collapses the route when enabled.

Before/after summary:

| Route | Step 11 FPS | Step 12 FPS | Step 11 frame delta ms | Step 12 frame delta ms | Result |
|---|---:|---:|---:|---:|---|
| Dark legacy static | 68.667 | 67.883 | 14.563 | 14.731 | Stable baseline retained |
| Owner healthy static | 1.982 | 39.098 | 504.650 | 25.577 | Main-thread collapse removed |
| Owner forced fallback static | 1.882 | 57.250 | 531.250 | 17.467 | Fallback remains healthy |
| Harness side-by-side static | 67.333 | 58.153 | 14.851 | 17.196 | Healthy explicit comparison route retained |
| Owner interaction | 1.718 | 43.680 | 581.920 | 22.894 | Catastrophic interaction collapse removed |
| Harness interaction | 3.236 | 38.548 | 309.022 | 25.942 | Catastrophic interaction collapse removed |

Perf-trace evidence:
- Owner healthy trace (`?webgl2StarsPerfTrace=1`): `17` diagnostics ingress events, `7` committed status snapshots, `10` suppressed updates, route still at `58.799 FPS`.
- Harness side-by-side trace (`?webgl2StarsPerfTrace=1`): `374` diagnostics ingress events, `8` committed status snapshots, `366` suppressed updates, route still at `62.893 FPS`.

Artifacts recorded for this block:
- `/home/rocco/Astronomy-Hub/output/playwright/step12-browser-main-thread-lag-attribution/static-metrics.json`
- `/home/rocco/Astronomy-Hub/output/playwright/step12-browser-main-thread-lag-attribution/interaction-metrics.json`

Validation commands executed:
- `cd /home/rocco/Astronomy-Hub/frontend && npm run typecheck`: pass
- `cd /home/rocco/Astronomy-Hub/frontend && npm run test -- tests/test_webgl2_stars_harness_flag.test.jsx`: pass (`12/12`)
- `cd /home/rocco/Astronomy-Hub/frontend && npm run build`: pass

Recommendation:
- `GO` to keep this Step 12 fix on the explicit opt-in owner/harness trial routes because it removes the real browser/main-thread lag source while preserving fallback and diagnostics.
- `NO-GO` for making WebGL2 the default owner, removing fallback, or claiming parity. This step fixes a trial-route browser bottleneck only.

Conclusion:
- Temporary dev dark-sky and stars-visible overrides now provide explicit verification controls without altering default route behavior.
- Step 9 style calibration controls are active in the WebGL2 harness path and surfaced in diagnostics/status, enabling direct visual comparison against local Stellarium while preserving current ownership boundaries.

## Renderer Reset Step 10 - WebGL2 Star Ownership Trial

Objective:
- Promote the WebGL2 stars path from comparison-only harness to an explicit feature-flagged ownership trial while keeping `directStarLayer` as the default and legacy fallback.

Flags:
- Ownership trial: `webgl2StarsOwner=1`
- Fallback verification aid (dev-only): `webgl2StarsOwnerForceFail=1`
- Existing comparison harness remains separate: `webgl2StarsHarness=1`
- Existing style controls reused by owner mode:
  - `webgl2StarsHarnessPointScale`
  - `webgl2StarsHarnessAlphaScale`
  - `webgl2StarsHarnessColorMode`

Default behavior:
- `/sky-engine` keeps `directStarLayer` as the visible star owner.
- Owner mode is `OFF` by default.
- WebGL2 ownership canvas is not mounted unless `webgl2StarsOwner=1` is present.
- Comparison harness remains unmounted unless `webgl2StarsHarness=1` is present.

Owner behavior (`webgl2StarsOwner=1`):
- A dedicated WebGL2 owner canvas mounts above the Babylon scene canvas.
- WebGL2 consumes the existing `rendererBoundaryStarsPointItem` output from `StarsModule`.
- `directStarLayer` remains initialized but is suppressed only after a healthy WebGL2 frame is submitted and drawn.
- Owner diagnostics are always visible and explicitly state:
  - `WebGL2 star ownership trial: ON/OFF`
  - backend health
  - backend name
  - direct star layer status (`visible`, `suppressed`, `fallback`)
  - renderer-boundary point count
  - submitted and drawn point counts
  - active point style calibration
  - explicit `Non-default ownership trial only. Not parity complete.` wording

Fallback behavior:
- If renderer-boundary stars are not ready, `directStarLayer` stays visible.
- If WebGL2 init/render throws, `directStarLayer` is forced back to visible and diagnostics switch to `fallback` with the reason shown in the UI.
- Route remains stable; no ownership-mode crash was observed in the forced-failure verification route.

Diagnostics added:
- Owner status card in `SkyEngineScene` with ownership/fallback status.
- Healthy owner state reports live counts from `WebGL2StellariumRenderer`.
- Harness comparison card remains intact and independent.

Tests added/updated:
- `frontend/tests/test_webgl2_stars_harness_flag.test.jsx`
  - default route leaves owner mode off
  - owner flag mounts owner trial surface
  - dark/style flags remain wired in owner mode
  - forced-failure route stays dev-only
- `frontend/tests/test_webgl2_stars_harness_module.test.js`
  - owner mode suppresses `directStarLayer` only while healthy
  - init/render failures restore fallback safely
- `frontend/tests/test_webgl2_stellarium_renderer.test.js`
  - WebGL2 renderer folder remains Babylon-free

Visual routes and artifacts:
- Default route:
  - URL: `http://127.0.0.1:4173/sky-engine`
  - Direct star count: `5`
  - WebGL2 submitted count: `0`
  - WebGL2 drawn count: `0`
  - Owner mode: `OFF`
  - Fallback status: `visible` (`Owner flag disabled; directStarLayer remains default.`)
  - Screenshot: `/home/rocco/Astronomy-Hub/output/playwright/step10-webgl2-owner-trial/01-default.png`
  - Visible result: legacy directStarLayer-only route with owner diagnostics card present and non-default note.
- Dark legacy route:
  - URL: `http://127.0.0.1:4173/sky-engine?skyDebugDark=1&skyDebugStarsVisible=1`
  - Direct star count: `5`
  - WebGL2 submitted count: `0`
  - WebGL2 drawn count: `0`
  - Owner mode: `OFF`
  - Fallback status: `visible`
  - Screenshot: `/home/rocco/Astronomy-Hub/output/playwright/step10-webgl2-owner-trial/02-dark-legacy.png`
  - Visible result: legacy route with dark-sky and stars-visible debug overrides active; no ownership swap.
- Harness side-by-side route:
  - URL: `http://127.0.0.1:4173/sky-engine?webgl2StarsHarness=1&webgl2StarsHarnessMode=side-by-side&skyDebugDark=1&skyDebugStarsVisible=1&webgl2StarsHarnessRealCatalogDensePreset=1`
  - Direct star count: `602`
  - WebGL2 submitted count: `602`
  - WebGL2 drawn count: `602`
  - Owner mode: `OFF`
  - Fallback status: `visible`
  - Screenshot: `/home/rocco/Astronomy-Hub/output/playwright/step10-webgl2-owner-trial/03-harness-side-by-side.png`
  - Visible result: comparison harness side-by-side remains separate; `directStarLayer` remains default.
- Ownership trial route:
  - URL: `http://127.0.0.1:4173/sky-engine?webgl2StarsOwner=1&skyDebugDark=1&skyDebugStarsVisible=1&webgl2StarsHarnessRealCatalogDensePreset=1&webgl2StarsHarnessPointScale=1.8&webgl2StarsHarnessAlphaScale=1.6&webgl2StarsHarnessColorMode=white-hot`
  - Direct star count: `602`
  - WebGL2 submitted count: `602`
  - WebGL2 drawn count: `602`
  - Owner mode: `ON`
  - Fallback status: `suppressed` (`Fallback reason: none`)
  - Screenshot: `/home/rocco/Astronomy-Hub/output/playwright/step10-webgl2-owner-trial/04-owner-trial.png`
  - Visible result: WebGL2 points become the primary visible star layer while `directStarLayer` remains initialized and suppressed.
- Ownership trial forced fallback route:
  - URL: `http://127.0.0.1:4173/sky-engine?webgl2StarsOwner=1&webgl2StarsOwnerForceFail=1&skyDebugDark=1&skyDebugStarsVisible=1&webgl2StarsHarnessRealCatalogDensePreset=1&webgl2StarsHarnessPointScale=1.8&webgl2StarsHarnessAlphaScale=1.6&webgl2StarsHarnessColorMode=white-hot`
  - Direct star count: `602`
  - WebGL2 submitted count: `0`
  - WebGL2 drawn count: `0`
  - Owner mode: `ON`
  - Fallback status: `fallback` (`WebGL2 owner trial forced failure for fallback verification.`)
  - Screenshot: `/home/rocco/Astronomy-Hub/output/playwright/step10-webgl2-owner-trial/05-owner-fallback.png`
  - Visible result: directStarLayer reappears without route failure.

Validation results:
- `cd /home/rocco/Astronomy-Hub/frontend && npm run typecheck`: pass
- `cd /home/rocco/Astronomy-Hub/frontend && npm run test -- tests/test_webgl2_stars_harness_module.test.js tests/test_webgl2_stars_harness_flag.test.jsx tests/test_webgl2_stellarium_renderer.test.js tests/sky-engine-stars-runtime.test.js`: pass (`4` files, `31` tests)
- `cd /home/rocco/Astronomy-Hub/frontend && npm run build`: pass
- `cd /home/rocco/Astronomy-Hub/frontend && npm run profile:sky-engine-runtime`: pass
  - artifact: `/home/rocco/Astronomy-Hub/.cursor-artifacts/parity-compare/module2-live-runtime-profile-2026-04-26.json`
- `cd /home/rocco/Astronomy-Hub && git diff --check`: pass

Readiness for broader ownership testing:
- Ready for broader opt-in ownership testing on dense real-catalog routes only.
- Not ready for default ownership.

Remaining blockers:
- Owner diagnostics off-route still report `directStarLayer` counts only through general runtime chips rather than a unified owner-module feed.
- Renderer path still covers `ITEM_POINTS` only; non-point item lanes remain outside owner-trial scope.
- Real scene packet still reports `hipparcos` in the captured dense route; this step does not resolve broader survey-parity limitations.
- This step is explicitly non-parity and non-default.
