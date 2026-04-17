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

## Rules

- Every `PASS` gate must reference at least one evidence row.
- Evidence rows must be reproducible with committed command definitions.
