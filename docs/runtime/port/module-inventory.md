# Stellarium Source Module Inventory (Fail-Closed)

Source root: pinned upstream `Stellarium/stellarium-web-engine` `src/` (see `stellarium-web-engine-src.md`)

Generated: 2026-04-18  
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
| `src/sprintf.c` | core | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/swe.c` | core | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/obj.h` | core | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/mpc.h` | minor_planets | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/eph-file.c` | eph | module1-hips-kernel | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/sgp4.h` | satellites | module5-satellites-full | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/obj_info.h` | object_info | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/geojson_parser.h` | geojson | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/hips.h` | hips | module1-hips-kernel | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/core.c` | core | module0-foundation-lock | BLOCKED | Barometric + time/refraction hooks: `transforms/coordinates.ts` (`computeStellariumBarometricPressureMbar`), `SkyClockService`, bridge; full Stellarium `core.c` render/init loop not ported. **Gate:** G5. |
| `src/symbols.h` | symbols | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/projection.h` | projection | module0-foundation-lock | BLOCKED | `projectionMath.ts`, `SkyProjectionService.ts`; not all C projection entry points frozen. **Gate:** G5. |
| `src/log.h` | core | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/shader_cache.h` | render | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/painter.c` | render | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/hip.c` | stars | module2-stars-full | BLOCKED | Hub TS: **`hipGetPix.ts`** (`hipGetPix`, `parseHipIdFromRuntimeStar`, `runtimeStarMatchesHipHealpixLookup`) + vendored **`hipPixOrder2.generated.ts`** (ported `PIX_ORDER_2` blob from `hip.inl`, **EV-0041**); Hipparcos merge path drops HIP rows that fail `hip_get_pix(hip,2) === healpixAngToPix(2, ra, dec)` (**EV-0042**). Native C `hip_load` / `hip_iter` loaders remain **BLOCKED**. **Gate:** G5. See **`module2-source-contract.md`** §1–§2. |
| `src/swe.h` | core | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/erfa_wrap.h` | astro_math | module0-foundation-lock | BLOCKED | Literal TS ERFA ports: `engine/sky/runtime/erfa*.ts` (incl. **`eraEpv00`** → `erfaEpv00.ts` + generated tables). **Gate:** G5 astrometry parity. |
| `src/skybrightness.h` | skybrightness | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/progressbar.c` | utils | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/line_mesh.c` | render | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/utils.h` | utils | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/fps.h` | utils | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/system.h` | system | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/gesture.h` | input | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/request.c` | io | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/utf8.c` | utils | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/tests.c` | tests | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/tests.h` | tests | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/painter.h` | render | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/request.h` | io | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/gui.h` | gui | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/designation.h` | labels | module6-labels-overlays | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/uv_map.c` | render | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/layer.c` | render | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/cache.c` | cache | module1-hips-kernel | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/line_mesh.h` | render | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/fader.c` | utils | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/telescope.c` | telescope | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/core.h` | core | module0-foundation-lock | BLOCKED | Types/contracts spread across `sky-engine` runtime + feature modules; no 1:1 header. **Gate:** G5. |
| `src/utils/worker.h` | async | module1-hips-kernel | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/hips.c` | hips | module1-hips-kernel | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/events.c` | events | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/texture.c` | texture | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/assets.h` | assets | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/skyculture.c` | skyculture | module6-labels-overlays | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/fps.c` | utils | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/constellations.c` | module | module6-labels-overlays | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/module.h` | module_system | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/gl.h` | render | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/drag_selection.c` | module | module6-labels-overlays | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/labels.h` | labels | module6-labels-overlays | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/cardinal.c` | module | module6-labels-overlays | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/eph-file.h` | eph | module1-hips-kernel | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/frames.h` | frames | module0-foundation-lock | BLOCKED | Paired with `frames.c` mapping. **Gate:** G5. |
| `src/utils/vec.c` | math | module0-foundation-lock | BLOCKED | `erfaIau2006.ts` matrix ops; Babylon `Vector3` elsewhere; Stellarium `vec.h` multiply order documented for observer chain. **Gate:** G5. |
| `src/observer.h` | observer | module0-foundation-lock | BLOCKED | `SkyObserverService.ts`, `observerDerivedGeometry.ts` (**`eraEpv00`** → `earthPv`/`sunPv` partial), `observerParityStubs.ts`. **Gate:** EOP/PM, full `observer_update_full` / `eraApco`; G5. |
| `src/utils/cache.h` | cache | module1-hips-kernel | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/navigation.h` | navigation | module0-foundation-lock | BLOCKED | `SkyNavigationService.ts`, `SkyClockService.ts`, `observerNavigation.ts`. **Gate:** G5. |
| `src/render_gl.c` | render | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/utf8.h` | utils | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/libtess2.c` | render | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/lines.c` | module | module6-labels-overlays | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/skyculture.h` | skyculture | module6-labels-overlays | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/swe_utils.c` | utils | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/dss.c` | module | module4-dss-full | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/telescope.h` | telescope | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/texture.h` | texture | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/otypes.c` | object_types | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/projections/proj_hammer.c` | projection | module0-foundation-lock | BLOCKED | Not implemented in Hub projection surface; `projectionMath.ts` / `SkyProjectionService.ts` cover subset. **Gate:** G5. |
| `src/system.c` | system | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/progressbar.h` | utils | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/observer.c` | observer | module0-foundation-lock | BLOCKED | `SkyObserverService.ts`, `observerDerivedGeometry.ts`, `runtime/erfa*.ts`. **Gate:** G5 (native C parity / EOP / PM / PV beyond PyERFA harness **EV-0018**). |
| `src/projections/proj_perspective.c` | projection | module0-foundation-lock | BLOCKED | Perspective path via `SkyProjectionService` / `projectionMath.ts` (not C-identical). **Gate:** G5. |
| `src/modules/planets.c` | module | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/request_js.c` | io | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/vec.h` | math | module0-foundation-lock | BLOCKED | `erfaIau2006.ts` + Babylon vectors; see `vec.c` row. **Gate:** G5. |
| `src/assets.c` | assets | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/projections/proj_mercator.c` | projection | module0-foundation-lock | BLOCKED | Not first-class in Hub; subset in `projectionMath.ts`. **Gate:** G5. |
| `src/otypes.h` | object_types | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/labels.c` | module | module6-labels-overlays | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/worker.c` | async | module1-hips-kernel | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/uv_map.h` | render | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/hip.h` | stars | module2-stars-full | BLOCKED | Hipparcos ID surface consumed via **`hipGetPix.ts`**; `hip.inl` `PIX_ORDER_2` table vendored as **`hipPixOrder2.generated.ts`** (no external tree dependency). Remaining `hip_t` loader contract still **BLOCKED** pending full `hip.c` port. **Gate:** G5. See **`module2-source-contract.md`** §1–§2. |
| `src/utils/utils_json.h` | utils | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/utils_json.c` | utils | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/constants.h` | core | module0-foundation-lock | BLOCKED | `erfaConstants.ts`, time-scale and engine constants. **Gate:** G5. |
| `src/modules/stars.c` | module | module2-stars-full | BLOCKED | Hub TS (partial ports): `bvToRgb.ts` (**EV-0038**), `starsNuniq.ts` (**EV-0039**, `nuniq_to_pix`), `stellariumPainterLimits.ts` (**EV-0040**, `render_visitor` `limit_mag` policy), `runtime/starsRenderVisitor.ts` + `runtime/modules/StarsModule.ts` + `runtime/modules/runtimeFrame.ts` (**EV-0074**, native `render_visitor` tile traversal + point-clipped gate on active runtime path), `starsLookup.ts` (**EV-0075**, survey-wide `obj_get_by_hip` lookup keyed by `hip_get_pix(hip, 2)` buckets + cached index; stable HIP detail route retained from **EV-0046**), `erfaStarpv.ts` + `starsCatalogAstrom.ts` (**EV-0070**, `compute_pv` + `star_get_astrom` + ERFA `eraStarpv` / `eraEpb2jd`), `services/sceneAssembler.ts` (**EV-0070**/**EV-0074**, per-star pv cache + tile-ordered packet feed), `contracts/scene.ts` (tile traversal payload schema). `painter_project(FRAME_ASTROM → FRAME_OBSERVED)` apparent-place chain (`eraLdsun` + `eraAb` + `bpn^T` + `ri2h`) is **PORTED** via `erfaAbLdsun.ts` + `convertObserverFrameVector('icrf' → 'observed_geom')` and sealed end-to-end by **EV-0072** (`test_module2_painter_project_frame_astrom.test.js`). Native C `stars_list` and `stars_add_data_source` remain **BLOCKED**. **Gate:** G5. See **`module2-source-contract.md`** §1–§7. |
| `src/projections/proj_stereographic.c` | projection | module0-foundation-lock | BLOCKED | `projectionMath.ts` stereographic branch + `SkyProjectionService.ts`. **Gate:** G5. |
| `src/frames.c` | frames | module0-foundation-lock | BLOCKED | `astronomy.ts`, `transforms/coordinates.ts` (`ObserverFrame`, `convertObserverFrameVector`). **Gate:** G5. |
| `src/utils/mesh.h` | render | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/gl.c` | render | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/args.c` | args | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/projections/proj_mollweide.c` | projection | module0-foundation-lock | BLOCKED | Not implemented in Hub viewport stack. **Gate:** G5 / future. |
| `src/utils/fader.h` | utils | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/mesh.c` | render | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/navigation.c` | navigation | module0-foundation-lock | BLOCKED | `SkyNavigationService.ts`, `SkyClockService.ts`, `SkyProjectionService.ts`, `observerNavigation.ts`. **Gate:** G5. |
| `src/areas.c` | areas | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/geojson.c` | module | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/utils/gesture.c` | input | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/symbols.c` | symbols | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/skybrightness.c` | skybrightness | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/obj.c` | object | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/tonemapper.h` | tonemapper | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/comets.c` | module | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/movements.c` | module | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/designation.c` | labels | module6-labels-overlays | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/coordinates.c` | module | module6-labels-overlays | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/minorplanets.c` | module | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/skycultures.c` | module | module6-labels-overlays | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/satellites.c` | module | module5-satellites-full | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/module.c` | module_system | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/dso.c` | module | module3-dso-full | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/atmosphere.c` | module | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/circle.c` | module | module6-labels-overlays | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/photos.c` | module | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/pointer.c` | module | module6-labels-overlays | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/landscape.c` | module | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/debug.c` | module | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/milkyway.c` | module | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/geojson_parser.c` | geojson | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/modules/meteors.c` | module | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/args.h` | args | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/render.h` | render | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/mpc.c` | minor_planets | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/tonemapper.c` | tonemapper | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/projection.c` | projection | module0-foundation-lock | BLOCKED | `projectionMath.ts`, `SkyProjectionService.ts`. **Gate:** G5. |
| `src/config.h` | config | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/areas.h` | areas | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/algos/utctt.h` | time_scale | module0-foundation-lock | BLOCKED | `timeScales.ts` UTC↔TT (+ leap seconds); not full ERFA `eraUtctai`/`eraTaitt` surface. **Gate:** G5. |
| `src/algos/refraction.c` | algos | module0-foundation-lock | BLOCKED | Altitude-layer: `refraction_prepare` + Saemundsson forward/inverse in `transforms/coordinates.ts`; barometric pressure `core.c` in `computeStellariumBarometricPressureMbar`. Vector `refraction`/`refraction_inv` not yet on shared unit-vector path. **Gate:** G5. |
| `src/algos/orbit.c` | algos | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/algos/moon.c` | algos | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/algos/format.c` | algos | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/algos/healpix.c` | algos | module1-hips-kernel | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/algos/pluto.c` | algos | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/algos/satrings.c` | algos | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/algos/utctt.c` | time_scale | module0-foundation-lock | BLOCKED | `timeScales.ts` (`toJulianDateTt`, `dut1SecondsFromTimestampIso`, etc.). **Gate:** G5. |
| `src/algos/deltat.c` | algos | module0-foundation-lock | PORTED | `runtime/timeScales.ts` (`deltaTSecondsFromTtMjd`, SMH2016 + post-2016 branch). Verified: `tests/test_time_scales.test.js`. |
| `src/algos/bv_to_rgb.c` | algos | module2-stars-full | BLOCKED | Hub TS: **`bvToRgb.ts`** + **`test_module2_bv_to_rgb.test.js`** (**EV-0038**); C file row **`BLOCKED`** until native parity pass. |
| `src/algos/algos.h` | algos | module0-foundation-lock | BLOCKED | Umbrella header; module0 algorithms mapped on per-file rows (`deltat`, `utctt`, `refraction`). **Gate:** per-algo G5. |
| `src/algos/gust86.c` | algos | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/algos/tass17.c` | algos | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/algos/l1.c` | algos | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/algos/cst-boundaries.c` | algos | module6-labels-overlays | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |
| `src/shader_cache.c` | render | module7-remaining-swe | BLOCKED | G0 inventory lock: Planned Module assigned; AH port work deferred per `docs/runtime/port/README.md` execution order. |

