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
6. Hub lookup helper **`findRuntimeStarByHipInTiles`** follows `obj_get_by_hip` intent: invalid HIP mapping => null, Gaia rows skipped, first non-Gaia HIP match returned (**EV-0044**).
7. `SkyEngineScene` runtime star-object assembly now consumes the helper and surfaces HIP lookup status in star `truthNote` on the live scene path (**EV-0045**).
8. HIP-backed stars now carry stable detail route identity **`hip/<id>`** for runtime selection/detail continuity (**EV-0046**).
9. Selection state uses stable HIP `detailRoute` fallback and then rebinds `selectedObjectId` to the active runtime object id when survey tile ids change (**EV-0047**).
10. HUD controls are grouped around the same top-bar and bottom-bar composition used by the reference UI while preserving current runtime hooks (**EV-0049**, **EV-0050**).
11. Earlier experimental left/right dock UI passes are historical only and were reverted to keep parity with reference composition (see **`evidence-index.md`** notes for **EV-0051** and **EV-0052**).
12. Upstream toolbar SVG assets are vendored under **`frontend/public/stellarium-web/`** and wired via **`stellariumWebUiAssets.ts`** so runtime UI is self-contained (**EV-0053**).
13. **`computeModule2PortFingerprint`** includes **`coreGetPointForMagnitude`** samples and a view-tier/label-cap mirror of **`resolveViewTier`** for stronger G4 drift detection (**EV-0054**).
14. User-facing branding in the Sky-Engine UI must not show the word `Stellarium`; preserve parity through structure/behavior/assets instead of upstream branding text.
15. Runtime stabilization pass: scene model sync cadence increased to `500ms` and wide-FOV repository query floor pinned to `6.5` to reduce lag and avoid near-empty star loads at startup (**EV-0057**). This is a stability stopgap, not final parity closure.
16. Runtime projection stabilization: projected star count is capped by FOV tier (`>=90°: 2500`, `>=40°: 4500`, `>=15°: 7000`, else `12000`) and render-side limiting-magnitude floor also pins to `6.5` in `collectProjectedStars` to reduce frame churn while preserving visible stars during recovery (**EV-0058**).
17. Toolbar interaction wiring: Deep Sky / Atmosphere / Landscape / Night Mode toggles now flow through shared `aidVisibility` state and directly gate runtime modules/layers, replacing UI-local-only toggle behavior (**EV-0059**).
18. Additional lag mitigation: scene-model sync cadence is throttled to `1000ms`, and projected-star caps were tightened (`>=90°: 1200`, `>=40°: 2200`, `>=15°: 3500`, else `5000`) to reduce visible stutter on constrained hardware while parity work continues (**EV-0060**).
19. Deterministic replay was extended to include active runtime perf knobs (`syncCadenceMs` and sampled FOV `starCap` tiers) so parity snapshots now catch unintended drift in stabilization settings (**EV-0061**).

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
| G2 | **Partial** — **`bv_to_rgb`** (**EV-0038**); **`nuniq_to_pix`** via **`starsNuniq.ts`** (**EV-0039**); **`render_visitor` limit_mag policy** (**EV-0040**); **`hip_get_pix`** (**EV-0041**); full **`stars.c`** render path / remaining **`hip.c`** loaders still open. |
| G3 | **Partial** — Hipparcos **`mergeSurveyTiles`** uses **`runtimeStarMatchesHipHealpixLookup`** (**EV-0042**); `obj_get_by_hip` helper + scene wiring + stable HIP route identity + selection continuity (**EV-0044**, **EV-0045**, **EV-0046**, **EV-0047**); full **`stars.c`** / object graph still open. |
| G4 | **Partial** — algorithm fingerprint **`computeModule2PortFingerprint`** (**EV-0043**, extended **EV-0054** with point-math + view-tier samples and **EV-0061** with perf-knob samples); full scene/`StarsModule` projection replay still open; tile-load replay remains module 1 **`computeModule1TileLoadFingerprint`** (**EV-0024**). |
| G5–G7 | **FAIL** until parity closure + evidence for remaining §1 scope. |

