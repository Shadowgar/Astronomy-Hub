# `STATE_TRANSITIONS.md`


---

# STATE TRANSITIONS

---

## PURPOSE

Defines the allowed execution state flow for all work in Astronomy Hub.

This ensures:

* controlled progress
* verifiable outcomes
* no false completion
* no hidden failures

---

## STATES

* READY — context loaded, task defined
* ACTIVE — work in progress
* BLOCKED — cannot proceed due to failure
* VALIDATING — verifying behavior
* COMPLETE — verified and stable

---

## ALLOWED FLOW

```text id="2t9h3f"
READY → ACTIVE → VALIDATING → COMPLETE
ACTIVE → BLOCKED → ACTIVE
VALIDATING → BLOCKED
```

---

## RULES

* no skipping validation
* no marking complete without proof
* no resuming from BLOCKED without fixing the root cause
* no silent or implicit state transitions

---

## PROOF REQUIREMENT

A state transition is valid only if:

* change is observable
* behavior is verifiable
* output matches expected outcome
* system behavior is stable

---

## VALIDATION REQUIREMENT

VALIDATING must confirm:

* runtime correctness
* UI correctness (if applicable)
* contract compliance
* no regression introduced

---

## BLOCKED CONDITIONS

A state must move to BLOCKED if:

* behavior cannot be verified
* output is incorrect
* contracts are violated
* system becomes unstable
* required data is unavailable

---

## COMPLETION REQUIREMENT

A state may move to COMPLETE only if:

* all validation passes
* behavior is correct
* output is meaningful to the user
* no known issues remain within the active slice

---

## ENFORCEMENT RULE

```text id="yq8n5z"
State reflects reality, not intention.
```

---

## FINAL PRINCIPLE

```text id="9jv1cx"
Progress is only real when it is proven in runtime.
```
