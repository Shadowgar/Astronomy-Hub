# Phase 2A — Sky Brightness + Exposure Module

## Purpose

Create a dedicated runtime-owned `SkyBrightnessExposureModule` so scene-wide sky brightness and exposure-style response are no longer inferred opportunistically across stars, atmosphere, and fallback background paths.

This slice is structural. It centralizes response ownership without attempting a full Stellarium parity rewrite.

## Current Sky Brightness / Exposure Responsibilities

Before this slice, scene-wide response ownership was fragmented:

- `skyBrightness.ts`
  - computed sky brightness and effective limiting magnitude
- `nightSkyBackground.ts`
  - held the night-sky luminance floor model, but not under runtime ownership
- `runtimeFrame.ts`
  - computed limiting magnitude during star projection
- `AtmosphereModule`
  - implicitly derived backdrop opacity from star visibility via the direct background path
- `BackgroundRuntimeModule`
  - used star visibility and star field brightness directly for synthetic density fallback budgeting

That shape made scene-wide response state real, but not explicitly runtime-owned.

## What Moves Into `SkyBrightnessExposureModule`

`SkyBrightnessExposureModule` owns evaluation of:

- scene-wide sky brightness scalar
- effective limiting magnitude for the current FOV
- centralized star visibility scalar
- centralized star field brightness scalar
- centralized atmosphere exposure scalar
- centralized backdrop opacity
- bounded night-sky luminance floor samples for zenith and horizon

The module writes a runtime-owned response state that later modules can consume.

## What Remains Outside For Now

This slice does not move or rewrite:

- visual calibration generation in `solar.ts`
- detailed tone-mapping or HDR adaptation behavior matching Stellarium’s full tonemapper
- atmosphere color generation
- star render profile math
- Milky Way response
- painter-level luminance propagation

Those remain deferred to later fidelity slices.

## Current Files / Functions Coordinated

This slice centralizes ownership around these existing helpers:

- `skyBrightness.ts`
  - `computeSkyBrightness(...)`
  - `computeEffectiveLimitingMagnitude(...)`
- `nightSkyBackground.ts`
  - `computeNightSkyLuminance(...)`

Consumers updated in this slice:

- `AtmosphereModule`
  - consumes centralized backdrop response
- `StarsModule`
  - consumes centralized limiting magnitude and visual response calibration
- `BackgroundRuntimeModule`
  - consumes centralized star visibility / star field brightness response

## Module Order

This slice uses the explicit runtime order:

- `SkyBrightnessExposureModule` → `5`
- `AtmosphereModule` → `10`
- `LandscapeModule` → `15`
- `BackgroundRuntimeModule` → `18`
- `StarsModule` → `20`
- `ObjectRuntimeModule` → `30`
- `OverlayRuntimeModule` → `40`
- `SceneReportingModule` → `90`
- bridge → `100`

The brightness/exposure module runs first so dependent modules consume a shared state instead of recomputing response locally.

## Validation Plan

Structural validation:

- `SkyBrightnessExposureModule` exists and is explicitly registered first
- `runtimeFrame.ts` no longer computes sky brightness and limiting magnitude directly
- atmosphere, stars, and background fallback consume `runtime.brightnessExposureState`
- runtime-boundary tests prove the ownership move

Runtime validation:

- targeted runtime-boundary tests
- frontend typecheck
- frontend build
- verify `/api/v1/scene?scope=sky&engine=sky_engine` returns `200`

Live comparison:

- compare live Stellarium at `http://127.0.0.1:8080/`
- compare Astronomy Hub at `http://127.0.0.1:4173/sky-engine`
- confirm no new regression in night-sky darkness floor, twilight suppression/reveal, or route health

## Stellarium Mapping

Reference sources:

- `src/skybrightness.c`
- `src/skybrightness.h`
- `src/tonemapper.c`
- `src/tonemapper.h`
- `src/modules/atmosphere.c`
- `src/modules/stars.c`
- `src/core.c`
- `src/core.h`

Phase 2A matches Stellarium’s ownership shape by making scene-wide brightness and exposure response a core-owned runtime output that atmosphere and stars consume, instead of leaving those decisions scattered inside downstream render paths.
