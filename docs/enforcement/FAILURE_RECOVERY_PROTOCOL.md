# FAILURE RECOVERY PROTOCOL

## Purpose

This document defines the bounded recovery procedure used when current execution has already been stopped by an authoritative validation or execution rule.

This document does not define:

* system architecture
* current product scope
* execution priority
* stop conditions on its own

It is a supporting enforcement document only.

Related authority:

* `docs/context/CORE_CONTEXT.md`
* `docs/context/LIVE_SESSION_BRIEF.md`
* `docs/validation/SYSTEM_VALIDATION_SPEC.md`
* active execution docs

---

## Role

Recovery exists to restore validated progress after a known failure has already been identified.

Recovery must not become a second execution system.

Recovery must not silently expand scope.

---

## Invocation Rules

Recovery may begin only when all of the following are true:

1. current work has already been stopped by an identified failure or validation break
2. the failure has been explicitly named
3. the failure can be isolated to a bounded problem
4. current execution context remains known

If these conditions are not met, recovery must not begin.

---

## Required Failure Classification

Each recovery cycle must classify one failure as one of:

* document conflict
* missing required context
* validation cannot be proven
* scope violation
* authority mismatch
* state inconsistency
* implementation / documentation drift
* broken contract
* runtime mismatch

Only one classification may be active per recovery cycle.

If the failure cannot be classified, recovery stops and must be escalated explicitly.

---

## Recovery Sequence

The recovery sequence is fixed:

```text
detect → classify → isolate → generate one remediation task → validate → update state → resume only if proven
```

No batching is allowed.

---

## Remediation Rules

A remediation task must be:

* bounded
* testable
* small enough to validate clearly
* compatible with current system authority

A remediation task must not:

* introduce unrelated fixes
* change architecture unless the architecture itself is the classified failure
* broaden current scope
* include hidden secondary tasks

Exactly one remediation task is allowed per cycle.

---

## Validation Before Resume

Execution may resume only when:

* the remediation result can be verified
* proof exists
* the original failure condition is explicitly cleared

Valid proof may include:

* file references
* command output
* runtime observation
* schema validation
* deterministic before/after evidence

If proof cannot be produced, execution does not resume.

---

## Stop Conditions During Recovery

Recovery must stop immediately if:

* the remediation requires scope expansion
* multiple coupled tasks are required
* a new authority conflict appears
* the current state cannot be reconciled deterministically
* the proof required to clear the failure cannot be produced

When recovery stops, the reason must be recorded clearly.

---

## Prohibited Behavior

Recovery must not:

* invent new authority
* override context rules
* replace normal execution planning
* bypass validation
* continue after partial remediation
* run multiple recovery tracks at once

---

## Final Rule

Recovery is a bounded correction process.

It exists to restore verified execution, not to replace execution control.
