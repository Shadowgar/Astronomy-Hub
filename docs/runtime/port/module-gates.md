# Module Gates

This file tracks gate completion for each module in execution order.

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
| module1-hips-kernel | PASS | PASS | FAIL | FAIL | FAIL | FAIL | PASS | FAIL | BLOCKED |
| module2-stars-full | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module3-dso-full | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module4-dss-full | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module5-satellites-full | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module6-labels-overlays | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module7-remaining-swe | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module8-global-final-gate | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

### Execution order vs inventory (`README.md`)

**Module Completion Rule** (`port/README.md`): each module must pass **all** gates in the checklist (inventory lock through evidence closure) **before** the **next** module is treated as the active completion target. Until then, downstream modules stay **`N/A`** here — that is the strict “one module to ~100% (all gates **PASS** / **COMPLETE**) before the next” plan.

**Inventory file** (`module-inventory.md`) is separate: **global G0** (no **`UNMAPPED`** file rows anywhere in the Stellarium `src` inventory) **PASS** as of **2026-04-18** G0 seed — every row is **`PORTED`** or **`BLOCKED`** (or future **`OUT-OF-SCOPE`** with approval). Downstream modules stay **`N/A`** here until the prior module is **`COMPLETE`** per the execution-order rule above.

**Module 0 subset:** every file row with `Planned Module == module0-foundation-lock` is **`PORTED`** or **`BLOCKED`** with an AH mapping (no **`UNMAPPED`** in that subset). **BLK-000** (G4 tier-1) is **RESOLVED**; **BLK-002** (G5 PyERFA `apco` second runtime vs Hub) is **RESOLVED** (**EV-0018**). Optional native Stellarium C / WASM matrix dumps remain out of scope for that blocker.

**Module 0 gate closure (EV-0019):** **G0** — no **`UNMAPPED`** file rows in `module-inventory.md` (2026-04-18 G0 seed). **G1** — `module0-source-contract.md` §1–§2 spine + every module 0 inventory row cross-referenced (§6). **G2** — observer/time/matrix spine uses explicit ERFA ports or documented stubs; no undocumented numeric shortcuts on that path. **G3** — G6 Vitest bundle exercises observer/clock/time/geometry services. **G4** — **EV-0011** + **EV-0017**. **G5** — Hub astrom goldens + PyERFA **EV-0018** (not bit-identical native Stellarium C). **G6** — `npm run typecheck`, `npm run build`, and the Vitest list in **EV-0019**. **G7** — this row + `evidence-index.md` through **EV-0019**.

**G1 (module 0):** `module0-source-contract.md` freezes the **implemented** observer/time/ERFA/refraction Hub paths vs Stellarium §1 sources. **`PORTED`** / **`BLOCKED`** inventory rows outside §1 remain tracked for future port waves; they do not invalidate **G1 PASS** for the closed module 0 gate set.

**Module 1 (hips-kernel) — active:** **G0** — nine `module1-hips-kernel` file rows in `module-inventory.md` (**`BLOCKED`** / deferred C port). **G1** — `module1-source-contract.md`. **G2–G5** — not satisfied (heuristic/runtime/replay/parity work pending vs Stellarium HiPS/eph/cache/worker). **G6** — `npm run typecheck`, `npm run build`, **`npm run test:module1`** (**EV-0020**) and CI workflow **`.github/workflows/module1-hips.yml`** (**EV-0021**). **G7** — open until module 1 **`COMPLETE`** evidence. **`test_close_fov_star_counts.test.js`** is intentionally excluded from **`test:module1`** (long-running / asset-heavy; see contract §3).

## Rules

- A module can be `COMPLETE` only if every gate is `PASS`.
- Any `UNMAPPED` in module inventory forces `G0=FAIL`.
- Active process blockers use **`BLK-***` rows in `blockers.md`**. **`BLOCKED`** status in `module-inventory.md` alone is normal deferred port work and does not require a **`BLK-***` unless it stops all forward progress.
