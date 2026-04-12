# Astronomy Hub vs Stellarium Web Engine - Subsystem Parity List

Last updated: 2026-04-12
Authority sources:
- Stellarium study source: `/home/rocco/Astronomy-Hub/study/stellarium-web-engine/source/stellarium-web-engine-master/src/modules/*.c`
- Astronomy Hub local source: `/home/rocco/Astronomy-Hub/frontend/src/features/sky-engine/**`

Purpose:
- This is a working parity tracker for AI coders.
- Update this file after each bounded subsystem slice.
- Status must reflect active code reality, not intent.
- Active runtime wiring counts more than standalone experimental files.

## Status Legend
- `not started`
- `stubbed`
- `partially ported`
- `functionally equivalent`
- `behaviorally equivalent`

## Parity Matrix
| Subsystem | Stellarium module/file | Local equivalent file(s) | Status | Brief justification from code | Biggest missing behavior | Recommended next bounded slice |
|---|---|---|---|---|---|---|
| atmosphere | `src/modules/atmosphere.c` | `engine/sky/runtime/modules/AtmosphereModule.ts`, `directBackgroundLayer.ts` | partially ported | Active runtime module prepares atmosphere frames and syncs them into the direct background layer every render pass. | No Stellarium-grade atmospheric scattering/extinction model depth. | Port bounded airmass and extinction behavior into the active background frame. |
| cardinal | `src/modules/cardinal.c` | `directOverlayLayer.ts` | partially ported | Active overlay generation emits cardinal labels and grid aids from the current projected view. | Localized cardinal naming and Stellarium-style label policy are still shallow. | Split cardinal policy from generic overlay aids and align visibility rules. |
| circle | `src/modules/circle.c` | none found | not started | No dedicated circle primitive projection or rendering path exists in the local sky engine. | Circle overlays and frame-aware circle rendering are absent. | Add a minimal bounded circle overlay module. |
| comets | `src/modules/comets.c` | none found | not started | No comet catalog ingestion, orbit propagation, or rendering path was found in the local sky-engine runtime. | Catalog, ephemeris, and comet-specific render behavior are absent. | Add comet ingestion plus a bounded projected runtime integration. |
| constellations | `src/modules/constellations.c` | `constellations.ts`, `skycultures/**`, `directOverlayLayer.ts` | partially ported | Sky-culture data is converted into constellation pairs and boundaries, and the active overlay renders segments, boundaries, and labels for the selected sky culture. | No Stellarium-grade image artwork, broader culture coverage, or richer constellation presentation policies. | Expand the active sky-culture pack and wire constellation image anchors as a bounded slice. |
| coordinates | `src/modules/coordinates.c` | `engine/sky/transforms/coordinates.ts`, `projectionMath.ts` | partially ported | Observer-frame coordinate transforms and projection helpers are present and used by the active runtime. | Broader frame conversion/reporting breadth is still missing. | Add missing frame utilities and tests against study-side coordinate expectations. |
| debug | `src/modules/debug.c` | `engine/sky/runtime/modules/SceneReportingModule.ts`, `engine/sky/runtime/perfTelemetry.ts`, `engine/sky/runtime/luminanceReport.ts` | partially ported | The active runtime collects scene telemetry and per-step timing data through dedicated reporting modules. | Interactive debug tooling and Stellarium-like inspection controls are absent. | Add a bounded runtime debug surface backed by the existing telemetry. |
| drag_selection | `src/modules/drag_selection.c` | `engine/sky/runtime/SkyNavigationService.ts` | not started | Pointer drag currently pans the camera only; there is no rectangle-selection or drag-hit extraction path. | Drag-selection rectangle and object extraction behavior are absent. | Add rectangle selection over projected pick entries. |
| dso | `src/modules/dso.c` | `directObjectLayer.ts` | stubbed | Deep-sky objects currently render through the generic non-star object layer; dedicated `DsoRenderer.ts` exists but is not wired into the active runtime. | No DSO-specific morphology, sizing, filtering, or active runtime ownership. | Either wire a bounded DSO renderer into the runtime or remove the dead path and add an active DSO-specific module. |
| dss | `src/modules/dss.c` | none found | not started | No DSS or survey-background tile subsystem was found in the local runtime. | Survey ingestion and rendering are absent. | Add a feature-flagged survey background module. |
| geojson | `src/modules/geojson.c` | none found | not started | No GeoJSON ingestion, projection, or overlay rendering path was found in the local sky engine. | GeoJSON overlays are absent. | Add a bounded GeoJSON overlay ingestion and rendering path. |
| labels | `src/modules/labels.c` | `labelManager.ts`, `directOverlayLayer.ts` | partially ported | Active label layout includes overlap pruning, priorities, selected/guided emphasis, and constellation labels. | Per-class budgets and richer Stellarium-style label policy remain shallow. | Port per-class label budgets and more explicit label policy knobs. |
| landscape | `src/modules/landscape.c` | `engine/sky/runtime/modules/LandscapeModule.ts`, `directBackgroundLayer.ts`, `landscapeLayer.ts` | partially ported | The active runtime syncs landscape frames into the background layer and renders horizon and aid geometry. | Landscape asset fidelity, occlusion behavior, and luminance coupling are still limited. | Add structured landscape assets and bounded luminance/occlusion coupling. |
| lines | `src/modules/lines.c` | `directOverlayLayer.ts` | partially ported | The active overlay builds altitude/azimuth, equatorial, constellation, and boundary lines from the current view and timestamp. | Line families are not broken into the same fine-grained controls as Stellarium. | Split line families into explicit toggles and policies. |
| meteors | `src/modules/meteors.c` | none found | not started | No meteor catalog, radiant generation, or meteor trail rendering path was found locally. | Meteor generation and rendering are absent. | Add a simple bounded meteor subsystem. |
| milkyway | `src/modules/milkyway.c` | `engine/sky/runtime/modules/MilkyWayModule.ts`, `directBackgroundLayer.ts` | partially ported | A dedicated runtime module prepares Milky Way state and syncs it into the active background layer. | Data-backed density and fidelity are still far below Stellarium depth. | Port bounded data-driven Milky Way intensity and shape behavior. |
| minorplanets | `src/modules/minorplanets.c` | none found | not started | No asteroid or minor-planet catalog, propagation, or rendering path was found in the local sky-engine runtime. | Catalog, orbit propagation, and brightness modeling are absent. | Add a bounded minor-planet catalog and runtime path. |
| movements | `src/modules/movements.c` | `engine/sky/runtime/SkyNavigationService.ts`, `observerNavigation.ts`, `engine/sky/runtime/SkyInputService.ts` | partially ported | Wheel zoom, drag pan, selection targeting, and observer-navigation updates are active in the current runtime. | Stellarium-style movement modes and tuning breadth are still missing. | Tune inertia and zoom behavior, then add the next missing navigation mode. |
| photos | `src/modules/photos.c` | none found | not started | No photo ingestion, calibration, or photo projection/rendering path was found. | Photo overlays and astrometric projection are absent. | Add an optional bounded photo overlay subsystem. |
| planets | `src/modules/planets.c` | `astronomy.ts`, `directObjectLayer.ts` | partially ported | Planet data is computed and projected into the active generic object layer; dedicated `PlanetRenderer.ts` exists but is not wired into the active runtime. | No dedicated active planet renderer and no higher-fidelity ephemerides. | Wire a bounded planet renderer into the runtime or deepen the active generic path. |
| pointer | `src/modules/pointer.c` | `directObjectLayer.ts`, `PointerRenderer.ts` | stubbed | The active runtime uses a generic selection ring; standalone `PointerRenderer.ts` exists but has no active runtime references. | No animated pointer subsystem is wired through the active module graph. | Wire pointer lifecycle through object selection in the active runtime. |
| satellites | `src/modules/satellites.c` | none found | not started | No TLE ingestion, SGP4 propagation, or satellite rendering path was found in the local sky engine. | Satellite propagation and render behavior are absent. | Add a bounded satellites runtime subsystem. |
| skycultures | `src/modules/skycultures.c` | `skycultures/index.ts`, `skyCultureSelection.ts`, `directOverlayLayer.ts` | partially ported | Multiple sky-culture definitions exist, culture IDs can be normalized and persisted, and the active overlay renders constellation data for the selected culture ID. | Culture pack coverage and localized behavior breadth are still very limited. | Expand the active culture pack and verify bounded culture switching end-to-end. |
| stars | `src/modules/stars.c` | `engine/sky/runtime/modules/StarsModule.ts`, `engine/sky/runtime/modules/runtimeFrame.ts`, `directStarLayer.ts` | partially ported | A dedicated star runtime module handles projection caching, LOD reuse, limiting magnitude, and star-layer sync in the active scene. | Catalog richness, traversal depth, and Stellarium-grade data breadth are still missing. | Deepen catalog richness and port the next bounded traversal/detail behavior. |

