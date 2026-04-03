# State Transitions (Authoritative Extension)

## Purpose
Define legal execution state movement under the feature-first model.

## Authority Relationship
This document is subordinate to:
1. `docs/validation/SYSTEM_VALIDATION_SPEC.md`
2. `docs/context/CORE_CONTEXT.md`
3. `docs/context/LIVE_SESSION_BRIEF.md`
4. `docs/context/CONTEXT_MANIFEST.yaml`
5. `docs/execution/PROJECT_STATE.md`
6. `docs/execution/MASTER_PLAN.md`
7. `docs/features/*`

If conflict exists, this document must be corrected.

## State Definitions
- `READY`: context loaded and task pack selected.
- `ACTIVE`: one bounded feature slice is in execution.
- `BLOCKED`: execution halted by a valid fail condition.
- `RECONCILING`: one bounded remediation slice is running.
- `VALIDATING`: proof checks are being executed.
- `VERIFIED`: required checks passed with evidence.
- `COMPLETE`: tracker/state docs updated with proof.

## Legal Transitions
- `READY -> ACTIVE`: selected feature slice declared.
- `ACTIVE -> BLOCKED`: fail condition triggered and recorded.
- `BLOCKED -> RECONCILING`: bounded fix scope declared.
- `RECONCILING -> VALIDATING`: implementation done, proof run begins.
- `VALIDATING -> VERIFIED`: checks pass with evidence.
- `VERIFIED -> COMPLETE`: feature/state docs updated.
- `COMPLETE -> READY`: next bounded slice selected.
- `VALIDATING -> BLOCKED`: validation fails.
- `RECONCILING -> BLOCKED`: remediation cannot be proven.

## Illegal Transitions
- `ACTIVE -> COMPLETE` (skips validation)
- `BLOCKED -> ACTIVE` (skips reconciliation)
- `RECONCILING -> COMPLETE` (skips validation)
- any transition without explicit proof artifacts

## Proof Requirements
Every transition must include:
- trigger source
- artifact references
- command/output evidence when applicable
- pass/fail statement

## Final Rule
No state transition is valid without explicit proof.
