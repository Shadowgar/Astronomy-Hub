# Sky Engine Phase 2C — Milky Way Design

## Purpose

Add the first dedicated galactic depth layer without changing the existing star, atmosphere, or overlay ownership model.

## Current Gap

The recovered runtime now has explicit ownership for brightness/exposure, atmosphere, landscape, fallback background stars, stars, objects, overlays, and reporting. It still lacks a dedicated galactic background owner, so the night sky can feel empty compared with Stellarium.

## Ownership Move

This slice introduces `MilkyWayModule` as the explicit owner of:

- galactic background render submission
- bounded procedural Milky Way patch generation
- visibility suppression/reveal driven by `runtime.brightnessExposureState`
- background-canvas clearing for the galactic-depth stack before fallback stars draw over it

## Implementation Approach

Use a bounded procedural galactic-band approximation rather than a new HiPS or panorama asset pipeline.

The module:

- samples a static set of galactic-band patches in galactic longitude/latitude
- converts those samples into observed sky directions using the existing coordinate transforms
- projects them through the active runtime projection
- draws a subtle additive layer on the existing background canvas

This keeps the slice local, reversible, and cheap enough for the current runtime.

## Brightness / Exposure Integration

`SkyBrightnessExposureModule` remains the owner of scene-wide response state. Phase 2C extends that state with:

- `milkyWayVisibility`
- `milkyWayContrast`

Expected response:

- daytime: nearly fully suppressed
- twilight: faintly present or absent depending on sky brightness
- dark night: visible but subordinate to the star field

`MilkyWayModule` consumes those values directly rather than inventing a separate day/night decision path.

## What Stays Outside This Slice

- full HiPS Milky Way imagery
- physically correct galactic luminance modelling
- bloom / post-processing
- painter abstraction
- star batching changes
- label or overlay redesign
- landscape asset work

## Module Order

Safe order for this slice:

- sky brightness / exposure `5`
- atmosphere `10`
- Milky Way `12`
- landscape `15`
- background fallback `18`
- stars `20`
- objects `30`
- overlays `40`
- reporting `90`
- bridge `100`

This keeps the galactic layer behind stars and overlays, but after atmosphere-owned backdrop state has been established.

## Validation Plan

1. Verify `MilkyWayModule` exists and is registered explicitly.
2. Verify `BackgroundRuntimeModule` no longer owns galactic-layer drawing.
3. Run targeted runtime/module tests.
4. Run frontend typecheck and build.
5. Verify:
   - `GET /api/v1/scene?scope=sky&engine=sky_engine` returns `200`
   - `http://127.0.0.1:8080/` returns `200`
   - `http://127.0.0.1:4173/sky-engine` returns `200`
6. Perform a live comparison:
   - use Stellarium for the night-sky behavioral target
   - use the local route plus its time controls when possible
   - if the live route remains in daylight, state that limitation explicitly instead of overclaiming parity
