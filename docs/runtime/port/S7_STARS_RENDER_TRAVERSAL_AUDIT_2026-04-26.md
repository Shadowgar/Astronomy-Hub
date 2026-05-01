# S7 Stars Render Traversal Audit — 2026-04-26

Mode: Stellarium Port Mode ACTIVE  
Scope: S7 quality audit only (`stars.c::render_visitor` / `stars_render` traversal behavior). No runtime changes.

## Executive Verdict

S7 is acceptable as a **partial source-faithful traversal slice**.

What is now source-faithful enough to proceed:
- `render_visitor`-shaped tile walk exists and is active in runtime star projection path.
- tile-level magnitude gate, per-star sorted early-break, projection reject, and descend gate are mapped.
- root fallback traversal (when diagnostics roots are empty) closes a practical traversal gap and keeps root->children behavior alive.

What is not yet parity-complete:
- full `stars_render` survey loop semantics (native multi-survey traversal structure) remain simplified.
- native luminance/reporting and name/hint side effects from `stars.c` are not fully mirrored.

Decision: **Accept S7 as bounded partial parity; do not claim full `stars.c` parity.**

Exact S8 recommendation: **(b) stars.c survey traversal / stars_render loop**.

## Function-By-Function Comparison

### 1) `stars.c::render_visitor`

Source anchor: `study/stellarium-web-engine/source/stellarium-web-engine-master/src/modules/stars.c:645`

Mapped AH path:
- visitor entry: `frontend/src/features/sky-engine/engine/sky/runtime/starsRenderVisitor.ts:115`
- limit clamp (`fmin(stars_limit_mag, hard_limit_mag)`): `starsRenderVisitor.ts:121-123` (source `stars.c:658`)
- tile clip early exit: `starsRenderVisitor.ts:82-84` (source `stars.c:661-663`)
- tile mag gate: `starsRenderVisitor.ts:77-80` (source `stars.c:671-672`)
- per-star sorted early break: `starsRenderVisitor.ts:87-91` (source `stars.c:675-677`)
- projection reject: `starsRenderVisitor.ts:92-96` (source `stars.c:679-680`)
- descend gate (`mag_max > limit_mag`): `starsRenderVisitor.ts:108-112` (source `stars.c:714-716`)

Verdict:
- S7 improved source-faithfulness by keeping visitor gating and early-break order close to native shape.
- Still simplified vs C implementation for per-star side effects (illumination accumulation, selectability object assignment, name rendering).

### 2) `stars.c::stars_render`

Source anchor: `study/stellarium-web-engine/source/stellarium-web-engine-master/src/modules/stars.c:720`

Native behaviors:
- survey loop (`DL_FOREACH`): `stars.c:731-742`
- survey-level min-vmag skip: `stars.c:734-735`
- hips iterator root->children traversal: `stars.c:736-741`
- luminance report + progress report: `stars.c:744-754`

Current AH equivalent path:
- projection entrypoint: `frontend/src/features/sky-engine/engine/sky/runtime/modules/runtimeFrame.ts:790`
- visitor invocation: `runtimeFrame.ts:859-892`
- point emission intent/path: `frontend/src/features/sky-engine/engine/sky/runtime/modules/StarsModule.ts:125-210`

Verdict:
- AH calls a visitor-shaped traversal and emits point items through painter API surface.
- AH does not yet reproduce full native per-survey iteration/lifecycle semantics from `stars_render`.

### 3) Traversal roots and child walk reliability

Source expectation:
- native hips iterator seeds roots and conditionally pushes children (`stars.c:736-741`).

S7 change:
- AH root fallback from `scenePacket.starTiles` when diagnostics roots are absent:
  - `frontend/src/features/sky-engine/engine/sky/runtime/starsRenderVisitor.ts:58-67`

Verdict:
- This is a valid bounded alignment that prevents traversal collapse when diagnostics roots are empty.

## Source-Faithful Behaviors in S7

1. Visitor-shaped traversal is explicit and used in star projection path (`runtimeFrame.ts:859-892`, `starsRenderVisitor.ts:115-160`).
2. Limit magnitude clamp behavior matches native intent (`starsRenderVisitor.ts:121-123`, source `stars.c:658`).
3. Tile and star filtering order aligns with native gating sequence (tile gate -> sorted star loop -> break/continue).
4. Conditional child descent based on tile max magnitude mirrors native gate (`starsRenderVisitor.ts:108-112`, source `stars.c:714-716`).
5. Root fallback traversal closes a real robustness gap without changing renderer ownership.

