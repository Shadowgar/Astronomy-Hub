# Module 2 — Stars full (G1 anchor)

This document **freezes** the Astronomy Hub ↔ Stellarium Web Engine **initial mapping** for **`module2-stars-full`** inventory rows (`hip.c` / `hip.h` / `stars.c` / `bv_to_rgb.c`). It satisfies **G1 SourceContractLock** for the **declared Hub surface** in §2; **line-level C parity** and **G2–G7** closure are **blocked** until **`BLK-003`** in **`blockers.md`** (Stellarium sources available under `study/`).

**Authority:** `docs/runtime/port/README.md`. Reconcile **`module-inventory.md`** before changing Hub paths here.

---

## 1. Stellarium sources in scope (inventory rows)

Paths are relative to the Stellarium Web Engine tree referenced by **`module-inventory.md`** (expected under `study/.../src` once **BLK-003** is resolved).

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
| B−V–based display color (heuristic until `bv_to_rgb.c` port) | `frontend/src/features/sky-engine/starRenderer.ts` (`resolveStarColorHex`, `getStarRenderProfileForMagnitude`) |
| Stellarium point-size / tonemapper-style magnitude | `frontend/src/features/sky-engine/engine/sky/core/stellariumVisualMath.ts`; used from `starRenderer.ts` |
| Stars runtime module (projection, limits, projected star list) | `frontend/src/features/sky-engine/engine/sky/runtime/modules/StarsModule.ts`, `runtimeFrame.ts` (`collectProjectedStars`, …) |
| Star billboards / layer sync | `frontend/src/features/sky-engine/starObjectRenderer.ts`, `directStarLayer.ts` |
| Catalog → scene objects (non-tile backends) | `frontend/src/features/sky-engine/astronomy.ts` (`computeRealSkySceneObjects`, …) |
| Typed star payload from tiles | `frontend/src/features/sky-engine/engine/sky/contracts/stars.ts` (`RuntimeStar`) |

---

## 3. Behavioral notes

1. **`BLK-003`:** There is **no** `study/**/*.c` tree in this workspace today, so §1 sources cannot be diffed or ported line-by-line. **Exit:** vendored or submodule path documented in **`blockers.md`**.
2. **`resolveStarColorHex`** is a **Hub curve**, not a verified port of **`bv_to_rgb.c`** — **G2** debt until source is available and a golden or side-by-side check exists.
3. **Module 1** already implements Eph tiles + HiPS order; **module 2** focuses on **stars module + color + point pipeline**, not duplicating **`eph-file.c`** (see **`module1-source-contract.md`**).

---

## 4. Change control

- Renames or new Hub files in §2 require updates to this document, **`module-inventory.md`** notes (if mapping changes), and **`evidence-index.md`**.
- Do not claim **G5** parity for §1 until **BLK-003** is **RESOLVED** or an approved alternative reference (e.g. pasted excerpts with version pin) is recorded in evidence.

---

## 5. Gate status (informational)

| Gate | Note |
|---|---|
| G0 | **PASS** — four `module2-stars-full` file rows exist in **`module-inventory.md`** with **`BLOCKED`** + Planned Module. |
| G1 | **PASS** for §1–§2 mapping as written; **G2–G7** remain **FAIL** until **`BLK-003`** and implementation/evidence waves. |

---

## 6. Inventory cross-reference

Rows: **`src/hip.c`**, **`src/hip.h`**, **`src/modules/stars.c`**, **`src/algos/bv_to_rgb.c`** — see **`docs/runtime/port/module-inventory.md`**.
