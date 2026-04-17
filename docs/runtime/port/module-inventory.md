# Stellarium Source Module Inventory (Fail-Closed)

Source root: `study/stellarium-web-engine/source/stellarium-web-engine-master/src`

Generated: 2026-04-17  
Total C/H files: 146

## Status Legend

- `UNMAPPED`: no AH mapping approved yet (automatic fail)
- `PORTED`: fully ported and verified
- `OUT-OF-SCOPE`: requires explicit user approval
- `BLOCKED`: mapped but cannot complete due to explicit blocker

## Inventory Rules

- Every file below must have at least one mapping row before module completion.
- Every public/entry function in each mapped file must be enumerated in follow-up function-level expansion.
- No file may remain `UNMAPPED` at global completion.

## File-Level Inventory

| Source File | Domain | Planned Module | Status | AH Mapping |
|---|---|---|---|---|
| `src/sprintf.c` | core | module7-remaining-swe | UNMAPPED | - |
| `src/swe.c` | core | module7-remaining-swe | UNMAPPED | - |
| `src/obj.h` | core | module7-remaining-swe | UNMAPPED | - |
| `src/mpc.h` | minor_planets | module7-remaining-swe | UNMAPPED | - |
| `src/eph-file.c` | eph | module1-hips-kernel | UNMAPPED | - |
| `src/sgp4.h` | satellites | module5-satellites-full | UNMAPPED | - |
| `src/obj_info.h` | object_info | module7-remaining-swe | UNMAPPED | - |
| `src/geojson_parser.h` | geojson | module7-remaining-swe | UNMAPPED | - |
| `src/hips.h` | hips | module1-hips-kernel | UNMAPPED | - |
| `src/core.c` | core | module0-foundation-lock | UNMAPPED | - |
| `src/symbols.h` | symbols | module7-remaining-swe | UNMAPPED | - |
| `src/projection.h` | projection | module0-foundation-lock | UNMAPPED | - |
| `src/log.h` | core | module7-remaining-swe | UNMAPPED | - |
| `src/shader_cache.h` | render | module7-remaining-swe | UNMAPPED | - |
| `src/painter.c` | render | module7-remaining-swe | UNMAPPED | - |
| `src/hip.c` | stars | module2-stars-full | UNMAPPED | - |
| `src/swe.h` | core | module7-remaining-swe | UNMAPPED | - |
| `src/erfa_wrap.h` | astro_math | module0-foundation-lock | UNMAPPED | - |
| `src/skybrightness.h` | skybrightness | module7-remaining-swe | UNMAPPED | - |
| `src/utils/progressbar.c` | utils | module7-remaining-swe | UNMAPPED | - |
| `src/line_mesh.c` | render | module7-remaining-swe | UNMAPPED | - |
| `src/utils/utils.h` | utils | module7-remaining-swe | UNMAPPED | - |
| `src/utils/fps.h` | utils | module7-remaining-swe | UNMAPPED | - |
| `src/system.h` | system | module7-remaining-swe | UNMAPPED | - |
| `src/utils/gesture.h` | input | module7-remaining-swe | UNMAPPED | - |
| `src/utils/request.c` | io | module7-remaining-swe | UNMAPPED | - |
| `src/utils/utf8.c` | utils | module7-remaining-swe | UNMAPPED | - |
| `src/tests.c` | tests | module7-remaining-swe | UNMAPPED | - |
| `src/tests.h` | tests | module7-remaining-swe | UNMAPPED | - |
| `src/painter.h` | render | module7-remaining-swe | UNMAPPED | - |
| `src/utils/request.h` | io | module7-remaining-swe | UNMAPPED | - |
| `src/gui.h` | gui | module7-remaining-swe | UNMAPPED | - |
| `src/designation.h` | labels | module6-labels-overlays | UNMAPPED | - |
| `src/uv_map.c` | render | module7-remaining-swe | UNMAPPED | - |
| `src/layer.c` | render | module7-remaining-swe | UNMAPPED | - |
| `src/utils/cache.c` | cache | module1-hips-kernel | UNMAPPED | - |
| `src/line_mesh.h` | render | module7-remaining-swe | UNMAPPED | - |
| `src/utils/fader.c` | utils | module7-remaining-swe | UNMAPPED | - |
| `src/telescope.c` | telescope | module7-remaining-swe | UNMAPPED | - |
| `src/core.h` | core | module0-foundation-lock | UNMAPPED | - |
| `src/utils/worker.h` | async | module1-hips-kernel | UNMAPPED | - |
| `src/hips.c` | hips | module1-hips-kernel | UNMAPPED | - |
| `src/events.c` | events | module7-remaining-swe | UNMAPPED | - |
| `src/utils/texture.c` | texture | module7-remaining-swe | UNMAPPED | - |
| `src/assets.h` | assets | module7-remaining-swe | UNMAPPED | - |
| `src/skyculture.c` | skyculture | module6-labels-overlays | UNMAPPED | - |
| `src/utils/fps.c` | utils | module7-remaining-swe | UNMAPPED | - |
| `src/modules/constellations.c` | module | module6-labels-overlays | UNMAPPED | - |
| `src/module.h` | module_system | module7-remaining-swe | UNMAPPED | - |
| `src/utils/gl.h` | render | module7-remaining-swe | UNMAPPED | - |
| `src/modules/drag_selection.c` | module | module6-labels-overlays | UNMAPPED | - |
| `src/labels.h` | labels | module6-labels-overlays | UNMAPPED | - |
| `src/modules/cardinal.c` | module | module6-labels-overlays | UNMAPPED | - |
| `src/eph-file.h` | eph | module1-hips-kernel | UNMAPPED | - |
| `src/frames.h` | frames | module0-foundation-lock | UNMAPPED | - |
| `src/utils/vec.c` | math | module0-foundation-lock | UNMAPPED | - |
| `src/observer.h` | observer | module0-foundation-lock | UNMAPPED | - |
| `src/utils/cache.h` | cache | module1-hips-kernel | UNMAPPED | - |
| `src/navigation.h` | navigation | module0-foundation-lock | UNMAPPED | - |
| `src/render_gl.c` | render | module7-remaining-swe | UNMAPPED | - |
| `src/utils/utf8.h` | utils | module7-remaining-swe | UNMAPPED | - |
| `src/libtess2.c` | render | module7-remaining-swe | UNMAPPED | - |
| `src/modules/lines.c` | module | module6-labels-overlays | UNMAPPED | - |
| `src/skyculture.h` | skyculture | module6-labels-overlays | UNMAPPED | - |
| `src/utils/swe_utils.c` | utils | module7-remaining-swe | UNMAPPED | - |
| `src/modules/dss.c` | module | module4-dss-full | UNMAPPED | - |
| `src/telescope.h` | telescope | module7-remaining-swe | UNMAPPED | - |
| `src/utils/texture.h` | texture | module7-remaining-swe | UNMAPPED | - |
| `src/otypes.c` | object_types | module7-remaining-swe | UNMAPPED | - |
| `src/projections/proj_hammer.c` | projection | module0-foundation-lock | UNMAPPED | - |
| `src/system.c` | system | module7-remaining-swe | UNMAPPED | - |
| `src/utils/progressbar.h` | utils | module7-remaining-swe | UNMAPPED | - |
| `src/observer.c` | observer | module0-foundation-lock | UNMAPPED | - |
| `src/projections/proj_perspective.c` | projection | module0-foundation-lock | UNMAPPED | - |
| `src/modules/planets.c` | module | module7-remaining-swe | UNMAPPED | - |
| `src/utils/request_js.c` | io | module7-remaining-swe | UNMAPPED | - |
| `src/utils/vec.h` | math | module0-foundation-lock | UNMAPPED | - |
| `src/assets.c` | assets | module7-remaining-swe | UNMAPPED | - |
| `src/projections/proj_mercator.c` | projection | module0-foundation-lock | UNMAPPED | - |
| `src/otypes.h` | object_types | module7-remaining-swe | UNMAPPED | - |
| `src/modules/labels.c` | module | module6-labels-overlays | UNMAPPED | - |
| `src/utils/worker.c` | async | module1-hips-kernel | UNMAPPED | - |
| `src/uv_map.h` | render | module7-remaining-swe | UNMAPPED | - |
| `src/hip.h` | stars | module2-stars-full | UNMAPPED | - |
| `src/utils/utils_json.h` | utils | module7-remaining-swe | UNMAPPED | - |
| `src/utils/utils_json.c` | utils | module7-remaining-swe | UNMAPPED | - |
| `src/constants.h` | core | module0-foundation-lock | UNMAPPED | - |
| `src/modules/stars.c` | module | module2-stars-full | UNMAPPED | - |
| `src/projections/proj_stereographic.c` | projection | module0-foundation-lock | UNMAPPED | - |
| `src/frames.c` | frames | module0-foundation-lock | UNMAPPED | - |
| `src/utils/mesh.h` | render | module7-remaining-swe | UNMAPPED | - |
| `src/utils/gl.c` | render | module7-remaining-swe | UNMAPPED | - |
| `src/args.c` | args | module7-remaining-swe | UNMAPPED | - |
| `src/projections/proj_mollweide.c` | projection | module0-foundation-lock | UNMAPPED | - |
| `src/utils/fader.h` | utils | module7-remaining-swe | UNMAPPED | - |
| `src/utils/mesh.c` | render | module7-remaining-swe | UNMAPPED | - |
| `src/navigation.c` | navigation | module0-foundation-lock | UNMAPPED | - |
| `src/areas.c` | areas | module7-remaining-swe | UNMAPPED | - |
| `src/modules/geojson.c` | module | module7-remaining-swe | UNMAPPED | - |
| `src/utils/gesture.c` | input | module7-remaining-swe | UNMAPPED | - |
| `src/symbols.c` | symbols | module7-remaining-swe | UNMAPPED | - |
| `src/skybrightness.c` | skybrightness | module7-remaining-swe | UNMAPPED | - |
| `src/obj.c` | object | module7-remaining-swe | UNMAPPED | - |
| `src/tonemapper.h` | tonemapper | module7-remaining-swe | UNMAPPED | - |
| `src/modules/comets.c` | module | module7-remaining-swe | UNMAPPED | - |
| `src/modules/movements.c` | module | module7-remaining-swe | UNMAPPED | - |
| `src/designation.c` | labels | module6-labels-overlays | UNMAPPED | - |
| `src/modules/coordinates.c` | module | module6-labels-overlays | UNMAPPED | - |
| `src/modules/minorplanets.c` | module | module7-remaining-swe | UNMAPPED | - |
| `src/modules/skycultures.c` | module | module6-labels-overlays | UNMAPPED | - |
| `src/modules/satellites.c` | module | module5-satellites-full | UNMAPPED | - |
| `src/module.c` | module_system | module7-remaining-swe | UNMAPPED | - |
| `src/modules/dso.c` | module | module3-dso-full | UNMAPPED | - |
| `src/modules/atmosphere.c` | module | module7-remaining-swe | UNMAPPED | - |
| `src/modules/circle.c` | module | module6-labels-overlays | UNMAPPED | - |
| `src/modules/photos.c` | module | module7-remaining-swe | UNMAPPED | - |
| `src/modules/pointer.c` | module | module6-labels-overlays | UNMAPPED | - |
| `src/modules/landscape.c` | module | module7-remaining-swe | UNMAPPED | - |
| `src/modules/debug.c` | module | module7-remaining-swe | UNMAPPED | - |
| `src/modules/milkyway.c` | module | module7-remaining-swe | UNMAPPED | - |
| `src/geojson_parser.c` | geojson | module7-remaining-swe | UNMAPPED | - |
| `src/modules/meteors.c` | module | module7-remaining-swe | UNMAPPED | - |
| `src/args.h` | args | module7-remaining-swe | UNMAPPED | - |
| `src/render.h` | render | module7-remaining-swe | UNMAPPED | - |
| `src/mpc.c` | minor_planets | module7-remaining-swe | UNMAPPED | - |
| `src/tonemapper.c` | tonemapper | module7-remaining-swe | UNMAPPED | - |
| `src/projection.c` | projection | module0-foundation-lock | UNMAPPED | - |
| `src/config.h` | config | module7-remaining-swe | UNMAPPED | - |
| `src/areas.h` | areas | module7-remaining-swe | UNMAPPED | - |
| `src/algos/utctt.h` | time_scale | module0-foundation-lock | UNMAPPED | - |
| `src/algos/refraction.c` | algos | module0-foundation-lock | UNMAPPED | - |
| `src/algos/orbit.c` | algos | module7-remaining-swe | UNMAPPED | - |
| `src/algos/moon.c` | algos | module7-remaining-swe | UNMAPPED | - |
| `src/algos/format.c` | algos | module7-remaining-swe | UNMAPPED | - |
| `src/algos/healpix.c` | algos | module1-hips-kernel | UNMAPPED | - |
| `src/algos/pluto.c` | algos | module7-remaining-swe | UNMAPPED | - |
| `src/algos/satrings.c` | algos | module7-remaining-swe | UNMAPPED | - |
| `src/algos/utctt.c` | time_scale | module0-foundation-lock | UNMAPPED | - |
| `src/algos/deltat.c` | algos | module0-foundation-lock | UNMAPPED | - |
| `src/algos/bv_to_rgb.c` | algos | module2-stars-full | UNMAPPED | - |
| `src/algos/algos.h` | algos | module0-foundation-lock | UNMAPPED | - |
| `src/algos/gust86.c` | algos | module7-remaining-swe | UNMAPPED | - |
| `src/algos/tass17.c` | algos | module7-remaining-swe | UNMAPPED | - |
| `src/algos/l1.c` | algos | module7-remaining-swe | UNMAPPED | - |
| `src/algos/cst-boundaries.c` | algos | module6-labels-overlays | UNMAPPED | - |
| `src/shader_cache.c` | render | module7-remaining-swe | UNMAPPED | - |

