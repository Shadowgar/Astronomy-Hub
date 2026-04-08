# Sky Engine Port Recovery Phase 0D Design

Date: 2026-04-08
Scope: bounded runtime/module extraction only
Status: implementation slice

## Goal

Reduce `SkyEngineRuntimeBridge.ts` from a hidden engine implementation into a thin compatibility coordinator by extracting the first real runtime modules under `SkyCore`.

This slice keeps current Babylon behavior intact. It does not change visual semantics, painter architecture, catalog scope, or parity tuning.

## Bridge To Module Mapping

Bridge responsibilities moved into real runtime modules:
- background frame preparation and direct background submission now live in `BackgroundRuntimeModule`
- synthetic density-star fallback coordination now lives in `BackgroundRuntimeModule`
- projected object collection, viewport/FOV frame construction, and pick-entry refresh now live in `ObjectRuntimeModule`
- direct object-layer submission now lives in `ObjectRuntimeModule`
- overlay frame preparation plus labels/aids/trajectory submission now live in `OverlayRuntimeModule`

Bridge responsibilities intentionally retained:
- Babylon runtime creation and disposal
- service construction and prop sync entrypoints
- bounded compatibility reporting for scene state and pick target export
- per-frame navigation update coordination that still belongs to the temporary compatibility shell in this slice

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

Not handled in this slice:
- painter abstraction or painter parity work
- deeper module splitting inside background/object/overlay paths
- new catalogs, labels, atmosphere tuning, or visual upgrades
- runtime service redesign beyond consuming the existing observer/navigation/projection/input/clock backbone

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

## Live Stellarium Parity Baseline

Behavioral authority used for this slice:
- live reference: `http://127.0.0.1:8080/`
- source reference: `/study/stellarium-web-engine/source/stellarium-web-engine-master/src/`

Baseline observations from the live reference before extraction verification:
- background behavior: strong day/night gradient with horizon brightening, atmospheric glow, and a landscape horizon that visibly occludes below-horizon content
- object behavior: dense star placement with center-weighted readability, sky-culture/object labels, and stable major-object placement during drag/zoom
- overlay behavior: labels and guides remain separate from the core background/object draw path and appear to be layered after object placement
- interaction feel: drag and zoom are immediate, and the scene updates continuously without host-page ownership leaks

Source structure observations used to match runtime ownership:
- `core.c` sorts child modules by render order and updates/renders them under core ownership
- `module.h` defines module-level update/list/render behavior as a module concern rather than a page concern
- `atmosphere.c`, `stars.c`, `landscape.c`, `constellations.c`, and `labels.c` keep rendering responsibilities separated by module

## Validation Plan

Structural validation:
- verify `SkyCore` explicitly registers `BackgroundRuntimeModule`, `ObjectRuntimeModule`, `OverlayRuntimeModule`, and the thin bridge module in render order
- verify `SkyEngineRuntimeBridge.ts` no longer owns projected object collection, background preparation, or overlay preparation helpers

Functional validation:
- run targeted runtime-boundary tests that prove module registration and bridge shrinkage
- run frontend typecheck and build
- smoke-check `/sky-engine` in the local Astronomy Hub preview

Live parity validation:
- compare Astronomy Hub `/sky-engine` against live Stellarium for background layering, object density/placement feel, overlay presence, and drag/zoom responsiveness
- if behavior differs, treat it as an ownership regression first and fix the extraction boundary before changing visuals
