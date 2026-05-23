# Sky Engine Phase 2D — Atmosphere Fidelity Design

## Purpose

Refine the visible sky so the atmosphere reads less like a flat background and more like a layered atmosphere across daylight, twilight, and dark night.

## Current Weaknesses

The current atmosphere path is structurally correct but visually shallow:

- `AtmosphereModule` only forwards a thin frame into the direct background layer
- horizon and zenith separation is too weak
- twilight is mostly a single band plus a simple sun glow
- the dark-night floor is not materially shaping the visible sky
- centralized brightness/exposure state is only consumed through `backdropAlpha`

## In-Scope Changes

This slice refines the existing atmosphere-owned render output by:

- extending `prepareDirectAtmosphereFrame(...)` to consume `runtime.brightnessExposureState`
- adding richer bounded frame fields:
  - `horizonGlowStrength`
  - `zenithDarkening`
  - `twilightLowerBandIntensity`
  - `nightFloorTintHex`
  - `nightFloorStrength`
  - `exposureOpacity`
- updating the atmosphere shader response so the visible sky has stronger vertical structure and twilight behavior

## Out of Scope

- projection rewrites
- ownership changes to stars, Milky Way, landscape, overlays, or routing
- bloom / post-processing
- painter abstraction
- new datasets or panorama assets
- full physical parity with Stellarium’s full atmosphere luminance model

## Files Touched

- `frontend/src/features/sky-engine/engine/sky/runtime/modules/AtmosphereModule.ts`
- `frontend/src/features/sky-engine/directBackgroundLayer.ts`
- `frontend/tests/test_atmosphere_fidelity.test.js`

## Brightness / Exposure Consumption

`SkyBrightnessExposureModule` remains the only owner of scene-wide brightness/exposure state.

Phase 2D uses:

- `skyBrightness`
- `atmosphereExposure`
- `backdropAlpha`
- `nightSkyZenithLuminance`
- `nightSkyHorizonLuminance`

The atmosphere path becomes a deeper consumer of that state rather than a second owner of sky response logic.

## Validation Plan

1. Verify `AtmosphereModule` still owns atmosphere submission.
2. Verify atmosphere frame preparation now consumes centralized brightness/exposure state directly.
3. Run targeted tests for atmosphere fidelity shaping and runtime boundaries.
4. Run frontend typecheck and build.
5. Verify:
   - `GET /api/v1/scene?scope=sky&engine=sky_engine` returns `200`
   - `http://127.0.0.1:8080/` returns `200`
   - `http://127.0.0.1:4173/sky-engine` returns `200`
6. Perform live comparison with:
   - one twilight local route check
   - one dark-night local route check
   - live Stellarium as the behavioral reference
7. State approximation gaps explicitly instead of claiming full physical parity.