## Out-of-Scope Approval Log

No out-of-scope entries approved yet.

## Function-Level Expansion Queue

Function-level mapping is required before any module can pass `G0 InventoryLock`.

- module0-foundation-lock: pending
- module1-hips-kernel: pending
- module2-stars-full: pending
- module3-dso-full: pending
- module4-dss-full: pending
- module5-satellites-full: pending
- module6-labels-overlays: pending
- module7-remaining-swe: pending

## Module 0 Function Inventory (Foundation Contracts)

### Source: `src/observer.c`, `src/observer.h`

| Function | Source | Status | AH Target |
|---|---|---|---|
| `observer_update` | observer.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/services/SkyObserverService.ts` |
| `observer_update_fast` | observer.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/services/SkyObserverService.ts` |
| `observer_update_full` | observer.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/services/SkyObserverService.ts` |
| `observer_is_uptodate` | observer.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/services/SkyObserverService.ts` |
| `observer_get_pos` | observer.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/services/SkyObserverService.ts` |

### Source: `src/frames.c`, `src/frames.h`

| Function | Source | Status | AH Target |
|---|---|---|---|
| `convert_frame` | frames.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/services/SkyObserverService.ts` |
| `convert_framev4` | frames.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/services/SkyObserverService.ts` |
| `position_to_apparent` | frames.c | UNMAPPED | `frontend/src/features/sky-engine/astronomy.ts` |
| `position_to_astrometric` | frames.c | UNMAPPED | `frontend/src/features/sky-engine/astronomy.ts` |
| `apparent_to_astrometric` | frames.c | UNMAPPED | `frontend/src/features/sky-engine/astronomy.ts` |
| `frame_get_rotation` | frames.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/services/SkyObserverService.ts` |

