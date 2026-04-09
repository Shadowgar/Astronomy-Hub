# Sky Engine Phase 2E — Tone / Adaptation Design

## Purpose

Refine scene-wide perceptual balance so atmosphere, stars, and the Milky Way feel more coupled across twilight and dark night without changing module ownership or adding post-processing.

## Current Weaknesses

- `SkyBrightnessExposureModule` still forwards too much raw visual calibration state directly into runtime response.
- Twilight and dark-night balance is too even, especially for star and Milky Way reveal.
- Atmosphere, stars, and Milky Way all consume centralized state, but that state is not yet adaptation-shaped strongly enough to create a believable scene-wide response.

## In-Scope Changes

This slice refines centralized response state by:

- adding bounded adaptation outputs:
  - `adaptationLevel`
  - `sceneContrast`
- deriving star reveal, Milky Way reveal, and atmosphere exposure from those adaptation outputs instead of forwarding only raw calibration values
- tightening propagation so:
  - atmosphere remains dominant in brighter sky
  - stars recede harder in twilight and reveal more strongly at dark night
  - the Milky Way follows the same scene-wide adaptation shape instead of a mostly independent darkness curve

## Out of Scope

- bloom or post-processing
- painter abstraction
- ownership changes
- new assets or catalogs
- HiPS Milky Way
- projection rewrites
- label redesign
- full Stellarium physical tonemapper parity

## Files Touched

- `frontend/src/features/sky-engine/engine/sky/runtime/modules/SkyBrightnessExposureModule.ts`
- `frontend/src/features/sky-engine/engine/sky/runtime/types.ts`
- `frontend/src/features/sky-engine/directBackgroundLayer.ts`
- `frontend/src/features/sky-engine/starRenderer.ts`
- `frontend/src/features/sky-engine/engine/sky/runtime/modules/MilkyWayModule.ts`
- `frontend/tests/test_tone_adaptation.test.js`

## Centralized Response Refinement

`SkyBrightnessExposureModule` remains the only owner of scene-wide response state.

Phase 2E refines that state by deriving:

- `adaptationLevel` from sky darkness and the bounded night-sky luminance floor
- `sceneContrast` from adaptation level, sky brightness, and dark-sky bias
- refined:
  - `starVisibility`
  - `starFieldBrightness`
  - `atmosphereExposure`
  - `milkyWayVisibility`
  - `milkyWayContrast`
  - `backdropAlpha`

Dependent modules continue to consume centralized state rather than inventing their own scene-wide logic.

## Validation Plan

1. Verify `SkyBrightnessExposureModule` still owns the scene-wide tone/adaptation response.
2. Verify stars and Milky Way consume refined centralized state rather than recomputing scene-wide adaptation locally.
3. Run targeted tests for adaptation shaping and existing runtime boundaries.
4. Run frontend typecheck and build.
5. Verify:
   - `GET /api/v1/scene?scope=sky&engine=sky_engine` returns `200`
   - `http://127.0.0.1:8080/` returns `200`
   - `http://127.0.0.1:4173/sky-engine` returns `200`
6. Perform live comparison with:
   - one twilight local route check
   - one dark-night local route check
   - live Stellarium as the behavioral reference
7. State the remaining tonemapper/adaptation approximation gap explicitly instead of claiming full parity.
