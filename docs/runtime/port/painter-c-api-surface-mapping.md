# `painter.c` / `painter.h` API Surface Mapping (Slice 1)

Pinned source:
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/painter.h`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/painter.c`
- commit `63fb3279e85782158a6df63649f1c8a1837b7846`

Scope:
- API boundary only.
- No `render_gl.c` batching/shader port in this slice.
- No visual behavior redesign.

## Command Queue Mapping (Slice 1A)

`frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts` now records a typed CPU-side command queue for every exposed painter API callable.

Queue model:
- command type union keyed by source-faithful callable names (`paint_*`, `painter_*`)
- per-command payload shape mapped by callable
- per-command batch snapshot placeholders (`mode`, `color`, `flags`, texture-slot bindings, projection/clipping state)
- per-frame sequencing (`frameIndex`, monotonic `sequence`)
- includes stars mirror command payload (`paint_stars_draw_intent`) for Stage 1 direct-path intent capture (count + source + magnitude + view snapshot)

Lifecycle behavior:
- `reset_for_frame(...)` clears mutable command storage and clears finalized command snapshots.
- `paint_prepare(...)` records a typed `paint_prepare` lifecycle command.
- representative draw intents (for example `paint_texture`, `paint_mesh`, `paint_text`) record typed inert commands only.
- `paint_finish(...)` records `paint_finish` then finalizes the frame command list for later backend consumption.
- after finalize, additional `paint_*` / `painter_*` calls in the same frame do not mutate the finalized list.

Validation:
- `frontend/tests/test_sky_core_frame_lifecycle_order.test.js`
- `frontend/tests/test_painter_port_command_queue.test.js`
- `frontend/tests/sky-engine-stars-runtime.test.js` (stars mirror command emission + finalization + direct-path ownership)
- Evidence: **EV-0111**, **EV-0113**.

## Stage 3 Batch Object Model (Slice 1B)

`frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts` now builds an inert finalized batch model from finalized frame commands at `paint_finish`.

Batch behavior (current slice):
- supported batch kind: `stars` only
- source command mapping: `paint_stars_draw_intent` -> one finalized `stars` batch per finalized stars-intent command
- backend ownership: none; status remains inert (`not_executed`)
- storage: finalized batches are stored separately from finalized commands (`finalizedBatches`)

Finalized stars batch shape:
- `kind`: `stars`
- `sourceCommandKind`: `paint_stars_draw_intent`
- `frameIndex`
- `starCount`
- grouping metadata for later backend mapping:
  - `projectionMode`
  - exact `fovDegrees` and a categorical `fovBucket`
  - magnitude range (`limitingMagnitude`, `minRenderedMagnitude`, `maxRenderedMagnitude`)
  - render-alpha range (`minRenderAlpha`, `maxRenderAlpha`)
  - texture/material placeholders (`textureRef`, `materialRef`)
- `sourcePath`: `direct-star-mirror`
- `executionStatus`: `not_executed`

Validation:
- `frontend/tests/test_painter_port_command_queue.test.js`
- `frontend/tests/sky-engine-stars-runtime.test.js`
- Evidence: **EV-0115**.

## Stage 4A Backend Mapping Shell (Slice 1C)

`frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterBackendPort.ts` now defines an inert backend adapter shell that maps finalized painter batches to backend mapping plans without execution.

Stage 4A shell behavior:
- input model accepts finalized painter batches and explicit unsupported batch records.
- stars mapping output preserves finalized stars batch grouping metadata and emits:
  - intended backend path marker: `babylon-thin-instance-stars`
  - execution status: `mapped_not_executed`
  - render_gl marker references (`render_points_2d`/`render_points_3d`, `ITEM_POINTS`/`ITEM_POINTS_3D`, `render_finish`)
- unsupported batches are reported with `unsupported_not_executed` and no fallback execution.
- runtime integration is telemetry-only through `SceneReportingModule`; direct stars rendering ownership remains with `directStarLayer.sync(...)`.

Validation:
- `frontend/tests/test_painter_backend_port.test.js`
- `frontend/tests/sky-engine-stars-runtime.test.js`
- Evidence: **EV-0116**.

## Stage 4B Feature-Flagged Execution Prototype (Slice 1D)

`frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterBackendPort.ts` now includes a default-off execution prototype layered on top of the Stage 4A mapping shell.

