# Sky Engine Stellarium Port Canon

This directory is the only canonical documentation set for the Stellarium source port into Astronomy Hub Sky Engine.

General Hub docs are frozen for this effort. If there is a conflict between this directory and other docs, this directory wins.

## Completion Contract

- Goal: source-faithful port of Stellarium Web Engine behaviors into Sky Engine.
- Coverage policy: fail-closed.
  - Every source file/function under `study/stellarium-web-engine/source/stellarium-web-engine-master/src` must be mapped.
  - Allowed mapping states:
    - `PORTED`
    - `OUT-OF-SCOPE` (requires explicit user approval recorded in `module-inventory.md`)
    - `BLOCKED`
    - `UNMAPPED` (automatic fail state)
- No module can be marked complete with any `UNMAPPED` item in scope.

## Canonical Files

- `module-inventory.md`: exhaustive source inventory and mapping status
- `module-gates.md`: gate checklists and pass/fail per module
- `blockers.md`: blocker log with owner and unblock criteria
- `evidence-index.md`: evidence artifacts and command/output references
- `module0-source-contract.md`: **G1** frozen Hub ↔ source mapping for the module 0 observer/time/matrix spine (**PASS** for module 0 closure; see file §5–§6)
- `module0-eraEpv00-port-plan.md`: staged work plan for **`eraEpv00`** (Earth heliocentric/barycentric PV) before `eraApco` / full `observer_update_full`
- `module0-eraApco-port-plan.md`: **`eraApco`** dependency graph (`eraApcs` … `eraPvtob`) and Hub `astrom` seam checklist
- `module1-source-contract.md`: **G1** Hub ↔ source mapping for **`module1-hips-kernel`** (tile / Eph / HEALPix spine; **PASS** for §1–§2; see file §5–§6)

## Module Completion Rule

Each module must pass all gates before moving to the next module:

1. Inventory lock
2. Source contract lock
3. Heuristic debt elimination
4. Active runtime proof
5. Deterministic replay proof
6. Side-by-side parity proof
7. Regression/build proof
8. Evidence and docs closure

Status values are strict:

- `COMPLETE`
- `BLOCKED`

No partial statuses are allowed.

**`module0-foundation-lock`** is **`COMPLETE`** (**EV-0019**). **`module1-hips-kernel`** is **active** with a filled gate row (**EV-0020**); **G4** Hub tile-load replay is **PASS** (**EV-0024**); **G2/G3** have additional **`eph-file.c`**, **`healpix`**, and **tile selection** regression coverage (**EV-0025**–**EV-0028**); **G5** has **`hips_get_render_order`** + Gaia **`hipsViewport`** wiring (**EV-0029**–**EV-0031**). **`Overall`** stays **`BLOCKED`** until G2, full G3, G5, and G7 close.