## Out-of-Scope Approval Log

No out-of-scope entries approved yet.

## Function-Level Expansion Queue

File-level **`G0 InventoryLock`** means zero **`UNMAPPED`** rows (satisfied globally as of **2026-04-18**). Function-level expansion below is still the authoritative checklist for parity work inside **`PORTED`** / **`BLOCKED`** surfaces.

- module0-foundation-lock: **gate `COMPLETE`** (**EV-0019**); file rows are `PORTED`/`BLOCKED` with AH targets; function tables list core contracts; **`BLOCKED`** C sources remain until row-specific **G5** parity or scope decisions.
- module1-hips-kernel: **COMPLETE** (**EV-0034**); see **`module1-source-contract.md`**, **`module-gates.md`**.
- module2-stars-full: **`G0`/`G1`** **PASS** (**EV-0036**); **`BLK-003`** **RESOLVED** (**EV-0037**); partial-parity Hub ports landed through **EV-0038**–**EV-0075** (`bv_to_rgb`, `nuniq_to_pix`, `render_visitor` `limit_mag`, `hip_get_pix` + vendored `PIX_ORDER_2` table, Hipparcos tile merge HIP-check, survey-wide `obj_get_by_hip` lookup keyed by `hip_get_pix(hip,2)`, stable HIP detail route + selection continuity, deterministic algorithm fingerprint, ERFA `eraStarpv` / `eraEpb2jd` + Stellarium `compute_pv` / `star_get_astrom`, native `render_visitor` tile traversal on runtime path, and **`painter_project(FRAME_ASTROM → FRAME_OBSERVED)`** apparent-place chain sealed end-to-end). Module 2 function inventory table below; see **`module2-source-contract.md`** §2–§7.
- module3-dso-full: pending
- module4-dss-full: pending
- module5-satellites-full: pending
- module6-labels-overlays: pending
- module7-remaining-swe: pending