Stage 4B additions:
- runtime/dev flag resolver:
  - query/runtime flags: `?painterBackendExecution=1` or `?SKY_ENGINE_ENABLE_PAINTER_BACKEND_EXECUTION=1`
  - default: OFF
- execution entrypoint:
  - `executePainterBackendPlan(...)`
- expanded backend statuses:
  - `mapped_not_executed`
  - `execution_disabled`
  - `executed_side_by_side`
  - `executed_side_by_side_painter_layer`
  - `unsupported_not_executed`

Execution semantics:
- OFF mode keeps Stage 4A inert behavior and returns `execution_disabled` without sync calls.
- ON mode performs side-by-side prototype sync only and marks `executed_side_by_side`.
- direct stars render ownership remains unchanged (`StarsModule` still calls `directStarLayer.sync(...)`).

Validation:
- `frontend/tests/test_painter_backend_port.test.js`
- `frontend/tests/sky-engine-stars-runtime.test.js`
- Evidence: **EV-0117**.

## Stage 4C Runtime-Flagged Execution Profiling (Slice 1E)

Stage 4C adds runtime proof for the Stage 4B execution contract via dual profile artifacts:
- OFF/default run (`debugTelemetry=1`) proves backend execution remains disabled by default.
- ON run (`debugTelemetry=1&painterBackendExecution=1`) proves side-by-side execution only.

Stage 4C outcomes:
- OFF: `backendExecutionEnabledShare.avg = 0`, `backendExecutionDisabledCount.avg = 1`, `backendSideBySideExecutionCount.avg = 0`.
- ON: `backendExecutionEnabledShare.avg = 1`, `backendExecutedSideBySideShare.avg = 1`, `backendSideBySideExecutionCount.avg = 1`.
- Both: direct render path remains active and comparison deltas stay zero; unsupported execution remains absent.

Validation:
- `/home/rocco/Astronomy-Hub/.cursor-artifacts/parity-compare/stars-painter-backend-runtime-profile-off-2026-04-26.json`
- `/home/rocco/Astronomy-Hub/.cursor-artifacts/parity-compare/stars-painter-backend-runtime-profile-on-2026-04-26.json`
- `docs/runtime/port/stars-painter-backend-runtime-profile.md`
- Evidence: **EV-0118**.

## Stage 4D Painter-Owned Backend Layer Prototype (Slice 1F)

Stage 4D adds a dedicated painter-owned backend layer boundary without replacing the direct stars path:
- new file:
  - `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterStarsBackendLayer.ts`
- runtime wiring:
  - `SkyEngineRuntimeBridge` now provisions `runtime.painterOwnedStarBackendLayer`
- execution semantics:
  - OFF mode: no painter-owned layer create/sync
  - ON mode: side-by-side sync can target painter-owned layer and returns `executed_side_by_side_painter_layer`

Telemetry additions:
- `painterOwnedStarLayerCreated`
- `painterOwnedStarLayerSynced`
- `painterOwnedStarLayerStarCount`
- `directStarLayerStillActive`
- `painterOwnedVsDirectDelta`

Validation:
- `frontend/tests/test_painter_backend_port.test.js`
- `frontend/tests/sky-engine-stars-runtime.test.js`
- Evidence: **EV-0119**.

## Stage S1 Real Point Item Pipeline (2026-04-26)

Status: implemented (source-modeled backend behavior, still safety-gated for Babylon ownership changes).

Source anchors:
- `src/painter.c`: `paint_prepare`, `paint_2d_points`, `paint_3d_points`, `paint_finish`
- `src/render_gl.c`: `render_prepare`, `get_item`, `render_points_2d`, `render_points_3d`, `render_finish`

Hub implementation:
- `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts`

What changed from wrapper-only state:
- `paint_prepare` now drives a real backend-frame reset (`render_prepare`-equivalent), including framebuffer scale state and depth min/max reset.
- `paint_2d_points` and `paint_3d_points` now populate real point items (`ITEM_POINTS` / `ITEM_POINTS_3D`) rather than metadata-only intent records.
- A `get_item`-equivalent compatible-item reuse path is implemented for point batches (type/flags/halo/texture/capacity compatibility).
- `paint_finish` now performs a real flush/finalize boundary (`render_finish`-equivalent) and exposes finalized point-item snapshots.
- Stars batch finalization now derives `starCount` from finalized point items when present, reducing dependency on wrapper-only markers.

