# Astronomy Hub vs Stellarium Web Engine - Strict Parity Tracker

Last updated: 2026-04-13 (Survey depth expansion block implemented; local tile/tier depth ceilings removed; frontend typecheck/build and targeted runtime tests pass; 120/60/30/10/2 checkpoint evidence revalidated)

Authority sources:
- Stellarium study source: `/home/rocco/Astronomy-Hub/study/stellarium-web-engine/source/stellarium-web-engine-master/src/**`
- Astronomy Hub source: `/home/rocco/Astronomy-Hub/frontend/src/features/sky-engine/**`
- Active runtime wiring anchor: `SkyEngineScene.tsx` module graph + `SkyEngineRuntimeBridge.ts`

Purpose:
- Track strict Stellarium-to-AH behavior parity.
- Count only active runtime wiring.
- Treat local heuristics as debt when Stellarium source behavior exists.

## Status Legend
- `absent`
- `heuristic`
- `partial port`
- `strong partial port`
- `near parity`

## Corrected Parity Matrix (active runtime only)
| Category | Stellarium source file(s) | Astronomy Hub active file(s) | Status | Still fake locally | Keep / Replace / Delete | Exact next direct port task |
|---|---|---|---|---|---|---|
| core / tonemapper / skybrightness | `src/core.c`, `src/tonemapper.c`, `src/skybrightness.c`, `src/navigation.c` | `skyBrightness.ts`, `starRenderer.ts`, `engine/sky/runtime/luminanceReport.ts`, `SkyBrightnessExposureModule.ts`, `observerNavigation.ts` | strong partial port | mixed local response curves and navigation easing not fully source-locked | Keep physical input chain; replace response math; delete non-source transition surrogates | Port one shared Stellarium-equivalent core math utility used by stars and planets |
| stars | `src/modules/stars.c`, `src/core.c` | `StarsModule.ts`, `runtimeFrame.ts`, `directStarLayer.ts`, `starRenderer.ts` | near parity | deepest zoom is now bounded by the currently shipped authoritative asset pack rather than a local tile/tier gate | Keep strict scene-packet traversal and core point chain; replace remaining deep-zoom data ceiling only | Add the next real survey asset layer and revalidate live Stellarium density at deep zoom |
| star surveys / sequencing | `src/modules/stars.c`, survey/hips paths | `engine/sky/adapters/fileTileRepository.ts`, `sceneAssembler.ts`, `SkyEngineScene.tsx`, `backendTileRegistry.ts`, `engine/sky/core/tileIndex.ts`, `engine/sky/core/tileSelection.ts` | strong partial port | current file-backed chain still tops out at the shipped Hipparcos/supplemental asset depth after local level and tier caps were removed | Keep deterministic file-backed sequencing and manifest-aware depth selection; replace remaining dataset ceiling; delete any reintroduced fallback branches | Add the next authoritative survey asset pack and validate the handoff beyond current Hipparcos ceiling |
| hints / label limiting magnitude | `src/core.c`, `src/modules/labels.c`, `src/modules/stars.c`, `src/modules/planets.c` | `labelManager.ts`, `directOverlayLayer.ts`, `runtimeFrame.ts` | heuristic | fixed label caps and local admissions instead of `hints_limit_mag` chain | Keep overlap/layout mechanics; replace admission rules; delete fixed caps | Port hint limiting-magnitude eligibility from Stellarium modules |
| planets | `src/modules/planets.c`, `src/core.c`, `src/navigation.c`, `src/tonemapper.c` | `astronomy.ts`, `runtimeFrame.ts`, `PlanetRenderer.ts`, `PlanetRuntimeModule.ts` | strong partial port | live Stellarium side-by-side threshold parity still unproven; horizon fade bypass still active globally | Keep ephemeris object feed; replace remaining non-source visibility/presentation paths | Validate/align any remaining `planet_render` threshold deltas against live Stellarium checkpoints |
| planet zoom chain | `src/modules/planets.c` (`planet_render`, `get_artificial_scale`), `src/core.c` (`core_get_point_for_mag*`, `core_get_apparent_angle_for_point`), `src/navigation.c` | `runtimeFrame.ts`, `PlanetRenderer.ts`, `ObjectRuntimeModule.ts`, `directObjectLayer.ts`, `observerNavigation.ts` | partial port | no live side-by-side confirmation yet; additional tonemapper parity validation still needed | Keep single transition chain now in runtime frame; replace residual non-source alpha/visibility behavior if discovered | Run explicit Jupiter+Moon checkpoint validation against live Stellarium and close residual deltas |
| moons | `src/modules/planets.c` (moon exception + scale behavior) | `astronomy.ts`, `ObjectRuntimeModule.ts`, `directObjectLayer.ts`, `PlanetRenderer.ts` | partial port | moon exception uses type gate but full Stellarium moon branch nuances may still differ | Keep moon in planet chain and artificial scaling port; replace any remaining generic-marker semantics | Validate moon separation/scale checkpoints and adjust to exact `get_artificial_scale` behavior |
| DSO | `src/modules/dso.c` | `astronomy.ts`, `DsoRuntimeModule.ts`, `DsoRenderer.ts`, `dsoVisuals.ts` | partial port | fixed 4-item seed DSO catalog and local morphology shortcuts | Keep dedicated DSO render lane; replace static seed behavior | Replace seed catalog with survey-backed DSO behavior and Stellarium gating |
| labels | `src/modules/labels.c` | `labelManager.ts`, `directOverlayLayer.ts` | heuristic | local priority and cap policies | Keep layout/collision implementation; replace class visibility rules | Port Stellarium label policy and class offsets |
| constellations | `src/modules/constellations.c` | `constellations.ts`, `directOverlayLayer.ts` | strong partial port | local presentation policy not fully source-equivalent | Keep culture-driven geometry flow; replace policy differences | Port constellation visibility/policy coupling from Stellarium module behavior |
| skycultures | `src/skyculture.c`, `src/modules/skycultures.c` | `skycultures/**`, `constellations.ts`, `SkyEngineScene.tsx` | strong partial port | runtime coupling rules still simplified | Keep data loading and switching foundation; replace behavior coupling | Align culture activation/fallback behavior to Stellarium flow |
| overlays / grids | `src/modules/coordinates.c`, `src/modules/labels.c` | `OverlayRuntimeModule.ts`, `directOverlayLayer.ts` | heuristic | cadence throttling thresholds govern relayout timing | Keep overlay pipeline; replace cadence heuristics with deterministic invalidation | Remove fixed relayout thresholds and use projection/state driven updates |
| atmosphere | `src/modules/atmosphere.c`, `src/skybrightness.c` | `AtmosphereModule.ts`, `directBackgroundLayer.ts`, `SkyBrightnessExposureModule.ts` | partial port | local exposure/contrast calibrations not fully source-locked | Keep module ownership and frame sync; replace coupling formulas | Align atmosphere response chain to Stellarium skybrightness/tonemapper behavior |
| landscape | `src/modules/landscape.c` | `LandscapeModule.ts`, `directBackgroundLayer.ts` | heuristic | procedural horizon/ground shading substitute | Keep landscape module ownership; replace procedural shading behavior | Port Stellarium landscape + occlusion behavior |
| Milky Way | `src/modules/milkyway.c` | `MilkyWayModule.ts`, `directBackgroundLayer.ts` | heuristic | procedural Milky Way sampling | Delete procedural synthesis; replace with source-defined behavior | Port Milky Way intensity/shape behavior from Stellarium module |
| pointer / selection | `src/modules/pointer.c`, selection paths in core | `SkyNavigationService.ts`, `pickTargets.ts`, selection rings in direct layers | partial port | local pick radius and pointer visuals differ; `PointerRenderer.ts` unwired | Keep selection ownership and routing; replace pointer behavior | Port pointer marker and selection behavior from Stellarium pointer module |
| object inspector / detail surface | object info paths (`obj_info` and per-module `get_info`) | `SkyEngineDetailShell.tsx` | heuristic | explicit temporary/deferred truth placeholders | Keep shell surface; replace content contracts | Port object-type info adapters mirroring Stellarium info fields |
| satellites | `src/modules/satellites.c` | `astronomy.ts`, `SatelliteRuntimeModule.ts`, `SatelliteRenderer.ts` | partial port | top-3 truncation and placeholder `magnitude: 99` | Keep backend-fed integration boundary; replace truncation/placeholder behavior | Port visibility and photometric behavior from Stellarium satellite logic |
| minor planets | `src/modules/minorplanets.c`, `src/mpc.c` | none active | absent | subsystem missing | Replace absence with direct port | Add minor-planet ingestion + runtime module + rendering path |
| comets | `src/modules/comets.c` | none active | absent | subsystem missing | Replace absence with direct port | Add comet ingestion + runtime module + rendering path |
| meteors | `src/modules/meteors.c` | none active | absent | subsystem missing | Replace absence with direct port | Add meteor subsystem and rendering behavior |
| DSS / survey background | `src/modules/dss.c` | `BackgroundRuntimeModule.ts` (no DSS parity path) | heuristic | procedural background substitute, no DSS behavior | Keep background module ownership; replace DSS behavior path | Port DSS layer behavior and gating from `dss.c` |

