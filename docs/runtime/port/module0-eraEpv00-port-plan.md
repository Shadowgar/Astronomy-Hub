# Module 0 — `eraEpv00` port plan

**Goal:** match Stellarium `observer_update_full` (`observer.c` ~211–212) so Hub can fill `earth_pvh` / `earth_pvb` (AU, AU/day) before `eraApco` / aberration chains.

**Source of truth:** `study/stellarium-web-engine/source/stellarium-web-engine-master/ext_src/erfa/erfa.c`, function **`eraEpv00`** (declaration **`int eraEpv00(double date1, double date2, double pvh[2][3], double pvb[2][3])`**).

**Approximate line span in vendored `erfa.c`:** **8619–11152** (body includes DE405-alignment constants, large static harmonic tables for Sun–Earth and SSB–Sun models, then assembly math; next symbol is **`eraEqec06`** at ~11154).

---

## 1. Why not hand-port in one PR

- ~**2.5k** lines, almost entirely **numeric tables** (triplets: amplitude, phase, frequency per term).
- Same pattern as **`erfaNut00a`**: maintain a **generator** that extracts literals from `erfa.c` and writes **`erfaEpv00Tables.generated.ts`**, plus a thin **`erfaEpv00.ts`** that implements the loop structure from the C source.

---

## 2. Recommended implementation sequence

1. **Generator** — `frontend/scripts/generate_erfa_epv00_tables.mjs`  
   - Parse or slice the known line range from `erfa.c` (or copy-paste stable blocks into a sidecar JSON committed under `frontend/scripts/data/` if parsing is too brittle).  
   - Emit TypeScript: one export per table array (`e0x`, `e0y`, … `s2z` per ERFA comments in source), plus `am12`…`am33` scalars.

2. **Runtime** — `frontend/src/features/sky-engine/engine/sky/runtime/erfaEpv00.ts`  
   - Signature aligned with ERFA: return **`0`** or **`+1`** (warning outside 1900–2100 AD per ERFA docs).  
   - Use **`ERFA_DJ00`**, **`ERFA_DJC`**, **`ERFA_DAS2R`**, **`ERFA_D2PI`** from `erfaConstants.ts` as today.  
   - TT split: match Stellarium / Hub convention **`eraPnm06a` / `eraS06`**: **`date1 = 2400000.5`**, **`date2 = ttJulianDate - 2400000.5`** (TDB ≈ TT).

3. **Tests** — `frontend/tests/test_erfa_epv00.test.js`  
   - Golden **`pvh` / `pvb`** at 2–3 Julian dates (e.g. J2000, 2024-06-21 TT, one edge 1899 or 2101 for status `+1`) generated once from the same `erfa.c` build or SOFA/ERFA reference.  
   - Assert status and **tight tolerance** on position (km-level model error is documented in ERFA header).

4. **Integration** — `observerDerivedGeometry.ts` (or a dedicated PV module called from it)  
   - Replace placeholder **`earthPv` / `sunPv`** zeros when **`eraEpv00`** returns **`0`** or **`+1`**.  
   - Extend **`module0ParityFingerprint.ts`** to include flattened **`pvh`/`pvb`** (update snapshot **once** after goldens land).

5. **Docs** — update **`module0-source-contract.md`** §1/§3 to move **`eraEpv00`** from “not in contract” to **PORTED** with evidence row.

---

## 3. Dependencies / risks

- **No new runtime deps:** pure TS + existing constants.  
- **File size:** generated tables may be **hundreds of KB**; acceptable if tree-shaken or lazy-loaded is not required for first pass.  
- **`eraApco`:** still needed for full `astrom`; **`eraEpv00`** alone does not close **`observer_update_full`**.

---

## 4. Exit check (for this workstream)

- [ ] Generator committed and reproducible (`node frontend/scripts/generate_erfa_epv00_tables.mjs`).  
- [ ] `eraEpv00` tests green; fingerprint snapshot updated if PV included.  
- [ ] `module-inventory.md` / contract / evidence index updated.
