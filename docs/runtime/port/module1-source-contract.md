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
| Eph / survey property codec | `frontend/src/features/sky-engine/engine/sky/adapters/ephCodec.ts` |
| HEALPix helpers | `frontend/src/features/sky-engine/engine/sky/adapters/healpix.ts` |
| Mock tiles (tests) | `frontend/src/features/sky-engine/engine/sky/adapters/mockTileRepository.ts` |
| Tile index / query | `frontend/src/features/sky-engine/engine/sky/core/tileIndex.ts` (and related `contracts/tiles`) |

---

## 3. Behavioral notes (non–bit-identical until G5)

1. **Star surveys** use built-in manifests under `public/sky-engine-assets/` (Hipparcos; optional Gaia via `mirror:gaia`). Stellarium Web Engine HiPS **image** surveys are not ported here.
2. **`test_close_fov_star_counts.test.js`** exercises wide-to-close FOV against real assets and may **time out** without full local catalogs — it is **not** part of the default **`npm run test:module1`** bundle (see **`evidence-index.md` EV-0020**).

---

## 4. Change control

Renames or new Hub adapters in §2 require updates to **`module-inventory.md`**, this file, and **`evidence-index.md`**.

---

## 5. Gate status (informational)

| Gate | Note |
|---|---|
| G1 | **PASS** for the §1–§2 mapped subset; remaining **`BLOCKED`** C rows in inventory are out of this contract’s behavioral freeze. |
| G6 | **`npm run test:module1`** (see **EV-0020**). |

---

## 6. Inventory cross-reference

All rows where **`Planned Module` = `module1-hips-kernel`** live in **`docs/runtime/port/module-inventory.md`**.
