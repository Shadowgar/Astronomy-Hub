# Astronomy Hub vs Stellarium Web Engine - Strict Parity Tracker

Last updated: 2026-04-17 (Port Block 8 repaired frontend scene routing to `/api/v1/scene`, added multi-survey packet promotion fallback, switched DSO to file-backed catalog ingestion, and removed satellite placeholder/truncation defaults; frontend tests/typecheck/build pass, but live parity against Stellarium is still partial for dense stars/DSO/DSS/satellites)

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
| core / tonemapper / skybrightness | `src/core.c`, `src/tonemapper.c`, `src/skybrightness.c`, `src/navigation.c` | `skyBrightness.ts`, `starRenderer.ts`, `engine/sky/core/stellariumVisualMath.ts`, `engine/sky/runtime/luminanceReport.ts`, `SkyBrightnessExposureModule.ts`, `observerNavigation.ts` | strong partial port | navigation easing and some runtime presentation policy remain local; core point/luminance/adaptation chain now routes through shared Stellarium math | Keep shared physical input chain; replace remaining non-source presentation policy; delete any duplicated math that reappears | Validate runtime visuals against live Stellarium at wide FOV and close any remaining adaptation/background deltas |
| stars | `src/modules/stars.c`, `src/core.c` | `StarsModule.ts`, `runtimeFrame.ts`, `directStarLayer.ts`, `starRenderer.ts` | near parity | deepest zoom is now bounded by the currently shipped authoritative asset pack rather than a local tile/tier gate | Keep strict scene-packet traversal and core point chain; replace remaining deep-zoom data ceiling only | Add the next real survey asset layer and revalidate live Stellarium density at deep zoom |
| star surveys / sequencing | `src/modules/stars.c`, `src/eph-file.c`, `src/eph-file.h`, `src/algos/healpix.c`, `src/hips.c` | `engine/sky/adapters/fileTileRepository.ts`, `engine/sky/adapters/ephCodec.ts`, `engine/sky/adapters/healpix.ts`, `sceneAssembler.ts`, `SkyEngineScene.tsx`, `sceneQueryState.ts`, `backendTileRegistry.ts`, `engine/sky/core/tileIndex.ts`, `engine/sky/core/tileSelection.ts` | strong partial port | multi-survey promotion fallback is now wired, but live deep-density still trails Stellarium with the current mirrored Gaia depth and unresolved observer/time synchronization controls | Keep ordered file-backed sequencing, real Gaia ingestion, and promotion fallback; replace remaining deep-density and runtime parity controls | Verify night-time synchronized observer/time checkpoints and expand survey depth where assets are currently capped |
| hints / label limiting magnitude | `src/core.c`, `src/modules/labels.c`, `src/modules/stars.c`, `src/modules/planets.c` | `labelManager.ts`, `directOverlayLayer.ts`, `runtimeFrame.ts` | heuristic | fixed label caps and local admissions instead of `hints_limit_mag` chain | Keep overlap/layout mechanics; replace admission rules; delete fixed caps | Port hint limiting-magnitude eligibility from Stellarium modules |
| planets | `src/modules/planets.c`, `src/core.c`, `src/navigation.c`, `src/tonemapper.c` | `astronomy.ts`, `runtimeFrame.ts`, `PlanetRenderer.ts`, `PlanetRuntimeModule.ts` | strong partial port | live Stellarium side-by-side threshold parity still unproven; horizon fade bypass still active globally | Keep ephemeris object feed; replace remaining non-source visibility/presentation paths | Validate/align any remaining `planet_render` threshold deltas against live Stellarium checkpoints |
| planet zoom chain | `src/modules/planets.c` (`planet_render`, `get_artificial_scale`), `src/core.c` (`core_get_point_for_mag*`, `core_get_apparent_angle_for_point`), `src/navigation.c` | `runtimeFrame.ts`, `PlanetRenderer.ts`, `ObjectRuntimeModule.ts`, `directObjectLayer.ts`, `observerNavigation.ts` | partial port | no live side-by-side confirmation yet; additional tonemapper parity validation still needed | Keep single transition chain now in runtime frame; replace residual non-source alpha/visibility behavior if discovered | Run explicit Jupiter+Moon checkpoint validation against live Stellarium and close residual deltas |
| moons | `src/modules/planets.c` (moon exception + scale behavior) | `astronomy.ts`, `ObjectRuntimeModule.ts`, `directObjectLayer.ts`, `PlanetRenderer.ts` | partial port | moon exception uses type gate but full Stellarium moon branch nuances may still differ | Keep moon in planet chain and artificial scaling port; replace any remaining generic-marker semantics | Validate moon separation/scale checkpoints and adjust to exact `get_artificial_scale` behavior |
| DSO | `src/modules/dso.c` | `astronomy.ts`, `engine/sky/adapters/dsoRepository.ts`, `SkyEngineScene.tsx`, `DsoRuntimeModule.ts`, `DsoRenderer.ts`, `dsoVisuals.ts`, `public/sky-engine-assets/catalog/dso/catalog.json` | partial port | no HiPS/EPH DSO tile ingestion yet; catalog coverage remains minimal | Keep dedicated DSO render lane and file-backed ingestion; replace remaining bounded catalog with Stellarium-equivalent survey feed | Port DSO tile-source loading/gating semantics from `dso.c` and replace bounded catalog with true survey-backed depth |
| labels | `src/modules/labels.c` | `labelManager.ts`, `directOverlayLayer.ts` | heuristic | local priority and cap policies | Keep layout/collision implementation; replace class visibility rules | Port Stellarium label policy and class offsets |
| constellations | `src/modules/constellations.c` | `constellations.ts`, `directOverlayLayer.ts` | strong partial port | local presentation policy not fully source-equivalent | Keep culture-driven geometry flow; replace policy differences | Port constellation visibility/policy coupling from Stellarium module behavior |
| skycultures | `src/skyculture.c`, `src/modules/skycultures.c` | `skycultures/**`, `constellations.ts`, `SkyEngineScene.tsx` | strong partial port | runtime coupling rules still simplified | Keep data loading and switching foundation; replace behavior coupling | Align culture activation/fallback behavior to Stellarium flow |
| overlays / grids | `src/modules/coordinates.c`, `src/modules/labels.c` | `OverlayRuntimeModule.ts`, `directOverlayLayer.ts` | heuristic | cadence throttling thresholds govern relayout timing | Keep overlay pipeline; replace cadence heuristics with deterministic invalidation | Remove fixed relayout thresholds and use projection/state driven updates |
| atmosphere | `src/modules/atmosphere.c`, `src/skybrightness.c` | `AtmosphereModule.ts`, `directBackgroundLayer.ts`, `SkyBrightnessExposureModule.ts` | strong partial port | direct background tinting is still local, but atmosphere adaptation now follows shared tonemapper target state instead of the older contrast/boost chain | Keep module ownership and frame sync; replace residual tint/shading policy only where checkpoint evidence demands it | Run explicit wide-FOV sky brightness checkpoints against live Stellarium and reconcile any remaining background tone differences |
| landscape | `src/modules/landscape.c` | `LandscapeModule.ts`, `directBackgroundLayer.ts` | heuristic | procedural horizon/ground shading substitute | Keep landscape module ownership; replace procedural shading behavior | Port Stellarium landscape + occlusion behavior |
| Milky Way | `src/modules/milkyway.c` | `MilkyWayModule.ts`, `directBackgroundLayer.ts` | heuristic | procedural Milky Way sampling | Delete procedural synthesis; replace with source-defined behavior | Port Milky Way intensity/shape behavior from Stellarium module |
| pointer / selection | `src/modules/pointer.c`, selection paths in core | `SkyNavigationService.ts`, `pickTargets.ts`, selection rings in direct layers | partial port | local pick radius and pointer visuals differ; `PointerRenderer.ts` unwired | Keep selection ownership and routing; replace pointer behavior | Port pointer marker and selection behavior from Stellarium pointer module |
| object inspector / detail surface | object info paths (`obj_info` and per-module `get_info`) | `SkyEngineDetailShell.tsx` | heuristic | explicit temporary/deferred truth placeholders | Keep shell surface; replace content contracts | Port object-type info adapters mirroring Stellarium info fields |
| satellites | `src/modules/satellites.c` | `astronomy.ts`, `SatelliteRuntimeModule.ts`, `SatelliteRenderer.ts` | strong partial port | backend contract still lacks full Stellarium satellite lifecycle and shadow/phase photometry; horizon-only visible slice still provider-gated | Keep backend-fed integration boundary and full visible-set rendering; replace remaining lifecycle/photometry deltas | Port Stellarium shadow/illumination magnitude path and visibility iteration strategy on top of complete satellite feed |
| minor planets | `src/modules/minorplanets.c`, `src/mpc.c` | none active | absent | subsystem missing | Replace absence with direct port | Add minor-planet ingestion + runtime module + rendering path |
| comets | `src/modules/comets.c` | none active | absent | subsystem missing | Replace absence with direct port | Add comet ingestion + runtime module + rendering path |
| meteors | `src/modules/meteors.c` | none active | absent | subsystem missing | Replace absence with direct port | Add meteor subsystem and rendering behavior |
| DSS / survey background | `src/modules/dss.c` | `BackgroundRuntimeModule.ts`, `engine/sky/adapters/dssRepository.ts`, `public/sky-engine-assets/catalog/dss/manifest.json` | heuristic | current manifest is patch/gradient metadata only; no HiPS-backed DSS tile rendering path yet | Keep background module ownership and DSS gating chain; replace patch-only rendering path | Port `hips_render`-style DSS tile path (split/render order, adaptation gating, and concrete survey tile loading) |

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
- The live runtime still does not promote from the stale Hipparcos packet to a resolved multi-survey packet after Gaia tile loading begins, so exact Gaia-backed density parity cannot yet be proven side-by-side against Stellarium.

