# `core.c` Frame Lifecycle Mapping (Port Mode Pivot)

Pinned source:
- `study/stellarium-web-engine/source/stellarium-web-engine-master/src/core.c`
- commit `63fb3279e85782158a6df63649f1c8a1837b7846`

## Extraction (`core.c`)

| Stellarium section | Source lines | Behavior |
|---|---:|---|
| `core_update` timing + dt | `core.c:294-297` | Read wall clock, compute `dt`, clamp minimum to `0.001`, store current clock. |
| `core_update` pre-module update stack | `core.c:299-337` | Atmosphere visibility/refraction, observer update, telescope auto, progressbar, tonemapper update, star scale factor, navigation observer update, task queue ticks. |
| Module update sequencing | `core.c:338-344` | Sort modules by render order, then run `module->klass->update` in sorted order. |
| `core_render` pre-render stack | `core.c:537-571` | Window/pixel-scale sync, projection update, observer update, stars/hints vmag limits, fps tick, labels reset, painter setup/prepare. |
| Module render sequencing | `core.c:572-574` | Run `obj_render` across modules in sorted child order. |
| Render flush + post-render sequencing | `core.c:586-598` | Flush render pipeline (`paint_finish`), then run `post_render` for each module in sorted order. |

## Sky-Engine Equivalents

| Stellarium | Sky-Engine equivalent |
|---|---|
| `core_update` frame ownership | `frontend/src/features/sky-engine/engine/sky/runtime/SkyCore.ts::runFrameLifecycle` |
| `dt = fmax(now - clock, 0.001)` | `SkyCore.ts` `deltaSeconds = Math.max((now - lastFrameTime) * 0.001, 0.001)` |
| `DL_SORT(...); module->update` | `SkyCore.ts::update` (`sortModulesByRenderOrder` then `module.update`) |
| `core_render` preamble | `SkyEngineScene.tsx` `coreRenderPreamble` -> `runStellariumCoreRenderSpine` |
| `core_render` preamble state object (`painter_t` setup before `obj_render`) | `SkyCore.ts` `createFrameState` -> `SkyCoreFrameState.render` (shared in update/render/postRender contexts) |
| `obj_render(module, painter)` | `SkyCore.ts::render` (`module.render` in sorted order) |
| `paint_finish` + `post_render` | `SkyCore.ts` `render()` calls `frameState.render.painter.paint_finish()`, then `runtime.scene.render()`, then `runModulePostRenders()` |
| Clock/time service step before update | `SkyEngineScene.tsx` `updateServices` -> `clockService.advanceFrame` |
| Observer/nav update preamble | `SkyEngineScene.tsx` `coreUpdatePreamble` -> `runStellariumCoreUpdateObserverPreamble` |

## Port Decision Notes

- This pivot ports control flow and ordering only.
- No painter/render_gl internals were touched.
- No React/dirty-frame render gating remains in `SkyCore` lifecycle ownership.

## `core_render` Preamble State Mapping (Slice 2)

Source focus: `core.c:537-570` (window/pixel scale sync, projection/observer prep, painter limits and framebuffer values before `obj_render`).

| Stellarium `core_render` pre-object value | SkyCore render-state field |
|---|---|
| `core->win_size[0/1]` (`core.c:537-538`) | `frameState.render.windowWidth` / `windowHeight` |
| `core->win_pixels_scale` (`core.c:539`) | `frameState.render.pixelScale` |
| `painter.fb_size` (`core.c:556`) | `frameState.render.framebufferWidth` / `framebufferHeight` |
| `painter.stars_limit_mag` (`core.c:559`) | `frameState.render.starsLimitMag` (from runtime `corePainterLimits`) |
| `painter.hints_limit_mag` (`core.c:560`) | `frameState.render.hintsLimitMag` (from runtime `corePainterLimits`) |
| `painter.hard_limit_mag` (`core.c:561`) | `frameState.render.hardLimitMag` (from runtime `corePainterLimits`) |

Implementation notes:
- A single `SkyCoreFrameState` object is created once per frame inside `runFrameLifecycle` and passed unchanged to ordered module `update`, `render`, and `postRender` phases.
- `Babylon scene.render()` remains between `painter.paint_finish()` and ordered `postRender`.
- `painter.paint_finish()` now also finalizes the CPU-side typed painter command list for backend handoff in later render slices (no `render_gl.c` execution in this step).
- `painter_update_clip_info` / `paint_prepare` / `render_gl` remain intentionally unported in this slice.

For painter API boundary details, see `docs/runtime/port/painter-c-api-surface-mapping.md`.
