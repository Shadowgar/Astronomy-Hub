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
