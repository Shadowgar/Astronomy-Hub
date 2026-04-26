# Stage 4A Render Backend Mapping Shell (Stars)

> Legacy scaffold notice (2026-04-26): this document describes the pre-S1 metadata-only mapping shell.
> Slice S1 introduced a real internal point-item pipeline in `painterPort.ts` (render_prepare/get_item/render_points/render_finish equivalents).
> The string-only `renderGlReference` markers documented below are now historical labels and are not parity proof.

Date: 2026-04-26  
Mode: Stellarium Port Mode ACTIVE  
Scope: Stage 4A inert mapping shell + Stage 4B feature-flagged side-by-side execution prototype.

## Source Anchors

- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/render.h`
  - `render_points_2d`
  - `render_points_3d`
  - `render_finish`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/render_gl.c`
  - `render_prepare`
  - point item types and batching (`ITEM_POINTS`, `ITEM_POINTS_3D`, `get_item(...)`)
  - flush dispatch in `render_finish`

## Hub Shell

File:
- `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterBackendPort.ts`

Exports:
- backend batch input model (`SkyPainterBackendBatchInput`)
- unsupported input record (`SkyPainterUnsupportedBatchInput`)
- stars mapping result (`SkyPainterStarsBackendMappingResult`)
- unsupported mapping result (`SkyPainterUnsupportedBatchMappingResult`)
- backend execution statuses:
  - `mapped_not_executed`
  - `unsupported_not_executed`
- mapping entrypoint:
  - `mapPainterBatchesToBackendPlan({ finalizedBatches })`

## Mapping Output Contract (Inert)

For each finalized stars batch:
- preserve `frameIndex`, `starCount`, and grouping metadata
- attach intended backend path marker:
  - `babylon-thin-instance-stars`
- attach render_gl reference marker:
  - `renderHeaderApi`: `render_points_2d` or `render_points_3d`
  - `renderGlItemType`: `ITEM_POINTS` or `ITEM_POINTS_3D`
  - `renderGlBatchingConcept`: `get_item(type, flags, halo, texture)`
  - `renderGlFlushPhase`: `render_finish`
- force execution status:
  - `mapped_not_executed`

For unsupported batch kinds:
- emit an unsupported mapping record
- set status to `unsupported_not_executed`
- do not execute or fallback

## Runtime Integration Rule (Stage 4A)

The mapping shell is consumed for telemetry only:
- `frontend/src/features/sky-engine/engine/sky/runtime/modules/SceneReportingModule.ts`

Not allowed in this stage:
- no render backend execution
- no Babylon scene mutation
- no direct-star path replacement

## Stage 4B Prototype Execution Contract

Execution flag:
- runtime/dev query flags:
  - `?painterBackendExecution=1`
  - `?SKY_ENGINE_ENABLE_PAINTER_BACKEND_EXECUTION=1`
- default: OFF

Executor entrypoint:
- `executePainterBackendPlan({ finalizedBatches, mappingPlan, executionEnabled, sideBySideRenderer, projectedStarsFrame, selectedObjectId, animationTimeSeconds })`

Execution statuses:
- `mapped_not_executed`
- `execution_disabled`
- `executed_side_by_side`
- `executed_side_by_side_painter_layer`
- `unsupported_not_executed`

Behavior:
- OFF mode: returns `execution_disabled`; no side-by-side sync calls.
- ON mode: executes side-by-side only (prototype), marks `executed_side_by_side`.
- Unsupported batch kinds: remain `unsupported_not_executed`.

Stage 4B boundaries:
- direct stars render ownership remains `StarsModule -> directStarLayer.sync(...)`
- no renderer replacement
- no projection/math/loading/styling changes

## Stage 4D Painter-Owned Layer Contract

New adapter shell:
- `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterStarsBackendLayer.ts`

Contract:
- accepts finalized stars batch + mapped backend metadata through explicit sync input
- remains gated behind `painterBackendExecution` runtime flag
- does not replace or mutate `directStarLayer`
- exposes creation/sync state for telemetry

Stage 4D behavior:
- OFF mode:
  - painter-owned layer is not created/synced
  - execution status remains `execution_disabled`
- ON mode:
  - side-by-side path can sync painter-owned layer
  - execution status becomes `executed_side_by_side_painter_layer`
  - direct stars path remains active

## Stage 4C Runtime Profiling Validation

Runtime profile commands:
- `cd /home/rocco/Astronomy-Hub/frontend && SKY_ENGINE_PROFILE_URL='http://127.0.0.1:4173/sky-engine?debugTelemetry=1' npm run profile:sky-engine-runtime`
- `cd /home/rocco/Astronomy-Hub/frontend && SKY_ENGINE_PROFILE_URL='http://127.0.0.1:4173/sky-engine?debugTelemetry=1&painterBackendExecution=1' npm run profile:sky-engine-runtime`

Stage 4C assertions (EV-0118):
- OFF/default run: backend execution disabled by default (`backendExecutionEnabledShare.avg = 0`, `backendExecutionDisabledCount.avg = 1`).
- ON run: explicit side-by-side execution (`backendExecutionEnabledShare.avg = 1`, `backendSideBySideExecutionCount.avg = 1`).
- Both runs: direct star rendering still active, no unsupported execution, zero batch/direct and mapped/direct deltas.

## Validation

Commands:
- `cd /home/rocco/Astronomy-Hub/frontend && npm run test -- tests/test_painter_backend_port.test.js`
- `cd /home/rocco/Astronomy-Hub/frontend && npm run test -- tests/sky-engine-stars-runtime.test.js`

Evidence:
- `EV-0116`
- `EV-0117`
- `EV-0118`
- `EV-0119`