## Top 15 Fake Local Behaviors To Remove
1. `runtimeFrame.ts:getPlanetMarkerRadiusPx` FOV smoothstep point-to-disk blend; replace with `planets.c:planet_render` transition. Status: removed in Port Block 1.
2. `PlanetRenderer.ts` local diameter/alpha boost shaping (`2.08`, `+0.9`, `pointToDiscBlend`); replace with Stellarium model/point outputs. Status: removed in Port Block 1.
3. `ObjectRuntimeModule.ts` + `directObjectLayer.ts` moon generic path; replace with moon handling in planet chain per `planets.c`. Status: removed in Port Block 1.
4. `runtimeFrame.ts:getObjectHorizonFade` unconditional return `1`; replace with Stellarium visibility/occlusion behavior.
5. `runtimeFrame.ts:resolveViewTier` hard label caps (`6/8/10`); replace with limiting-magnitude-driven hint policy.
6. `labelManager.ts` fixed max visible labels and local ranking constants; replace with `labels.c` + class hint limits.
7. `sceneAssembler.ts` fallback magnitude label rule (`mag > 2.5` style shortcut); replace with source hint gating.
8. `SkyEngineScene.tsx:loadSkyRuntimeTiles` active mock fallback branch; replace with authoritative source path and explicit failure. Status: removed in Port Block 2.
9. `runtimeMode.ts` query-param mock mode in parity path; replace with single authoritative runtime behavior. Status: removed in Port Block 2.
10. `backendTileRegistry.ts` ID-prefix lookup heuristics; replace with deterministic survey mapping. Status: removed in Port Block 2.
11. `astronomy.ts` fixed 4-item DSO seed catalog; replace with `dso.c` data/behavior path.
12. `astronomy.ts:computeSatelliteSceneObjects` top-3 truncation; replace with Stellarium visibility policy.
13. `astronomy.ts:computeSatelliteSceneObjects` placeholder `magnitude: 99`; replace with Stellarium-style photometric behavior.
14. `astronomy.ts:computeGuidanceScore` local score curves; remove from strict parity behavior chain.
15. `MilkyWayModule.ts` procedural sample clouds; replace with `milkyway.c` behavior.

