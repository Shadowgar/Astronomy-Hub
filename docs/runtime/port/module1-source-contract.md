# Module 1 — HiPS / tile / eph kernel (G1 anchor)

This document freezes the Astronomy Hub ↔ Stellarium **`module1-hips-kernel`** inventory mapping for the **implemented** star-tile, Eph tile codec, and HEALPix helper surface. Full Stellarium **`hips.c`** / imagery HiPS parity remains **BLOCKED** per `module-inventory.md` until a later G5 wave.

**Authority:** `docs/runtime/port/README.md`. Reconcile **`module-inventory.md`** before changing Hub paths here.

---

## 1. Stellarium sources in scope (this contract)

| Source (under `study/.../src`) | Role |
|---|---|
| `hips.c`, `hips.h` | HiPS survey runtime (Hub: partial — catalog tiles + healpix helpers, not full imagery HiPS). |
| `eph-file.c`, `eph-file.h` | Packed Eph tile blobs — mirrored by **`ephCodec`** for Gaia/Hipparcos tile payloads. |
| `utils/cache.c`, `utils/cache.h` | Tile/cache seam (Hub uses TS repositories + browser caches; not 1:1). |
| `utils/worker.c`, `utils/worker.h` | Async worker seam (Hub: Promise-based loaders). |
| `algos/healpix.c` | HEALPix indexing — Hub **`healpix.ts`** (subset aligned with tile addressing). |

---

## 2. Frozen Hub targets (paths relative to repo root)

| Concern | Hub files |
|---|---|
| File-backed Hipparcos/Gaia tile repository | `frontend/src/features/sky-engine/engine/sky/adapters/fileTileRepository.ts` |
| Module1 G4 tile-load fingerprint (deterministic replay) | `frontend/src/features/sky-engine/engine/sky/runtime/module1ParityFingerprint.ts` |
| Eph / survey property codec | `frontend/src/features/sky-engine/engine/sky/adapters/ephCodec.ts` (`decodeEphTile`, **`decodeEphTileNuniq`** / **`encodeEphTileNuniq`** ↔ `eph-file.c` tile header) |
| HEALPix helpers | `frontend/src/features/sky-engine/engine/sky/adapters/healpix.ts` |
| Mock tiles (tests) | `frontend/src/features/sky-engine/engine/sky/adapters/mockTileRepository.ts` |
| Tile index / query | `frontend/src/features/sky-engine/engine/sky/core/tileIndex.ts` (and related `contracts/tiles`) |

---

## 3. Behavioral notes (non–bit-identical until G5)

1. **Star surveys** use built-in manifests under `public/sky-engine-assets/` (Hipparcos; optional Gaia via `mirror:gaia`). Stellarium Web Engine HiPS **image** surveys are not ported here.
2. **RA wrap seam (G3):** repository bounds checks now treat `raMinDeg > raMaxDeg` as a wrap interval crossing `0°` for both healpix pixel preselection and final star clipping (`fileTileRepository.ts` helpers + `test_file_backed_tile_repository_bounds.test.js`, **EV-0022**).
3. **Gaia activation flow seam (G3):** integration test covers narrow-FOV Gaia activation path (`properties` + mirror manifest + HiPS tile fetch + `decodeEphTile` merge with in-bounds filtering) in `test_file_backed_tile_repository_gaia_flow.test.js` (**EV-0023**).
4. **`test_close_fov_star_counts.test.js`** exercises wide-to-close FOV against real assets and may **time out** without full local catalogs — it is **not** part of the default **`npm run test:module1`** bundle (see **`evidence-index.md` EV-0020**).

---

## 4. Change control

Renames or new Hub adapters in §2 require updates to **`module-inventory.md`**, this file, and **`evidence-index.md`**.

---

## 5. Gate status (informational)

| Gate | Note |
|---|---|
| G1 | **PASS** for the §1–§2 mapped subset; remaining **`BLOCKED`** C rows in inventory are out of this contract’s behavioral freeze. |
| G3 | Runtime-path proofs for RA wrap bounds handling and Gaia activation/merge flow (**EV-0022**, **EV-0023**). |
| G4 | **`computeModule1TileLoadFingerprint`** + `tests/test_module1_deterministic_replay.test.js` snapshot (**EV-0024**). |
| G2 (partial) | EPH **`nuniq`** decode/encode aligned with Stellarium **`eph_read_tile_header`** (**EV-0025**). |
| G6 | **`npm run test:module1`** (see **EV-0020**, **EV-0022**, **EV-0023**, **EV-0024**, **EV-0025**). |

---

## 6. Inventory cross-reference

All rows where **`Planned Module` = `module1-hips-kernel`** live in **`docs/runtime/port/module-inventory.md`**.