Safety and scope notes:
- Direct star rendering ownership remains with `directStarLayer`.
- No new wrapper stage names or telemetry stages were introduced.
- Legacy `renderGlReference` string labels are no longer parity proof; parity evidence is now based on real finalized point items.

Validation:
- `npm run typecheck`
- `npm run test -- tests/test_painter_backend_port.test.js tests/sky-engine-stars-runtime.test.js`
- `npm run build`
- Evidence: **EV-0120**.

## Slice S2 Render-Item Flags / Reorder / Flush Lifecycle (2026-04-27)

Status: implemented as an S1 refinement focused on `render_gl.c` item lifecycle semantics.

Source anchors:
- `src/render_gl.c`: `get_item`, `render_points_2d`, `render_points_3d`, `render_finish`, `rend_flush`
- `src/painter.c`: `paint_prepare`, `paint_finish`, `paint_2d_points`, `paint_3d_points`

Hub implementation:
- `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts`

What changed in S2:
- point-item records now track source-relevant lifecycle fields:
  - `orderIndex`
  - `compatibilityKey` (`type|flags|halo|texture`)
  - `flushed`
- `get_item` behavior is now explicitly modeled around:
  - backward scan from newest queued item
  - compatibility-key + capacity constraints
  - reorder barrier stop unless `PAINTER_ALLOW_REORDER` permits crossing
- `render_finish` now models a `rend_flush`-like lifecycle seam:
  - produces ordered flushed item snapshots
  - publishes flush/release result records for assertions
  - clears mutable queue after flush so flushed items are no longer mutable

Behavior kept intentionally unchanged in S2:
- direct star rendering ownership remains with `directStarLayer`
- no Babylon renderer replacement
- no new wrapper stage and no telemetry-stage expansion

Validation:
- `npm run typecheck`
- `npm run test -- tests/test_painter_backend_port.test.js tests/sky-engine-stars-runtime.test.js`
- `npm run build`
- Evidence: **EV-0121**.

## Slice S3 Flush / Resource Lifecycle Deepening (2026-04-27)

Status: implemented as a deeper `render_finish` / `rend_flush` lifecycle model while remaining CPU-side.

Source anchors:
- `src/render_gl.c`: `rend_flush`, `render_finish`, per-item dispatch/release loop, post-flush GL reset seam
- `src/painter.c`: `paint_finish`

Hub implementation:
- `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts`

What changed in S3:
- `render_finish` now models explicit ordered dispatch and release phases for each finalized point item.
- point items now carry explicit terminal lifecycle fields:
  - `dispatched`
  - `released`
  - `terminalState` (`queued` / `dispatched` / `released`)
- backend frame now exposes source-modeled lifecycle records:
  - `flushDispatches`
  - `flushLifecycleEvents` (`dispatch`, `release`, `flush_complete`, `post_flush_state_reset`)
  - `flushCompleteRecord`
  - `postFlushStateResetRecord`
- mutable queue cleanup now happens after lifecycle records are produced.

Behavior intentionally unchanged in S3:
- rendering remains CPU-side and inert for this path (no backend draw execution)
- direct star rendering ownership remains with `directStarLayer`
- no `render_gl.c` GPU/shader replacement introduced

Validation:
- `npm run typecheck`
- `npm run test -- tests/test_painter_backend_port.test.js tests/sky-engine-stars-runtime.test.js`
- `npm run build`
- Evidence: **EV-0122**.

## Slice S4 painter_update_clip_info + Projection Flip/Cull (2026-04-27)

Status: implemented as a projection/clip preamble parity slice for the active point/star path.

Source anchors:
- `src/painter.c`: `painter_update_clip_info`, `paint_prepare` cull parity derivation
- `src/painter.h`: painter projection/clip state surface
- `src/render_gl.c`: `render_prepare` cull/projection acceptance
- `src/projection.h`: `PROJ_FLIP_HORIZONTAL`, `PROJ_FLIP_VERTICAL`, `PROJ_HAS_DISCONTINUITY`

Hub implementation:
- `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts`
- `frontend/src/features/sky-engine/engine/sky/runtime/SkyCore.ts`
- `frontend/src/features/sky-engine/engine/sky/runtime/SkyProjectionService.ts`

