# S8 Stars Survey Traversal Audit — 2026-04-26

Mode: Stellarium Port Mode ACTIVE  
Scope: S8 quality audit + visible-star regression check only. No runtime code changes.

## Executive Verdict

S8 is accepted as a **partial source-faithful slice** for `stars.c::stars_render` loop shaping.

Visible-star regression verdict:
- The latest `hipparcos`-backed 6-star profile is **not evidence of an S8 traversal regression**.
- Current evidence points to **view/scene limiting-magnitude conditions** (very low effective limit in that capture), not survey omission or fallback persistence.

## S8 Source Comparison (`stars_render` / `render_visitor`)

### 1) Survey loop structure

Stellarium source:
- `stars.c:731-742`: iterate surveys, per-survey traverse iterator, call `render_visitor`.
- `stars.c:734-735`: skip survey when `survey->min_vmag > painter.stars_limit_mag`.

AH S8:
- `frontend/src/features/sky-engine/engine/sky/runtime/starsRenderVisitor.ts:183-206`
  - `visitStarsRenderSurveys(...)` now performs explicit survey/source-tier loop.
  - survey pre-gate via `surveyMinMagnitude > input.starsLimitMagnitude`.

Assessment:
- This is a bounded source-shaped equivalent of the native outer survey loop.

### 2) Visitor semantics

Stellarium `render_visitor` anchors:
- limit clamp: `stars.c:658`
- tile gate: `stars.c:671-672`
- sorted-star early break: `stars.c:675-677`
- project skip: `stars.c:679-680`
- descend gate: `stars.c:714-716`

AH S7/S8 retained behavior:
- `starsRenderVisitor.ts:84-119` and `:131-170`
- root fallback still present: `starsRenderVisitor.ts:65-73`

Assessment:
- S8 did not remove S7 visitor behavior; it wrapped it with survey-order traversal.

## Required Regression Checks

### 1) Survey pre-gate correctness

Code:
- `starsRenderVisitor.ts:193-200`

Result:
- Pre-gate only skips tiers whose minimum star magnitude exceeds limit.
- In hipparcos packet mode, at least one tier still passes (confirmed by non-zero projected/rendered stars and `dataMode=hipparcos`).
- No evidence the pre-gate skips all Hipparcos tiers incorrectly.

### 2) `activeTiers + remaining packet tiers` ordering completeness

Code:
- `starsRenderVisitor.ts:173-181`

Result:
- Order includes diagnostics tiers present in packet, then all remaining packet tiers sorted.
- This ordering cannot omit packet tiers entirely; it only orders them.

### 3) Root/child tile traversal integrity

Code:
- root recovery fallback retained: `starsRenderVisitor.ts:65-73`
- child walk retained: `starsRenderVisitor.ts:158-163`

Tests:
- `frontend/tests/sky-engine-runtime-frame-projection.test.js:287-348` (root fallback traversal)

Result:
- S7 root/child behavior remains intact.

### 4) Limiting-magnitude / early-break aggressiveness

Code:
- limit clamp: `runtimeFrame.ts:799-805`
- star-loop break in visitor: `starsRenderVisitor.ts:94-98`

Runtime evidence (latest baseline profile artifact):
- `dataMode=hipparcos`, `sourceLabel="Hipparcos · 8,870 stars"`
- `starsExposureLimitMag=2.21875`
- `starsPainterLimitMag=3.125`
- projected/rendered stars: `6`

Interpretation:
- At that capture state, low effective limiting magnitude naturally yields very sparse visible stars.
- This is not caused by traversal loop shape alone.

## Why Latest Catalog-Backed Profile Rendered 6 Stars

Primary cause in captured run:
1. Catalog path is active (not fallback):
- mode/label are hipparcos-backed (`Hipparcos · 8,870 stars`).
2. Effective visibility threshold is low in that snapshot:
- `starsExposureLimitMag ≈ 2.22`.
3. With that limit, only brightest stars survive filters at the sampled view/time/FOV.

