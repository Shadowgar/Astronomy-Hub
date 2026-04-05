# STATE TRANSITIONS

## Purpose

Defines basic execution state flow for controlled work.

---

## States

* READY — context loaded, task defined
* ACTIVE — work in progress
* BLOCKED — cannot proceed due to failure
* VALIDATING — verifying behavior
* COMPLETE — verified and stable

---

## Allowed Flow

```text
READY → ACTIVE → VALIDATING → COMPLETE
ACTIVE → BLOCKED → ACTIVE
VALIDATING → BLOCKED
```

---

## Rules

* no skipping validation
* no marking complete without proof
* no resuming from blocked without fixing cause

---

## Proof Requirement

A state change is valid only if:

* change is observable
* behavior is verifiable
* result matches expected outcome

---

## Final Rule

State reflects reality, not intention.
