# Astronomy Hub vs Stellarium - Subsystem Parity List

Last updated: 2026-04-12
Authority sources:
- Stellarium code: `/home/rocco/stellarium/src`
- Astronomy Hub code: `frontend/src/features/sky-engine/**`

Purpose:
- This is a working parity tracker for AI coders.
- Update this file after each bounded subsystem slice.
- Status must reflect code reality, not intent.

## Status Legend
- `not started`
- `stubbed`
- `partially ported`
- `functionally equivalent`
- `behaviorally equivalent`

## Parity Matrix
| Subsystem | Stellarium module/file | Local equivalent file(s) | Status | Brief justification from code | Biggest missing behavior | Recommended next bounded slice |
|---|---|---|---|---|---|---|
| atmosphere | `src/modules/atmosphere.c` | `engine/sky/runtime/modules/AtmosphereModule.ts` | partially ported | Dedicated runtime module exists and is wired into frame flow. | Stellarium-grade atmospheric fidelity depth. | Port bounded atmospheric luminance/airmass terms. |
| cardinal | `src/modules/cardinal.c` | `directOverlayLayer.ts`, `landscapeLayer.ts` | partially ported | Cardinal markers/labels exist in overlay/landscape path. | Full Stellarium cardinal integration with label policy. | Isolate cardinal overlay policy and align placement rules. |
| circle | `src/modules/circle.c` | none found | not started | No dedicated circle subsystem in runtime. | Circle primitive module/path absent. | Add minimal bounded circle overlay module. |
| comets | `src/modules/comets.c` | none found | not started | No comet ingestion/runtime/render path found. | Catalog + ephemeris + render behavior absent. | Add comet ingestion + projected runtime integration. |
| constellations | `src/modules/constellations.c` | `constellations.ts` | stubbed | Present but shallow hardcoded segment set only. | Full data-driven constellation/skyculture behavior. | Replace hardcoded set with data-driven constellation pack. |
| coordinates | `src/modules/coordinates.c` | `engine/sky/transforms/coordinates.ts` | partially ported | Coordinate transforms exist and are used by projection/runtime. | Full Stellarium coordinate subsystem breadth. | Add missing coordinate frame/report utilities. |
| debug | `src/modules/debug.c` | `SceneReportingModule.ts`, `SkyEnginePage.tsx` | partially ported | Telemetry/debug reporting exists. | Dedicated Stellarium-like debug tooling depth. | Consolidate runtime debug controls into dedicated module. |
| drag_selection | `src/modules/drag_selection.c` | none found | not started | Drag input exists for camera movement only. | Drag-selection rectangle + selection extraction absent. | Add bounded drag-selection subsystem over picking. |
| dso | `src/modules/dso.c` | `DsoRenderer.ts`, `directObjectLayer.ts` | stubbed | DSO-named code exists; runtime object path is generic/shallow. | Rich DSO catalog semantics/filtering/styling. | Add DSO-specific runtime bucket + visibility policy. |
| dss | `src/modules/dss.c` | none found | not started | No DSS/HiPS-like survey subsystem found. | Survey background integration absent. | Add optional survey background module (feature-flagged). |
| geojson | `src/modules/geojson.c` | none found | not started | No geojson sky overlay module in runtime. | GeoJSON ingestion/projection/render path absent. | Add bounded geojson overlay module. |
| labels | `src/modules/labels.c` | `labelManager.ts`, `OverlayRuntimeModule.ts` | partially ported | Label placement/management exists. | Stellarium-level conflict/priority policy depth. | Port per-class label budgets and conflict policy. |
| landscape | `src/modules/landscape.c` | `LandscapeModule.ts`, `landscapeLayer.ts` | partially ported | Landscape runtime/layer exists. | Detailed landscape asset/model behavior parity. | Add structured landscape asset handling + luminance coupling. |
| lines | `src/modules/lines.c` | `directOverlayLayer.ts` | partially ported | Grid/line overlays exist. | Full Stellarium line families and controls. | Split line families into explicit runtime toggles. |
| meteors | `src/modules/meteors.c` | none found | not started | No meteor subsystem found. | Meteor generation/update/render absent. | Add simple bounded meteor subsystem. |
| milkyway | `src/modules/milkyway.c` | `MilkyWayModule.ts` | partially ported | Dedicated runtime module exists. | Data/model fidelity vs Stellarium depth. | Port data-backed Milky Way intensity behavior. |
| minorplanets | `src/modules/minorplanets.c` | none found | not started | No minor-planet subsystem found. | Catalog + orbit propagation + render absent. | Add minor-planet catalog/runtime path. |
| movements | `src/modules/movements.c` | `SkyNavigationService.ts`, `SkyInputService.ts` | partially ported | Camera/navigation controls implemented. | Stellarium movement dynamics/options depth. | Tune movement model and add missing movement modes. |
| photos | `src/modules/photos.c` | none found | not started | No photo overlay module/path found. | Photo ingestion/projection/render absent. | Add optional photos overlay subsystem. |
| planets | `src/modules/planets.c` | `astronomy.ts`, `ObjectRuntimeModule.ts` | partially ported | Planet objects are computed/rendered through object runtime. | Higher-fidelity ephemerides/appearance behavior. | Port bounded ephemeris fidelity upgrade. |
| pointer | `src/modules/pointer.c` | `PointerRenderer.ts` | stubbed | Pointer file exists; runtime ownership/integration appears shallow. | Full pointer lifecycle integration absent. | Wire pointer into runtime module graph + selection lifecycle. |
| satellites | `src/modules/satellites.c` | none found | not started | No satellites subsystem found. | TLE ingestion/propagation/render absent. | Add bounded satellites runtime subsystem. |
| skycultures | `src/modules/skycultures.c` | none found (only static constellation helper) | not started | No skyculture manager/data model present. | Culture packs/localized names/variants absent. | Add skyculture data model feeding constellations/labels. |
| stars | `src/modules/stars.c` | `StarsModule.ts`, `runtimeFrame.ts`, `directStarLayer.ts` | partially ported | Dedicated star runtime ownership + scalable render path exists. | Full Stellarium star-data/traversal depth parity. | Port catalog richness + render-visitor-like traversal details. |

## Snapshot Summary
- Strongest parity areas: `stars`, `atmosphere`, `milkyway`, `landscape`, `labels/lines/cardinal`.
- Weakest parity areas: `comets`, `minorplanets`, `satellites`, `meteors`, `dss`, `geojson`, `photos`, `circle`, `drag_selection`, `skycultures`.
- Top 5 next high-value slices:
  1. skycultures + constellations data-driven port
  2. planets ephemeris fidelity upgrade
  3. dso runtime/data-depth port
  4. satellites bounded TLE subsystem
  5. minorplanets/comets bounded catalog runtime pass
- Overall parity estimate: `~20-25%` subsystem parity (many modules still missing or shallow).

## Update Protocol (for future AI coders)
When you complete a slice, update:
1. the row `Status`
2. `Brief justification from code` with concrete implementation evidence
3. `Biggest missing behavior`
4. `Recommended next bounded slice`
5. `Last updated` date at top

Hard rule:
- Do not upgrade status based on naming similarity or intent.
- Only upgrade status when behavior is implemented and verifiable in code/runtime.
