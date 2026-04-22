# Module 2 — Stars full (G1 anchor)

This document **freezes** the Astronomy Hub ↔ Stellarium Web Engine **initial mapping** for **`module2-stars-full`** inventory rows (`hip.c` / `hip.h` / `stars.c` / `bv_to_rgb.c`). It satisfies **G1 SourceContractLock** for the **declared Hub surface** in §2; **line-level C parity** and **G2–G7** closure use the pinned Git reference in **`stellarium-web-engine-src.md`** (**`BLK-003`** **RESOLVED**, **EV-0037**).

**Authority:** `docs/runtime/port/README.md`. Reconcile **`module-inventory.md`** before changing Hub paths here.

---

## 1. Stellarium sources in scope (inventory rows)

Paths are relative to the Stellarium Web Engine `src/` tree; see **`stellarium-web-engine-src.md`** for the pinned commit and raw URLs (**`BLK-003`** **RESOLVED**).

| Source | Role |
|---|---|
| `src/hip.c`, `src/hip.h` | Hipparcos / star catalog data structures and loaders (native C). |
| `src/modules/stars.c` | Stars module: registration, update/render hooks vs core painter. |
| `src/algos/bv_to_rgb.c` | B−V → RGB mapping for star color. |

**Explicitly not claimed ported in this G1 wave:** any other `src/**` file; painter GL mesh details; full `stars.c` render parity.

---

## 2. Frozen Hub targets (paths relative to repo root)

These are the **current** Hub implementations that correspond to the **spirit** of the four inventory files (tile loading and Module 0/1 already cover catalog *ingest* for Hipparcos/Gaia Eph; this module targets **visual / runtime star pipeline** alignment).

| Concern | Hub files |
|---|---|
| B−V → RGB (`bv_to_rgb.c` table port) | `frontend/src/features/sky-engine/engine/sky/adapters/bvToRgb.ts` (`bvToRgb`); **`frontend/tests/test_module2_bv_to_rgb.test.js`** (**EV-0038**) |
| Star hex wrapper | `frontend/src/features/sky-engine/starRenderer.ts` (`resolveStarColorHex` → `bvToRgb`) |
| `stars.c` `nuniq_to_pix` ↔ EPH tile header | `frontend/src/features/sky-engine/engine/sky/adapters/starsNuniq.ts` (`nuniqToHealpixOrderAndPix` → `decodeEphTileNuniq`); **`frontend/tests/test_module2_stars_nuniq.test.js`** (**EV-0039**) |
| `hip.c` `hip_get_pix` + `hip.inl` lookup | `frontend/src/features/sky-engine/engine/sky/adapters/hipGetPix.ts` (`hipGetPix`, `parseHipIdFromRuntimeStar`, `runtimeStarMatchesHipHealpixLookup`); vendored **`hipPixOrder2.generated.ts`**; **`frontend/tests/test_module2_hip_get_pix.test.js`** (**EV-0041**) |
| Hipparcos tile merge + HIP ↔ HEALPix check | `frontend/src/features/sky-engine/engine/sky/adapters/fileTileRepository.ts` (`mergeSurveyTiles` → **`filterSurveyStarsForMerge`**) (**EV-0042**) |
| `stars.c` `obj_get_by_hip`-style lookup seam | `frontend/src/features/sky-engine/engine/sky/adapters/starsLookup.ts` (`findRuntimeStarByHipInTiles`) + **`test_module2_stars_lookup.test.js`** (**EV-0044**) |
| Scene runtime HIP lookup wiring | `frontend/src/features/sky-engine/SkyEngineScene.tsx` (`buildEngineStarSceneObjects` truth-note uses `findRuntimeStarByHipInTiles`) (**EV-0045**) |
| Scene diagnostics + `stars_list` live probe + HUD | `frontend/src/features/sky-engine/engine/sky/diagnostics/skyDiagnostics.ts` (`buildSkyDiagnostics` → `listRuntimeStarsFromTiles`; `formatSkyDiagnosticsSummary`), `contracts/scene.ts` (`diagnostics.starsListVisitCount`), `SkyEngineSnapshotStore.ts` + `SnapshotBridgeModule.ts`, `SkyEnginePage.tsx` (**EV-0083**, **EV-0084**) |
| Stable HIP detail route identity | `frontend/src/features/sky-engine/engine/sky/adapters/starsLookup.ts` (`buildHipDetailRoute`, `resolveHipDetailRouteForRuntimeStar`), `SkyEngineScene.tsx` (`detailRoute = hip/<id>`) (**EV-0046**) |
| Selection continuity across id churn | `frontend/src/features/sky-engine/useSkyEngineSelection.ts` (`resolveSelectedObjectWithDetailRoute` + id resync), `test_sky_engine_selection_detail_route.test.js` (**EV-0047**) |
| Stellarium point-size / tonemapper-style magnitude | `frontend/src/features/sky-engine/engine/sky/core/stellariumVisualMath.ts`; used from `starRenderer.ts` |
| Stars runtime module (projection, limits, projected star list) | `frontend/src/features/sky-engine/engine/sky/runtime/modules/StarsModule.ts`, `runtimeFrame.ts` (`collectProjectedStars`, …); **`stellariumPainterLimits.ts`** (`resolveStarsRenderLimitMagnitude`, **EV-0040**) |
| Star billboards / layer sync | `frontend/src/features/sky-engine/starObjectRenderer.ts`, `directStarLayer.ts` |
| Catalog → scene objects (non-tile backends) | `frontend/src/features/sky-engine/astronomy.ts` (`computeRealSkySceneObjects`, …) |
| Typed star payload from tiles | `frontend/src/features/sky-engine/engine/sky/contracts/stars.ts` (`RuntimeStar`) |
| Module 2 port deterministic replay (G4) | `frontend/src/features/sky-engine/engine/sky/runtime/module2ParityFingerprint.ts` (`computeModule2PortFingerprint`); **`frontend/tests/test_module2_deterministic_replay.test.js`** (**EV-0043**) |