## Module 0 Function Inventory (Foundation Contracts)

### Source: `src/observer.c`, `src/observer.h`

| Function | Source | Status | AH Target |
|---|---|---|---|
| `observer_update` | observer.c | BLOCKED | `frontend/src/features/sky-engine/engine/sky/services/SkyObserverService.ts` (parity **G5**; PyERFA `apco` slice **EV-0018**). |
| `observer_update_fast` | observer.c | BLOCKED | `frontend/src/features/sky-engine/engine/sky/services/SkyObserverService.ts` |
| `observer_update_full` | observer.c | BLOCKED | `frontend/src/features/sky-engine/engine/sky/services/SkyObserverService.ts` |
| `observer_is_uptodate` | observer.c | BLOCKED | `frontend/src/features/sky-engine/engine/sky/services/SkyObserverService.ts` |
| `observer_get_pos` | observer.c | BLOCKED | `frontend/src/features/sky-engine/engine/sky/services/SkyObserverService.ts` |

### Source: `src/frames.c`, `src/frames.h`

| Function | Source | Status | AH Target |
|---|---|---|---|
| `convert_frame` | frames.c | BLOCKED | `frontend/src/features/sky-engine/engine/sky/services/SkyObserverService.ts` |
| `convert_framev4` | frames.c | BLOCKED | `frontend/src/features/sky-engine/engine/sky/services/SkyObserverService.ts` |
| `position_to_apparent` | frames.c | BLOCKED | `frontend/src/features/sky-engine/astronomy.ts` |
| `position_to_astrometric` | frames.c | BLOCKED | `frontend/src/features/sky-engine/astronomy.ts` |
| `apparent_to_astrometric` | frames.c | BLOCKED | `frontend/src/features/sky-engine/astronomy.ts` |
| `frame_get_rotation` | frames.c | BLOCKED | `frontend/src/features/sky-engine/engine/sky/services/SkyObserverService.ts` |

