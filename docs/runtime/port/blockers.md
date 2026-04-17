# Blockers

This log records blockers that prevent module completion. Blockers must be explicit, minimal, and tied to one module gate.

## Blocker Template

| ID | Module | Gate | Blocker | Required Prerequisite | Owner | Created | Exit Criteria | Status |
|---|---|---|---|---|---|---|---|---|
| BLK-000 | module0-foundation-lock | G4 | Deterministic replay harness requires robust cross-runtime measurable signal that is not based on noisy pixel hash alone. | Implement deterministic parity mode signal and stable measurement contract. | Sky Engine Port | 2026-04-17 | Five-case deterministic replay produces stable metrics for Hub and reference checkpoints. | OPEN |

## Rules

- `Status`: `OPEN`, `RESOLVED`, `INVALID`.
- No work may move to a downstream module while blocker for current module remains `OPEN` unless prerequisite module is explicitly defined and completed first.
