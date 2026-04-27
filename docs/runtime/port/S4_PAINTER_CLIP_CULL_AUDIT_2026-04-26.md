# S4 Painter Clip/Cull Audit — 2026-04-26

Mode: Stellarium Port Mode ACTIVE  
Scope: audit only. No runtime implementation changes.

## Files Audited

- `docs/runtime/port/PORT_DRIFT_AUDIT_2026-04-26.md`
- `docs/runtime/port/S1_POINT_ITEM_PIPELINE_AUDIT_2026-04-26.md`
- `docs/runtime/port/S2_RENDER_GL_ITEM_LIFECYCLE_AUDIT_2026-04-26.md`
- `docs/runtime/port/S3_RENDER_GL_FLUSH_LIFECYCLE_AUDIT_2026-04-26.md`
- `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts`
- `frontend/src/features/sky-engine/engine/sky/runtime/SkyCore.ts`
- `frontend/src/features/sky-engine/engine/sky/runtime/SkyProjectionService.ts`
- `frontend/tests/test_painter_backend_port.test.js`
- `frontend/tests/test_painter_port_command_queue.test.js`
- `frontend/tests/test_sky_core_frame_lifecycle_order.test.js`
- `frontend/tests/sky-engine-stars-runtime.test.js`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/painter.c`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/painter.h`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/render_gl.c`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/render.h`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/projection.c`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/projection.h`

---

## Executive Verdict

S4 should be accepted as a **partial source-faithful slice** for painter preamble clip/cull wiring, but not full painter/projection parity.

What improved:
- `paint_prepare` now computes `cullFlipped` from projection flip flags (XOR parity), matching Stellarium cull parity intent.
- A clip-info preamble seam exists and runs before `paint_prepare` command recording.
- SkyCore forwards projection mode/flags into painter reset/preamble path.
- `render_prepare` now receives and stores computed cull/projection state instead of hardcoded `false`.

Why not full parity:
- `painter_update_clip_info` in Hub is a minimal placeholder subset, not Stellarium’s full per-frame cap math.
- Projection flags are adapter-fed and not fully derived by a native `core_get_proj`-equivalent matrix/flag pipeline.
- `render_prepare` still omits Stellarium `rend->proj = *proj` transfer and tex-cache `in_use` reset semantics.

---

## Function-by-Function Comparison

## 1) `painter_update_clip_info` subset vs Stellarium

Stellarium reference:
- `painter.c:119-126` loops all `FRAMES_NB` entries and computes:
  - `compute_viewport_cap(...)` (`painter.c:123`, with cap normal construction in `painter.c:101-109`)
  - `compute_sky_cap(...)` (`painter.c:124`, definition `painter.c:112-117`)

S4 implementation:
- `painterPort.ts:635-651` sets `clipInfoValid` and records a subset:
  - `viewportWidth`, `viewportHeight`
  - `boundingCapComputed: true`
  - `skyCapComputed: true`

Assessment:
- **Source-faithful seam:** explicit `painter_update_clip_info` call exists in preamble and state is persisted.
- **Simplified:** no multi-frame clip arrays, no real cap geometry computation, no frame transforms (`convert_frame`) for sky cap.

---

## 2) `paint_prepare` cull flip derivation parity

Stellarium reference:
- `painter.c:138-141`:
  - `cull_flipped = (proj.flags & PROJ_FLIP_HORIZONTAL) != (proj.flags & PROJ_FLIP_VERTICAL)`
  - then `render_prepare(..., cull_flipped)`

S4 implementation:
- `painterPort.ts:535-547`:
  - calls `painter_update_clip_info()`
  - computes `cullFlipped = deriveCullFlippedFromProjectionFlags(...)`
  - passes to `render_prepare(...)`
- `painterPort.ts:503-507` and `579-587` track `flipHorizontal` / `flipVertical` from projection flags.

Assessment:
- **Source-faithful:** XOR parity behavior is now aligned for the implemented subset.
- **Simplified:** projection flags are not yet guaranteed to come from a fully native projection construction path each frame.

---

## 3) Projection flag adapter vs Stellarium projection flag source

Stellarium reference:
- `core.c:115-133` computes projection and sets flags from view flips:
  - sets `PROJ_FLIP_VERTICAL` / `PROJ_FLIP_HORIZONTAL` (`core.c:124-130`)
  - applies matrix scaling before render (`core.c:132`)
- Flag definitions in `projection.h:41-48`.

S4 implementation:
- `SkyCore.ts:227-239` forwards projection mode/flags into painter `reset_for_frame`.
- `SkyCore.ts:347-370` resolves optional projection mode/flags from `projectionService`.
- `SkyProjectionService.ts:34-40` + `77-79` adds adapter storage/getter for projection flags.

Assessment:
- **Source-faithful seam (partial):** projection flags now have an explicit path into painter preamble.
- **Simplified:** current service path is an adapter carrier; it does not yet prove full `core_get_proj`-equivalent flip derivation/matrix coupling.

---

## 4) `render_prepare` state transfer vs Stellarium `render_prepare`

Stellarium reference:
- `render_gl.c:365-382` sets:
  - framebuffer size/scale/cull flag
  - full projection copy (`rend->proj = *proj`)
  - texture cache `in_use` reset (`render_gl.c:377-378`)
  - depth range reset

S4 implementation:
- `painterPort.ts:834-856` stores:
  - framebuffer size/scale/cull
  - projection mode/flags/flip booleans
  - `clipInfoValid`
  - depth range reset

Assessment:
- **Source-faithful (partial):** cull flag and preframe depth reset are wired correctly, with projection metadata persistence.
- **Simplified/missing:** no full projection matrix copy equivalent, no texture cache lifecycle reset parity.