### Source: `src/navigation.c`, `src/navigation.h`

| Function | Source | Status | AH Target |
|---|---|---|---|
| `core_update_time` | navigation.c | BLOCKED | `frontend/src/features/sky-engine/engine/sky/runtime/SkyClockService.ts` |
| `core_update_direction` | navigation.c | BLOCKED | `frontend/src/features/sky-engine/engine/sky/services/SkyNavigationService.ts` |
| `core_update_mount` | navigation.c | BLOCKED | `frontend/src/features/sky-engine/engine/sky/services/SkyNavigationService.ts` |
| `core_update_fov` | navigation.c | BLOCKED | `frontend/src/features/sky-engine/engine/sky/services/SkyProjectionService.ts` |

### Source: `src/projection.c`, `src/projection.h`, `src/projections/*.c`

| Function | Source | Status | AH Target |
|---|---|---|---|
| `projection_init` | projection.c | BLOCKED | `frontend/src/features/sky-engine/engine/sky/services/SkyProjectionService.ts` |
| `projection_compute_fovs` | projection.c | BLOCKED | `frontend/src/features/sky-engine/engine/sky/services/SkyProjectionService.ts` |
| `project_to_clip` | projection.c | BLOCKED | `frontend/src/features/sky-engine/projectionMath.ts` |
| `project_to_win` | projection.c | BLOCKED | `frontend/src/features/sky-engine/projectionMath.ts` |
| `unproject` | projection.c | BLOCKED | `frontend/src/features/sky-engine/projectionMath.ts` |
| `proj_stereographic` | projections/proj_stereographic.c | BLOCKED | `frontend/src/features/sky-engine/engine/sky/services/SkyProjectionService.ts` |
| `proj_perspective` | projections/proj_perspective.c | BLOCKED | `frontend/src/features/sky-engine/engine/sky/services/SkyProjectionService.ts` |
| `proj_hammer` | projections/proj_hammer.c | BLOCKED | `frontend/src/features/sky-engine/engine/sky/services/SkyProjectionService.ts` |
| `proj_mercator` | projections/proj_mercator.c | BLOCKED | `frontend/src/features/sky-engine/engine/sky/services/SkyProjectionService.ts` |
| `proj_mollweide` | projections/proj_mollweide.c | BLOCKED | `frontend/src/features/sky-engine/engine/sky/services/SkyProjectionService.ts` |

