# `FEATURE_EXECUTION_MODEL.md`

Your current file says “archived / not authoritative.” That is correct, but incomplete. 

Right now there is **no explicit execution model**, which is why Codex drifted and lied about completion.

We fix that here.

---

## Replace the entire file with this:

---

# FEATURE EXECUTION MODEL (ACTIVE)

---

## PURPOSE

Defines how features are executed in Astronomy Hub.

This document prevents:

* fake completion
* scope drift
* architecture violations
* unverified progress

This document works together with:

```text
PROJECT_STATE.md
FEATURE_ACCEPTANCE.md
FEATURE_TRACKER.md
```

---

## CORE PRINCIPLE

```text
Features are built as small, verifiable slices tied to real runtime behavior.
```

---

## EXECUTION UNIT

The smallest unit of work is:

```text
Feature Slice
```

A feature slice must:

* produce user-visible behavior
* be tied to a real backend path
* be testable in runtime
* be verifiable against acceptance gates

---

## REQUIRED FLOW

Every feature slice must follow:

```text
1. Load context
2. Identify active feature (PROJECT_STATE)
3. Define slice
4. Implement minimal change
5. Run system
6. Validate behavior
7. Apply acceptance gates
8. Record status
```

---

## MANDATORY LOOP

```text
verify → fix minimally → verify again
```

This loop must not be skipped.

---

## SLICE DEFINITION RULE

A valid slice must include:

* one clear user-visible outcome
* one backend path
* one interaction path
* one verifiable output

If a slice spans multiple domains or engines:

```text
The slice is too large and must be reduced.
```

---

## ARCHITECTURE ALIGNMENT RULE

Before implementing any slice:

* confirm engine ownership
* confirm object model usage
* confirm contract compliance
* confirm scene behavior

If not aligned:

```text
Do not implement
```

---

## RENDERING RULE

If the slice affects UI:

* viewport must reflect active engine
* hub must remain a decision layer
* engine must control scene

---

## PROHIBITED EXECUTION

Do NOT:

* build multiple features simultaneously
* expand scope mid-slice
* create placeholder logic
* simulate backend behavior
* bypass contracts
* invent data

---

## ACCEPTANCE REQUIREMENT

Every slice must pass:

* `FEATURE_ACCEPTANCE.md`

No exceptions.

---

## STATUS CLASSIFICATION

Each slice must be labeled:

* REAL — all gates passed
* PARTIAL — some gates fail
* FAKE — no real backend or truth
* BLOCKED — cannot proceed

---

## TRACKING REQUIREMENT

Every slice must be recorded in:

```text
FEATURE_TRACKER.md
```

---

## FAILURE CONDITIONS

Execution is invalid if:

* no runtime verification
* missing proof
* incorrect routing
* incorrect object ownership
* UI does not match behavior
* data is fabricated

---

## COMPLETION RULE

A slice is complete only when:

* behavior works in runtime
* output is correct
* interaction is correct
* acceptance gates pass
* proof exists

---

## FINAL PRINCIPLE

```text
If it is not proven in runtime, it does not exist.
```

---