## Simplifications / Missing Behaviors

1. Full survey loop parity (`stars.c:731-742`) remains simplified in current AH scene-packet traversal model.
2. Native illumination accumulation/reporting path (`stars.c:682`, `744-751`) is not equivalently ported.
3. Native hint/name side effects (`star_render_name`, `stars.c:704-705`) remain outside this S7 slice.
4. Native painter-side selection coupling (`obj` assignment in points, `stars.c:699-701`) is not fully mirrored by current runtime entry shaping.
5. Progress reporting semantics (`progressbar_report`, `stars.c:753`) are not a parity target in current runtime path.

## Test Coverage Gaps

What tests currently prove:
- Traversal shape and early-break behavior:
  - `frontend/tests/sky-engine-runtime-frame-projection.test.js:217-285`
- Root fallback traversal behavior when diagnostics roots are empty:
  - `frontend/tests/sky-engine-runtime-frame-projection.test.js:287+`
- Direct-star ownership and painter backend disabled default behavior:
  - `frontend/tests/sky-engine-stars-runtime.test.js:218-252`

What they do not yet prove:
1. Exact native survey-loop ordering across multiple surveys (true `stars_render` semantics).
2. Native luminance accumulation/reporting behavior parity.
3. End-to-end equivalence of all `render_visitor` side effects beyond traversal/filter gates.

## Usability Protection Checks

S7 audit confirms no regression against pre-S7 usability safeguards:

1. Loading fallback behavior remains present:
- temporary seed source retained (`frontend/src/features/sky-engine/SkyEngineScene.tsx:340`).

2. Hipparcos bootstrap transition behavior remains present:
- bootstrap query cap still wired (`frontend/src/features/sky-engine/SkyEngineScene.tsx:376-389`, `frontend/src/features/sky-engine/sceneQueryState.ts:13-29`).

3. Direct star ownership remains active:
- `directStarLayer.sync(...)` still called in StarsModule render (`frontend/src/features/sky-engine/engine/sky/runtime/modules/StarsModule.ts:397-403`).
- Painter backend remains not default visual owner (validated by existing ownership tests in `sky-engine-stars-runtime.test.js`).

## S7 Acceptance Decision

S7 is **accepted** as a bounded, source-cited partial slice for `render_visitor` traversal alignment.

Acceptance basis:
- source-shaped traversal behavior exists and is covered by focused regression tests,
- S7 added a safe root fallback alignment,
- no renderer ownership switch occurred,
- no rollback of usability recovery / bootstrap reliability behavior occurred.

## Exact S8 Recommendation

Recommended S8 target: **(b) stars.c survey traversal / stars_render loop**.

Why this next:
1. S7 already improved `render_visitor`-shape traversal internals.
2. Largest remaining structural parity gap is native survey iteration and traversal orchestration at `stars_render` level.
3. This can remain bounded without enabling painter backend ownership or undoing usability protections.

Not recommended yet:
- (e) backend visual ownership switch, because direct layer ownership must remain active at this stage.


## S8 Appendix — Survey Traversal Slice Landed

Date: 2026-05-01  
Scope: bounded `stars.c::stars_render` survey/source loop shaping only.

What landed:
1. Added `visitStarsRenderSurveys(...)` in `frontend/src/features/sky-engine/engine/sky/runtime/starsRenderVisitor.ts`.
2. Made traversal explicit as diagnostics/source tier loop -> existing tile visitor -> entry emission.
3. Added bounded survey pre-gate (`surveyMinMagnitude > starsLimitMagnitude`) mirroring native survey skip intent.
4. Updated `collectProjectedStars(...)` in `runtimeFrame.ts` to consume survey-loop results while keeping S7 visitor behavior intact.

What did not change:
- `directStarLayer` remains visual owner.
- painter backend default execution state unchanged.
- startup fallback seed behavior unchanged.
- Hipparcos bootstrap/catalog transition path unchanged.

Parity scope note:
- This remains a partial source-faithful slice and does not claim full `stars.c` parity.
