# Module 0 — `eraApco` port plan

**Goal:** match Stellarium `observer_update_full` (`observer.c` ~214–217) for terrestrial observers: **`eraApco(DJM0, tt, earth_pvb, earth_pvh[0], x, y, s, theta, elong, phi, hm, 0, 0, sp, 0, 0, &astrom)`** before `eraEors` / matrix refresh.

**Source of truth:** `study/stellarium-web-engine/source/stellarium-web-engine-master/ext_src/erfa/erfa.c`.

---

## 1. Call graph (what `eraApco` composes)

From `erfa.c` ~1067–1107:

| Step | ERFA symbol | Approx. line | Notes |
|---|---:|---:|---|
| scalars | (inline) | 1072–1086 | `along`, `xpl`, `ypl`, `sphi`, `cphi`, `refa`, `refb` |
| local ERA | `eraAper` | 1635–1732 | `eral = theta + along` |
| CIO matrix | `eraC2ixys` | 4785–4852 | uses `eraIr`, `eraRz`, `eraRy` |
| station PV | `eraPvtob` | 22436–22533 | `eraGd2gc` → `eraPom00` → `eraTrxp`; OM constant |
| rotate PV | `eraTrxpv` | 26225–26261 | `eraTr` + `eraRxpv` |
| ICRS↔GCRS block | **`eraApcs`** | 1337–1505 | **`PORTED`** → `erfaApcs.ts` |
| copy BPN | `eraCr` | 5683–5707 | `eraCp` rows |

**Already in Hub:** `eraEpv00`, `eraPnm06a` / `eraBpn2xy`, `eraS06`, `eraEors`, `localEarthRotationAngleRad` / `eraEra00` path, exported **`eraSp00`** / **`eraEra00FromUtcJulianDate`** in `erfaEarthRotation.ts`, refraction weather scalars in `observerDerivedGeometry`, **`deriveObserverGeometry` → `eraApco`** → **`astrom`**.

---

## 2. Recommended implementation sequence

1. **Low-level helpers** (single module `erfaApcoSupport.ts` or split): `eraCp`, `eraCr`, `eraIr`, `eraRx`, `eraRy`, `eraRz`, `eraRxp`, `eraRxpv`, `eraTr`, `eraTrxp`, `eraTrxpv`, `eraZp`, `eraSxp`, `eraPm`, `eraPn` — most are tiny; keep row-major order identical to ERFA.
2. **`eraC2ixys`** — depends on §1 rotators only.
3. **`eraEform` / `eraGd2gce` / `eraGd2gc`** — WGS84 only is enough for Stellarium path (`eraGd2gc(1, …)`).
4. **`eraPom00`** — polar-motion matrix (zeros in Stellarium call today).
5. **`eraPvtob`** — ties site + PM + ERA to CIRS PV (m, m/s).
6. **`eraApco`** — glue + `eraCr` into `astrom.bpn`.
7. **Hub type** — `EraAstrom` / `SkyObserverDerivedGeometry.astrom` (or narrow seam) matching `erfa.h` `eraASTROM` fields used downstream.
8. **Tests** — golden `astrom` slice vs reference build (PyERFA/ERFA C) once ufunc IO shape is sorted; until then, unit tests per leaf (`eraApcs` ✅) + integration test with frozen numeric snapshot from C.

---

## 3. Dependencies / risks

- **Stellarium `theta` / `eral`:** `observer.c` uses **`eraEra00(DJM0, obs->utc)`** (UTC), not UT1 — Hub **`ri2h`** / **`observerSeam.eralRad`** use **`observerEralStellariumRad`** = same angle as **`astrom.eral`** after **`eraApco`**.
- **`eraASTROM.phi`:** struct field exists in `erfa.h`; `eraApco` does not set it — treat as **unspecified** unless a downstream read appears in study `src/`.
- **Scope creep:** `eraAtioq` / `eraAtciq` are **not** required to declare `eraApco` ported for matrix spine, but they are needed for full apparent-place parity.

---

## 4. Exit check

- [x] `eraApcs` + tests (**`erfaApcs.ts`**, **`test_erfa_apcs.test.js`**).  
- [x] `eraApco` + local helpers + SOFA release-vector test (**`erfaApco.ts`**, **`test_erfa_apco.test.js`**); evidence **EV-0016**.  
- [x] Hub **`astrom`** on `SkyObserverDerivedGeometry` (`observerDerivedGeometry` calls **`eraApco`**; `SkyObserverService` default + `module0ParityFingerprint` extended).  
- [x] `module0-source-contract.md` §1 / §3 updated for live **`astrom`** (apparent-place / `eraAtioq` still future).  
- [x] **`ri2h` / `observerSeam.eralRad`** use **`observerEralStellariumRad`** (= **`astrom.eral`**, UTC `eraEra00` + longitude + `eraSp00`), not UT1-based `localEarthRotationAngleRad`.  
- [ ] Full **`update_matrices`** parity: Stellarium `Rz(eral) × Rpl × Ry(…) × Rsx` then transpose vs Hub’s `Ry × Rz` factorization; polar motion **`Rpl`** when EOP lands.  
- [x] **`eraAb` / `eraLd` / `eraLdsun`**, **`stellariumApparentGcrsToAstrometricIcrsUnit`**, **`stellariumFrameAstrometryFromEraAstrom`** (`erfaAbLdsun.ts`, **`test_erfa_ab_ldsun.test.js`**).  
- [x] **`convertObserverFrameVector`**: when **`stellariumAstrom`** is present, `icrf` ↔ `observed_geom` uses **`astrometric_to_apparent`** + **`bpn^T`** + **`ri2h`** / inverse (`frames.c`); runtime modules attach slice from **`observerAstrometry.astrom`**.  
- [x] **`SkyEngineScene` → `buildSkyEngineQuery`**: **`observerFrameAstrometry`** from **`mergeObserverSnapshotWithDerivedGeometry`**; **`assembleSkyScenePacket`** / **`raDecToObserverUnitVector`** use Module 0 horizontal for Hipparcos/Gaia packet stars.