---

## 6. Inventory cross-reference

Rows: **`src/hip.c`**, **`src/hip.h`**, **`src/modules/stars.c`**, **`src/algos/bv_to_rgb.c`** — see **`docs/runtime/port/module-inventory.md`**.

---

## 7. Handoff for external agents (e.g. Codex / new chat)

Read first: **`docs/runtime/port/stellarium-web-engine-src.md`** (pinned commit), **`docs/runtime/port/evidence-index.md`** (EV-0038–EV-0056), this file §2–§5.

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
| `hip_get_pix` + table | `frontend/src/features/sky-engine/engine/sky/adapters/hipGetPix.ts`, vendored **`hipPixOrder2.generated.ts`** |
| `obj_get_by_hip`-style lookup | `frontend/src/features/sky-engine/engine/sky/adapters/starsLookup.ts` (`findRuntimeStarByHipInTiles`) |
| HIP detail route identity | `frontend/src/features/sky-engine/engine/sky/adapters/starsLookup.ts` (`buildHipDetailRoute`), `frontend/src/features/sky-engine/SkyEngineScene.tsx` (`detailRoute`) |
| Selection continuity | `frontend/src/features/sky-engine/useSkyEngineSelection.ts` (`resolveSelectedObjectWithDetailRoute`) |
| Hipparcos merge + HIP check | `frontend/src/features/sky-engine/engine/sky/adapters/fileTileRepository.ts` (`filterSurveyStarsForMerge` → `runtimeStarMatchesHipHealpixLookup`) |
| Public exports | `frontend/src/features/sky-engine/engine/sky/index.ts` |
| Stellarium simple-html UI assets (toolbar SVGs) | `frontend/public/stellarium-web/`, `frontend/src/pages/stellariumWebUiAssets.ts`, `frontend/src/pages/SkyEnginePage.tsx` (**EV-0053**) |
| G4 port fingerprint | `frontend/src/features/sky-engine/engine/sky/runtime/module2ParityFingerprint.ts`; tests **`test_module2_deterministic_replay.test.js`** (**EV-0043**) |

### Commands (from `frontend/`)

- `npm run typecheck` — required before claiming done.
- `npm run build` — production bundle (note: **`hipPixOrder2.generated.ts`** embeds ~120 KB table as base64; optional future work: lazy load).
- `npm run test:module2` — module 2 Vitest bundle (BV, nuniq, limit mag, HIP).
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


### CI

- **`.github/workflows/module2-stars.yml`** — typecheck, build, `test:module2` (path-filtered).
- **`.github/workflows/module1-hips.yml`** — includes **`fileTileRepository.ts`**; run **`test:module1`** when touching tile merge.

### Suggested next coding targets (not done)

1. **`stars.c`** — render path, surveys, `obj_get_by_hip`-style resolution beyond current tile merge; align with pinned C where Hub exposes stars objects.
2. **G4** — extend deterministic coverage further (e.g. **`StarsModule`** projection cache signature / scene packet slice) beyond **`computeModule2PortFingerprint`** (**EV-0043**, **EV-0054**).
3. **Tests** — synthetic fixtures: if a star uses a fake **`HIP N`** with coordinates that do not match **`PIX_ORDER_2`**, merge will drop it (**EV-0042**); use no-HIP ids or catalog-consistent RA/Dec.
4. **Runtime blockers before deeper parity:** profile frame pacing with active sky scene + overlays now that primary toolbar toggles are runtime-wired; treat this as P0 before additional UI parity deltas.

### Fixture pitfall (tests)

**`test_file_backed_tile_repository_gaia_flow.test.js`** uses a Hipparcos placeholder star **`fixture-hipparcos-no-hip`** (no `HIP` / `hip-` id) so multi-survey merge tests are not rejected by the HIP consistency rule.