### Source: `src/algos/utctt.c`, `src/algos/utctt.h`, `src/algos/deltat.c`

| Function | Source | Status | AH Target |
|---|---|---|---|
| `utc2tt` | algos/utctt.c | BLOCKED | `toJulianDateTt` in `runtime/timeScales.ts` (leap table; not full ERFA `eraUtctai`/`eraTaitt`). |
| `tt2utc` | algos/utctt.c | BLOCKED | inverse not split out; `dut1SecondsFromTimestampIso` uses (TT−UTC)−ΔT identity vs full `eraTtut1`/`eraTaiutc`. |
| `ut1_minus_utc` | algos/utctt.c | BLOCKED | `dut1SecondsFromTimestampIso` in `runtime/timeScales.ts` (algebraic from ΔT + leap table). |
| `deltat` | algos/deltat.c | PORTED | `deltaTSecondsFromTtMjd` in `runtime/timeScales.ts`; `tests/test_time_scales.test.js`. |

### Module 0 Mapping Notes (working)

- **G1 partial contract:** `docs/runtime/port/module0-source-contract.md` — frozen Hub ↔ Stellarium mapping for the observer/time/ERFA/refraction spine (evidence **EV-0012**).
- `computeObserverUpdateHash` now keys on TT Julian date instead of raw ISO timestamp:
  - `frontend/src/features/sky-engine/engine/sky/runtime/observerUpdateHash.ts`
- Leap-second-aware UTC/TT conversion introduced:
  - `frontend/src/features/sky-engine/engine/sky/runtime/timeScales.ts`
  - consumed by `frontend/src/features/sky-engine/engine/sky/runtime/observerDerivedGeometry.ts`
