# FAILURE RECOVERY PROTOCOL — ASTRONOMY HUB (AUTHORITATIVE EXTENSION)

## 0. PURPOSE
Define the bounded recovery procedure that runs only after a valid execution stop condition has already been triggered by authoritative control documents.

## 1. ROLE IN SYSTEM
This protocol governs controlled remediation behavior.
It does not define system truth, phase scope, or stop conditions.

## 2. AUTHORITY RELATIONSHIP (SUBORDINATE)
This protocol is subordinate to:
1. `docs/validation/SYSTEM_VALIDATION_SPEC.md`
2. `docs/context/CORE_CONTEXT.md`
3. `docs/context/LIVE_SESSION_BRIEF.md`
4. `docs/context/CONTEXT_MANIFEST.yaml`
5. phase execution authority

If conflict exists, this protocol is wrong and must be corrected.

## 3. INVOCATION RULES
Recovery may be invoked only when all are true:
- execution is already stopped by an existing authoritative stop condition
- the stop condition is explicitly identified and documented
- current state is set to `BLOCKED`

This protocol must not invent new stop conditions.

## 4. FAILURE CLASSIFICATION (REQUIRED)
Every recovery cycle must classify exactly one failure as one of:
- document conflict
- missing required context
- validation cannot be proven
- scope violation
- authority mismatch
- state inconsistency
- implementation/document drift

If classification is not possible, recovery must stop and escalate.

## 5. RECOVERY SEQUENCE (MANDATORY)
The recovery flow is fixed:

```text
detect -> classify -> isolate -> generate ONE remediation task -> validate -> update state -> resume only if proven
```

## 6. REMEDIATION GENERATION LAW
- exactly one remediation task per recovery cycle
- remediation task must be bounded, testable, and phase-safe
- no batching
- no speculative fixes
- no hidden additional actions

## 7. VALIDATION BEFORE RESUME
Resume is legal only when:
- remediation output is validated against authoritative docs
- proof artifacts exist (file references, command evidence, observed outcomes)
- blocked condition is explicitly cleared in execution state docs

Without proof, execution remains blocked.

## 8. PROHIBITED BEHAVIOR
Recovery must not:
- bypass validation law
- bypass context loading law
- rewrite phase scope
- redefine authority hierarchy
- continue execution after partial remediation
- run parallel recovery tasks in one cycle

## 9. RECOVERY STOP CONDITIONS
Recovery must stop immediately if:
- remediation requires scope expansion
- remediation requires multiple coupled tasks
- proof cannot be produced
- new authority conflict appears
- current state cannot be reconciled deterministically

On stop: keep `BLOCKED`, record reason, escalate for explicit resolution.

## 10. FINAL RULE
```text
Recovery is controlled, bounded response behavior.
It exists to restore validated execution, not to replace execution control.
```
