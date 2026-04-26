# Stage 4A Render Backend Mapping Shell (Stars)

Date: 2026-04-26  
Mode: Stellarium Port Mode ACTIVE  
Scope: Inert backend mapping shell only. No render execution.

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

## Validation

Commands:
- `cd /home/rocco/Astronomy-Hub/frontend && npm run test -- tests/test_painter_backend_port.test.js`
- `cd /home/rocco/Astronomy-Hub/frontend && npm run test -- tests/sky-engine-stars-runtime.test.js`

Evidence:
- `EV-0116`