## Corrected Remaining Port Order
1. Star LOD + survey sequencing parity.
2. DSO data-depth parity.
3. Hints/labels limiting-magnitude parity.
4. Constellations + skyculture behavior coupling parity.
5. Overlay/grid deterministic behavior parity.
6. Atmosphere + landscape + Milky Way parity.
7. Pointer/selection parity.
8. Object inspector/detail parity.
9. Missing subsystems: satellites full parity, minor planets, comets, meteors, DSS.

## Biggest Missing Behavior
- Deep-zoom star density is still capped by the current shipped authoritative file-backed survey assets, but the local level-3 tile clamp and tier-admission clamp are no longer the cause.

## Recommended Next Bounded Slice
- Add the next real file-backed survey asset pack beyond the current Hipparcos ceiling and revalidate deep-zoom density against Stellarium before moving on to hints/labels parity.

## Port Block 1 (Executed)
### Planet Zoom Chain Parity

Stellarium authority files:
- `src/core.c`
- `src/tonemapper.c`
- `src/navigation.c`
- `src/modules/planets.c`

Astronomy Hub target files:
- `frontend/src/features/sky-engine/engine/sky/runtime/modules/runtimeFrame.ts`
- `frontend/src/features/sky-engine/PlanetRenderer.ts`
- `frontend/src/features/sky-engine/engine/sky/runtime/modules/ObjectRuntimeModule.ts`
- `frontend/src/features/sky-engine/directObjectLayer.ts`
- `frontend/src/features/sky-engine/astronomy.ts`
- `frontend/src/features/sky-engine/observerNavigation.ts`

Stellarium to AH function mapping (this block):
1. `core_get_point_for_mag_` -> replace local unresolved-point math in planet marker sizing.
2. `core_get_point_for_mag` -> replace local unresolved point size/luminance for planets/moon.
3. `core_get_apparent_angle_for_point` -> replace local disk-threshold surrogates.
4. `compute_vmag_for_radius` -> align limiting-magnitude/radius breakpoints.
5. `planet_render` -> authoritative point-to-disk transition and render gate behavior.
6. `get_artificial_scale` / `scale_moon` -> moon zoom-out scaling behavior.
7. `vmag > stars_limit_mag` with moon exception -> non-star visibility gate.
8. `core_update_fov` -> FOV semantics feeding transition logic.

