# Evidence Index

This index links command runs, raw outputs, screenshots, and JSON artifacts used to pass/fail module gates.

## Entry Template

| Evidence ID | Module | Gate | Command / Probe | Artifact Path | Result | Notes |
|---|---|---|---|---|---|---|

## Current Entries

| Evidence ID | Module | Gate | Command / Probe | Artifact Path | Result | Notes |
|---|---|---|---|---|---|---|
| EV-0001 | module0-foundation-lock | G4 | Five-case deterministic replay run (v1) | `.cursor-artifacts/parity-compare/phase0-deterministic-five-case.json` | FAIL | Hub and Stellarium stability checks not fully passing. |
| EV-0002 | module0-foundation-lock | G4 | Five-case deterministic replay run (v3) | `.cursor-artifacts/parity-compare/phase0-deterministic-five-case-v3.json` | FAIL | Fingerprint acquisition incomplete for some runtime cases. |
| EV-0003 | module0-foundation-lock | G6 | `npm run test -- test_sky_observer_service.test.js test_sky_clock_service.test.js` | Terminal command output | PASS | Observer/time-scale and deterministic clock regression tests passing. |
| EV-0004 | module0-foundation-lock | G6 | `npm run typecheck` | Terminal command output | PASS | Type safety intact after foundation updates. |
| EV-0005 | module0-foundation-lock | G0 | Exhaustive file inventory seeded at fail-closed baseline | `docs/runtime/port/module-inventory.md` | PASS | All 146 source C/H files enumerated with initial status. |
| EV-0006 | module0-foundation-lock | G3 | TT-based observer hash alignment update | `frontend/src/features/sky-engine/engine/sky/runtime/observerUpdateHash.ts` | PASS | Update hash now keyed on TT Julian date instead of raw ISO string. |
| EV-0007 | module0-foundation-lock | G6 | `npm run test -- test_sky_observer_service.test.js` | Terminal command output | PASS | Observer service regression suite green after TT-hash change. |
| EV-0008 | module0-foundation-lock | G0 | Module0 file rows in `module-inventory.md` set to `PORTED`/`BLOCKED` + AH mapping; `deltat.c` **PORTED** | `docs/runtime/port/module-inventory.md` (commit) | PASS | Clears **`UNMAPPED`** for all `module0-foundation-lock` file rows; global inventory still has `UNMAPPED` for downstream modules. |
| EV-0009 | module0-foundation-lock | G6 | `npm run type-check` && `npx vitest run tests/test_erfa_nutation.test.js tests/test_time_scales.test.js` | Terminal command output | PASS | Typecheck + foundation time/ERFA tests green after inventory closure workflow. |
| EV-0010 | module1-hips-kernel | G0 | ~~Module1 inventory pre-close~~ **SUPERSEDED** | — | INVALID | Reverted: execution order is module 0 to **COMPLETE** before module 1 inventory closure (`module-gates.md` note). |
| EV-0011 | module0-foundation-lock | G4 | `npx vitest run tests/test_module0_deterministic_replay.test.js` | `frontend/tests/__snapshots__/test_module0_deterministic_replay.test.js.snap` + `module0ParityFingerprint.ts` | PASS | Hub five-case deterministic fingerprint + snapshot; **Stellarium reference path still pending** for BLK-000 full exit. |
| EV-0012 | module0-foundation-lock | G1 | Review / adopt `module0-source-contract.md` as partial source-contract lock | `docs/runtime/port/module0-source-contract.md` (commit) | PASS | Frozen Hub file list + Stellarium §1 scope for observer spine; §5 states remaining G1 gap for other module 0 files. |
| EV-0013 | module0-foundation-lock | G1 | Author `module0-eraEpv00-port-plan.md` (line span, generator strategy, test + integration checklist) | `docs/runtime/port/module0-eraEpv00-port-plan.md` (commit) | PASS | Staged plan for `eraEpv00`; implementation tracked via future evidence rows. |
| EV-0014 | module0-foundation-lock | G6 | `npx vitest run tests/test_erfa_epv00.test.js tests/test_module0_deterministic_replay.test.js` | `frontend/scripts/generate_erfa_epv00_tables.mjs`, `erfaEpv00.ts`, `erfaEpv00Tables.generated.ts`, `observerDerivedGeometry.ts`, snapshot update | PASS | `eraEpv00` ported from study `erfa.c`; PyERFA goldens; `earthPv`/`sunPv` wired; Module 0 fingerprint snapshot refreshed. |

## Rules

- Every `PASS` gate must reference at least one evidence row.
- Evidence rows must be reproducible with committed command definitions.