## Recommended Next Bounded Slice
- Trace the unresolved live scene-packet handoff after Gaia requests begin, make the multi-survey packet win once the local Gaia load resolves, then re-run live Stellarium deep-zoom checkpoints before moving on to hints/labels parity.

## Port Block 8 (Executed, partial parity)
### Runtime Route Repair + Star/DSO/Satellite Corrective Pass

Stellarium authority files:
- `src/modules/stars.c`
- `src/eph-file.c`
- `src/eph-file.h`
- `src/algos/healpix.c`
- `src/hips.c`
- `src/modules/dso.c`
- `src/modules/satellites.c`

Astronomy Hub target files:
- `frontend/src/features/scene/queries.ts`
- `frontend/src/pages/SkyEnginePage.tsx`
- `frontend/src/features/sky-engine/sceneQueryState.ts`
- `frontend/src/features/sky-engine/astronomy.ts`
- `frontend/src/features/sky-engine/SkyEngineScene.tsx`
- `frontend/src/features/sky-engine/engine/sky/adapters/dsoRepository.ts`
- `frontend/public/sky-engine-assets/catalog/dso/catalog.json`
- `frontend/tests/test_satellite_runtime_activation.test.js`

Explicit local logic deleted/replaced in this block:
1. frontend scene-route drift to `/scene` (stalled runtime readiness) replaced with `/api/v1/scene` authority routing.
2. stale-only query matching for scene packet adoption replaced with multi-survey promotion fallback in `sceneQueryState.ts`.
3. hardcoded in-file DSO seed usage replaced with file-backed DSO catalog ingestion path.
4. satellite placeholder `magnitude: 99` replaced with nominal fallback magnitude `7`.
5. default satellite truncation branch removed (full visible list now rendered unless an explicit caller-provided cap is passed).
6. sky scene query now accepts explicit `lat/lon/elevation_ft/at` URL params so parity checks can run with synchronized observer/time inputs.
7. fixed query wiring so sky-scene ownership request actually forwards those URL overrides to `/api/v1/scene`.