Explicit local logic deleted in this block:
- `runtimeFrame.ts` planet marker smoothstep/mix blend chain (`zoomDiscBlend`, `geometricDiscBlend`, `discBlend`, `discMagnitudeBoostPx`, `zoomDiscScale`, final `mix(...)`).
- `PlanetRenderer.ts` local `pointToDiscBlend`-driven alpha/diameter shaping and synthetic diameter boost constants.
- moon primary rendering in generic object path (`directObjectLayer.ts` + runtime partition flow now routes moon with planets).
- fixed FOV threshold-based point-to-disk switch logic in planet marker path.

Pass/fail parity checkpoints (current status):
1. Jupiter wide-FOV dominance: `PENDING LIVE STELLARIUM CHECK`
2. Smooth zoom growth: `PASS (local runtime/tests)`, `PENDING LIVE STELLARIUM CHECK`
3. Moon visibility/separation behavior: `PASS (unit tests + chain routing)`, `PENDING LIVE STELLARIUM CHECK`
4. Correct point-to-disk transition threshold: `PENDING LIVE STELLARIUM CHECK`
5. No zoom disappearance except Stellarium visibility gating: `PASS (non-moon limiting-mag gate + moon exception in runtime path)`, `PENDING LIVE STELLARIUM CHECK`

Validation evidence recorded for this block:
- `npm run typecheck` (frontend): pass
- `npm run build` (frontend): pass
- `npm run test -- test_planet_ephemeris_fidelity.test.js sky-engine-runtime-frame-projection.test.js test_observer_navigation.test.js`: pass

## Port Block 2 (Executed)
### Star LOD + Survey Sequencing Parity

Stellarium authority files:
- `src/modules/stars.c`
- `src/core.c`

Astronomy Hub target files:
- `frontend/src/features/sky-engine/engine/sky/runtime/modules/StarsModule.ts`
- `frontend/src/features/sky-engine/engine/sky/runtime/modules/runtimeFrame.ts`
- `frontend/src/features/sky-engine/starRenderer.ts`
- `frontend/src/features/sky-engine/directStarLayer.ts`
- `frontend/src/features/sky-engine/engine/sky/adapters/fileTileRepository.ts`
- `frontend/src/features/sky-engine/backendTileRegistry.ts`
- `frontend/src/features/sky-engine/engine/sky/runtimeMode.ts`
- `frontend/src/features/sky-engine/SkyEngineScene.tsx`
- `frontend/src/features/sky-engine/engine/sky/services/sceneAssembler.ts`

Stellarium to AH function mapping (this block):
1. `core_get_point_for_mag_` -> unresolved point radius now stays in the core point chain in `starRenderer.ts` with no extra active-runtime size curve layered on top.
2. `core_get_point_for_mag` -> active star admission now depends on the Stellarium-equivalent point visibility result instead of local star profile boosting.
3. `compute_vmag_for_radius` -> active limiting-magnitude behavior continues to drive scene-packet selection and runtime early break at the point-threshold boundary.
4. `core_get_apparent_angle_for_point` -> retained as the authoritative point/disk bridge in `runtimeFrame.ts`; no separate local star disk curve remains in the active path.
5. `stars.c` sorted traversal + early break -> active star traversal now walks the file-backed scene packet sorted by magnitude and stops when the limiting magnitude is exceeded.
6. `stars_add_data_source` / survey ordering -> active file-backed surveys are now selected deterministically by magnitude range ordering with no mock runtime branch.

Explicit local logic deleted in this block:
- `runtimeFrame.ts` selected-star admission override beyond the Stellarium point gate.
- `runtimeFrame.ts` active star traversal over merged local object lists instead of the authoritative scene packet.
- `directStarLayer.ts` twinkle, emphasis scaling, and PSF inflation as the active point-size source.
- `SkyEngineScene.tsx` mock fallback in `loadSkyRuntimeTiles`.
- `runtimeMode.ts` query-param mock runtime selection in the active parity path.
- `backendTileRegistry.ts` ID-prefix (`hip-`) survey routing heuristic.

Checkpoint evidence recorded for this block:
- `120°`: limiting magnitude `5.78125`; visible stars `3165`; brightest point radius `6.5937 px`; density per sr `1007.45`; max survey depth `1`.
- `60°`: limiting magnitude `6.765625`; visible stars `3604`; brightest point radius `8.0920 px`; density per sr `4281.37`; max survey depth `1`.
- `30°`: limiting magnitude `8.28125`; visible stars `6822`; brightest point radius `10.1474 px`; density per sr `31864.46`; max survey depth `2`.
- `10°`: limiting magnitude `10.65625`; visible stars `1337`; brightest point radius `10.8294 px`; density per sr `55919.39`; max survey depth `3`.
- `2°`: limiting magnitude `14.21875`; visible stars `1070`; brightest point radius `14.6745 px`; density per sr `1118124.58`; max survey depth `3`.