---

## Source-Faithful Behaviors in S4

- `paint_prepare` no longer hardcodes cull parity; it derives from projection flips and forwards into `render_prepare`.
- Painter preamble now includes explicit clip/projection/cull state preparation before render-path calls.
- `SkyCore` now forwards projection metadata into the painter frame reset/preamble contract.
- Frame order still keeps painter preamble before module render and `paint_finish` before scene render (`test_sky_core_frame_lifecycle_order`).

---

## Simplifications / Missing Behaviors

- `painter_update_clip_info` is placeholder-state only for point/star path; no real `bounding_cap`, `viewport_caps[4]`, `sky_cap` geometry.
- No Stellarium `FRAMES_NB` clip-info population.
- Adapter projection flags are not yet proven to be generated from full native projection init/matrix operations.
- `render_prepare` still lacks full `projection_t` transfer and tex-cache reuse reset semantics.
- No claimable parity yet for clip-dependent culling functions (`painter_is_*_clipped`) beyond no-op surfaces.

---

## Test Coverage Gaps

Current tests prove:
- S4 preamble shape and state recording (`test_painter_backend_port.test.js:346-475`).
- cull parity toggles correctly for non-flipped/single-flip/double-flip bit patterns (`test_painter_backend_port.test.js:396-434`).
- command queue order includes `painter_update_clip_info` before `paint_prepare` (`test_painter_port_command_queue.test.js:25-50`, `test_sky_core_frame_lifecycle_order.test.js:167-181`).
- direct star layer remains active (`sky-engine-stars-runtime.test.js:236-252`).

Current tests do not prove:
- numeric parity of computed viewport/sky caps against Stellarium geometry math.
- parity for frame-based clip-info arrays (`FRAMES_NB`) and frame transforms.
- full `core_get_proj` matrix + flag coupling behavior.
- any texture cache reset parity in `render_prepare`.

Conclusion:
- Tests currently prove **adapter/preamble lifecycle parity**, not full geometric clip/projection parity.

---

## S4 Acceptance Decision

Accepted as: **partial source-faithful S4 slice** (clip/cull preamble wiring and projection-flag cull parity).  
Not accepted as: full `painter_update_clip_info` / projection / render_prepare parity.

This is consistent with the S4 scope constraints (CPU-side, no renderer replacement, no wrapper-stage expansion).

---

## Exact S5 Recommendation

Recommended S5 target: **(a) deeper `painter_update_clip_info` / sky cap / bounding cap parity**.

Reason:
- It is the smallest direct continuation of S4’s remaining source gap.
- It closes a concrete source-defined seam (`painter.c:119-126`, plus cap math around `compute_viewport_cap` / `compute_sky_cap`) without jumping subsystems.
- It improves real clipping correctness prerequisites before object-picking or backend execution work.

Why not first:
- **(b)** `stars.c render_visitor` is a different subsystem jump.
- **(c)** `areas_add_circle` side effects depend on broader render-path and picking lifecycle seams.
- **(d)** actual backend draw execution is higher blast radius and not the next smallest parity closure.
- **(e)** projection-depth parity (`proj_get_depth`) matters, but for this branch the tighter immediate gap after S4 is clip-cap geometry itself.

---

## Final Note

Do not claim full painter/projection parity from S4.  
S4 reduced preamble drift; clip geometry and full projection/render-prep semantics remain materially unported.

---

## Appendix — S5 Status Update (EV-0124)

Status: **S5 landed (partial cap-geometry parity gain, still not full frame-conversion parity)**.

S5 runtime changes:
- `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts`
  - replaced placeholder clip booleans with source-shaped cap data:
    - per-frame clip records (`frameId`, `frameName`, `supported`, `unsupportedReason`)
    - `boundingCap` (`normal`, `limit`)
    - `viewportCaps[]` (`normal`, `limit`)
    - `skyCap` (`normal`, `limit = cos(91°)`)
  - implemented bounded `compute_viewport_cap`-equivalent path:
    - unprojects viewport center/corners
    - computes max-separation-based bounding cap
    - computes oriented side caps from corner cross products
  - implemented bounded `compute_sky_cap`-equivalent path for supported observed frames.
  - marks unsupported frame conversions explicitly as `frame_conversion_not_ported`.
  - handles invalid viewport dimensions safely by emitting `clipInfoValid=false`.
- `frontend/src/features/sky-engine/engine/sky/runtime/SkyCore.ts`
  - forwards `centerDirection` and `fovRadians` into painter frame reset, stabilizing cap computation inputs.

S5 tests added/extended:
- `frontend/tests/test_painter_backend_port.test.js`
  - verifies real cap payloads (finite normals/limits, side caps, sky cap)
  - verifies explicit unsupported frame conversion reporting
  - verifies invalid viewport safety behavior
  - preserves S4 cull parity assertions and S1/S2/S3 lifecycle regressions
- `frontend/tests/test_painter_port_command_queue.test.js`
  - updated `painter_update_clip_info` payload expectations for cap-state summary fields.

Validation:
- `npm run typecheck`
- `npm run test -- tests/test_painter_backend_port.test.js tests/test_painter_port_command_queue.test.js tests/test_sky_core_frame_lifecycle_order.test.js tests/sky-engine-stars-runtime.test.js`
- `npm run build`

Remaining gaps (outside S5 scope):
- no full `FRAMES_NB` geometric parity via `convert_frame` across all frames
- no full Stellarium `projection_t` matrix parity in `render_prepare`
- no clip-dependent culling function behavior parity beyond boundary/state surfaces
- no backend draw execution parity.