What changed in S4:
- `paint_prepare` now computes `cullFlipped` from source-modeled flip flags:
  - `flipHorizontal XOR flipVertical`
  - removes the previous hardcoded `false` path.
- `painter_update_clip_info` now wires clip-info preamble lifecycle and projection-state handoff for later cap parity work.
- render backend frame now carries explicit pre-render projection/clip/cull state:
  - `projectionMode`
  - `projectionFlags`
  - `flipHorizontal`
  - `flipVertical`
  - `cullFlipped`
  - `clipInfoValid`
- added a narrow projection adapter seam (`sync_projection_state`) and SkyCore service bridge for projection metadata injection.

Known limitation (explicit):
- Sky-engine does not yet port full Stellarium projection struct/matrix/flag pipeline end-to-end.
- Current runtime defaults projection flags to `0` unless injected through the narrow adapter path; this keeps behavior stable while enabling source-faithful cull derivation when flags are provided.

Behavior intentionally unchanged in S4:
- direct star rendering ownership remains with `directStarLayer`
- CPU-side command/flush model remains in place
- no backend draw execution or renderer replacement introduced

Validation:
- `npm run typecheck`
- `npm run test -- tests/test_painter_backend_port.test.js tests/sky-engine-stars-runtime.test.js`
- `npm run build`
- Evidence: **EV-0123**.

## Slice S5 painter_update_clip_info Cap Geometry (2026-04-27)

Status: implemented as a bounded cap-geometry parity slice for the supported observed-frame path.

Source anchors:
- `src/painter.c`: `compute_viewport_cap`, `compute_sky_cap`, `painter_update_clip_info`
- `src/painter.h`: `clip_info[FRAMES_NB]` cap structures
- `src/frames.h`: frame-id contracts (`FRAME_*`, `FRAMES_NB`)

Hub implementation:
- `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts`
- `frontend/src/features/sky-engine/engine/sky/runtime/SkyCore.ts`

What changed in S5:
- placeholder clip booleans were replaced with source-shaped cap data:
  - per-frame clip entries (`frameId`, `frameName`, supported flag, explicit unsupported reason)
  - `boundingCap` (`normal`, `limit`)
  - `viewportCaps[]` side-plane caps (`normal`, `limit`)
  - `skyCap` (`normal`, `limit = cos(91°)`)
- `painter_update_clip_info` now computes practical `compute_viewport_cap` parity for supported frames using unprojected viewport corners and side-cap orientation against center direction.
- clip-info now explicitly tracks unsupported frame-conversion paths instead of silently implying full frame parity.
- invalid viewport dimensions (`<= 0`) now produce `clipInfoValid=false` and no cap payload.
- SkyCore now forwards `centerDirection` and `fovRadians` into painter frame reset for cap computation stability.

Bounded-support notes:
- Current cap computation support is explicit for `FRAME_OBSERVED_GEOM` and `FRAME_OBSERVED`.
- Other frame conversions remain explicit `frame_conversion_not_ported` until `convert_frame`-equivalent paths are ported.

Behavior intentionally unchanged in S5:
- S1/S2/S3 point item, reorder, and flush lifecycle semantics remain intact.
- direct star rendering ownership remains with `directStarLayer`.
- no backend draw execution and no renderer replacement.

Validation:
- `npm run typecheck`
- `npm run test -- tests/test_painter_backend_port.test.js tests/test_painter_port_command_queue.test.js tests/test_sky_core_frame_lifecycle_order.test.js tests/sky-engine-stars-runtime.test.js`
- `npm run build`
- Evidence: **EV-0124**.

## Slice S6 Frame Conversion / FRAMES_NB Clip-Info (2026-04-27)

Status: implemented as a bounded frame-conversion parity slice for clip-info vectors.

Source anchors:
- `src/painter.c`: `compute_sky_cap`, `painter_update_clip_info`
- `src/frames.h`: `FRAME_*` ids, `FRAMES_NB`
- `src/frames.c`: `convert_frame` behavior contracts (bounded subset only in this slice)

Hub implementation:
- `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts`
- `frontend/src/features/sky-engine/engine/sky/runtime/SkyCore.ts`

What changed in S6:
- frame identifiers now include full pinned enum values (`FRAME_ASTROM`..`FRAME_VIEW`, `FRAME_ECLIPTIC`) while clip-info iteration remains `FRAMES_NB=8` (`FRAME_VIEW+1`).
- added bounded `convert_frame`-shaped adapter for clip vectors:
  - observed -> observed (identity)
  - observed -> observed_geom (bounded identity fallback pending full refraction-state seam)
  - observed -> view (basis rotation using current center direction)
  - all other paths explicit unsupported
