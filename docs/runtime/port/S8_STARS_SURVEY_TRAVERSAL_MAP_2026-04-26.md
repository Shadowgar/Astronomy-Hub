# S8 Stars Survey Traversal Map — 2026-04-26

Mode: Stellarium Port Mode ACTIVE  
Scope: bounded `stars.c::stars_render` survey traversal / loop shaping only.

## Executive Summary

S7 aligned AH tile traversal toward `render_visitor`. The next bounded gap is the outer `stars_render` survey loop.  
S8 should keep existing visitor logic intact, but make traversal explicit as:

`survey/source loop -> tile visitor -> star entry emission`

while preserving:
- directStarLayer visual ownership,
- painter backend default disabled,
- startup fallback + Hipparcos bootstrap reliability behavior.

## Stellarium Source Flow (`stars.c::stars_render`)

Source anchors:
- function entry: `study/stellarium-web-engine/source/stellarium-web-engine-master/src/modules/stars.c:720`
- survey loop: `stars.c:731-742`
- survey min-vmag skip: `stars.c:734-735`
- iterator + `render_visitor`: `stars.c:736-741`
- luminance/progress reporting: `stars.c:744-754`

Key native flow:
1. Iterate loaded surveys (`DL_FOREACH`).
2. Skip survey when `survey->min_vmag > painter.stars_limit_mag`.
3. For each survey, run hips root traversal and call `render_visitor` per tile.
4. `render_visitor` applies tile/star filtering and point emission.
5. After all surveys, report luminance/progress side effects.

## Current AH Flow (Pre-S8)

Current runtime flow:
- entrypoint: `frontend/src/features/sky-engine/engine/sky/runtime/modules/runtimeFrame.ts:790`
- single visitor call over full packet: `runtimeFrame.ts:859-892`
- visitor internals: `frontend/src/features/sky-engine/engine/sky/runtime/starsRenderVisitor.ts:115-160`

Current gap:
- traversal is visitor-shaped but not explicitly survey/source-loop-shaped.
- all stars are traversed in one visitor pass instead of explicit per-survey/source pass.

## Where S7 Visitor Fits

`starsRenderVisitor.ts` already matches bounded `render_visitor` behavior:
- limit clamp,
- tile gate,
- sorted star early break,
- projection/clipping skip,
- child descent gate,
- root fallback traversal.

S8 should **reuse** this visitor behavior and wrap it with a source-loop seam.

## Survey Traversal Differences To Address

1. Native has explicit survey loop; AH currently has single packet traversal.
2. Native skips surveys with min-vmag above painter limit; AH has no source-level pre-skip.
3. AH has packet tier metadata (`star.tier`, `diagnostics.activeTiers`) that can serve as bounded survey/source proxies.

## Smallest Safe Implementation Slice

1. Add a `stars_render`-shaped helper in `starsRenderVisitor.ts`:
- derive deterministic source/survey order from `diagnostics.activeTiers` + packet tiers.
- for each source/tier:
  - compute source min magnitude,
  - skip source if above `starsLimitMagnitude` (bounded proxy of native survey skip),
  - call existing tile visitor constrained to that source/tier,
  - append entries in survey-loop order.

2. Update `runtimeFrame.collectProjectedStars` to call this survey-loop helper instead of direct one-pass visitor.

3. Keep unchanged:
- directStarLayer ownership,
- painter backend default status,
- fallback seed loading behavior,
- Hipparcos bootstrap/catalog transition logic,
- S7 root fallback tile traversal behavior.

## Out of Scope (Not Claimed in S8)

1. Full native survey object lifecycle / registration parity (`stars_add_data_source` internals).
2. Full luminance/progress side-effect parity (`stars.c:744-754`).
3. Backend painter execution ownership.
4. Full Gaia/multi-survey parity completeness.

