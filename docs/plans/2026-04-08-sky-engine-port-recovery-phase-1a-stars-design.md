# Phase 1A — StarsModule Extraction + Ownership

## Purpose

Create the first dedicated Sky Engine subsystem module by moving current star-specific orchestration out of the generic projected-object path and into a runtime-owned `StarsModule`.

This slice is structural. It does not change visual targets, catalogs, projection math, or overlay behavior.

## Current Star Responsibilities

The current runtime mixes star ownership into the generic projected-scene path:

- tile and `scenePacket` star projection
- limiting magnitude integration
- atmospheric extinction and observed magnitude computation
- star visibility filtering
- star render profile and marker sizing
- final star entry assembly for direct object rendering

These responsibilities currently live in shared `runtimeFrame.ts` and are triggered from `ObjectRuntimeModule`.

## What Moves Into `StarsModule`

`StarsModule` owns:

- viewport/view-based star projection
- tile and packet star integration
- limiting magnitude computation
- extinction and star visibility filtering
- star render entry assembly passed into the direct object layer

This establishes star ownership explicitly before deeper painter or catalog work.

## What Remains Outside `StarsModule`

For this slice, these concerns remain outside:

- background synthetic density-star fallback in `BackgroundRuntimeModule`
- non-star projected object preparation in `ObjectRuntimeModule`
- labels, aids, trajectories, and overlay sync in `OverlayRuntimeModule`
- scene-state reporting and pick-target export in the compatibility bridge

## Compatibility / Deferred Items

Deferred after this slice:

- painter-style star rendering abstraction
- Milky Way and atmosphere parity work
- deeper catalog ownership beyond the current tile/packet path
- label ownership changes
- deeper luminance reporting parity with Stellarium

## Bridge / Module Mapping

- `SkyEngineRuntimeBridge.ts`
  - stays responsible for compatibility reporting only
- `StarsModule`
  - becomes the runtime owner of star-specific projection and visibility orchestration
- `ObjectRuntimeModule`
  - becomes non-star projected object orchestration plus merge of the final projected scene frame

## Validation Plan

Structural validation:

- `StarsModule` exists and is explicitly registered in `SkyEngineScene.tsx`
- star-specific orchestration is no longer initiated from `ObjectRuntimeModule`
- runtime module ordering is explicit: background → stars → objects → overlays → bridge

Runtime validation:

- targeted runtime-boundary tests
- frontend typecheck
- frontend build

Live comparison:

- compare live Stellarium at `http://127.0.0.1:8080/`
- compare Astronomy Hub at `http://127.0.0.1:4173/sky-engine`
- confirm no regression in star presence, density behavior at current zoom, or interaction feel

## Stellarium Mapping

Reference sources:

- `src/modules/stars.c`
- `src/core.c`
- `src/module.h`

Phase 1A matches Stellarium’s structural separation by giving stars their own runtime-owned module instead of letting generic object orchestration own star rendering concerns.