Validation evidence recorded for this block:
- `cd /home/rocco/Astronomy-Hub/frontend && npm run test -- test_satellite_runtime_activation.test.js test_sky_engine_astronomy.test.js test_scene_query_state.test.js`: pass
- `cd /home/rocco/Astronomy-Hub/frontend && npm run test -- test_satellite_runtime_activation.test.js test_scene_query_state.test.js`: pass
- `cd /home/rocco/Astronomy-Hub/frontend && npm run typecheck`: pass
- `cd /home/rocco/Astronomy-Hub/frontend && npm run build`: pass
- `cd /home/rocco/Astronomy-Hub && curl -sS "http://127.0.0.1:8000/api/v1/scene?scope=sky&engine=sky_engine"` contract probe: pass
- `cd /home/rocco/Astronomy-Hub && node <playwright parity capture>` wrote `.cursor-artifacts/parity-compare/port-mode-validation.json` plus side-by-side screenshots.
- `cd /home/rocco/Astronomy-Hub && node <playwright synced parity capture with lat/lon/at>` wrote `.cursor-artifacts/parity-compare/port-mode-validation-synced.json`.
- `cd /home/rocco/Astronomy-Hub && node <playwright synced night capture>` wrote `.cursor-artifacts/parity-compare/port-mode-validation-synced-night.json` and validated request forwarding (`/api/v1/scene?...&lat=...&lon=...&elevation_ft=...&at=...`).

