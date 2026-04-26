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
