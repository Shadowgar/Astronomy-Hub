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
| `obj_render(module, painter)` | `SkyCore.ts::render` (`module.render` in sorted order) |
| `paint_finish` + `post_render` | `SkyCore.ts` `runtime.scene.render()` then `runModulePostRenders()` |
| Clock/time service step before update | `SkyEngineScene.tsx` `updateServices` -> `clockService.advanceFrame` |
| Observer/nav update preamble | `SkyEngineScene.tsx` `coreUpdatePreamble` -> `runStellariumCoreUpdateObserverPreamble` |

## Port Decision Notes

- This pivot ports control flow and ordering only.
- No painter/render_gl internals were touched.
- No React/dirty-frame render gating remains in `SkyCore` lifecycle ownership.