Live parity evidence snapshot (current partial state):
- Hub wide: `FOV 120°`, rendered stars `1`, projected satellites `0`, projected DSO `0`.
- Hub medium: `FOV 30.6°`, rendered stars `0`, projected satellites `0`, projected DSO `0`.
- Hub deep: `FOV 0.8°`, rendered stars `0`, projected satellites `0`, projected DSO `0`.
- Stellarium reference: `FOV 120°`, observer `SEVILLA`, timestamp `2026-04-17 16:10:00`.

Interpretation:
- Runtime routing blocker is fixed, and star/DSO/satellite paths are now source-aligned structurally.
- Behavioral parity is still incomplete: observer/time synchronization, deeper survey richness, DSS HiPS tile rendering, and full Stellarium satellite photometry/visibility iteration remain open.

## Port Block 7 (Executed, not yet complete)
### Wide-FOV Star Admission + Multi-Survey Activation Parity

Stellarium authority files:
- `src/core.c`
- `src/modules/stars.c`
- related HiPS survey registration behavior under `src/hips.c`

Astronomy Hub target files:
- `frontend/src/features/sky-engine/engine/sky/adapters/fileTileRepository.ts`
- `frontend/src/features/sky-engine/engine/sky/runtime/modules/runtimeFrame.ts`
- `frontend/src/features/sky-engine/engine/sky/runtime/modules/SceneReportingModule.ts`
- `frontend/tests/test_file_backed_tile_repository.test.js`
- `frontend/tests/test_close_fov_star_counts.test.js`

Explicit local logic deleted in this block:
1. non-source supplemental Hipparcos survey activation from `6.0` to `8.5` inside the active multi-survey repository.
2. permanent cache poisoning after transient Gaia tile fetch failures.
3. unthrottled Gaia remote tile fan-out that made browser-side resource failure easier to trigger.

Live checkpoint evidence:
1. startup daytime wide view: `dataMode = hipparcos`, `sourceLabel = Hipparcos · 8,870 stars`, `0 rendered stars`, limiting magnitude below daytime visibility floor.
2. night wide view after fix: `120°`, `dataMode = hipparcos`, `sourceLabel = Hipparcos · 8,870 stars`, `488 rendered stars`, limiting magnitude `4.671875`.
3. night medium view after fix: `35.0°`, `dataMode = hipparcos`, `sourceLabel = Hipparcos · 8,870 stars`, `254 rendered stars`, limiting magnitude `7.9375`, Gaia resource entries `46`.
4. night close view after fix: `18.9°`, `dataMode = hipparcos`, `sourceLabel = Hipparcos · 8,870 stars`, `106 rendered stars`, limiting magnitude `9.28125`, Gaia resource entries still `46`.

