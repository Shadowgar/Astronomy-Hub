# Module Gates

This file tracks gate completion for each module in execution order.

Parity policy for all modules: target exact source parity where reference behavior exists (no "style-like" substitutes).

## Gate Definitions

- `G0 InventoryLock`: module source items fully enumerated and mapped.
- `G1 SourceContractLock`: exact source files/functions and AH target files frozen.
- `G2 HeuristicDebtZero`: no active local heuristics where source behavior exists.
- `G3 RuntimePathProof`: modified logic is verified on active update/render path.
- `G4 DeterministicReplay`: repeated runs stable for fixed observer/time/FOV profile.
- `G5 SideBySideParity`: Hub/Stellarium module checkpoints pass 100%.
- `G6 RegressionBuild`: tests, typecheck, build, and required probes pass.
- `G7 EvidenceDocsClosure`: evidence bundle complete and linked.

**Module 0–7 G6 scope:** Until **`module8-global-final-gate`**, **G6** for an active module means **`npm run typecheck`**, **`npm run build`**, and the **Vitest regression bundle** listed for that module in **`evidence-index.md`** (not necessarily the entire frontend `npm test`, which may include downstream UI tests unrelated to the module under closure). **Module 8** adds repo-wide test closure as the final gate.

## Status Legend

- `PASS`
- `FAIL`
- `BLOCKED`
- `N/A`

## Module Gate Table

| Module | G0 | G1 | G2 | G3 | G4 | G5 | G6 | G7 | Overall |
|---|---|---|---|---|---|---|---|---|---|
| module0-foundation-lock | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | COMPLETE |
| module1-hips-kernel | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | COMPLETE |
| module2-stars-full | PASS | PASS | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | BLOCKED |
| module3-dso-full | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module4-dss-full | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module5-satellites-full | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module6-labels-overlays | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module7-remaining-swe | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module8-global-final-gate | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

*Module 2: gate columns remain **`FAIL`** until each gate is fully **`PASS`**; partial Hub work is documented in **`module2-source-contract.md` §5** and **`evidence-index.md`** (**EV-0038**–current).*

### Execution order vs inventory (`README.md`)

**Module Completion Rule** (`port/README.md`): each module must pass **all** gates in the checklist (inventory lock through evidence closure) **before** the **next** module is treated as the active completion target. Until then, downstream modules stay **`N/A`** here — that is the strict “one module to ~100% (all gates **PASS** / **COMPLETE**) before the next” plan.

**Inventory file** (`module-inventory.md`) is separate: **global G0** (no **`UNMAPPED`** file rows anywhere in the Stellarium `src` inventory) **PASS** as of **2026-04-18** G0 seed — every row is **`PORTED`** or **`BLOCKED`** (or future **`OUT-OF-SCOPE`** with approval). Downstream modules stay **`N/A`** here until the prior module is **`COMPLETE`** per the execution-order rule above.

**Module 0 subset:** every file row with `Planned Module == module0-foundation-lock` is **`PORTED`** or **`BLOCKED`** with an AH mapping (no **`UNMAPPED`** in that subset). **BLK-000** (G4 tier-1) is **RESOLVED**; **BLK-002** (G5 PyERFA `apco` second runtime vs Hub) is **RESOLVED** (**EV-0018**). Optional native Stellarium C / WASM matrix dumps remain out of scope for that blocker.

**Module 0 gate closure (EV-0019):** **G0** — no **`UNMAPPED`** file rows in `module-inventory.md` (2026-04-18 G0 seed). **G1** — `module0-source-contract.md` §1–§2 spine + every module 0 inventory row cross-referenced (§6). **G2** — observer/time/matrix spine uses explicit ERFA ports or documented stubs; no undocumented numeric shortcuts on that path. **G3** — G6 Vitest bundle exercises observer/clock/time/geometry services. **G4** — **EV-0011** + **EV-0017**. **G5** — Hub astrom goldens + PyERFA **EV-0018** (not bit-identical native Stellarium C). **G6** — `npm run typecheck`, `npm run build`, and the Vitest list in **EV-0019**. **G7** — this row + `evidence-index.md` through **EV-0019**.

