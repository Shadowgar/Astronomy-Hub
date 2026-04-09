# Phase 1D — Bridge Collapse + SceneState / Pick Export Extraction

## Purpose

Remove the remaining compatibility-heavy reporting ownership from `SkyEngineRuntimeBridge.ts` so scene-state reporting and pick-target export are runtime-owned concerns instead of bridge-owned concerns.

This slice is structural. It does not change projection, stars, atmosphere, landscape, labels, or any visible behavior.

## Current Remaining Bridge Responsibilities

After Phase 1C, the bridge still mixes three responsibilities:

- compatibility status startup messaging
- runtime navigation update and selection sync
- scene-state reporting and pick-target export

Only the reporting/export path still belongs to a generic compatibility bridge instead of an explicit runtime-owned boundary.

## What Moves Out In This Slice

`SceneReportingModule` owns:

- scene-state export through `writeSceneState(...)`
- reported view-state tracking through `updateReportedViewState(...)`
- pick-target export through `writeSkyEnginePickTargets(...)`
- cleanup of exported compatibility attributes through `clearSceneState(...)` and `clearSkyEnginePickTargets(...)`

This keeps runtime reporting explicit and module-owned instead of embedding it in the bridge.

## What Remains Temporary After This Slice

The bridge remains as a thin compatibility shell for:

- fallback startup status messaging
- navigation selection sync
- per-frame navigation update
- direct Babylon layer disposal

That shell is still temporary, but it is no longer the owner of reporting/export work.

## Validation Plan

Structural validation:

- `SceneReportingModule` exists and is explicitly registered before the bridge
- `SkyEngineRuntimeBridge.ts` no longer calls `writeSceneState(...)`
- `SkyEngineRuntimeBridge.ts` no longer calls `writeSkyEnginePickTargets(...)`
- runtime-boundary tests prove the reporting/export ownership move

Runtime validation:

- targeted runtime-boundary tests
- frontend typecheck
- frontend build
- verify `/api/v1/scene?scope=sky&engine=sky_engine` returns `200`

Live comparison:

- compare live Stellarium at `http://127.0.0.1:8080/`
- compare Astronomy Hub at `http://127.0.0.1:4173/sky-engine`
- confirm no new runtime regressions in rendering, interaction, or selection/export behavior

## Stellarium Mapping

Reference sources:

- `src/core.c`
- `src/core.h`
- `src/module.h`

Phase 1D matches Stellarium’s ownership shape by keeping core/module-owned runtime state and render/update flow explicit, instead of leaving compatibility reporting stranded in a bridge layer between the runtime and the host.