---

## 3. Behavioral notes

0. **Exact parity rule:** the module target is exact source parity, not "Stellarium-like" interpretation. If source behavior exists, port that behavior directly.
1. **`BLK-003` (RESOLVED):** Authoritative C sources are pinned in **`stellarium-web-engine-src.md`** (GitHub **`63fb327…`**). Use pinned upstream URLs/commit for parity reference.
2. **`bvToRgb`** reproduces the **`COLORS`** table and index math from **`bv_to_rgb.c`**; **`resolveStarColorHex`** maps linear RGB to 8-bit sRGB hex for rendering.
3. **Module 1** already implements Eph tiles + HiPS order; **module 2** focuses on **stars module + color + point pipeline**, not duplicating **`eph-file.c`** (see **`module1-source-contract.md`**).
4. **`hip_get_pix`** uses vendored **`PIX_ORDER_2`** bytes from **`hipPixOrder2.generated.ts`** (no runtime or tooling dependency on an external Stellarium tree) (**EV-0041**).
5. On the Hipparcos survey merge path, stars with a parseable HIP must satisfy **`hip_get_pix(hip, 2) === healpixAngToPix(2, raDeg, decDeg)`** or they are dropped (**EV-0042**).
6. Hub lookup helper **`findRuntimeStarByHipInTiles`** now follows survey-wide `obj_get_by_hip` intent on the loaded runtime surface: invalid HIP mapping => null, Gaia rows skipped, lookup keyed by `hip_get_pix(hip, 2)` bucket index, first non-Gaia HIP match returned (**EV-0044**, **EV-0075**).
7. `SkyEngineScene` runtime star-object assembly now consumes the helper and surfaces HIP lookup status in star `truthNote` on the live scene path (**EV-0045**).
8. HIP-backed stars now carry stable detail route identity **`hip/<id>`** for runtime selection/detail continuity (**EV-0046**).
9. Selection state uses stable HIP `detailRoute` fallback and then rebinds `selectedObjectId` to the active runtime object id when survey tile ids change (**EV-0047**).
10. HUD controls are grouped around the same top-bar and bottom-bar composition used by the reference UI while preserving current runtime hooks (**EV-0049**, **EV-0050**).
11. Earlier experimental left/right dock UI passes are historical only and were reverted to keep parity with reference composition (see **`evidence-index.md`** notes for **EV-0051** and **EV-0052**).
12. Upstream toolbar SVG assets are vendored under **`frontend/public/stellarium-web/`** and wired via **`stellariumWebUiAssets.ts`** so runtime UI is self-contained (**EV-0053**).
13. **`computeModule2PortFingerprint`** includes **`coreGetPointForMagnitude`** samples and a view-tier/label-cap mirror of **`resolveViewTier`** for stronger G4 drift detection (**EV-0054**).
14. User-facing branding in the Sky-Engine UI must not show the word `Stellarium`; preserve parity through structure/behavior/assets instead of upstream branding text.
15. Runtime stabilization pass: scene model sync cadence increased to `500ms` and wide-FOV repository query floor pinned to `6.5` to reduce lag and avoid near-empty star loads at startup (**EV-0057**). This is a stability stopgap, not final parity closure.
16. Runtime projection stabilization (historical): earlier recovery passes added FOV-based projected-star caps and a render-side `6.5` floor in `collectProjectedStars` (**EV-0058**); these were temporary stopgaps.
17. Toolbar interaction wiring: Deep Sky / Atmosphere / Landscape / Night Mode toggles now flow through shared `aidVisibility` state and directly gate runtime modules/layers, replacing UI-local-only toggle behavior (**EV-0059**).
18. Additional lag mitigation (historical): scene-model sync cadence was throttled to `1000ms`, and projected-star caps were tightened in a follow-up stopgap (**EV-0060**).
19. Deterministic replay was extended to include active runtime perf knobs (`syncCadenceMs` and sampled FOV `starCap` tiers) so parity snapshots now catch unintended drift in stabilization settings (**EV-0061**).
20. Parity hardening removed forced render-path floor/cap heuristics in `collectProjectedStars` (no fixed `6.5` floor, no finite FOV cap) so module2 star projection follows source-aligned limit flow rather than local throttling policy (**EV-0063**).
21. Stars runtime projection-cache signature now includes a scene-packet content slice (first/last id+mag, packet count, diagnostics limit/visible/tile depth) so cache reuse is invalidated when packet star payload changes even if object array shape is unchanged (**EV-0064**).
22. Scene packet assembly no longer applies local packet-time limiting-magnitude filtering or fallback label heuristics; packet carries deduped tile stars and candidate labels while active render/runtime path enforces visibility limits. Selected-star projection path now bypasses strict star drop gates to preserve continuity of active selection (**EV-0065**).
23. Parity cleanup removed Hub-introduced star visibility inflators (`minimumByFov` query floor and selected-star projection bypass) so limiting-magnitude and visibility decisions stay on the source-aligned runtime path only (**EV-0066**).
24. Runtime tile-query signature now quantizes `hipsViewport` fields (`windowHeightPx`, `projectionMat11`, `tileWidthPx`) before string keying so micro-jitter does not trigger continuous reload churn; this stabilizes scene-packet promotion on the live path without introducing non-source star visibility heuristics (**EV-0069**).
25. Scene assembly now honors Stellarium's `stars.c::compute_pv` + `star_get_astrom` pipeline for catalogue stars: `computeCatalogStarPvFromCatalogueUnits` (wrapping ERFA `eraStarpv` / `eraEpb2jd`) produces the BCRS pv-vector at J2000.0 and `starAstrometricIcrfVector` applies (`obs->tt − ERFA_DJM00`) propagation and subtracts `earth_pvb[0]` before normalisation. The `RuntimeStar` reference is used as a WeakMap key so each star's `pv` is computed exactly once (mirroring `stars.c::on_file_tile_loaded`). When the catalogue row carries `plx ≤ 2 mas` the assembler falls through to the static ra/dec path, mirroring Stellarium's loader rule (`if (!isnan(plx) && (plx < 2.0 / 1000)) plx = 0.0`). `ObserverAstrometrySnapshot` was extended with the two already-computed fields (`ttJulianDate`, `earthPv`) so the assembler can consume them directly from the merged observer geometry without a second ERFA pass (**EV-0070**).
26. Survey registration ordering now mirrors `stars.c::survey_cmp` behavior: non-finite `max_vmag` values sort last (treated as +infinity), and Gaia `min_vmag` promotion follows non-Gaia survey ceilings (matching `stars_add_data_source` post-sort gate update). The existing narrow-FOV Gaia activation override remains intact in Hub runtime query flow (**EV-0077**).
27. `stars.c::stars_list` loaded-tile seam now has a dedicated adapter surface in Hub (`starsList.ts`): source-key selection, `max_mag` filtering, nuniq hint decode (`nuniq_to_pix`), and unresolved-hint `MODULE_AGAIN`-style status are covered by regression tests (`test_module2_stars_list.test.js`). This is a loaded-runtime subset, not full live fetch parity (**EV-0078**).
28. `stars_list(..., source)` selection now keys off survey source keys carried in tile provenance (`sourceKey`/`sourceKeys` from merged `fileTileRepository` survey payloads), so source selection is no longer limited to catalog-level (`hipparcos`/`gaia`) filtering. This advances `stars_add_data_source(..., key)` parity continuity on the loaded runtime surface (**EV-0079**).
29. `stars_list(..., hint=nuniq)` matching now resolves against merged upstream HiPS provenance sets (`hipsTiles` list of contributing `(order,pix,sourceKey)`), not only a single `(hipsOrder, hipsPix)` pair, so hinted traversal survives multi-pixel survey merges while keeping source-key scoping and `MODULE_AGAIN` unresolved-hint behavior (**EV-0080**).
30. `stars_list` non-hint traversal now mirrors more of the native loop semantics: unknown source key falls back to first available survey key, tiles with `mag_min >= max_mag` are skipped up front, and per-tile traversal uses sorted star magnitude order with early break once `vmag > max_mag` (**EV-0081**).
31. G4 deterministic replay (`computeModule2PortFingerprint`) now embeds a frozen `stars_list` fixture slice (default order + `again` on unresolved hint + hinted early break + explicit survey-key traversal) so `starsList.ts` behavior is locked in the same golden snapshot as traversal/HIP/astrometry seams (**EV-0082**).
32. Live scene assembly now runs the same `listRuntimeStarsFromTiles` traversal (no nuniq hint, `max_mag = limitingMagnitude`, tiles restricted to `query.visibleTileIds`) inside `buildSkyDiagnostics`, exposing **`diagnostics.starsListVisitCount`** on every `assembleSkyScenePacket` output so the `stars_list` port executes on the real packet path—not only unit fixtures—without conflating visit counts with deduped projected star tallies (**EV-0083**).
33. **`starsListVisitCount`** is bridged into the runtime snapshot and Sky Engine HUD as a **Listed** progress chip (vs **Stars** rendered count) plus tooltip copy; `formatSkyDiagnosticsSummary` appends `list N` for compact log-style readouts (**EV-0084**).
34. **`resolveScenePacketForQuery`** (`sceneQueryState.ts`, module 1 spine) no longer reuses a multi-survey `tileLoadResult` when `resolvedTileQuerySignature` does not match the active `tileQuerySignature`, so the engine does not assemble a new `visibleTileIds` query against stale `runtimeTiles` (a real cause of **Listed 0** with planets still visible). Track A: inspector dock moves to **bottom-left**; HUD shows **Tiles error** when `diagnostics.sourceError` is set (**EV-0085**).