**G1 (module 0):** `module0-source-contract.md` freezes the **implemented** observer/time/ERFA/refraction Hub paths vs Stellarium §1 sources. **`PORTED`** / **`BLOCKED`** inventory rows outside §1 remain tracked for future port waves; they do not invalidate **G1 PASS** for the closed module 0 gate set.

**Module 1 (hips-kernel) — COMPLETE (**EV-0034**): **G0** — nine `module1-hips-kernel` file rows in `module-inventory.md` (**`BLOCKED`** / deferred C port; inventory-only, not process blockers). **G1** — `module1-source-contract.md`. **G2** — EPH **`nuniq`**, **`shuffleEphTableBytes`**, **`convertEphFloat`** (**EV-0025**–**EV-0027**); Hipparcos quadtree depth from **`hips_get_render_order`** + **`clampHipsRenderOrder`** with **`normalizeProjectionMat11ForHips`** (**EV-0032**), not ad-hoc FOV thresholds. **G3** — RA wrap (**EV-0022**), Gaia merge (**EV-0023**), HEALPix (**EV-0026**), tile selection (**EV-0028**), **`buildSkyEngineQuery` ↔ `hipsViewport`** on visible tiles (**EV-0033**). **G4** — tile-load fingerprint (**EV-0024**). **G5** — Hub regression checkpoints: **`hips_get_render_order`** + Gaia **`resolveGaiaHealpixOrder`** (**EV-0029**–**EV-0031**), normalized viewport + tile depth policy (**EV-0032**); full native **`hips.c`** / worker / cache C parity remains inventory **`BLOCKED`**, not a gate failure for this module’s Hub subset. **G6** — `npm run typecheck`, `npm run build`, **`npm run test:module1`**, **`.github/workflows/module1-hips.yml`** (**EV-0021**, **EV-0034**). **G7** — this row + **`evidence-index.md`** through **EV-0034**. **`test_close_fov_star_counts.test.js`** is intentionally excluded from **`test:module1`** (long-running / asset-heavy; see contract §3).

**Module 2 (stars-full) — active; Overall BLOCKED:** **`module1-hips-kernel`** is **`COMPLETE`** (**EV-0034**). **`G0`/`G1`** promoted (**EV-0036**). **`BLK-003`** **RESOLVED** (**EV-0037**). **`G2` partial:** **`bv_to_rgb`** (**EV-0038**); **`nuniq_to_pix`** (**EV-0039**); **`render_visitor` limit magnitude** (**EV-0040**); **`hip_get_pix` / vendored `hip.inl` table** (**EV-0041**), plus removal of local projected-star floor/cap heuristics and packet-time star/label heuristics on the active stars path (**EV-0063**, **EV-0065**). **`G3` partial:** Hipparcos tile merge + HIP ↔ HEALPix consistency (**EV-0042**), `obj_get_by_hip`-style lookup helper (**EV-0044**), live scene runtime wiring (**EV-0045**), stable HIP detail route identity (**EV-0046**), selection continuity with id-resync (**EV-0047**), top/bottom HUD structure and asset parity passes (**EV-0049**, **EV-0050**, **EV-0053**) with intermediate dock experiments explicitly superseded (**EV-0051**, **EV-0052**), and selected-star projection continuity in active runtime path (**EV-0065**). **`G4` partial:** module 2 port algorithm fingerprint (**EV-0043**, extended **EV-0054**, **EV-0061**). **`G5`–`G7`** **FAIL**. Cross-module regression sweep through module0/module1/module2 bundles is recorded in **EV-0062**. Execution-order note: **EV-0035**. See **`module2-source-contract.md` §7** for agent handoff (files, commands, next steps).

## Rules

- A module can be `COMPLETE` only if every gate is `PASS`.
- Any `UNMAPPED` in module inventory forces `G0=FAIL`.
- Active process blockers use **`BLK-***` rows in `blockers.md`**. **`BLOCKED`** status in `module-inventory.md` alone is normal deferred port work and does not require a **`BLK-***` unless it stops all forward progress.