- Stellarium `deltat` (SMH2016) and UT1 Julian date for GMST: `deltaTSecondsFromTtMjd`, `ut1JulianDateFromTimestampIso`, `dut1SecondsFromTimestampIso` in `timeScales.ts`; `computeLocalSiderealTimeDeg` uses UT1 JD.
- ERFA `eraEra00` (Capitaine et al. 2000) in `runtime/erfaEarthRotation.ts`; `ri2h`/`rh2i` follow Stellarium `observer.c` **`update_matrices`** (`Rz(eral)×Rpl×Ry×Rsx`, transpose, `mat3_invert` → Hub `invertMatrix3`) with **`astrom.eral`** / **`astrom.xpl`/`ypl`** after **`eraApco`** (`observerDerivedGeometry.ts`).
- `eraPnm06a` + `eraNut00a`/`eraNut06a` in `runtime/erfaNut00a.ts`, `runtime/erfaPnm06a.ts` (generated `erfaNut00aTables.generated.ts`); `matrices.bpn`, `rc2v`/`ri2v` per Stellarium `vec.h` `mat3_mul` order; `matrices.icrsToHorizontal` = `ri2h×bpn`, `horizontalToIcrs` for `coordinates.ts` `icrf` frame.
- Polar motion: `runtime/observerParityStubs.ts` (`ZERO_POLAR_MOTION_STUB`, `SkyPolarMotionStub`); `SkyObserverDerivedGeometry.polarMotion` / `.observerSeam` (ERFA `xp`/`yp` + `xpl`/`ypl`, and `elong`/`phi`/`hm`/`eral`) — IERS EOP still stubbed; **`Rpl`** in `ri2h` already reads **`astrom.xpl`/`ypl`** when non-zero.
- CIP / CIO / EO chain (Stellarium `observer_update_full` / `eraEo06a` ingredients): `runtime/erfaBpn2xy.ts`, `runtime/erfaS06.ts`, `runtime/erfaEors.ts`; `SkyObserverDerivedGeometry.cipRad`, `.cioLocatorSRad`, `.equationOfOriginsRad`, and `.timeModifiedJulianDate` (TT/UTC/UT1 as MJD); `eraFalp03` / `eraFad03` added in `erfaFundamentalArguments.ts` for `eraS06`.
- IAU 2006 `eraObl06` / `eraPfw06` / `eraFw2m` / `eraPmat06` / `eraEcm06` in `runtime/erfaIau2006.ts`; `matrices.ri2e` / `matrices.re2i` from `eraEcm06` (no Stellarium `mat3_invert` naming swap — ERFA ICRS→ecliptic of date).
- Module0 function rows use **`BLOCKED`** until **G5** side-by-side parity (or **`PORTED`** where noted, e.g. `deltat`). File-level inventory has **zero** **`UNMAPPED`** rows (**G0** satisfied); non–module-0 files remain **`BLOCKED`** with deferred AH work per planned module.
- **G4 (Hub):** `runtime/module0ParityFingerprint.ts` + `tests/test_module0_deterministic_replay.test.js` (**EV-0011**) + `tests/test_module0_replay_astrom_golden_contract.test.js` + `tests/fixtures/module0_replay_astrom_goldens.json` (**EV-0017**); **BLK-000** tier-1 **RESOLVED**. **G5** PyERFA `apco` second runtime vs Hub: **EV-0018** / **BLK-002** **RESOLVED** (`study/module0-parity/`); native Stellarium C / WASM dumps remain optional.
- **`eraEpv00` (Earth PV):** **PORTED** — vendored `erfaEpv00Tables.generated.ts`, `erfaEpv00.ts`, `frontend/tests/test_erfa_epv00.test.js`; `observerDerivedGeometry` sets **`earthPv`** / **`sunPv`** and feeds **`pvb`** / **`pvh[0]`** into **`eraApco`**. Evidence **EV-0014**.
- **`eraApcs` / `eraApco`:** **`eraApcs`** **PORTED** (`erfaApcs.ts`, **EV-0015**); **`eraApco`** **PORTED** (`erfaApco.ts`, SOFA vector test, **EV-0016**). **`deriveObserverGeometry`** fills **`SkyObserverDerivedGeometry.astrom`**. **`eraAb` / `eraLdsun`**, **`convertObserverFrameVector`**, **`SkyEngineQuery.observerFrameAstrometry`** → **`assembleSkyScenePacket` / `raDecToObserverUnitVector`** (`erfaAbLdsun.ts`, **`observerAstrometryMerge.ts`**, **`SkyEngineScene.tsx`**); procedural Milky Way uses the same snapshot via **`ScenePropsSnapshot.observerFrameAstrometry`** in **`MilkyWayModule`**.

## Module 2 Function Inventory (Stars Pipeline)

Scope rows: **`src/hip.c`**, **`src/hip.h`**, **`src/modules/stars.c`**, **`src/algos/bv_to_rgb.c`**. File-level status remains **`BLOCKED`** (native C parity is open) while the partial-port Hub TS surface below is live on the runtime star path.

### Source: `src/algos/bv_to_rgb.c`

