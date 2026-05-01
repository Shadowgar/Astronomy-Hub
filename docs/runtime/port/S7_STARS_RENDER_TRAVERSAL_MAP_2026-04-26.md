# S7 Stars Render Traversal Map — 2026-04-26

Mode: Stellarium Port Mode ACTIVE  
Scope: bounded `stars.c` traversal mapping (`render_visitor` / `stars_render`) and minimal safe alignment only.

## Executive Summary

S7 starts from a strong existing base: AH already has a `render_visitor`-shaped traversal helper (`visitStarsRenderTiles`) and a `stars_render`-shaped call chain into painter point items while keeping `directStarLayer` active.

This slice adds one narrow traversal reliability alignment:
- recover root traversal from `scenePacket.starTiles` when diagnostics root IDs are missing,
- preserving existing ordering/filters/point emission behavior,
- without changing renderer ownership or enabling painter backend execution.

## Source -> AH Function Map

1. Stellarium `render_visitor`  
Source: `study/stellarium-web-engine/source/stellarium-web-engine-master/src/modules/stars.c:645`  
Current AH equivalent:
- tile traversal helper: `frontend/src/features/sky-engine/engine/sky/runtime/starsRenderVisitor.ts:115`
- tile gate (`mag_min > limit_mag`): `starsRenderVisitor.ts:77-80` (source `stars.c:671-672`)
- per-star break on sorted magnitude: `starsRenderVisitor.ts:87-91` (source `stars.c:675-677`)
- projection reject path: `starsRenderVisitor.ts:92-96` (source `stars.c:679-680`)
- descend gate (`mag_max > limit_mag`): `starsRenderVisitor.ts:108-112` (source `stars.c:714-716`)

2. Stellarium `stars_render`  
Source: `study/stellarium-web-engine/source/stellarium-web-engine-master/src/modules/stars.c:720`  
Current AH equivalent:
- projection/collection entrypoint: `frontend/src/features/sky-engine/engine/sky/runtime/modules/runtimeFrame.ts:790`
- visitor invocation and limit clamp: `runtimeFrame.ts:859-863` and `starsRenderVisitor.ts:121-123` (source `stars.c:658`)
- point emission path: `frontend/src/features/sky-engine/engine/sky/runtime/modules/StarsModule.ts:192-210`
- painter intent mirror + direct layer sync:
  - `StarsModule.ts:125-158` (`paint_stars_draw_intent`)
  - `StarsModule.ts:397-403` (`directStarLayer.sync`)

3. Painter point path references
- Stellarium point draw: `stars.c:708` -> `paint_2d_points(...)`
- AH point draw: `StarsModule.ts:209` -> `painter.paint_2d_points(...)`
- Direct star renderer remains active owner: `StarsModule.ts:397-403`

## True Parity Gaps (still out of scope for this S7 slice)

1. Full survey traversal/lifecycle parity with native `hips_iter` + per-survey loop in `stars_render` (`stars.c:731-741`) is not fully mirrored in runtime module structure.
2. Exact native per-star luminance accumulation/reporting path (`stars.c:682`, `744-751`) is not fully ported in this bounded slice.
3. Native name/hint rendering behavior (`star_render_name`, `stars.c:312-376`, `704-705`) is not part of this traversal-only step.
4. Exact clip semantics through native painter C pipeline are only partially mirrored via AH viewport projection/visibility gates.

## Must-Not-Change Constraints (kept)

1. Do not replace `directStarLayer` ownership.
2. Do not enable painter backend rendering by default.
3. Do not remove usability fallback path.
4. Do not undo catalog bootstrap transition reliability fix.
5. Do not claim full `stars.c` parity.

## Smallest Implementation Slice (applied)

### Change

- File: `frontend/src/features/sky-engine/engine/sky/runtime/starsRenderVisitor.ts`
- Function: `getTileOrder(...)`
- Alignment: when `diagnostics.visibleTileIds` does not yield roots, recover roots from `scenePacket.starTiles` (`parentTileId == null` or missing parent).

### Why this is source-faithful and safe

1. Preserves root->children traversal shape expected by native `hips_iter`.
2. Prevents traversal drop-to-empty due to missing diagnostics roots.
3. Does not alter:
- limiting magnitude math,
- per-star projection/filter path,
- painter emission,
- direct star layer ownership.

## Regression Coverage Added

1. Traversal order + early break behavior:
- `frontend/tests/sky-engine-runtime-frame-projection.test.js`
- verifies vmag ordering and early stop at limit.

2. Root fallback recovery:
- same test file,
- verifies traversal still works when `visibleTileIds` is empty but `starTiles` has roots.

3. Existing ownership and transition guards kept:
- `frontend/tests/sky-engine-stars-runtime.test.js`
- `frontend/tests/test_scene_query_state.test.js`
- `frontend/tests/test_painter_backend_port.test.js`

## S7 Slice Status

This S7 step is accepted as a bounded traversal-mapping/alignment slice only.  
It improves traversal robustness without renderer replacement and without parity-completion claims.
