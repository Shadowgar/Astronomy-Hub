# STATE TRANSITIONS — ASTRONOMY HUB (AUTHORITATIVE EXTENSION)

## 0. PURPOSE
Define legal execution state movement under existing authority and proof requirements.

## 1. ROLE IN SYSTEM
This document constrains execution-state transitions.
It does not replace validation, context, or phase authority.

## 2. AUTHORITY RELATIONSHIP (SUBORDINATE)
This document is subordinate to:
1. `docs/validation/SYSTEM_VALIDATION_SPEC.md`
2. `docs/context/CORE_CONTEXT.md`
3. `docs/context/LIVE_SESSION_BRIEF.md`
4. `docs/context/CONTEXT_MANIFEST.yaml`
5. phase execution documents

If conflict exists, this document is wrong and must be corrected.

## 3. STATE DEFINITIONS
- `READY`: context and authority loaded; execution may begin.
- `ACTIVE`: one bounded task is being executed.
- `BLOCKED`: execution stopped due to a valid stop condition.
- `RECONCILING`: one bounded remediation task is being executed via recovery protocol.
- `VALIDATING`: outputs are being verified against authoritative requirements.
- `VERIFIED`: validation proof is complete and pass conditions are satisfied.
- `COMPLETE`: verified work is finalized and state records are updated.

## 4. TRANSITION RULES (LEGAL ONLY)
Each transition must include explicit trigger and proof.

- `READY -> ACTIVE`
  - Trigger: approved bounded task selected.
  - Proof: active task declared in session state.

- `ACTIVE -> BLOCKED`
  - Trigger: authoritative stop condition triggered.
  - Proof: stop reason recorded with source authority.

- `BLOCKED -> RECONCILING`
  - Trigger: recovery protocol invoked.
  - Proof: failure class recorded + one remediation task defined.

- `RECONCILING -> VALIDATING`
  - Trigger: remediation task finished.
  - Proof: changed artifacts and validation target declared.

- `VALIDATING -> VERIFIED`
  - Trigger: required checks pass.
  - Proof: explicit pass evidence recorded.

- `VERIFIED -> COMPLETE`
  - Trigger: tracking docs updated.
  - Proof: state docs reflect verified completion.

- `COMPLETE -> READY`
  - Trigger: next bounded task selected.
  - Proof: prior completion remains documented.

- `VALIDATING -> BLOCKED`
  - Trigger: validation fails.
  - Proof: failed check recorded with evidence.

- `RECONCILING -> BLOCKED`
  - Trigger: remediation cannot be proven.
  - Proof: blocked reason and escalation note recorded.

## 5. PROOF REQUIREMENTS
Every state change must include:
- trigger source
- exact artifact references
- validation evidence (when applicable)
- explicit pass/fail statement

State transitions without proof are invalid.

## 6. PROHIBITED TRANSITIONS
Illegal transitions include:
- `ACTIVE -> COMPLETE` (skips validation)
- `BLOCKED -> ACTIVE` (skips reconciliation)
- `BLOCKED -> VERIFIED` (no remediation)
- `RECONCILING -> COMPLETE` (skips validation)
- `VALIDATING -> ACTIVE` (validation not resolved)
- any transition that batches multiple task outcomes

## 7. RELATIONSHIP TO EXISTING STATE DOCS
- `docs/context/LIVE_SESSION_BRIEF.md` remains the authoritative current execution memory.
- `docs/execution/PROJECT_STATE.md` remains authoritative for factual project reality.
- `docs/execution/SESSION_STATE.md` remains a tracking document and does not authorize transitions.
- `docs/enforcement/FAILURE_RECOVERY_PROTOCOL.md` governs `BLOCKED -> RECONCILING` behavior.

## 8. FINAL RULE
```text
No state transition is legal without explicit trigger and proof.
Blocked execution may resume only through validated reconciliation.
```
