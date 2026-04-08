# Sky Engine Port Recovery Phase 0D Design

Date: 2026-04-08
Scope: bounded runtime/module extraction only
Status: implementation slice

## Goal

Reduce `SkyEngineRuntimeBridge.ts` from a hidden engine implementation into a thin compatibility coordinator by extracting the first real runtime modules under `SkyCore`.

This slice keeps current Babylon behavior intact. It does not change visual semantics, painter architecture, catalog scope, or parity tuning.

## BackgroundRuntimeModule

Responsibilities:
- own background render orchestration
- consume runtime-projected frame state prepared earlier in the tick
- sync the direct background layer
- run the bounded density-star fallback draw pass on the background canvas

Owned orchestration:
- background frame preparation
- direct background layer submission
- synthetic density-star fallback submission

Deferred:
- atmosphere module parity
- landscape/sky shader parity work
- painter-level background abstraction

## ObjectRuntimeModule

Responsibilities:
- own projected object preparation for the current frame
- own direct object layer submission
- refresh runtime pick targets from projected objects

Owned orchestration:
- viewport sync and per-frame projection view creation
- projected object collection from current objects and scene packet
- LOD derivation for the current frame
- direct object layer sync
- pick entry refresh

Deferred:
- stars module parity
- deeper picking redesign
- object batching or painter migration

## OverlayRuntimeModule

Responsibilities:
- own overlay frame preparation and submission
- keep labels, aids, trajectories, and guide overlays out of the bridge

Owned orchestration:
- direct overlay frame preparation
- direct overlay layer sync
- runtime storage of visible label ids and trajectory object id for bridge reporting

Deferred:
- labels module parity
- text atlas/batching work
- constellation/guide visual tuning

## Bridge Shrink Target

Leaves `SkyEngineRuntimeBridge.ts` in this slice:
- the bridge loses projected object preparation
- the bridge loses background render orchestration
- the bridge loses object layer render orchestration
- the bridge loses overlay render orchestration

Remains temporary in `SkyEngineRuntimeBridge.ts` after this slice:
- runtime/service construction
- Babylon runtime creation
- compatibility module for navigation update, atmosphere fallback status reporting, scene-state reporting, and pick-target export
- final layer disposal until deeper runtime cleanup work is approved

## SkyCore Registration

`SkyCore` remains the owner of the runtime and services. It now registers modules explicitly in render order:

1. `BackgroundRuntimeModule`
2. `ObjectRuntimeModule`
3. `OverlayRuntimeModule`
4. `SkySceneBridgeModule`

This keeps module order explicit and Stellarium-shaped without introducing a broader painter system.

## React Boundary After 0D

`SkyEngineScene.tsx` remains a mount/unmount and prop-sync host only.

It now:
- creates `SkyCore`
- wires runtime services
- registers the extracted runtime modules
- registers the thin bridge compatibility module

It does not:
- attach raw listeners
- own clock cadence
- own render orchestration
- own background/object/overlay composition
