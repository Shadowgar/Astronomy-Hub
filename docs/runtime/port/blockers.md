# Blockers

This log records blockers that prevent module completion. Blockers must be explicit, minimal, and tied to one module gate.

## Blocker Template

| ID | Module | Gate | Blocker | Required Prerequisite | Owner | Created | Exit Criteria | Status |
|---|---|---|---|---|---|---|---|---|
| BLK-000 | module0-foundation-lock | G4 | Deterministic replay harness requires robust cross-runtime measurable signal that is not based on noisy pixel hash alone. | Implement deterministic parity mode signal and stable measurement contract. | Sky Engine Port | 2026-04-17 | Five-case deterministic replay produces stable metrics for Hub and reference checkpoints. | OPEN |

### BLK-000 — Hub progress (partial)

- **Hub:** `computeModule0ObserverGeometryFingerprint` in `frontend/src/features/sky-engine/engine/sky/runtime/module0ParityFingerprint.ts` plus `frontend/tests/test_module0_deterministic_replay.test.js` (five fixed observer/time cases; bitwise-stable double-run + Vitest snapshot). Evidence: **EV-0011** in `evidence-index.md`.
- **Reference (Stellarium):** still required to satisfy the original exit criteria; do not mark **G4** `PASS` or **BLK-000** `RESOLVED` until reference checkpoints are wired.

## Rules

- `Status`: `OPEN`, `RESOLVED`, `INVALID`.
- No work may move to a downstream module while blocker for current module remains `OPEN` unless prerequisite module is explicitly defined and completed first.
