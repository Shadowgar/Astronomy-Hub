# First Render Path Painter Integration Audit (Stars Path)

Date: 2026-04-26  
Mode: Stellarium Port Mode ACTIVE  
Scope: Audit only. No runtime behavior changes in this slice.

## Goal

Identify the first active render path to migrate onto the painter boundary and define a staged migration sequence that preserves current runtime output while moving toward Stellarium painter and render lifecycle parity.

Chosen first path: stars.

Reason:
- Stars already have the most direct source-level mapping to Stellarium `stars.c` traversal semantics (`render_visitor` style tile walk is already ported on the Hub side).
- Stars are currently emitted as per-frame projected points, which maps cleanly to `paint_2d_points` / `paint_3d_points` style painter intents.
- Stars are currently the largest sustained per-frame draw workload in the active scene and are best suited for first batch telemetry and queue verification.

## Current AH Stars Render Path (Exact Mapping)

### 1) Scene packet and star object assembly

- Scene packet assembly: `assembleSkyScenePacket` in `frontend/src/features/sky-engine/engine/sky/services/sceneAssembler.ts`.
  - Builds `scenePacket.stars` and `scenePacket.starTiles` from active tiles.
  - Emits star vectors used later by runtime projection.
- Runtime scene model wiring: `buildSceneControllerModel` in `frontend/src/features/sky-engine/SkyEngineScene.tsx`.
  - Calls `buildEngineStarSceneObjects` to convert packet stars into runtime `SkyEngineSceneObject` star entries.

### 2) Runtime module entry and ordering

- Stars module registration: `createStarsModule()` registered in `frontend/src/features/sky-engine/SkyEngineScene.tsx`.
- Frame lifecycle owner: `SkyCore.render(...)` in `frontend/src/features/sky-engine/engine/sky/runtime/SkyCore.ts`.
  - Calls `painter.reset_for_frame(...)`.
  - Calls `painter.paint_prepare(...)`.
  - Executes ordered module renders (includes stars module render).
  - Calls `painter.paint_finish()`.
  - Calls Babylon `scene.render()`.

### 3) Star draw data preparation (CPU)

- Projection and filtering function: `collectProjectedStars(...)` in `frontend/src/features/sky-engine/engine/sky/runtime/modules/runtimeFrame.ts`.
  - Uses `visitStarsRenderTiles(...)` from `frontend/src/features/sky-engine/engine/sky/runtime/starsRenderVisitor.ts`.
  - Applies magnitude limit, projection visibility clipping, star visual profile generation, and per-entry alpha/radius.
- Stars module update path: `createStarsModule().update(...)` in `frontend/src/features/sky-engine/engine/sky/runtime/modules/StarsModule.ts`.
  - Computes reuse decision for projection cache.
  - Runs `collectProjectedStars(...)` when not reusing.
  - Stores `runtime.projectedStarsFrame`.
  - Writes perf telemetry breakdown fields (`collectProjectedStars*`, reuse metrics).

### 4) Babylon draw object creation/update

- Active star renderer: `createDirectStarLayer(...)` in `frontend/src/features/sky-engine/directStarLayer.ts`.
  - Uses one plane mesh with thin instances (`@babylonjs/core/Meshes/thinInstanceMesh`).
  - Maintains CPU-side `Float32Array` buffers:
    - matrix buffer (`capacity * 16`)
    - color buffer (`capacity * 4`)
  - Updates/rebinds thin-instance buffers and sets `thinInstanceCount` each sync.
  - Applies selected-star ring mesh/material update when applicable.

### 5) Per-frame stars render submission

- Stars module render path: `createStarsModule().render(...)` in `frontend/src/features/sky-engine/engine/sky/runtime/modules/StarsModule.ts`.
  - Calls `runtime.directStarLayer.sync(...)` with projected stars.
  - No painter draw calls are emitted from this module yet.

## Current Rendering Primitive Classification

Current stars path uses:
- Babylon mesh: yes (single plane mesh base).
- Babylon thin instances: yes (primary star draw path).
- Raw CPU-projected points: yes (projection is CPU-side in `collectProjectedStars`).
- Raw WebGL buffer management: indirect through Babylon thin-instance buffer API.
- Texture/material updates: yes (star texture/material and selection ring material/texture).
- Painter queue-backed drawing: not yet (only frame lifecycle queue records `paint_prepare` / `paint_finish` and inert API calls when invoked).

## Stellarium Correspondence (Reference Anchors)

- Star traversal and render entry:
  - `study/stellarium-web-engine/source/stellarium-web-engine-master/src/modules/stars.c`
  - `render_visitor` (~645)
  - `stars_render` (~720)
- Star list and HIP lookup seams already mirrored in adjacent Hub adapters:
  - `stars_list` (~757)
  - `obj_get_by_hip` (~924)
- Painter API entry points for this migration:
  - `study/stellarium-web-engine/source/stellarium-web-engine-master/src/painter.c`
  - `paint_prepare` (~128)
  - `paint_finish` (~145)
  - `paint_2d_points` (~172)
  - `paint_3d_points` (~178)
- Renderer batching/dispatch endpoint (target backend parity stage):
  - `study/stellarium-web-engine/source/stellarium-web-engine-master/src/render_gl.c`
  - `render_prepare` (~365)
  - points item build/use (`ITEM_POINTS`, `ITEM_POINTS_3D`)
  - `render_finish` (~1796)

## Gap Summary (First Path)

What exists now:
- Source-like star traversal and projection pipeline.
- Source-shaped painter boundary with typed inert command queue lifecycle.
- Stable lifecycle insertion points (`paint_prepare` / `paint_finish`) around module render.