| Function | Source | Status | AH Target |
|---|---|---|---|
| `bv_to_rgb` | algos/bv_to_rgb.c | PORTED | `frontend/src/features/sky-engine/engine/sky/adapters/bvToRgb.ts` (`bvToRgb`; `COLORS` 128×3 vendored). `resolveStarColorHex` in `starRenderer.ts` maps to sRGB hex. Tests: `test_module2_bv_to_rgb.test.js`. Evidence **EV-0038**. |

### Source: `src/hip.c`, `src/hip.h` (+ vendored `src/hip.inl`)

| Function | Source | Status | AH Target |
|---|---|---|---|
| `hip_get_pix` | hip.c | PORTED | `frontend/src/features/sky-engine/engine/sky/adapters/hipGetPix.ts` (`hipGetPix`) + vendored **`hipPixOrder2.generated.ts`** (`PIX_ORDER_2` blob from `hip.inl`). Tests: `test_module2_hip_get_pix.test.js`. Evidence **EV-0041**. |
| `hip_get_star` / `hip_load` / `hip_iter` | hip.c | BLOCKED | Not ported; Hub consumes Hipparcos rows via module 1 tile path (`fileTileRepository.ts`) and does not call `hip_load` loaders. **Gate:** G5. |
| `hip_t` / `hip_star_t` struct surface | hip.h | BLOCKED | Logical subset expressed via `RuntimeStar` in `contracts/stars.ts`; no 1:1 header. **Gate:** G5. |

### Source: `src/modules/stars.c`

| Function | Source | Status | AH Target |
|---|---|---|---|
| `nuniq_to_pix` | modules/stars.c | PORTED | `frontend/src/features/sky-engine/engine/sky/adapters/starsNuniq.ts` (`nuniqToHealpixOrderAndPix` → shared `decodeEphTileNuniq` from `ephCodec.ts`; same math as `eph-file.c`). Tests: `test_module2_stars_nuniq.test.js`. Evidence **EV-0039**. |
| `render_visitor` — tile traversal (`hips_iter` push-children flow), `limit_mag = fmin(stars_limit_mag, hard_limit_mag)`, tile `mag_min`/`mag_max` gates, and point-clipped rejection | modules/stars.c | PORTED (runtime traversal path) | `frontend/src/features/sky-engine/engine/sky/runtime/starsRenderVisitor.ts` + `runtime/modules/runtimeFrame.ts` + `runtime/modules/StarsModule.ts` now execute parent→child tile visits and visibility gates on the active projection path; `frontend/src/features/sky-engine/engine/sky/runtime/stellariumPainterLimits.ts` keeps policy helper. Tests: `test_module2_stars_render_visitor.test.js`, `test_module2_stars_render_limit.test.js`. Evidence **EV-0040**, **EV-0074**. |
| `compute_pv` (proper motion + parallax at J2000.0 from catalog row) | modules/stars.c | PORTED | `frontend/src/features/sky-engine/engine/sky/runtime/starsCatalogAstrom.ts` (`computeCatalogStarPv`, `computeCatalogStarPvFromCatalogueUnits`); wraps ERFA `eraStarpv` + `eraEpb2jd` in `runtime/erfaStarpv.ts`. Tests: `test_erfa_starpv.test.js`. Evidence **EV-0070**. |
| `star_get_astrom` (propagate pv to observer TT and subtract `earth_pvb[0]`) | modules/stars.c | PORTED | `frontend/src/features/sky-engine/engine/sky/runtime/starsCatalogAstrom.ts` (`starAstrometricIcrfVector`). Consumer: `services/sceneAssembler.ts` (per-`RuntimeStar` WeakMap pv cache mirroring `on_file_tile_loaded` behaviour; `plx ≤ 2 mas` falls back to static ra/dec path). Evidence **EV-0070**. |
| `painter_project(FRAME_ASTROM → FRAME_OBSERVED)` apparent-place chain (`eraLdsun` → `eraAb` → `bpn^T` → `ri2h`) on EV-0070 pv output | modules/stars.c + frames.c + painter.c | PORTED | `frontend/src/features/sky-engine/engine/sky/runtime/erfaAbLdsun.ts` (`eraLdsun`, `eraAb`, `stellariumAstrometricToApparentIcrsUnit`) wired from `frontend/src/features/sky-engine/engine/sky/transforms/coordinates.ts` (`convertObserverFrameVector('icrf' → 'observed_geom')` when `astrometry.stellariumAstrom` is present). `services/sceneAssembler.ts::projectStarFromPv` hands the `star_get_astrom` ICRF vector straight into this chain. Tests: `test_module2_painter_project_frame_astrom.test.js` (asserts end-to-end match to a manual Stellarium chain to 1e-11; plus `plx ≤ 2 mas` fallback). Evidence **EV-0072**. |
| `obj_get_by_hip` (survey traversal keyed by `hip_get_pix`) | modules/stars.c | PORTED (runtime loaded-survey path) | `frontend/src/features/sky-engine/engine/sky/adapters/starsLookup.ts` (`findRuntimeStarByHipInTiles`, `buildHipDetailRoute`, `resolveHipDetailRouteForRuntimeStar`) now uses cached `hip_get_pix(hip, 2)` buckets over loaded non-Gaia survey tiles; wired into `SkyEngineScene.tsx`. Tests: `test_module2_stars_lookup.test.js`, `test_module2_stars_lookup_survey.test.js`, `test_sky_engine_selection_detail_route.test.js`. Evidence **EV-0044**, **EV-0045**, **EV-0046**, **EV-0047**, **EV-0075**. |
| `stars_list` / `stars_add_data_source` | modules/stars.c | BLOCKED | `render_visitor` runtime traversal is ported (**EV-0074**) and survey-wide loaded-tile `obj_get_by_hip` lookup is ported (**EV-0075**). Remaining open seams are `stars_list` / `stars_add_data_source` datasource behavior and full side-by-side closure. **Gate:** G5 (see `module2-source-contract.md` §7 "Suggested next coding targets"). |
| `on_file_tile_loaded` (`plx < 2/1000` reject) | modules/stars.c | PORTED (policy only) | Enforced in `services/sceneAssembler.ts` (`resolveCatalogPv` uses `parallaxMas <= 2` to fall back); dedupe + merge live in module 1 `fileTileRepository.ts` + `mergeSurveyTiles`. Evidence **EV-0070**. |
| Hipparcos tile merge HIP ↔ HEALPix consistency filter | modules/stars.c + hip.c | PORTED | `frontend/src/features/sky-engine/engine/sky/adapters/fileTileRepository.ts` (`filterSurveyStarsForMerge` → `runtimeStarMatchesHipHealpixLookup`). Evidence **EV-0042**. |