Validation evidence recorded for this block:
- `npm run typecheck` (frontend): pass
- `npm run build` (frontend): pass
- `npm run test -- sky-engine-runtime-frame-projection.test.js test_file_backed_tile_repository.test.js test_sky_backend_tile_manifest.test.js test_sky_engine_scene_ownership.test.js`: pass

## Port Block 3 (Executed)
### Survey Depth Expansion

Stellarium authority files:
- `src/modules/stars.c`

Astronomy Hub target files:
- `frontend/src/features/sky-engine/engine/sky/core/tileIndex.ts`
- `frontend/src/features/sky-engine/engine/sky/core/tileSelection.ts`
- `frontend/src/features/sky-engine/engine/sky/index.ts`
- `frontend/src/features/sky-engine/engine/sky/services/sceneAssembler.ts`
- `frontend/src/features/sky-engine/engine/sky/contracts/stars.ts`
- `frontend/src/features/sky-engine/engine/sky/contracts/tiles.ts`
- `frontend/src/features/sky-engine/engine/sky/core/magnitudePolicy.ts`
- `frontend/src/features/sky-engine/engine/sky/core/tierPolicy.ts`
- `frontend/src/features/sky-engine/engine/sky/adapters/fileTileRepository.ts`
- `frontend/src/features/sky-engine/SkyEngineScene.tsx`

Stellarium to AH function mapping (this block):
1. `stars_render` + `hips_iter_push_children` -> runtime tile selection no longer assumes a fixed baked-in maximum depth and can rebuild the visible tile query against the repository-advertised manifest depth.
2. survey traversal ordered by visible magnitude -> scene assembly now keeps any star admitted by the limiting-magnitude chain even when its tier label extends past the legacy `T0`-`T3` ladder.
3. survey metadata-driven traversal -> active query generation now carries manifest-aware tile depth instead of hard-wiring a level-3 ceiling into the quadtree plumbing.

Explicit local logic deleted in this block:
- fixed `SKY_TILE_MAX_LEVEL = 3` traversal ceiling as the only tile-index model.
- scene-packet star admission gated by `query.activeTiers` rather than the actual limiting-magnitude result.
- fixed literal `T0 | T1 | T2 | T3` runtime-tier type boundary in the active scene path.
- single-pass tile loading that could not rebuild against a deeper repository manifest.

Checkpoint evidence recorded for this block:
- `120°`: limiting magnitude `5.78125`; visible stars `3165`; brightest point radius `5.4947 px`; density per sr `1007.45`; max survey depth `1`; active tiers `T0,T1`.
- `60°`: limiting magnitude `6.765625`; visible stars `3604`; brightest point radius `6.7433 px`; density per sr `4281.37`; max survey depth `1`; active tiers `T0,T1,T2`.
- `30°`: limiting magnitude `8.28125`; visible stars `6822`; brightest point radius `8.4562 px`; density per sr `31864.46`; max survey depth `2`; active tiers `T0,T1,T2`.
- `10°`: limiting magnitude `10.65625`; visible stars `1337`; brightest point radius `9.0245 px`; density per sr `55919.39`; max survey depth `3`; active tiers `T0,T1,T2`.
- `2°`: limiting magnitude `14.21875`; visible stars `1070`; brightest point radius `12.2287 px`; density per sr `1118124.58`; max survey depth `3`; active tiers `T0,T1,T2`.

Interpretation:
- Density still rises correctly as the field narrows.
- The remaining deep-zoom plateau is now attributable to the current shipped asset pack, not the local tile-selection or tier-gating chain.

Validation evidence recorded for this block:
- `npm run typecheck` (frontend): pass
- `npm run build` (frontend): pass
- `npm run test -- test_sky_engine_runtime_slice.test.js test_file_backed_tile_repository.test.js sky-engine-runtime-frame-projection.test.js test_sky_engine_scene_ownership.test.js`: pass
- `node <<'NODE' ... NODE` checkpoint script over `frontend/public/sky-engine-assets/catalog/hipparcos/**`: pass

## Evidence Rule
- Do not upgrade parity status by naming similarity.
- Do not count unwired/dormant files.
- Do not claim parity without active runtime verification.
