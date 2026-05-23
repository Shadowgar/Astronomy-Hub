# Phase 1C — LandscapeModule Extraction + Horizon Ownership

## Purpose

Create a dedicated runtime-owned `LandscapeModule` so horizon and landscape blocking submission are no longer implicitly owned by the atmosphere or generic background path.

This slice is structural. It does not redesign the landscape, add panoramas, change stars, or introduce new visual features.

## Current Landscape Responsibilities

The current direct Babylon background path still mixes two distinct concerns:

- atmosphere-owned visible-sky submission
- landscape-owned horizon and ground blocking submission through the ribbon path

The actual landscape/horizon orchestration currently lives inside `directBackgroundLayer.ts`, even though `AtmosphereModule` triggers the combined submission.

## What Moves Into `LandscapeModule`

`LandscapeModule` owns:

- current horizon ribbon preparation through `prepareDirectLandscapeFrame(...)`
- current horizon and ground blocking submission through `directBackgroundLayer.syncLandscape(...)`
- the non-atmosphere landscape path that should not remain inside backdrop atmosphere ownership

This matches the intended structure where landscape and horizon blocking are a runtime-owned subsystem distinct from atmosphere.

## What Remains Outside `LandscapeModule`

For this slice, these concerns stay outside:

- visible-sky backdrop, twilight, glare, and patch submission in `AtmosphereModule`
- bounded synthetic density-star fallback drawing in `BackgroundRuntimeModule`
- star tile and packet projection in `StarsModule`
- non-star projected objects in `ObjectRuntimeModule`
- labels, aids, and trajectories in `OverlayRuntimeModule`
- compatibility reporting in the bridge

## Compatibility / Deferred Items

Deferred after this slice:

- panorama and HiPS landscape ownership
- deeper horizon occlusion parity with Stellarium landscape datasets
- any new landscape assets or visibility features
- Milky Way ownership
- painter decomposition

## Bridge / Module Mapping

- `AtmosphereModule`
  - owns visible-sky/backdrop atmosphere submission
- `LandscapeModule`
  - owns horizon and ground blocking submission
- `BackgroundRuntimeModule`
  - keeps bounded non-atmosphere density fallback only
- bridge
  - remains compatibility reporting and disposal only

## Module Order

This slice uses the explicit runtime order:

- `AtmosphereModule` → `10`
- `LandscapeModule` → `15`
- `BackgroundRuntimeModule` → `18`
- `StarsModule` → `20`
- `ObjectRuntimeModule` → `30`
- `OverlayRuntimeModule` → `40`
- bridge → `100`

The background fallback remains after landscape because it is a bounded canvas-only density overlay, not a horizon owner.

## Validation Plan

Structural validation:

- `LandscapeModule` exists and is explicitly registered between atmosphere and background fallback
- `AtmosphereModule` no longer owns landscape ribbon preparation
- `BackgroundRuntimeModule` remains fallback-only
- runtime-boundary tests prove the ownership move

Runtime validation:

- targeted runtime-boundary tests
- frontend typecheck
- frontend build
- verify `/api/v1/scene?scope=sky&engine=sky_engine` is healthy before concluding

Live comparison:

- compare live Stellarium at `http://127.0.0.1:8080/`
- compare Astronomy Hub at `http://127.0.0.1:4173/sky-engine`
- confirm no regression in visible horizon / landscape presence or interaction feel

## Stellarium Mapping

Reference sources:

- `src/modules/landscape.c`
- `src/core.c`
- `src/module.h`

Phase 1C matches Stellarium’s structure by giving landscape and horizon blocking its own runtime-owned module instead of leaving it embedded in the generic background submission path.
