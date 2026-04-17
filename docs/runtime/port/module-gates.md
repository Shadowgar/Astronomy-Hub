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

## Rules

- A module can be `COMPLETE` only if every gate is `PASS`.
- Any `UNMAPPED` in module inventory forces `G0=FAIL`.
- `BLOCKED` must include an entry in `blockers.md`.