### Module 2 Mapping Notes (working)

- **G1 partial contract:** `docs/runtime/port/module2-source-contract.md` — §1–§2 freezes these Hub paths; §3 carries behavioral notes 1–25 covering all evidence through **EV-0070**; §7 is the Codex handoff.
- **G4 (Hub):** `runtime/module2ParityFingerprint.ts` + `tests/test_module2_deterministic_replay.test.js` (snapshot; Evidence **EV-0043** / extended **EV-0054** / **EV-0061** / **EV-0076**). Fingerprint now covers the prior algorithm set (`bv_to_rgb`, `nuniq_to_pix`, `resolveStarsRenderLimitMagnitude`, `hip_get_pix`, `coreGetPointForMagnitude`, view-tier / label-cap policy, `syncCadenceMs`, FOV `starCap`) plus deterministic slices for `stars.c::render_visitor` traversal order + yielded stars (`visitStarsRenderTiles`), survey-wide `obj_get_by_hip` lookup bucket semantics (`findRuntimeStarByHipInTiles`), and `compute_pv`/`star_get_astrom` catalog astrometry propagation invariants.
- **Stabilization stopgaps superseded by parity hardening:** the projected-star cap / wide-FOV floor / selected-star bypass introduced in **EV-0057**/**EV-0058**/**EV-0060** were removed in **EV-0063**/**EV-0065**/**EV-0066**; current runtime follows source-aligned limit flow without those Hub-specific heuristics. Reload thrash from viewport float jitter is instead solved by quantizing `hipsViewport` signature fields (**EV-0069**).
- **Catalog astrometry (EV-0070):** `ObserverAstrometrySnapshot` now carries `ttJulianDate` and `earthPv` from the merged `SkyObserverDerivedGeometry`; `sceneAssembler` consumes them to drive `starAstrometricIcrfVector` for catalog rows with `parallaxMas > 2`, falling back to `raDecToObserverUnitVector` otherwise. Per-star pv is cached on the immutable `RuntimeStar` reference via a `WeakMap` to match `stars.c::on_file_tile_loaded` "compute once at tile load" semantics.