Interpretation:
- The Stellarium-backed Gaia handoff threshold is now active because Gaia requests begin once the Hipparcos ceiling is crossed.
- The browser no longer reports the earlier cached failure collapse, but the live scene packet still does not flip to `multi-survey` after Gaia loading begins.
- The remaining blocker is now the unresolved live handoff from Gaia tile loading to resolved scene-packet adoption, not the old survey activation ceiling.

Validation evidence recorded for this block:
- `cd /home/rocco/Astronomy-Hub && docker compose exec frontend npm run test -- tests/test_scene_query_state.test.js tests/test_file_backed_tile_repository.test.js tests/test_close_fov_star_counts.test.js`: pass
- `cd /home/rocco/Astronomy-Hub && docker compose exec frontend npm run typecheck`: pass
- `cd /home/rocco/Astronomy-Hub && docker compose exec frontend npm run build`: pass

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

## Port Block 4 (Executed)
### Multi-Survey Ingestion (Gaia / HiPS)

Stellarium authority files:
- `src/modules/stars.c`
- `src/eph-file.c`
- `src/eph-file.h`
- `src/algos/healpix.c`
- `src/hips.c`

Astronomy Hub target files:
- `frontend/src/features/sky-engine/engine/sky/adapters/fileTileRepository.ts`
- `frontend/src/features/sky-engine/engine/sky/adapters/ephCodec.ts`
- `frontend/src/features/sky-engine/engine/sky/adapters/healpix.ts`
- `frontend/src/features/sky-engine/engine/sky/contracts/stars.ts`
- `frontend/src/features/sky-engine/engine/sky/contracts/tiles.ts`
- `frontend/src/features/sky-engine/engine/sky/diagnostics/skyDiagnostics.ts`
- `frontend/src/features/sky-engine/engine/sky/services/sceneAssembler.ts`
- `frontend/src/features/sky-engine/SkyEngineScene.tsx`
- `frontend/src/features/sky-engine/SkyEngineDetailShell.tsx`
- `frontend/src/features/sky-engine/SkyEngineSnapshotStore.ts`
- `frontend/src/features/sky-engine/directOverlayLayer.ts`
- `frontend/src/features/sky-engine/engine/sky/runtime/modules/runtimeFrame.ts`
- `frontend/src/features/sky-engine/pickTargets.ts`
- `frontend/src/features/sky-engine/types.ts`
- `frontend/src/pages/SkyEnginePage.tsx`
- `frontend/vite.config.mjs`
- `frontend/nginx.conf`
- `frontend/tests/test_eph_codec.test.js`

Stellarium to AH function mapping (this block):
1. `stars_add_data_source` and ordered survey traversal in `stars.c` -> the file-backed repository now stages ordered bright-to-deep surveys, preserving local Hipparcos assets and adding Gaia HiPS only when the limiting magnitude crosses the brightest prior survey ceiling.
2. `hips.c` survey path conventions -> Gaia survey metadata and tile payloads are loaded through canonical HiPS `properties` and `Norder*/Dir*/Npix*.eph` paths.
3. `eph-file.c` / `eph-file.h` tile decoding -> `.eph` star tiles are now decoded in AH runtime code with integer-style NUNIQ order derivation, column-table decoding, deflate inflation, and unit conversion.
4. `healpix.c` addressing helpers -> the runtime now maps local tile bounds into HiPS pixel requests through minimal nested HEALPix helpers.
5. survey-backed runtime truth -> scene objects and diagnostics now describe catalog-backed tiles rather than a Hipparcos-only runtime.

Explicit local logic deleted in this block:
- Hipparcos-only repository sequencing as the only active parity path.
- Hipparcos-only runtime/source labels in the scene, detail shell, overlay routing, and pick/runtime source handling.
- Local assumption that star survey mode can only report `mock` or `hipparcos` once the repository is active.
- Implicit runtime dependence on Stellarium-hosted Gaia tiles; replaced by a local mirrored Gaia asset root plus explicit mirror metadata.

