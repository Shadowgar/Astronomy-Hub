# S9 Stars Luminance / Magnitude Map — 2026-04-26

Mode: Stellarium Port Mode ACTIVE  
Scope: bounded S9 mapping for stars visibility-limit and luminance/magnitude decision flow.

## Executive Summary

S8 established survey/source traversal shape. S9 focuses on the magnitude-decision path that governs visible star density.

Core source shape to preserve:
1. `stars_render` survey pre-gate uses `painter.stars_limit_mag`.
2. `render_visitor` uses `limit_mag = fmin(painter.stars_limit_mag, painter.hard_limit_mag)`.
3. Per-tile/per-star filtering and break decisions are driven by `limit_mag`.
4. Luminance accumulation/reporting exists in native loop but remains only partially modeled in AH.

## Stellarium Source Anchors

### `stars.c`
- survey loop + pre-gate: `src/modules/stars.c:731-735`
- visitor limit clamp: `src/modules/stars.c:658`
- tile gate: `src/modules/stars.c:671-672`
- per-star early break: `src/modules/stars.c:675-677`
- illuminance accumulation: `src/modules/stars.c:682`
- point-size/luminance decision: `src/modules/stars.c:686-691`
- global luminance report: `src/modules/stars.c:744-751`

### `painter.c`
- point emission path: `src/painter.c:172-176` (`paint_2d_points`)

### `core.c`
- painter-related star-limit defaults source context:
  - core visual defaults influencing limit policy inputs (`star_*`, tonemapper, display limit): `src/core.c:173-185`, `:239`

## AH Current Equivalents

### Exposure-driven limit
- `frontend/src/features/sky-engine/engine/sky/runtime/modules/SkyBrightnessExposureModule.ts:63-69`
  - computes exposure-derived `brightnessExposureState.limitingMagnitude`

### Painter-limit clamp
- `frontend/src/features/sky-engine/engine/sky/runtime/stellariumPainterLimits.ts:76-85`
  - `resolveStarsRenderLimitMagnitude(exposure, painterLimits)`

### Traversal/filter clamp in projection path
- `frontend/src/features/sky-engine/engine/sky/runtime/modules/runtimeFrame.ts:799-805`
  - final `limitingMagnitude` used for fallback-star filtering and `visitStarsRenderSurveys` input
- `frontend/src/features/sky-engine/engine/sky/runtime/starsRenderVisitor.ts:131-133`
  - bounded visitor clamp (`min(starsLimitMagnitude, hardLimitMagnitude)`)

### Survey traversal (S8)
- `frontend/src/features/sky-engine/engine/sky/runtime/starsRenderVisitor.ts:183-206`
  - survey-order loop + survey pre-gate on min magnitude

### Stars module entry and propagation
- `frontend/src/features/sky-engine/engine/sky/runtime/modules/StarsModule.ts`
  - resolves star limit from exposure + painter limits
  - applies temporary Hipparcos-only usability delta (+0.3) bounded by hard limit
  - passes limit into `collectProjectedStars`

### Runtime reporting visibility fields
- `frontend/src/features/sky-engine/engine/sky/runtime/modules/StarsModule.ts` step metrics
- `frontend/src/features/sky-engine/engine/sky/runtime/modules/SceneReportingModule.ts` painter/delta snapshot

## Classification

### Source-faithful behavior currently present
1. Source-shaped painter limit clamp and visitor filtering/break semantics.
2. Survey/source loop wrapper from S8 with deterministic traversal order.
3. Direct point emission path retained (`paint_2d_points` mirror) while direct layer remains owner.

### Usability-only tuning (non-parity)
1. Hipparcos-only `+0.3` usability limit delta in `StarsModule`.
2. This must remain explicitly temporary and bounded by `hardLimitMag`.

### Missing/partial parity behavior
1. Native illuminance accumulation + `core_report_luminance_in_fov` coupling is only partially represented.
2. Full native point-size/luminance relationship (`core_get_point_for_mag`-driven) is approximated in AH point-visual path.
3. Full atmospheric/tonemapper scene-feedback loop parity is not complete.

## What Should Not Change Yet

1. Do not replace `directStarLayer` ownership.
2. Do not enable painter backend rendering by default.
3. Do not remove startup fallback / Hipparcos bootstrap reliability behavior.
4. Do not treat Hipparcos `+0.3` usability delta as Stellarium parity.
5. Do not broaden into full tonemapper/atmosphere rewrite in this slice.

## Smallest Safe S9 Implementation Slice

1. Make limit propagation explicit and deterministic:
- exposure-derived limit,
- source-shaped painter-clamped limit,
- optional bounded usability-adjusted limit (Hipparcos-only).

2. Feed resolved limit directly into star projection/traversal input to avoid ambiguity.

3. Add regression tests for:
- low vs high limiting magnitude response,
- painter-limit-driven filtering response,
- bounded Hipparcos usability delta behavior.

