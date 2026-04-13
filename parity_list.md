# Astronomy Hub vs Stellarium Web Engine - Strict Parity Tracker

Last updated: 2026-04-13 (Planet Zoom Chain block implemented; runtime tests/build pass; live Stellarium visual checkpoints still pending)

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
| stars | `src/modules/stars.c`, `src/core.c` | `StarsModule.ts`, `runtimeFrame.ts`, `directStarLayer.ts`, `starRenderer.ts` | strong partial port | residual local profile shaping and clamp policy divergence | Keep survey-driven traversal and projection; replace remaining local profile shaping | Route all star point size/visibility through strict core point model |
| star surveys / sequencing | `src/modules/stars.c`, survey/hips paths | `engine/sky/adapters/fileTileRepository.ts`, `sceneAssembler.ts`, `SkyEngineScene.tsx`, `backendTileRegistry.ts` | partial port | mock fallback and lookup heuristics still affect active flow | Keep multi-survey loader; replace fallback/heuristic routing; delete mock fallback in active parity path | Lock runtime to authoritative file-backed survey path and remove heuristic lookup branches |
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
8. `SkyEngineScene.tsx:loadSkyRuntimeTiles` active mock fallback branch; replace with authoritative source path and explicit failure.
9. `runtimeMode.ts` query-param mock mode in parity path; replace with single authoritative runtime behavior.
10. `backendTileRegistry.ts` ID-prefix lookup heuristics; replace with deterministic survey mapping.
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
- Star zoom behavior and survey depth sequencing remain the highest-impact visible mismatch after the planet zoom-chain port.

## Recommended Next Bounded Slice
- Port Stellarium star point-size/visibility/LOD chain (`modules/stars.c` + `core_get_point_for_mag*`) into the active AH star runtime path (`StarsModule.ts`, `runtimeFrame.ts`, `starRenderer.ts`) and remove residual local star profile shaping.

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

## Evidence Rule
- Do not upgrade parity status by naming similarity.
- Do not count unwired/dormant files.
- Do not claim parity without active runtime verification.