Implementation evidence recorded for this block:
- Verified real Gaia survey source: `https://data.stellarium.org/surveys/gaia/properties`
- Observed Gaia HiPS metadata: `hips_order_min = 3`, `hips_release_date = 2018-08-28T08:10Z`, `hips_tile_format = eph`
- Seeded local Gaia mirror: orders `3..5`, `16,088` mirrored tiles written under `frontend/public/sky-engine-assets/catalog/gaia/` with generated `mirror-manifest.json`

Validation evidence recorded for this block:
- `cd /home/rocco/Astronomy-Hub/frontend && npm run test -- test_file_backed_tile_repository.test.js test_sky_engine_runtime_slice.test.js test_eph_codec.test.js`: pass
- `cd /home/rocco/Astronomy-Hub/frontend && npm run typecheck`: pass
- `cd /home/rocco/Astronomy-Hub/frontend && npm run build`: pass

Residual proof gap:
- Live browser/runtime checkpoint evidence against Stellarium with Gaia active is still pending. This block establishes the real multi-survey ingestion path, but it does not yet prove exact deep-zoom density equivalence.

## Port Block 5 (Executed)
### Tonemapper + Sky Luminance Parity

Stellarium authority files:
- `src/tonemapper.c`
- `src/core.c`
- `src/skybrightness.c`
- `src/modules/stars.c`
- `src/modules/atmosphere.c`
- `src/modules/planets.c`

Astronomy Hub target files:
- `frontend/src/features/sky-engine/engine/sky/core/stellariumVisualMath.ts`
- `frontend/src/features/sky-engine/engine/sky/core/magnitudePolicy.ts`
- `frontend/src/features/sky-engine/starRenderer.ts`
- `frontend/src/features/sky-engine/engine/sky/runtime/luminanceReport.ts`
- `frontend/src/features/sky-engine/engine/sky/runtime/modules/SkyBrightnessExposureModule.ts`
- `frontend/src/features/sky-engine/directBackgroundLayer.ts`
- `frontend/src/features/sky-engine/engine/sky/runtime/modules/MilkyWayModule.ts`
- `frontend/tests/test_scene_luminance_report.test.js`
- `frontend/tests/test_tone_adaptation.test.js`
- `frontend/tests/test_atmosphere_fidelity.test.js`

Stellarium to AH function mapping (this block):
1. `tonemapper_map` -> shared `tonemapperMap` in `stellariumVisualMath.ts`, consumed by both limiting-magnitude and runtime star rendering paths.
2. `core_get_point_for_mag*` / `compute_vmag_for_radius` -> shared point radius, visibility, and limiting-magnitude logic used by `magnitudePolicy.ts` and `starRenderer.ts`.
3. `core_mag_to_illuminance` / `core_illuminance_to_lum_apparent` -> shared contributor math used by runtime luminance reporting.
4. `core_report_vmag_in_fov` -> solar-system luminance contributor path in `luminanceReport.ts`.
5. star aggregate report in `modules/stars.c` -> total visible-star illuminance aggregation and `pow(lum, 1/3) / 300` reporting path.
6. `core_update` adaptation behavior -> tonemapper target updates now distinguish fast atmosphere-style bright adaptation from logarithmic dark adaptation.

Explicit local logic deleted in this block:
- Duplicate local tonemapper and magnitude-to-point math in `starRenderer.ts`.
- Immediate brightening path in `SkyBrightnessExposureModule.ts` that bypassed the Stellarium `core_update` dark-adaptation behavior.
- Local star and solar-system contributor approximations in `luminanceReport.ts` that no longer used the shared core math.
- Background and Milky Way response chains that multiplied through the older runtime contrast stack instead of consuming luminance-driven runtime state directly.

Validation evidence recorded for this block:
- `cd /home/rocco/Astronomy-Hub/frontend && npm run test -- tests/test_tone_adaptation.test.js tests/test_scene_luminance_report.test.js tests/test_atmosphere_fidelity.test.js`: pass
- `cd /home/rocco/Astronomy-Hub/frontend && npm run typecheck`: pass
- `cd /home/rocco/Astronomy-Hub/frontend && npm run build`: pass