---

## 4. Change control

- Renames or new Hub files in §2 require updates to this document, **`module-inventory.md`** notes (if mapping changes), and **`evidence-index.md`**.
- Do not claim **G5** parity for §1 until Hub checks match **`stellarium-web-engine-src.md`** revision behavior (see **EV-0037**).

---

## 5. Gate status (informational)

| Gate | Note |
|---|---|
| G0 | **PASS** — four `module2-stars-full` file rows exist in **`module-inventory.md`** with **`BLOCKED`** + Planned Module. |
| G1 | **PASS** for §1–§2 mapping as written. |
| G2 | **Partial** — **`bv_to_rgb`** (**EV-0038**); **`nuniq_to_pix`** via **`starsNuniq.ts`** (**EV-0039**); **`render_visitor` limit_mag policy** (**EV-0040**) plus native tile traversal loop / tile gates / point-clipped path on the runtime surface (**EV-0074**); **`hip_get_pix`** (**EV-0041**); **`eraStarpv` / `eraEpb2jd` / `compute_pv` / `star_get_astrom`** (**EV-0070**); **`painter_project(FRAME_ASTROM → FRAME_OBSERVED)`** apparent-place chain on EV-0070 pv output (**EV-0072**); `stars_add_data_source` survey ordering/gating parity increment in repository registration path (**EV-0077**); `stars_list` loaded-runtime source/hint traversal subset via `starsList.ts` (**EV-0078**, source-key expansion **EV-0079**, merged hint-provenance expansion **EV-0080**, loop parity expansion **EV-0081**); remaining **`hip.c`** loader/list seams still open. |
| G3 | **Partial** — Hipparcos **`mergeSurveyTiles`** uses **`runtimeStarMatchesHipHealpixLookup`** (**EV-0042**); `obj_get_by_hip` helper + scene wiring + stable HIP route identity + selection continuity (**EV-0044**, **EV-0045**, **EV-0046**, **EV-0047**) plus survey-wide `hip_get_pix(hip, 2)` bucketed traversal on loaded runtime tiles (**EV-0075**); scene assembler now uses Stellarium's `star_get_astrom` path for catalogue stars with a per-star pv cache (**EV-0070**); end-to-end `painter_project(FRAME_ASTROM, …)` apparent-place chain sealed over the EV-0070 pv output by regression test (**EV-0072**); active StarsModule path now consumes tile traversal output through `starsRenderVisitor.ts` (native parent→child visit order and descend gating, **EV-0074**); data-source registration ordering and Gaia min-vmag promotion behavior now tracked on the active repository path (**EV-0077**); loaded-runtime `stars_list` source/hint traversal path now covered by dedicated adapter + tests with source-key aware selection, merged hint provenance handling, and loop-level max-mag traversal parity (**EV-0078**, **EV-0079**, **EV-0080**, **EV-0081**); `buildSkyDiagnostics` now invokes `listRuntimeStarsFromTiles` on visible tiles for **`diagnostics.starsListVisitCount`** on every assembled scene packet (**EV-0083**), with HUD/snapshot surfacing (**EV-0084**); full **`stars.c`** / object graph still open. |
| G4 | **Partial** — algorithm fingerprint **`computeModule2PortFingerprint`** (**EV-0043**, extended **EV-0054** with point-math + view-tier samples, **EV-0061** with perf-knob samples, **EV-0076** with deterministic render-visitor traversal, survey `obj_get_by_hip` lookup, and catalog-astrometry slices, **EV-0082** with `stars_list` loaded-tile slice); full scene/`StarsModule` projection replay still open; tile-load replay remains module 1 **`computeModule1TileLoadFingerprint`** (**EV-0024**). |
| G5–G7 | **FAIL** until parity closure + evidence for remaining §1 scope. |

