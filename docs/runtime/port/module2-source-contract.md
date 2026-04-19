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
| `hip.c` `hip_get_pix` + `hip.inl` lookup | `frontend/src/features/sky-engine/engine/sky/adapters/hipGetPix.ts` (`hipGetPix`); generated **`hipPixOrder2.generated.ts`** via **`npm run generate:hip-pix`**; **`frontend/tests/test_module2_hip_get_pix.test.js`** (**EV-0041**) |
| Stellarium point-size / tonemapper-style magnitude | `frontend/src/features/sky-engine/engine/sky/core/stellariumVisualMath.ts`; used from `starRenderer.ts` |
| Stars runtime module (projection, limits, projected star list) | `frontend/src/features/sky-engine/engine/sky/runtime/modules/StarsModule.ts`, `runtimeFrame.ts` (`collectProjectedStars`, …); **`stellariumPainterLimits.ts`** (`resolveStarsRenderLimitMagnitude`, **EV-0040**) |
| Star billboards / layer sync | `frontend/src/features/sky-engine/starObjectRenderer.ts`, `directStarLayer.ts` |
| Catalog → scene objects (non-tile backends) | `frontend/src/features/sky-engine/astronomy.ts` (`computeRealSkySceneObjects`, …) |
| Typed star payload from tiles | `frontend/src/features/sky-engine/engine/sky/contracts/stars.ts` (`RuntimeStar`) |

---

## 3. Behavioral notes

1. **`BLK-003` (RESOLVED):** Authoritative C sources are pinned in **`stellarium-web-engine-src.md`** (GitHub **`63fb327…`**). A full local checkout may live under `study/` (gitignored); port diffs can use raw.githubusercontent.com or a local clone.
2. **`bvToRgb`** reproduces the **`COLORS`** table and index math from **`bv_to_rgb.c`**; **`resolveStarColorHex`** maps linear RGB to 8-bit sRGB hex for rendering.
3. **Module 1** already implements Eph tiles + HiPS order; **module 2** focuses on **stars module + color + point pipeline**, not duplicating **`eph-file.c`** (see **`module1-source-contract.md`**).
4. **`hip_get_pix`** uses the same **`PIX_ORDER_2`** bytes as Stellarium (**`hip.inl`**); regenerate with **`npm run generate:hip-pix`** when the pinned upstream revision changes (**EV-0041**).

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
| G3–G7 | **FAIL** until runtime/evidence waves for remaining §1 files. |

---

## 6. Inventory cross-reference

Rows: **`src/hip.c`**, **`src/hip.h`**, **`src/modules/stars.c`**, **`src/algos/bv_to_rgb.c`** — see **`docs/runtime/port/module-inventory.md`**.