### Source: `src/navigation.c`, `src/navigation.h`

| Function | Source | Status | AH Target |
|---|---|---|---|
| `core_update_time` | navigation.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/runtime/SkyClockService.ts` |
| `core_update_direction` | navigation.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/services/SkyNavigationService.ts` |
| `core_update_mount` | navigation.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/services/SkyNavigationService.ts` |
| `core_update_fov` | navigation.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/services/SkyProjectionService.ts` |

### Source: `src/projection.c`, `src/projection.h`, `src/projections/*.c`

| Function | Source | Status | AH Target |
|---|---|---|---|
| `projection_init` | projection.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/services/SkyProjectionService.ts` |
| `projection_compute_fovs` | projection.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/services/SkyProjectionService.ts` |
| `project_to_clip` | projection.c | UNMAPPED | `frontend/src/features/sky-engine/projectionMath.ts` |
| `project_to_win` | projection.c | UNMAPPED | `frontend/src/features/sky-engine/projectionMath.ts` |
| `unproject` | projection.c | UNMAPPED | `frontend/src/features/sky-engine/projectionMath.ts` |
| `proj_stereographic` | projections/proj_stereographic.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/services/SkyProjectionService.ts` |
| `proj_perspective` | projections/proj_perspective.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/services/SkyProjectionService.ts` |
| `proj_hammer` | projections/proj_hammer.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/services/SkyProjectionService.ts` |
| `proj_mercator` | projections/proj_mercator.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/services/SkyProjectionService.ts` |
| `proj_mollweide` | projections/proj_mollweide.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/services/SkyProjectionService.ts` |

### Source: `src/algos/utctt.c`, `src/algos/utctt.h`, `src/algos/deltat.c`

| Function | Source | Status | AH Target |
|---|---|---|---|
| `utc2tt` | algos/utctt.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/runtime/SkyClockService.ts` |
| `tt2utc` | algos/utctt.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/runtime/SkyClockService.ts` |
| `ut1_minus_utc` | algos/utctt.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/services/SkyObserverService.ts` |
| `deltat` | algos/deltat.c | UNMAPPED | `frontend/src/features/sky-engine/engine/sky/services/SkyObserverService.ts` |
