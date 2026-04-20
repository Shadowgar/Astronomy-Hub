# Module 1 — HiPS / tile / eph kernel (G1 anchor)

This document freezes the Astronomy Hub ↔ Stellarium **`module1-hips-kernel`** inventory mapping for the **implemented** star-tile, Eph tile codec, and HEALPix helper surface. Full Stellarium **`hips.c`** / imagery HiPS parity remains **BLOCKED** per `module-inventory.md` until a later G5 wave.

**Authority:** `docs/runtime/port/README.md`. Reconcile **`module-inventory.md`** before changing Hub paths here.

---

## 1. Stellarium sources in scope (this contract)

| Source (under pinned upstream `src/`) | Role |
|---|---|
| `hips.c`, `hips.h` | HiPS survey runtime (Hub: partial — catalog tiles + healpix helpers; reference **`hips_get_render_order`** in **`hipsRenderOrder.ts`**, **EV-0029**; not full imagery HiPS). |
| `eph-file.c`, `eph-file.h` | Packed Eph tile blobs — mirrored by **`ephCodec`** for Gaia/Hipparcos tile payloads. |
| `utils/cache.c`, `utils/cache.h` | Tile/cache seam (Hub uses TS repositories + browser caches; not 1:1). |
| `utils/worker.c`, `utils/worker.h` | Async worker seam (Hub: Promise-based loaders). |
| `algos/healpix.c` | HEALPix indexing — Hub **`healpix.ts`** (subset aligned with tile addressing). |

---

## 2. Frozen Hub targets (paths relative to repo root)

| Concern | Hub files |
|---|---|
| File-backed Hipparcos/Gaia tile repository | `frontend/src/features/sky-engine/engine/sky/adapters/fileTileRepository.ts` (Gaia HEALPix order: **`resolveGaiaHealpixOrder`** + optional **`SkyEngineQuery.hipsViewport`**, **EV-0030**) |
| Module1 G4 tile-load fingerprint (deterministic replay) | `frontend/src/features/sky-engine/engine/sky/runtime/module1ParityFingerprint.ts` |
| Eph / survey property codec | `frontend/src/features/sky-engine/engine/sky/adapters/ephCodec.ts` (`decodeEphTile`, **`decodeEphTileNuniq`** / **`encodeEphTileNuniq`**, **`shuffleEphTableBytes`**, **`convertEphFloat`** + exported **`EPH_UNIT_*`** ↔ `eph-file.c` header / `eph_shuffle_bytes` / `eph_convert_f`) |
| HEALPix helpers | `frontend/src/features/sky-engine/engine/sky/adapters/healpix.ts` (nest **`ang2pix`** / **`pix2ang`** port; **`tests/test_healpix.test.js`**) |
| Mock tiles (tests) | `frontend/src/features/sky-engine/engine/sky/adapters/mockTileRepository.ts` |
| Tile index / query | `frontend/src/features/sky-engine/engine/sky/core/tileIndex.ts` and `contracts/tiles` (**`SkyEngineQuery.hipsViewport`** for Gaia order, **EV-0030**) |
| Visible tile selection | `frontend/src/features/sky-engine/engine/sky/core/tileSelection.ts` (`selectVisibleTileIds`; **`tests/test_tile_selection.test.js`**, **EV-0028**) |
| HiPS render order (reference) | `frontend/src/features/sky-engine/engine/sky/adapters/hipsRenderOrder.ts` (`hipsGetRenderOrderUnclamped`, `clampHipsRenderOrder`, **`formatHipsViewportKey`**; **`tests/test_hips_render_order.test.js`**, **EV-0029**) |

---

## 3. Behavioral notes (non–bit-identical until G5)

1. **Star surveys** use built-in manifests under `public/sky-engine-assets/` (Hipparcos; optional Gaia via `mirror:gaia`). Stellarium Web Engine HiPS **image** surveys are not ported here.
2. **RA wrap seam (G3):** repository bounds checks now treat `raMinDeg > raMaxDeg` as a wrap interval crossing `0°` for both healpix pixel preselection and final star clipping (`fileTileRepository.ts` helpers + `test_file_backed_tile_repository_bounds.test.js`, **EV-0022**).
3. **Gaia activation flow seam (G3):** integration test covers narrow-FOV Gaia activation path (`properties` + mirror manifest + HiPS tile fetch + `decodeEphTile` merge with in-bounds filtering) in `test_file_backed_tile_repository_gaia_flow.test.js` (**EV-0023**).
4. **`test_close_fov_star_counts.test.js`** exercises wide-to-close FOV against real catalogs and may **time out** without full local assets — it is **not** part of the default **`npm run test:module1`** bundle (see **`evidence-index.md` EV-0020**).
5. **Tile traversal depth:** **`selectVisibleTileIds`** uses **`max(magnitude-tier depth, clampHipsRenderOrder(hipsGetRenderOrderUnclamped(viewport), 0, maxTileLevel))`** where **`viewport`** is **`hipsViewport`** on **`SkyEngineQuery`** when present, otherwise **`buildSyntheticHipsViewportForTileSelection`** (canonical 1920×1080 + **`buildCanonicalSkyProjectionViewForFov`**) (**EV-0032**). View intersection still uses **`max(10°, 0.85×FOV)`** (edge coverage vs full **`hips_render`** culling — inventory **`hips.c`** imagery path remains deferred).
6. **HiPS render order:** **`hipsGetRenderOrderUnclamped`** mirrors **`hips_get_render_order`**; **`clampHipsRenderOrder`** mirrors post-clamp **`fmin(..., 9)`**. **`projectionMat11`** on **`SkyEngineHipsViewport`** is **normalized** (**`projectionScalePx / windowHeightPx`**) for the **`hips.c`** ratio (**EV-0032**). **`resolveGaiaHealpixOrder`** combines quadtree **`minOrder + level`** with screen order when **`hipsViewport`** is set (**EV-0030**). **`SkyEngineScene`** supplies normalized **`hipsViewport`** and **`buildRuntimeTileQuerySignature`** includes it (**EV-0031**).

---

## 4. Change control

Renames or new Hub adapters in §2 require updates to **`module-inventory.md`**, this file, and **`evidence-index.md`**.

---

## 5. Gate status (informational)

| Gate | Note |
|---|---|
| G1 | **PASS** for the §1–§2 mapped subset; remaining **`BLOCKED`** C rows in inventory are out of this contract’s behavioral freeze. |
| G2 | EPH **`nuniq`** (**EV-0025**); **`shuffleEphTableBytes`** (**EV-0026**); **`convertEphFloat`** (**EV-0027**); Hipparcos depth from **`hips_get_render_order`** (**EV-0032**). |
| G3 | RA wrap / Gaia / HEALPix / tile tests (**EV-0022**–**EV-0028**); **`hipsViewport`** on **`buildSkyEngineQuery`** (**EV-0033**). |
| G4 | **`computeModule1TileLoadFingerprint`** + `tests/test_module1_deterministic_replay.test.js` snapshot (**EV-0024**). |
| G5 | **`hips_get_render_order`** + Gaia order + normalized viewport (**EV-0029**–**EV-0032**); Hub regression checkpoints (**EV-0034**). |
| G6–G7 | **`npm run typecheck`**, **`npm run build`**, **`npm run test:module1`** (**EV-0034**); **`module-gates.md`** + **`evidence-index.md`**. |

---

## 6. Inventory cross-reference

All rows where **`Planned Module` = `module1-hips-kernel`** live in **`docs/runtime/port/module-inventory.md`**.
