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
- Port size threshold: any accepted port slice must include at least **500 added implementation-code lines** (`Added`), excluding docs and generated evidence text. Smaller slices are treated as incomplete unless an explicit user override is recorded.

## Canonical Files

- **`CODEX-HANDOFF.md`**: **single entry point** for a fresh agent (Codex 5.3 or successor) taking over without prior chat context — read this first. Links out to everything below.
- **`AUDIT-2026-04-26.md`**: full source-vs-Hub audit (**EV-0105**) proving the local Stellarium source tree still has 146 C/H files, only one file-level `PORTED` row, and that the renderer/painter/runtime gaps are usability-critical rather than optional future polish.
- `module-inventory.md`: exhaustive source inventory and mapping status (includes "Module 2 Function Inventory" per-function table).
- `module-gates.md`: gate checklists and pass/fail per module (includes "Known residuals" for repo-wide `npm test` failures that belong to later modules).
- `blockers.md`: blocker log with owner and unblock criteria.
- `stellarium-web-engine-src.md`: pinned GitHub commit + `src/` paths for Stellarium Web Engine (module 2 reference; **EV-0037** / **`BLK-003`**).
- `evidence-index.md`: evidence artifacts and command/output references. **Next free ID: EV-0117** (EV-0067 / EV-0068 are intentionally unused).
- `module0-source-contract.md`: **G1** frozen Hub ↔ source mapping for the module 0 observer/time/matrix spine (**PASS** for module 0 closure; see file §5–§6).
- `module0-eraEpv00-port-plan.md`: staged work plan for **`eraEpv00`** (Earth heliocentric/barycentric PV) before `eraApco` / full `observer_update_full`.
- `module0-eraApco-port-plan.md`: **`eraApco`** dependency graph (`eraApcs` … `eraPvtob`) and Hub `astrom` seam checklist.
- `module1-source-contract.md`: **G1** Hub ↔ source mapping for **`module1-hips-kernel`** (tile / Eph / HEALPix spine; **PASS** for §1–§2; see file §5–§6).
- `module2-source-contract.md`: **G1** Hub ↔ source mapping for **`module2-stars-full`** (`hip` / `stars` / `bv_to_rgb` inventory rows; **PASS** for §1–§2; C reference: **`stellarium-web-engine-src.md`**). **§7** = handoff for external agents (paths, `npm run test:module2`, open work).
- `AUDIT-2026-04-20.md`: Codex handoff audit (Pass A = **EV-0056**) and full runtime-port doc audit (Pass B = **EV-0071**).

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

**`module0-foundation-lock`** is **`COMPLETE`** (**EV-0019**) and **`module1-hips-kernel`** is **`COMPLETE`** (**EV-0034**) only as gated Hub subset closures; they are not claims that every native C/H source row in those modules is fully ported. **`module2-stars-full`** is the active execution-order target (**EV-0035**); **`G0`/`G1`** **PASS** (**EV-0036**) and many Hub-side stars seams are covered through **EV-0106** (including live side-by-side checkpoint ingestion and active-scene telemetry capture). **EV-0105** re-audits the full source inventory and confirms the broader full-port reality: the local pinned source tree has 146 C/H files, `module-inventory.md` has 146 file rows, only `src/algos/deltat.c` is file-level `PORTED`, and the current Sky Engine is still **`BLOCKED`** for full Stellarium indistinguishability. The active star layer uses Babylon/WebGL thin instances, but the Stellarium `core.c` / `painter.c` / `render_gl.c` lifecycle, batching, clipping, shader, texture, and tonemapper contracts are not ported; these gaps are usability-critical. **Overall** **`BLOCKED`** until remaining gates close; see **`module2-source-contract.md` §5–§7**, **`module-gates.md`**, **`AUDIT-2026-04-26.md`**, and **`evidence-index.md`**.