---

## 6. Inventory cross-reference

Rows: **`src/hip.c`**, **`src/hip.h`**, **`src/modules/stars.c`**, **`src/algos/bv_to_rgb.c`** — see **`docs/runtime/port/module-inventory.md`**.

---

## 7. Handoff for external agents (e.g. Codex / new chat)

Read first: **`docs/runtime/port/stellarium-web-engine-src.md`** (pinned commit), **`docs/runtime/port/evidence-index.md`** (EV-0038–EV-0087, noting EV-0067 / EV-0068 are intentionally unused IDs), **`module-gates.md`** "Known residuals" section for non-module-0/1/2 npm test failures that should be picked up by downstream modules, and this file §2–§5.

Hard constraints for continuation:
- Port for exact parity (logic/UI behavior), not approximation.
- Keep runtime/tooling self-contained in Astronomy Hub (no active dependency on external local source trees).
- Do not show `Stellarium` as user-facing UI branding text in Sky-Engine.

### Where to implement module 2 work

| Area | Primary Hub paths |
|---|---|
| Stellarium reference | Pin is **`63fb3279e85782158a6df63649f1c8a1837b7846`** — diff against raw `src/` under that commit. |
| B−V → RGB | `frontend/src/features/sky-engine/engine/sky/adapters/bvToRgb.ts`, `frontend/src/features/sky-engine/starRenderer.ts` |
| `nuniq` ↔ tile | `frontend/src/features/sky-engine/engine/sky/adapters/starsNuniq.ts`, `ephCodec.ts` |
| Star render limit magnitude | `frontend/src/features/sky-engine/engine/sky/runtime/stellariumPainterLimits.ts` (`resolveStarsRenderLimitMagnitude`), `runtime/modules/StarsModule.ts` |
| Native `render_visitor` traversal loop | `frontend/src/features/sky-engine/engine/sky/runtime/starsRenderVisitor.ts`, `runtime/modules/runtimeFrame.ts`, `runtime/modules/StarsModule.ts`, `services/sceneAssembler.ts`, `contracts/scene.ts` |
| `hip_get_pix` + table | `frontend/src/features/sky-engine/engine/sky/adapters/hipGetPix.ts`, vendored **`hipPixOrder2.generated.ts`** |
| Survey-wide `obj_get_by_hip` lookup | `frontend/src/features/sky-engine/engine/sky/adapters/starsLookup.ts` (`findRuntimeStarByHipInTiles`) |
| HIP detail route identity | `frontend/src/features/sky-engine/engine/sky/adapters/starsLookup.ts` (`buildHipDetailRoute`), `frontend/src/features/sky-engine/SkyEngineScene.tsx` (`detailRoute`) |
| Selection continuity | `frontend/src/features/sky-engine/useSkyEngineSelection.ts` (`resolveSelectedObjectWithDetailRoute`) |
| Hipparcos merge + HIP check | `frontend/src/features/sky-engine/engine/sky/adapters/fileTileRepository.ts` (`filterSurveyStarsForMerge` → `runtimeStarMatchesHipHealpixLookup`) |
| Public exports | `frontend/src/features/sky-engine/engine/sky/index.ts` |
| Stellarium simple-html UI assets (toolbar SVGs) | `frontend/public/stellarium-web/`, `frontend/src/pages/stellariumWebUiAssets.ts`, `frontend/src/pages/SkyEnginePage.tsx` (**EV-0053**) |
| G4 port fingerprint | `frontend/src/features/sky-engine/engine/sky/runtime/module2ParityFingerprint.ts` (includes **`scene-lum|`** slice for `evaluateSceneLuminanceReport` — **EV-0086**); tests **`test_module2_deterministic_replay.test.js`** (**EV-0043**) |
| Scene luminance / daytime star adaptation | `frontend/src/features/sky-engine/engine/sky/runtime/luminanceReport.ts`, `runtime/modules/SceneLuminanceReportModule.ts`, `frontend/src/features/sky-engine/solar.ts` (**EV-0086**) |
| Non-star horizon mask + runtime projection tests | `runtime/modules/runtimeFrame.ts` (`getObjectHorizonFade`, `collectProjectedNonStarObjects`) (**EV-0087**); tests **`test_runtime_frame_horizon.test.js`**, **`sky-engine-runtime-frame-projection.test.js`** |

