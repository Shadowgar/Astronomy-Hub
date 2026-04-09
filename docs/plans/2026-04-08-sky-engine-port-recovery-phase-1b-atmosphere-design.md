# Phase 1B — AtmosphereModule Extraction + Visible Sky Ownership

## Purpose

Create a dedicated runtime-owned `AtmosphereModule` so visible-sky and backdrop atmosphere submission are no longer implicitly owned by the generic background module.

This slice is structural. It does not change the sky model, add Milky Way work, or redesign stars, labels, or overlays.

## Current Atmosphere Responsibilities

The current background path still mixes two concerns:

- visible-sky / backdrop atmosphere submission through `prepareDirectBackgroundFrame(...)`
- bounded synthetic density-star fallback rendering on the background canvas

That makes atmosphere ownership implicit inside the generic background module.

## What Moves Into `AtmosphereModule`

`AtmosphereModule` owns:

- direct visible-sky backdrop frame preparation
- current glare / twilight / horizon atmosphere submission through `directBackgroundLayer`
- atmosphere-owned use of current calibrated visible-sky inputs already encoded in `sunState.visualCalibration`

This matches the intended structure where atmosphere is a runtime-owned subsystem instead of an incidental background side effect.

## What Remains Outside `AtmosphereModule`

For this slice, these concerns stay outside:

- synthetic density-star fallback drawing in `BackgroundRuntimeModule`
- star tile / packet projection in `StarsModule`
- non-star projected objects in `ObjectRuntimeModule`
- labels, aids, and trajectories in `OverlayRuntimeModule`
- compatibility reporting in the bridge

## Compatibility / Deferred Items

Deferred after this slice:

- Babylon atmosphere addon integration as the primary runtime path
- Milky Way ownership
- landscape-module extraction
- deeper luminance / adaptation parity with Stellarium core reporting
- any visible-sky quality upgrade beyond current calibrated behavior

## Bridge / Module Mapping

- `AtmosphereModule`
  - owns visible-sky/backdrop atmosphere submission
- `BackgroundRuntimeModule`
  - keeps bounded non-atmosphere fallback behavior only
- bridge
  - remains compatibility reporting and disposal only

## Validation Plan

Structural validation:

- `AtmosphereModule` exists and is explicitly registered before background/stars
- `BackgroundRuntimeModule` no longer calls `prepareDirectBackgroundFrame(...)`
- runtime-boundary tests prove the ownership move

Runtime validation:

- targeted runtime-boundary tests
- frontend typecheck
- frontend build
- verify `/api/v1/scene?scope=sky&engine=sky_engine` is healthy before concluding

Live comparison:

- compare live Stellarium at `http://127.0.0.1:8080/`
- compare Astronomy Hub at `http://127.0.0.1:4173/sky-engine`
- confirm no regression in visible sky presence, day/night backdrop behavior, or interaction feel

## Stellarium Mapping

Reference sources:

- `src/modules/atmosphere.c`
- `src/core.c`
- `src/module.h`

Phase 1B matches Stellarium’s structure by giving atmosphere/visible-sky submission its own runtime-owned module instead of leaving it embedded in the generic background path.