What is still missing for first-path painter integration:
- Stars module does not emit painter star draw intents yet.
- No command-count or per-frame intent parity checks for stars against active runtime telemetry.
- No painter-side star batch object model.
- No backend mapping from painter star commands to Babylon/WebGL draw execution.
- Legacy direct stars thin-instance path still owns final draw output.

## Staged Migration Plan (Required Sequence)

### Stage 1 - Mirror star draw intent into painter queue (keep current rendering)

- Add stars-path painter intent emission from `StarsModule.render(...)` using source-shaped point draw calls.
- Keep `directStarLayer.sync(...)` fully active as the rendering owner.
- Gate: no visual behavior change, queue contains star-intent calls each frame.

Status (EV-0113): PASS.
- `StarsModule.render(...)` now emits an inert typed painter command (`paint_stars_draw_intent`) once final projected star draw data is available.
- Existing Babylon thin-instance rendering remains unchanged and still executes through `directStarLayer.sync(...)`.
- No `render_gl.c` backend execution or shader path was introduced in this slice.

### Stage 2 - Validate command counts and state via runtime telemetry

- Compare per-frame projected star count vs painter point intent counts.
- Add deterministic and runtime telemetry assertions for command/state drift.
- Gate: stable per-frame count/state agreement under current scenes.

Status (EV-0114): PASS.
- Runtime telemetry now publishes per-frame `painterStarTelemetry` from finalized painter state (`postRender` after `paint_finish`), including:
  - frame index
  - star-intent command existence/count
  - payload star count
  - direct sync count and projected/rendered count comparisons
  - magnitude and render-alpha ranges
  - FOV/projection snapshot
  - finalized command counts after `paint_finish`
- Profile artifact capture now records and summarizes these fields in `.cursor-artifacts/parity-compare/module2-live-runtime-profile-2026-04-26.json`.
- Live runtime profile shows stable agreement (`painterVsDirectDelta`, `painterVsProjectedDelta`, `painterVsRenderedDelta` all zero-centered in summary) while keeping direct thin-instance rendering active.

### Stage 3 - Introduce painter batch objects for star points

- Add painter-internal star point batch object model matching queue semantics.
- Keep backend inert; batch objects are CPU-side staging only.
- Gate: queue-to-batch build validated without enabling new draw backend.

Status (EV-0115): PASS.
- `paint_finish` finalization now derives typed finalized stars batches from finalized `paint_stars_draw_intent` commands.
- Batch objects are stored separately from finalized commands and include:
  - batch kind (`stars`)
  - source command kind (`paint_stars_draw_intent`)
  - frame index and star count
  - grouping metadata (projection mode, exact FOV plus FOV bucket, magnitude range, render-alpha range, texture/material placeholders)
  - source path marker (`direct-star-mirror`)
  - backend execution status (`not_executed`)
- Runtime telemetry now reports finalized batch counts, stars batch count/star count/execution status, and batch-vs-direct/projected/rendered deltas while direct thin-instance rendering remains active.

### Stage 4A - Backend mapping shell to Babylon/WebGL concepts

- Add a backend adapter shell that consumes finalized painter batches and returns inert mapping-plan records only.
- Keep all records non-executing and telemetry-facing.
- Gate: finalized stars batches map to backend plan objects with explicit execution status `mapped_not_executed`.

Status (EV-0116): PASS.
- Added `renderer/painterBackendPort.ts` with source-mapped batch-input and mapping-result types:
  - backend batch input (`SkyPainterBackendBatchInput`)
  - stars mapping result (`SkyPainterStarsBackendMappingResult`)
  - backend execution status (`mapped_not_executed`)
  - unsupported batch status (`unsupported_not_executed`)
- Mapping output now includes:
  - batch kind
  - star count
  - preserved grouping metadata
  - intended backend path marker (`babylon-thin-instance-stars`)
  - render_gl reference markers (`render_points_2d`/`render_points_3d`, `ITEM_POINTS`/`ITEM_POINTS_3D`, `render_finish`)
- Mapping is consumed in `SceneReportingModule` telemetry only; no backend draw execution path is called.

### Stage 4B - Backend mapping to Babylon/WebGL execution

- Map painter star point batches to concrete backend draw execution path.
- Initial mapping may still target Babylon adapter path while preserving painter ownership contracts.
- Gate: stars draw path executes from painter batches instead of direct module thin-instance sync.

### Stage 5 - Remove old direct stars render path

- Remove/bypass `directStarLayer.sync(...)` from stars module render ownership.
- Keep compatibility telemetry during transition period, then retire redundant metrics.
- Gate: painter-owned stars rendering path is sole draw owner for stars.

## Files and Functions Most Likely to Change in Follow-up Slices

- `frontend/src/features/sky-engine/engine/sky/runtime/modules/StarsModule.ts`
  - render-stage painter intent emission and staged backend handoff.
- `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts`
  - star-intent call payloads and queue/batch state expansion.
- `frontend/src/features/sky-engine/directStarLayer.ts`
  - eventual de-ownership or adapter role during backend transition.
- `frontend/src/features/sky-engine/engine/sky/runtime/SkyCore.ts`
  - lifecycle envelope remains owner; no ordering changes expected for this migration.

## Audit Decision

The stars path is the correct first render path for painter integration because it already has source-like traversal inputs, deterministic projection outputs, and clear lifecycle boundaries. Migration should proceed in mirror-first mode (intent recording before backend ownership transfer) to preserve current visual behavior while building verifiable parity scaffolding.