- `compute_sky_cap` now uses the frame-conversion adapter for supported frames (not a constant normal for all supported frames).
- `compute_viewport_cap` now applies frame conversion to center and corner vectors before cap construction for supported frames.
- supported frame set expanded from S5:
  - `FRAME_OBSERVED`
  - `FRAME_OBSERVED_GEOM`
  - `FRAME_VIEW`

Bounded-support notes:
- S6 is still partial parity: full `frames.c` conversion chain (CIRS/JNOW/ICRF/ASTROM/mount/ecliptic and full observer-state effects) remains unported.
- unsupported frames remain explicit and honest (`frame_conversion_not_ported`).

Behavior intentionally unchanged in S6:
- S1/S2/S3 point/reorder/flush lifecycle behavior remains unchanged.
- direct star rendering ownership remains with `directStarLayer`.
- no backend draw execution and no renderer replacement.

Validation:
- `npm run typecheck`
- `npm run test -- tests/test_painter_backend_port.test.js tests/test_painter_port_command_queue.test.js tests/test_sky_core_frame_lifecycle_order.test.js tests/sky-engine-stars-runtime.test.js`
- `npm run build`
- Evidence: **EV-0125**.

## Enum Mapping (`painter.h`)

| Stellarium enum group | Sky-Engine mapping |
|---|---|
| `ALIGN_*` | `SkyPainterAlignFlags` |
| `TEXT_*` effects | `SkyPainterTextEffectFlags` |
| `MODE_TRIANGLES/LINES/POINTS` | `SkyPainterMode` |
| `PAINTER_*` flags | `SkyPainterFlags` |
| `PAINTER_TEX_*` slots | `SkyPainterTextureSlot` |

## Struct / State Mapping (`painter.h`)

| Stellarium shape | Sky-Engine mapping |
|---|---|
| `struct point` | `SkyPainterPoint` |
| `struct point_3d` | `SkyPainterPoint3D` |
| `struct painter` (public runtime-facing fields) | `SkyPainterPortState` |
| per-frame pre-render setup values (`fb_size`, `pixel_scale`, `stars_limit_mag`, `hints_limit_mag`, `hard_limit_mag`) | `SkyPainterPortState.reset_for_frame(...)` inputs sourced from `SkyCoreFrameState.render` |

## Callable Surface Mapping (`painter.h` + `painter.c`)

All public painter callables are represented as no-op boundary methods in:
- `frontend/src/features/sky-engine/engine/sky/runtime/renderer/painterPort.ts`

Represented methods:
- `paint_prepare`, `paint_finish`
- `painter_set_texture`
- `paint_2d_points`, `paint_3d_points`
- `paint_quad`, `paint_quad_contour`, `paint_tile_contour`
- `paint_line`, `paint_linestring`
- `paint_mesh`
- `paint_text_bounds`, `paint_text`
- `paint_texture`
- `paint_debug`
- `painter_is_quad_clipped`, `painter_is_healpix_clipped`, `painter_is_planet_healpix_clipped`
- `painter_is_point_clipped_fast`, `painter_is_2d_point_clipped`, `painter_is_2d_circle_clipped`, `painter_is_cap_clipped`
- `painter_update_clip_info`
- `paint_orbit`, `paint_2d_ellipse`, `paint_2d_rect`, `paint_2d_line`, `paint_cap`
- `painter_3d_model_exists`, `painter_get_3d_model_bounds`, `paint_3d_model`
- `painter_project_ellipse`, `painter_project`, `painter_unproject`

## Core Lifecycle Wiring

`SkyCore` now threads painter state through frame render state:
- `SkyCoreFrameState.render.painter` references `SkyPainterPortState`.
- During render lifecycle, `SkyCore.render(...)` performs:
  1. `painter.reset_for_frame(...)`
  2. `painter.paint_prepare(...)`
  3. configured `coreRenderPreamble(...)`
  4. ordered module `render(...)`
  5. `painter.paint_finish(...)`

`runFrameLifecycle(...)` then keeps `scene.render()` after `painter.paint_finish(...)` and before ordered `postRender(...)`.
