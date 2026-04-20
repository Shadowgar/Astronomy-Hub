# Sky Engine Stellarium Port Canon

This directory is the only canonical documentation set for the Sky-Engine source port into Astronomy Hub.

General Hub docs are frozen for this effort. If there is a conflict between this directory and other docs, this directory wins.

## Completion Contract

- Goal: source-faithful port of Stellarium Web Engine behaviors into Sky-Engine.
- Port quality bar: **exact parity target** (logic, UI structure, control behavior). Do not ship "style-like" approximations when reference behavior exists.
- Coverage policy: fail-closed.
  - Every source file/function under pinned upstream `src/` must be mapped (see `stellarium-web-engine-src.md`).
  - Allowed mapping states:
    - `PORTED`
    - `OUT-OF-SCOPE` (requires explicit user approval recorded in `module-inventory.md`)
    - `BLOCKED`
    - `UNMAPPED` (automatic fail state)
- No module can be marked complete with any `UNMAPPED` item in scope.
- Runtime and active tooling must not require external local source trees (`study/...`); Hub must stay self-contained.
- User-facing UI branding must not display the word `Stellarium`.

## Canonical Files

- `module-inventory.md`: exhaustive source inventory and mapping status
- `module-gates.md`: gate checklists and pass/fail per module
- `blockers.md`: blocker log with owner and unblock criteria
- `stellarium-web-engine-src.md`: pinned GitHub commit + `src/` paths for Stellarium Web Engine (module 2 reference; **EV-0037** / **`BLK-003`**)
- `evidence-index.md`: evidence artifacts and command/output references
- `module0-source-contract.md`: **G1** frozen Hub ↔ source mapping for the module 0 observer/time/matrix spine (**PASS** for module 0 closure; see file §5–§6)
- `module0-eraEpv00-port-plan.md`: staged work plan for **`eraEpv00`** (Earth heliocentric/barycentric PV) before `eraApco` / full `observer_update_full`
- `module0-eraApco-port-plan.md`: **`eraApco`** dependency graph (`eraApcs` … `eraPvtob`) and Hub `astrom` seam checklist
- `module1-source-contract.md`: **G1** Hub ↔ source mapping for **`module1-hips-kernel`** (tile / Eph / HEALPix spine; **PASS** for §1–§2; see file §5–§6)
- `module2-source-contract.md`: **G1** Hub ↔ source mapping for **`module2-stars-full`** (`hip` / `stars` / `bv_to_rgb` inventory rows; **PASS** for §1–§2; C reference: **`stellarium-web-engine-src.md`**). **§7** = handoff for external agents (paths, `npm run test:module2`, open work).
- `AUDIT-2026-04-20.md`: Codex handoff audit and runtime-port doc consistency closure (**EV-0056**).

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

**`module0-foundation-lock`** is **`COMPLETE`** (**EV-0019**). **`module1-hips-kernel`** is **`COMPLETE`** (**EV-0034**): **`eph-file.c`** / HEALPix / tile / HiPS-order spine, deterministic tile-load replay (**EV-0024**), normalized **`hipsViewport`** + quadtree depth from **`hips_get_render_order`** (**EV-0032**–**EV-0033**), and full evidence closure. **`module2-stars-full`** is the active execution-order target (**EV-0035**); **`G0`/`G1`** **PASS** (**EV-0036**). Hub subset progress includes stars pipeline parity and UI structure/asset parity hardening (**EV-0038**–**EV-0056**). **Overall** **`BLOCKED`** until remaining gates close; see **`module2-source-contract.md` §5–§7** and **`evidence-index.md`**.