### Commands (from `frontend/`)

- `npm run typecheck` — required before claiming done.
- `npm run build` — production bundle (note: **`hipPixOrder2.generated.ts`** embeds ~120 KB table as base64; optional future work: lazy load).
- `npm run test:module2` — module 2 Vitest bundle (BV, nuniq, limit mag, HIP, survey-wide HIP lookup regression `test_module2_stars_lookup_survey.test.js`, native `render_visitor` traversal regression `test_module2_stars_render_visitor.test.js`, deterministic replay, selection detail route, ERFA `eraStarpv` + `starsCatalogAstrom`, `painter_project(FRAME_ASTROM, …)` end-to-end, **`test_scene_luminance_report.test.js`** + **`test_tone_adaptation.test.js`** for atmosphere/daylight luminance + exposure adaptation (**EV-0086**), **`test_runtime_frame_horizon.test.js`** + **`sky-engine-runtime-frame-projection.test.js`** for geometric horizon fade + projection collector fixtures (**EV-0087**)).
- `npm run test:module1` — must stay green if **`fileTileRepository.ts`**, **`healpix.ts`**, or **`ephCodec.ts`** change.

### Evidence IDs already landed (do not duplicate unless changing behavior)

| ID | What |
|---|---|
| EV-0038 | `bv_to_rgb` + `starRenderer` |
| EV-0039 | `starsNuniq` + `decodeEphTileNuniq` |
| EV-0040 | `resolveStarsRenderLimitMagnitude` + `StarsModule` |
| EV-0041 | `hip_get_pix` + `hip.inl` → **`hipPixOrder2.generated.ts`** |
| EV-0042 | Hipparcos **`mergeSurveyTiles`** HIP ↔ `healpixAngToPix(2, …)` filter |
| EV-0043 | **`computeModule2PortFingerprint`** snapshot (**G4** partial) |
| EV-0044 | `findRuntimeStarByHipInTiles` (`obj_get_by_hip`-style helper) |
| EV-0045 | `SkyEngineScene` live runtime wiring for HIP lookup status |
| EV-0046 | Stable HIP detail routes (`hip/<id>`) on runtime star objects |
| EV-0047 | Selection continuity via HIP detailRoute fallback + selected id resync |
| EV-0048 | Historical UI/staging pass (superseded by later direct-parity updates) |
| EV-0049 | Stellarium-like HUD control-strip grouping in active viewport |
| EV-0050 | Icon-first compact Stellarium control chrome pass |
| EV-0051 | Historical left-dock experiment (later reverted) |
| EV-0052 | Historical right-dock experiment (later reverted) |
| EV-0053 | Vendored Stellarium simple-html toolbar SVGs + hub shell / phase layout |
| EV-0054 | Extended **`computeModule2PortFingerprint`** (point math + view tier) |
| EV-0057 | Runtime stabilization: slower model-sync cadence + wide-FOV star floor |
| EV-0058 | Runtime stabilization: FOV star caps + render-side star floor |
| EV-0059 | Runtime interaction wiring: aidVisibility drives DSO/atmosphere/landscape/night mode |
| EV-0060 | Runtime stabilization: 1000ms model cadence + tighter projected-star caps |
| EV-0061 | Extended G4 fingerprint with `syncCadenceMs` and FOV `starCap` samples |
| EV-0062 | Cross-module sweep: added `test:module0` + verified module0/module1/module2 bundles |
| EV-0063 | Removed forced star-floor/star-cap heuristics from `collectProjectedStars` path |
| EV-0064 | Scene-packet-aware stars projection cache signature + runtime reuse regression test |
| EV-0065 | Removed packet-time star/filter label heuristics + selected-star projection continuity path |
| EV-0066 | Removed query-floor and selected-star visibility bypass heuristics |
| EV-0069 | Quantized `hipsViewport` signature key to stop tile reload thrash from float jitter |
| EV-0070 | ERFA `eraStarpv` + `eraEpb2jd` ports + Stellarium `compute_pv`/`star_get_astrom` wired through scene assembler (per-star pv cache) |
| EV-0071 | Full runtime-port doc audit reconciliation; `test:module2` bundle + CI path-filter expanded with `test_erfa_starpv.test.js` + the three runtime files (`erfaStarpv.ts`, `starsCatalogAstrom.ts`, `observerAstrometryMerge.ts`) and `sceneAssembler.ts` / `transforms/coordinates.ts`; module-inventory function tables for module 2 (stars pipeline); repo-wide `npm test` residuals catalog in `module-gates.md` |
| EV-0072 | End-to-end `painter_project(FRAME_ASTROM → FRAME_OBSERVED)` regression test asserting the EV-0070 pv output flows through `eraLdsun` + `eraAb` + `bpn^T` + `ri2h` in `sceneAssembler.ts` (and the `plx ≤ 2 mas` fallback), plus `test:module2` bundle + CI path-filter extension |
| EV-0074 | Native `stars.c::render_visitor` tile traversal port (`starsRenderVisitor.ts`) wired into `runtimeFrame.ts` / `StarsModule.ts` using tile-ordered scene packets from `sceneAssembler.ts`; regression coverage in `test_module2_stars_render_visitor.test.js`; `test:module2` now 35/35 across 10 files |
| EV-0075 | Survey-wide `obj_get_by_hip` lookup keyed by `hip_get_pix(hip, 2)` buckets (`starsLookup.ts` cached index over loaded non-Gaia survey tiles) + regression coverage in `test_module2_stars_lookup_survey.test.js`; `test:module2` now 38/38 across 11 files |
| EV-0076 | Extended `computeModule2PortFingerprint` deterministic replay slices for `stars.c::render_visitor` traversal output, survey-wide `obj_get_by_hip` lookup identity, and `compute_pv`/`star_get_astrom` astrometry samples; `test:module2` now 39/39 across 11 files |
| EV-0082 | G4 fingerprint adds deterministic `stars_list` slice; root `docker:dev-backend` for Docker-first local API stack |
| EV-0083 | Scene diagnostics invoke `listRuntimeStarsFromTiles`; `starsListVisitCount` on assembled packets |
| EV-0084 | Snapshot bridge + HUD **Listed** chip + `formatSkyDiagnosticsSummary` list token |
| EV-0086 | `luminanceReport.ts` + **`scene-lum|`** in `module2ParityFingerprint.ts`; daylight `solar.ts` star band calibration; `test_scene_luminance_report.test.js` + `test_tone_adaptation.test.js` in **`test:module2`** + CI path filter |
| EV-0087 | `runtimeFrame.ts` geometric-altitude horizon fade for non-stars; `test_runtime_frame_horizon.test.js`; `sky-engine-runtime-frame-projection.test.js` aligned with collector + added to **`test:module2`** / CI path filter |


