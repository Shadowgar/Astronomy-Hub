# Sky Engine Background Render Unification Design

**Date:** 2026-04-08

**Scope:** Correction Slice 3 for the active Sky Engine viewport.

## Goal

Reduce the remaining `backgroundCanvas` dependency by migrating the dominant background path into Babylon-native rendering while preserving the current sky behavior.

## Constraints

- No new astronomy features.
- No projection, extinction, sky brightness, or visibility smoothing changes.
- No backend changes.
- No label-system rewrite.
- Keep the slice bounded to backdrop, glare, horizon blocking, and procedural density stars.

## Current Ownership

- `drawBackground(...)` in `frontend/src/features/sky-engine/SkyEngineScene.tsx` owns the Preetham + night gradient backdrop.
- `drawProceduralSkyBackdrop(...)` owns diffuse backdrop glow patches.
- `drawSolarGlare(...)` owns projected sun glare.
- `drawLandscapeMask(...)` owns horizon blocking / below-horizon masking.
- `drawSyntheticDensityStars(...)` owns the synthetic density star fallback.

All of these still repaint through `backgroundCanvas` during scene redraw.

## Approved Approach

Approach 1:

- Move backdrop, glare, and landscape/horizon blocking into a Babylon-native background layer.
- Preserve the current math and visual inputs; only change render ownership.
- Migrate procedural density stars only if the change stays small and stable.
- If density-star migration expands into a larger batching rewrite, keep them as the single intentional canvas fallback and reduce unnecessary redraw pressure where practical.

## Planned Architecture

```text
runtime state
→ prepared background frame
→ Babylon background layer sync
→ Babylon object layer sync
→ Babylon overlay layer sync
→ optional density-star canvas fallback only
```

## Babylon Background Layer Responsibilities

- Sky backdrop material state derived from the current Preetham/night inputs.
- Procedural backdrop glow patches rendered as engine-owned quads if feasible in the same layer.
- Sun glare rendered as an additive billboard/plane positioned from current projected sun behavior.
- Horizon blocking rendered as an engine-owned mask/occlusion surface.

## Procedural Density Star Rule

- First choice: migrate with a small Babylon point/plane solution.
- Fallback: keep them on `backgroundCanvas` only, isolate them as the last bounded non-parity canvas path, and update them only when view/solar state materially changes.

## Stellarium Structural Target

Match the structural intent of Stellarium’s unified flow:

- `paint_prepare(...)`
- module render submission for atmosphere / stars / landscape
- `paint_finish(...)`

We are approximating this with Babylon-owned background, object, and overlay layers rather than browser canvas compositing.

## Known Remaining Non-Parity After This Slice

- No shared painter abstraction equivalent to Stellarium.
- No literal OpenGL atmosphere module parity.
- Procedural density stars may remain the single canvas fallback if the migration is not small.
