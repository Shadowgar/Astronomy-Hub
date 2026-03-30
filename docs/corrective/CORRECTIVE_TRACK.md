# CORRECTIVE TRACK — BE / FE (AUTHORITATIVE)

---

## 1. PURPOSE

The BE and FE phase tracks exist to correct implementation drift.

They are not the product roadmap.

They are a temporary engineering stabilization layer.

---

## 2. RELATION TO MASTER PLAN

The master plan defined in `DOCUMENT_INDEX.md` remains the product authority.

During corrective execution, BE/FE phases override implementation behavior.

Rules:

* BE/FE MUST NOT redefine product intent
* BE/FE MUST NOT rewrite master plan meaning
* BE/FE MUST ONLY repair implementation to match system intent

---

## 3. CORRECTIVE STATUS

Corrective track is active when implementation drift requires stabilization.

Current state (2026-03-30):

```text
Corrective Track: CLOSEOUT READY
Backend Corrective Status: Stabilized at corrective-exit level
Frontend Corrective Status: Materially complete at corrective-exit level
Execution State: Corrective-exit handoff (no active corrective implementation step)
```

---

## 4. EXECUTION AUTHORITY

While corrective track is active or in closeout handoff:

Priority order:

1. `STACK_OVERVIEW.md`
2. `PHASE_FE_EXECUTION.md` or `PHASE_BE_EXECUTION.md`
3. `PHASE_STRUCTURE.md`
4. `DOCUMENT_INDEX.md` (intent reference)
5. `CURRENT_EXECUTION_STATE.md` (temporary closeout authority)

---

## 5. RESTRICTIONS

During corrective track and closeout handoff:

* NO new feature expansion
* NO product-phase advancement until explicit handoff
* NO speculative UI redesign outside defined corrective scope
* NO backend invention
* NO contract violations

---

## 6. COMPLETION CONDITION

Corrective track is complete only when:

* stack is aligned
* architecture matches the system model
* UI hierarchy is materially corrected
* data flow is deterministic enough for baseline execution
* implementation and docs are reconciled to the same reality

Current completion assessment:

* Met at corrective-exit level, with remaining non-blocking hardening deferred.

---

## 7. HANDOFF RULE

After corrective completion:

Execution MUST explicitly return to the master plan.

Required handoff steps:

1. Reconcile authoritative state/continuity docs to verified implementation reality.
2. Record non-blocking post-corrective hardening backlog explicitly.
3. Declare master-plan re-entry point and resume from an explicit approved phase gate.

No implicit transition is allowed.

---

## 8. FAILURE CONDITION

If corrective track or closeout discipline is ignored:

* drift will recur
* architecture will fragment
* UI and contract stability will degrade

---

## 9. FINAL PRINCIPLE

Corrective track fixes the foundation.
Master plan builds the product.