## Audit Notes
- `constellations` and `skycultures` are more advanced than the previous parity file claimed because they are actively rendered through the overlay path, not just defined as static data.
- `DsoRenderer.ts`, `PlanetRenderer.ts`, `MoonRenderer.ts`, and `PointerRenderer.ts` currently exist as standalone renderer paths but are not wired into the active runtime, so they do not justify higher parity by themselves.
- Parity judgments in this file are based on the active runtime module graph and the code that actually feeds the current scene.

## Snapshot Summary
- Strongest current areas: `stars`, `atmosphere`, `milkyway`, `landscape`, `labels`, `lines`, `movements`, `constellations/skycultures`.
- Weakest current areas: `comets`, `minorplanets`, `satellites`, `meteors`, `dss`, `geojson`, `photos`, `circle`, `drag_selection`.
- Highest-value next bounded slices:
  1. Wire active dedicated renderers where parallel dead paths already exist (`planets`, `pointer`, `dso`).
  2. Expand `skycultures` and constellation asset coverage beyond the current narrow pack.
  3. Add a bounded `satellites` subsystem.
  4. Add bounded `minorplanets` and `comets` catalog/runtime support.
  5. Decide whether to port a survey background (`dss`) or explicitly defer it.
- Overall parity estimate: `~22-26%` subsystem parity.

## Update Protocol (for future AI coders)
When you complete a slice, update:
1. the row `Status`
2. `Brief justification from code` with concrete implementation evidence
3. `Biggest missing behavior`
4. `Recommended next bounded slice`
5. `Last updated` date at top

Hard rule:
- Do not upgrade status based on naming similarity or intent.
- Do not count unwired experimental files as active parity.
- Only upgrade status when behavior is implemented and verifiable in the active runtime or supporting code path.