Additional evidence from interaction recapture (`module2-live-runtime-profile-interaction-s8-audit-2026-04-26.json`):
- still hipparcos-backed,
- after interaction (`FOV≈21.5`):
  - `starsExposureLimitMag ≈ 4.44`,
  - rendered/projected stars rise to `19`.

Conclusion:
- Star count responds to view/limit state as expected.
- No evidence of fallback-star persistence in hipparcos mode.
- No evidence S8 survey traversal omitted active data tiers.

## Comparison vs Earlier “Hundreds of Stars” Recovery Profiles

Earlier recovery documents showing hundreds of stars were captured under materially different runtime conditions (including different interaction states and broader limiting magnitude outcomes).  
Current run’s low count is associated with low effective limiting magnitude, not with catalog transition failure or direct/painter ownership changes.

## Ownership / Mode Safety Checks

Verified in profile and tests:
- `directStarLayerStillActive = true`
- `backendExecutionStatus = execution_disabled`
- no backend ownership switch occurred

## Validation Executed

- `npm run typecheck` ✅
- `npm run test -- tests/sky-engine-runtime-frame-projection.test.js tests/sky-engine-stars-runtime.test.js tests/test_scene_query_state.test.js tests/test_painter_backend_port.test.js` ✅
- `npm run build` ✅ (Node 20.18.2 warning present; build completes)
- `npm run profile:sky-engine-runtime` ✅
- interaction recapture (Playwright scripted drag/zoom) ✅

Artifacts used:
- `.cursor-artifacts/parity-compare/module2-live-runtime-profile-2026-04-26.json`
- `.cursor-artifacts/parity-compare/module2-live-runtime-profile-interaction-s8-audit-2026-04-26.json`
- `.cursor-artifacts/parity-compare/module2-live-runtime-profile-interaction-2026-04-26.json` (older reference)

## Test Coverage Gaps

1. No live assertion that survey-loop tier ordering under real hipparcos packets reproduces native survey sequencing semantics beyond tier proxying.
2. No parity-level test for full `stars_render` luminance/reporting side effects (`stars.c:744-754`).
3. No explicit runtime test that isolates limiting-magnitude drift causes versus traversal causes under fixed scene/time presets.

## S8 Acceptance Decision

S8 is accepted as a bounded partial source-faithful traversal slice:
- explicit survey/source loop added,
- S7 visitor behavior preserved,
- no renderer ownership or bootstrap/fallback regressions detected.

## Exact S9 Recommendation

Proceed with a **bounded S9 focused on stars visibility decision parity inputs**, not renderer ownership:

`S9 target: stars.c luminance/magnitude decision behavior audit+alignment for visible-star density stability`

Why:
1. S8 traversal is functioning and catalog-backed transition is intact.
2. The low rendered-star capture is tied to limiting-magnitude state (`starsExposureLimitMag`), making visibility-threshold behavior the next highest-value parity seam.
3. This can be done while keeping `directStarLayer` active and painter backend default-disabled.


## S9 Appendix — Luminance/Magnitude Decision Slice Landed

Date: 2026-05-01  
Scope: bounded stars visibility-limit flow shaping only.

What landed:
1. Added explicit S9 mapping doc:
- `docs/runtime/port/S9_STARS_LUMINANCE_MAGNITUDE_MAP_2026-04-26.md`
2. Clarified limit flow in StarsModule:
- exposure-derived limit,
- source-shaped painter clamp limit,
- bounded Hipparcos usability-adjusted limit (explicit non-parity tuning).
3. Propagated resolved stars limit deterministically into `collectProjectedStars(...)` and survey traversal input.
4. Added focused tests for low/high limit response, painter-limit propagation, and bounded Hipparcos boost behavior.

What did not change:
- directStarLayer ownership,
- painter backend default-disabled state,
- startup fallback behavior,
- Hipparcos bootstrap transition behavior.

Parity scope note:
- S9 remains a bounded partial slice; no full `stars.c` parity claim.