### CI

- **`.github/workflows/module2-stars.yml`** — typecheck, build, `test:module2` (path-filtered).
- **`.github/workflows/module1-hips.yml`** — includes **`fileTileRepository.ts`**; run **`test:module1`** when touching tile merge.

### Suggested next coding targets (not done)

1. **G4** — extend deterministic coverage further (e.g. full `StarsModule` projection replay, frame-pacing traces) beyond **`computeModule2PortFingerprint`** (**EV-0043**, **EV-0054**, **EV-0074**, **EV-0075**, **EV-0076**, **EV-0082**).
2. **`stars.c`** — `stars_list` / `stars_add_data_source` datasource/list seams (survey-wide loaded-tile `obj_get_by_hip` is now landed in **EV-0075**; traversal loop landed in **EV-0074**).
3. **Tests** — synthetic fixtures: if a star uses a fake **`HIP N`** with coordinates that do not match **`PIX_ORDER_2`**, merge will drop it (**EV-0042**); use no-HIP ids or catalog-consistent RA/Dec.
4. **Runtime blockers before deeper parity:** profile frame pacing with active sky scene + overlays now that primary toolbar toggles are runtime-wired; treat this as P0 before additional UI parity deltas.

### Fixture pitfall (tests)

**`test_file_backed_tile_repository_gaia_flow.test.js`** uses a Hipparcos placeholder star **`fixture-hipparcos-no-hip`** (no `HIP` / `hip-` id) so multi-survey merge tests are not rejected by the HIP consistency rule.
