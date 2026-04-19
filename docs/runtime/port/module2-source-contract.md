# Module 2 — Stars full (G1 anchor)

This document **freezes** the Astronomy Hub ↔ Stellarium Web Engine **initial mapping** for **`module2-stars-full`** inventory rows (`hip.c` / `hip.h` / `stars.c` / `bv_to_rgb.c`). It satisfies **G1 SourceContractLock** for the **declared Hub surface** in §2; **line-level C parity** and **G2–G7** closure use the pinned Git reference in **`stellarium-web-engine-src.md`** (**`BLK-003`** **RESOLVED**, **EV-0037**); optional local tree under `study/` remains gitignored.

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
| `hip.c` `hip_get_pix` + `hip.inl` lookup | `frontend/src/features/sky-engine/engine/sky/adapters/hipGetPix.ts` (`hipGetPix`, `parseHipIdFromRuntimeStar`, `runtimeStarMatchesHipHealpixLookup`); generated **`hipPixOrder2.generated.ts`** via **`npm run generate:hip-pix`**; **`frontend/tests/test_module2_hip_get_pix.test.js`** (**EV-0041**) |
| Hipparcos tile merge + HIP ↔ HEALPix check | `frontend/src/features/sky-engine/engine/sky/adapters/fileTileRepository.ts` (`mergeSurveyTiles` → **`filterSurveyStarsForMerge`**) (**EV-0042**) |
| `stars.c` `obj_get_by_hip`-style lookup seam | `frontend/src/features/sky-engine/engine/sky/adapters/starsLookup.ts` (`findRuntimeStarByHipInTiles`) + **`test_module2_stars_lookup.test.js`** (**EV-0044**) |
| Scene runtime HIP lookup wiring | `frontend/src/features/sky-engine/SkyEngineScene.tsx` (`buildEngineStarSceneObjects` truth-note uses `findRuntimeStarByHipInTiles`) (**EV-0045**) |
| Stable HIP detail route identity | `frontend/src/features/sky-engine/engine/sky/adapters/starsLookup.ts` (`buildHipDetailRoute`, `resolveHipDetailRouteForRuntimeStar`), `SkyEngineScene.tsx` (`detailRoute = hip/<id>`) (**EV-0046**) |
| Stellarium point-size / tonemapper-style magnitude | `frontend/src/features/sky-engine/engine/sky/core/stellariumVisualMath.ts`; used from `starRenderer.ts` |
| Stars runtime module (projection, limits, projected star list) | `frontend/src/features/sky-engine/engine/sky/runtime/modules/StarsModule.ts`, `runtimeFrame.ts` (`collectProjectedStars`, …); **`stellariumPainterLimits.ts`** (`resolveStarsRenderLimitMagnitude`, **EV-0040**) |
| Star billboards / layer sync | `frontend/src/features/sky-engine/starObjectRenderer.ts`, `directStarLayer.ts` |
| Catalog → scene objects (non-tile backends) | `frontend/src/features/sky-engine/astronomy.ts` (`computeRealSkySceneObjects`, …) |
| Typed star payload from tiles | `frontend/src/features/sky-engine/engine/sky/contracts/stars.ts` (`RuntimeStar`) |
| Module 2 port deterministic replay (G4) | `frontend/src/features/sky-engine/engine/sky/runtime/module2ParityFingerprint.ts` (`computeModule2PortFingerprint`); **`frontend/tests/test_module2_deterministic_replay.test.js`** (**EV-0043**) |

---

## 3. Behavioral notes

1. **`BLK-003` (RESOLVED):** Authoritative C sources are pinned in **`stellarium-web-engine-src.md`** (GitHub **`63fb327…`**). A full local checkout may live under `study/` (gitignored); port diffs can use raw.githubusercontent.com or a local clone.
2. **`bvToRgb`** reproduces the **`COLORS`** table and index math from **`bv_to_rgb.c`**; **`resolveStarColorHex`** maps linear RGB to 8-bit sRGB hex for rendering.
3. **Module 1** already implements Eph tiles + HiPS order; **module 2** focuses on **stars module + color + point pipeline**, not duplicating **`eph-file.c`** (see **`module1-source-contract.md`**).
4. **`hip_get_pix`** uses the same **`PIX_ORDER_2`** bytes as Stellarium (**`hip.inl`**); regenerate with **`npm run generate:hip-pix`** when the pinned upstream revision changes (**EV-0041**).
5. On the Hipparcos survey merge path, stars with a parseable HIP must satisfy **`hip_get_pix(hip, 2) === healpixAngToPix(2, raDeg, decDeg)`** or they are dropped (**EV-0042**).
6. Hub lookup helper **`findRuntimeStarByHipInTiles`** follows `obj_get_by_hip` intent: invalid HIP mapping => null, Gaia rows skipped, first non-Gaia HIP match returned (**EV-0044**).
7. `SkyEngineScene` runtime star-object assembly now consumes the helper and surfaces HIP lookup status in star `truthNote` on the live scene path (**EV-0045**).
8. HIP-backed stars now carry stable detail route identity **`hip/<id>`** for runtime selection/detail continuity (**EV-0046**).

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
| G3 | **Partial** — Hipparcos **`mergeSurveyTiles`** uses **`runtimeStarMatchesHipHealpixLookup`** (**EV-0042**); `obj_get_by_hip` helper + scene wiring + stable HIP route identity (**EV-0044**, **EV-0045**, **EV-0046**); full **`stars.c`** / object graph still open. |
| G4 | **Partial** — algorithm fingerprint **`computeModule2PortFingerprint`** (**EV-0043**); tile-load replay remains module 1 **`computeModule1TileLoadFingerprint`** (**EV-0024**). |
| G5–G7 | **FAIL** until parity closure + evidence for remaining §1 scope. |

