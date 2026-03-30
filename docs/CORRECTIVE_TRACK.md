# CORRECTIVE TRACK — BE / FE (AUTHORITATIVE)

---

## 1. PURPOSE

The BE and FE phase tracks exist to **correct drift** from prior implementation.

They are **not the product roadmap**.

They are a **temporary engineering stabilization layer**.

---

## 2. RELATION TO MASTER PLAN

The master plan defined in `Document_Index.md` remains the **product authority**.

However:

```text
During corrective execution,
BE/FE phases override implementation behavior.
````

Rules:

* BE/FE MUST NOT redefine product intent
* BE/FE MUST NOT rewrite master plan meaning
* BE/FE MUST ONLY repair implementation to match system intent

---

## 3. WHEN CORRECTIVE TRACK IS ACTIVE

Corrective track is active when:

* implementation drift has been identified
* code does not match system intent
* UI does not reflect defined UX hierarchy
* architecture is unstable or inconsistent

Current state:

```text
Corrective Track: ACTIVE
Active Track: FE
Checkpoint: FE8.5
```

---

## 4. EXECUTION AUTHORITY

While corrective track is active:

Priority order:

1. STACK_OVERVIEW.md (technology constraints)
2. PHASE_FE_EXECUTION.md or PHASE_BE_EXECUTION.md
3. PHASE_STRUCTURE.md
4. Document_Index.md (for intent reference only)

---

## 5. RESTRICTIONS

During corrective track:

* NO new feature expansion
* NO product-phase advancement (Phase 1–5)
* NO speculative UI redesign outside defined FE steps
* NO backend invention
* NO contract violations

---

## 6. COMPLETION CONDITION

Corrective track is complete ONLY when:

* stack is fully aligned
* architecture matches defined system model
* UI hierarchy matches defined design system
* data flow is deterministic
* no drift remains between docs and implementation

---

## 7. HANDOFF RULE

After corrective completion:

```text
Execution MUST explicitly return to the master plan.
```

Steps:

1. Validate implementation against Phase 1 requirements
2. Restart Phase 1 with corrected prompting
3. Continue forward through Phase 2, Phase A/B, etc.

No implicit transition is allowed.

---

## 8. FAILURE CONDITION

If corrective track is ignored:

* system WILL drift again
* architecture WILL fragment
* UI WILL degrade

---

## 9. FINAL PRINCIPLE

```text
Corrective track fixes the foundation.
Master plan builds the product.
```

EOF

````

---