Residual proof gap:
- Live side-by-side visual checkpoint evidence is still pending for wide-FOV sky brightness, bright-star separation, and zoom-level contrast against Stellarium runtime output.

## Port Block 6 (Executed)
### Close-FOV Star Packet Collapse

Stellarium authority files:
- `src/modules/stars.c`
- `src/core.c`
- `src/hips.c`

Astronomy Hub target files:
- `frontend/src/features/sky-engine/SkyEngineScene.tsx`
- `frontend/src/features/sky-engine/sceneQueryState.ts`
- `frontend/tests/test_scene_query_state.test.js`
- `frontend/tests/test_close_fov_star_counts.test.js`

Blocking defect observed before fix:
- Wide live runtime view around `120°` reported hundreds of rendered stars.
- Close live runtime view around `5.5°` collapsed to `starCount = 0`, `starThinInstanceCount = 0`, `sceneLuminanceStarSampleCount = 0`.

Root cause:
1. `SkyEngineScene.tsx` rebuilt a new close-FOV query immediately from live camera state, but while the new tile load was still in flight it assembled the next frame from the current `runtimeTilesRef`, which could temporarily be unresolved for that query.
2. Hipparcos runtime mode still allowed query limiting magnitude to reach `8.5`, and `fileTileRepository.ts` treats `limitingMagnitude >= 8.5` as permission to enter the Gaia branch. In practice this pushed close-FOV Hipparcos checkpoints onto the deeper Gaia load path even though the active runtime mode was locked to Hipparcos.

Fix implemented:
1. Added `sceneQueryState.ts` to centralize query-state decisions.
2. Capped Hipparcos-mode query limiting magnitude to `8.499` so close-FOV Hipparcos runtime never crosses the Gaia activation boundary.
3. Preserved the last resolved `scenePacket` until matching tiles for the newly requested query signature have actually loaded, preventing empty transitional packets during close-FOV query churn.
4. Added regression coverage for both the Hipparcos query cap and the non-empty fixed-FOV packet path through `5°`.

Docker validation evidence recorded for this block:
- `cd /home/rocco/Astronomy-Hub && docker compose build frontend`: pass
- `cd /home/rocco/Astronomy-Hub && docker compose run --rm frontend npm run test -- tests/test_scene_query_state.test.js tests/test_tone_adaptation.test.js tests/test_scene_luminance_report.test.js tests/test_atmosphere_fidelity.test.js`: pass
- `cd /home/rocco/Astronomy-Hub && docker compose run --rm frontend npm run test -- tests/test_close_fov_star_counts.test.js`: pass
- `cd /home/rocco/Astronomy-Hub && docker compose run --rm frontend npm run typecheck`: pass
- `cd /home/rocco/Astronomy-Hub && docker compose run --rm frontend npm run build`: pass

Fixed-FOV query-stage evidence recorded for this block (Vega-centered, Docker):
- `120°`: limiting magnitude `6.578`; visible tiles `12`; repository tiles `12`; tile stars `52,592`; assembled stars `7,754`
- `60°`: limiting magnitude `7.578`; visible tiles `17`; repository tiles `17`; tile stars `16,164`; assembled stars `6,691`
- `20°`: limiting magnitude `8.499`; visible tiles `5`; repository tiles `5`; tile stars `4,871`; assembled stars `4,551`
- `5°`: limiting magnitude `8.499`; visible tiles `4`; repository tiles `4`; tile stars `4,185`; assembled stars `3,908`

Interpretation:
- The blocking defect is fixed: close-FOV Hipparcos queries no longer collapse to an empty star packet, and the packet remains populated through `5°`.
- Absolute star count decreases with narrower framing in this Vega-centered checkpoint because sky area shrinks, but the engine no longer exhibits the invalid zero-star collapse that blocked parity work.

## Evidence Rule
- Do not upgrade parity status by naming similarity.
- Do not count unwired/dormant files.
- Do not claim parity without active runtime verification.