---

## 6. Inventory cross-reference

Rows: **`src/hip.c`**, **`src/hip.h`**, **`src/modules/stars.c`**, **`src/algos/bv_to_rgb.c`** — see **`docs/runtime/port/module-inventory.md`**.

---

## 7. Handoff for external agents (e.g. Codex / new chat)

Read first: **`docs/runtime/port/stellarium-web-engine-src.md`** (pinned commit), **`docs/runtime/port/evidence-index.md`** (EV-0038–EV-0046), this file §2–§5.

### Where to implement module 2 work

| Area | Primary Hub paths |
|---|---|
| Stellarium reference | Pin is **`63fb3279e85782158a6df63649f1c8a1837b7846`** — diff against raw `src/` under that commit. |
| B−V → RGB | `frontend/src/features/sky-engine/engine/sky/adapters/bvToRgb.ts`, `frontend/src/features/sky-engine/starRenderer.ts` |
| `nuniq` ↔ tile | `frontend/src/features/sky-engine/engine/sky/adapters/starsNuniq.ts`, `ephCodec.ts` |
| Star render limit magnitude | `frontend/src/features/sky-engine/engine/sky/runtime/stellariumPainterLimits.ts` (`resolveStarsRenderLimitMagnitude`), `runtime/modules/StarsModule.ts` |
| `hip_get_pix` + table | `frontend/src/features/sky-engine/engine/sky/adapters/hipGetPix.ts`, generated **`hipPixOrder2.generated.ts`**, generator **`frontend/scripts/generate_hip_pix_order2.mjs`** (`npm run generate:hip-pix` from `frontend/`) |
| `obj_get_by_hip`-style lookup | `frontend/src/features/sky-engine/engine/sky/adapters/starsLookup.ts` (`findRuntimeStarByHipInTiles`) |
| HIP detail route identity | `frontend/src/features/sky-engine/engine/sky/adapters/starsLookup.ts` (`buildHipDetailRoute`), `frontend/src/features/sky-engine/SkyEngineScene.tsx` (`detailRoute`) |
| Hipparcos merge + HIP check | `frontend/src/features/sky-engine/engine/sky/adapters/fileTileRepository.ts` (`filterSurveyStarsForMerge` → `runtimeStarMatchesHipHealpixLookup`) |
| Public exports | `frontend/src/features/sky-engine/engine/sky/index.ts` |
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

### CI

- **`.github/workflows/module2-stars.yml`** — typecheck, build, `test:module2` (path-filtered).
- **`.github/workflows/module1-hips.yml`** — includes **`fileTileRepository.ts`**; run **`test:module1`** when touching tile merge.

### Suggested next coding targets (not done)

1. **`stars.c`** — render path, surveys, `obj_get_by_hip`-style resolution beyond current tile merge; align with pinned C where Hub exposes stars objects.
2. **G4** — extend deterministic coverage (e.g. **`StarsModule`** / scene packet snapshot) beyond **`computeModule2PortFingerprint`** (**EV-0043**).
3. **Tests** — synthetic fixtures: if a star uses a fake **`HIP N`** with coordinates that do not match **`PIX_ORDER_2`**, merge will drop it (**EV-0042**); use no-HIP ids or catalog-consistent RA/Dec.

### Fixture pitfall (tests)

**`test_file_backed_tile_repository_gaia_flow.test.js`** uses a Hipparcos placeholder star **`fixture-hipparcos-no-hip`** (no `HIP` / `hip-` id) so multi-survey merge tests are not rejected by the HIP consistency rule.
