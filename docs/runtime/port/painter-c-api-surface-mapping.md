# `painter.c` / `painter.h` API Surface Mapping (Slice 1)

Pinned source:
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/painter.h`
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/painter.c`
- commit `63fb3279e85782158a6df63649f1c8a1837b7846`

Scope:
- API boundary only.
- No `render_gl.c` batching/shader port in this slice.
- No visual behavior redesign.

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
