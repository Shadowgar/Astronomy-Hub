# Module 0 — Source contract (G1 anchor)

This document **freezes** the Astronomy Hub ↔ Stellarium Web Engine **entrypoint mapping** for the **foundation observer / time / matrix / refraction spine** only. It exists to satisfy **G1 SourceContractLock** for the subset that is already implemented; remaining `observer.c` / `core.c` behavior is still **BLOCKED** until listed in inventory and covered here or in a follow-on contract addendum.

**Authority:** `docs/runtime/port/README.md`. If this file conflicts with `module-inventory.md`, reconcile inventory first, then update this contract.

---

## 1. Stellarium sources in scope (this contract)

| Source (under `study/.../src`) | Role |
|---|---|
| `observer.c` | `observer_update` / `_fast` / `_full`, `update_matrices`, `observer_compute_hash` seam |
| `observer.h` | `observer_t` shape (logical; Hub uses TS types) |
| `algos/utctt.c`, `algos/utctt.h` | UTC ↔ TT, UT1−UTC helpers |
| `algos/deltat.c` | ΔT(TT) |
| `algos/refraction.c` | `refraction_prepare` + Saemundsson-style refraction |
| `frames.c`, `frames.h` | Frame conversion (partial; see inventory function table) |
| `navigation.c`, `navigation.h` | Time / direction / FOV update seam (partial) |
| `projection.c`, `projection.h`, `projections/*.c` | Projection math seam (partial) |
| `utils/vec.c`, `utils/vec.h` | Matrix multiply conventions (documented in Hub) |
| `constants.h`, `core.c`, `core.h` | Shared constants / barometric pressure analog |

**Explicitly not in this contract yet:** use of **`astrom`** for apparent-place / **`eraAtciq`** / **`eraAtioq`**, `eraAper13`, `eraPvu`, space mode, `correct_speed_of_light`, `update_nutation_precession_mat` (`eraPn00a` path in C vs Hub `eraPnm06a` path). Those remain **BLOCKED** per `blockers.md` / inventory notes.

**`eraApco` (partial):** full terrestrial **`eraApco`** stack is in `erfaApco.ts` with SOFA `test_ufunc.test_apco` regression — **EV-0016**; **`deriveObserverGeometry`** now calls it and attaches **`astrom`** (UTC `eraEra00` for `theta`, TT **`eraSp00`** for `sp`, **`refa`/`refb` = 0** as in Stellarium before `refraction_prepare`).

**`eraApcs` (partial):** ICRS↔GCRS star-independent block — `erfaApcs.ts`, `test_erfa_apcs.test.js` (**EV-0015**).

**`eraEpv00` (partial):** VSOP2000 Earth PV is ported (`frontend/scripts/generate_erfa_epv00_tables.mjs` → `erfaEpv00Tables.generated.ts`, `erfaEpv00.ts`, `tests/test_erfa_epv00.test.js`). `observerDerivedGeometry` fills **`earthPv`** / **`sunPv`** and passes full **`pvb`** / **`pvh[0]`** into **`eraApco`** (**EV-0014** + plan `module0-eraEpv00-port-plan.md`).

---

## 2. Frozen Hub targets (paths relative to repo root)

| Concern | Hub files (do not rename without updating this contract + inventory) |
|---|---|
| Observer hash gate + frame tick | `frontend/src/features/sky-engine/engine/sky/runtime/SkyObserverService.ts` |
| Observer partial / full update hash | `frontend/src/features/sky-engine/engine/sky/runtime/observerUpdateHash.ts` |
| Derived geometry (matrices, TT/UT1/UTC, refraction, BPN, CIP/s/EO, MJD seam) | `frontend/src/features/sky-engine/engine/sky/runtime/observerDerivedGeometry.ts` |
| Polar motion + `astrom` scalar seam stubs | `frontend/src/features/sky-engine/engine/sky/runtime/observerParityStubs.ts` |
| Time scales, leap table, ΔT, UT1 JD | `frontend/src/features/sky-engine/engine/sky/runtime/timeScales.ts` |
| ERA, Earth rotation | `frontend/src/features/sky-engine/engine/sky/runtime/erfaEarthRotation.ts` |
| IAU2006 / BPN / nutation / ecliptic / Earth PV / `eraApcs` / `eraApco` | `frontend/src/features/sky-engine/engine/sky/runtime/erfaIau2006.ts`, `erfaPnm06a.ts`, `erfaNut00a.ts`, `erfaNut00aTables.generated.ts`, `erfaEpv00.ts`, `erfaEpv00Tables.generated.ts`, `erfaApcs.ts`, `erfaApco.ts`, `erfaBpn2xy.ts`, `erfaS06.ts`, `erfaEors.ts` |
| Fundamental arguments | `frontend/src/features/sky-engine/engine/sky/runtime/erfaFundamentalArguments.ts` |
| Constants | `frontend/src/features/sky-engine/engine/sky/runtime/erfaConstants.ts` |
| Scene clock + deterministic mode | `frontend/src/features/sky-engine/engine/sky/runtime/SkyClockService.ts` |
| Refraction + barometric pressure + coordinate transforms | `frontend/src/features/sky-engine/engine/sky/transforms/coordinates.ts` |
| Module 0 deterministic fingerprint (G4) | `frontend/src/features/sky-engine/engine/sky/runtime/module0ParityFingerprint.ts` |
| Regression: observer / time / ERFA / replay | `frontend/tests/test_sky_observer_service.test.js`, `test_time_scales.test.js`, `test_erfa_nutation.test.js`, `test_erfa_epv00.test.js`, `test_erfa_apcs.test.js`, `test_erfa_apco.test.js`, `test_module0_deterministic_replay.test.js` |

---

## 3. Behavioral contracts (non-bit-identical until G5)

1. **Matrix multiply order:** Stellarium `mat3_mul` / `vec.h` row-storage matches Hub `multiplyMatrix3Erfa` / `observerDerivedGeometry` comments (`ri2v` = `ri2h × ro2v`, `rc2v` = `bpn^T × ri2h × ro2v`).
2. **Hash gate:** Stellarium `observer_compute_hash` XOR over packed structs; Hub `computeObserverUpdateHash` uses string + **TT Julian date** (see `observerUpdateHash.ts`). **G5** must document any intentional divergence.
3. **Full update:** Hub calls **`eraEpv00`** (TT split `2400000.5` + `ttJulianDate − 2400000.5`) for **`earthPv`** / **`sunPv`** and **`eraApco`** with the same split for **`astrom`** (see §1). Apparent-place use of **`astrom`** and ERFA refraction constants on **`astrom.refa`/`refb`** remain unported.

---

## 4. Change control

- Any rename, split, or move of a file listed in §2 requires: update this document, `module-inventory.md` mapping rows, and add/adjust evidence in `evidence-index.md`.
- New ERFA ports that affect observer matrices belong in `runtime/erfa*.ts` or an addendum subsection here before claiming **G1 PASS** for the expanded surface.

---

## 5. Gate status (informational)

| Gate | Note |
|---|---|
| G1 | **Partially satisfied** by this document for the §1–§2 spine; **overall G1** for all of module 0 remains **FAIL** until every module 0 source file in `module-inventory.md` is under an explicit contract or `OUT-OF-SCOPE` approval. |
| G4 | Hub five-case fingerprint: **EV-0011**; **BLK-000** remains **OPEN** until reference replay is implemented. |
