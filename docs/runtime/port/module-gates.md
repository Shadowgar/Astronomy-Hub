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

## Status Legend

- `PASS`
- `FAIL`
- `BLOCKED`
- `N/A`

## Module Gate Table

| Module | G0 | G1 | G2 | G3 | G4 | G5 | G6 | G7 | Overall |
|---|---|---|---|---|---|---|---|---|---|
| module0-foundation-lock | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | FAIL | BLOCKED |
| module1-hips-kernel | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module2-stars-full | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module3-dso-full | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module4-dss-full | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module5-satellites-full | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module6-labels-overlays | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module7-remaining-swe | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| module8-global-final-gate | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

### Execution order vs inventory (`README.md`)

**Module Completion Rule** (`port/README.md`): each module must pass **all** gates in the checklist (inventory lock through evidence closure) **before** the **next** module is treated as the active completion target. Until then, downstream modules stay **`N/A`** here — that is the strict “one module to ~100% (all gates **PASS** / **COMPLETE**) before the next” plan.

**Inventory file** (`module-inventory.md`) is separate: **global G0** stays **FAIL** while **any** source file row is still **`UNMAPPED`**, across all planned modules. Filling rows early is **documentation only**; it does **not** mean module 1 has “started” in the completion-rule sense while module 0 is still **`BLOCKED`**.

**Module 0 subset:** every file row with `Planned Module == module0-foundation-lock` is **`PORTED`** or **`BLOCKED`** with an AH mapping (no **`UNMAPPED`** in that subset). **BLK-000** (G4 tier-1) is **RESOLVED**; **BLK-002** (G5 PyERFA `apco` second runtime vs Hub) is **RESOLVED** (**EV-0018**). Optional native Stellarium C / WASM matrix dumps remain out of scope for that blocker. Passing all module 0 gates is still required before module 0 can go **COMPLETE**.

**G1 (module 0):** `module0-source-contract.md` freezes the **implemented** observer/time/ERFA/refraction Hub paths vs Stellarium §1 sources. **Overall G1** stays **FAIL** until the rest of module 0 files are either under contract extensions or **`OUT-OF-SCOPE`** with approval.

## Rules

- A module can be `COMPLETE` only if every gate is `PASS`.
- Any `UNMAPPED` in module inventory forces `G0=FAIL`.
- `BLOCKED` must include an entry in `blockers.md`.
