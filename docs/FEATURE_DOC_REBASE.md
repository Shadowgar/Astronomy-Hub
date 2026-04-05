# `FEATURE_DOC_REBASE.md`

---

# FEATURE-FIRST DOCUMENTATION SYSTEM (AUTHORITATIVE)

---

## PURPOSE

Defines the enforced transition from:

```text
phase-based execution → feature-first runtime execution
```

This document ensures:

* no regression to phase-based workflows
* all execution tied to runtime truth
* all work aligned to feature slices

---

## CORE LAW

```text id="h3v8kz"
All execution must resolve to a feature slice with runtime proof.
```

---

## ACTIVE EXECUTION MODEL

Execution is:

```text id="w6x2dn"
Feature-first + Runtime-truth + Proof-driven
```

---

## REQUIRED OUTPUT OF EVERY SLICE

Every slice must produce:

---

### 1. Feature Mapping

Mapped to:

```text id="p8n4fr"
FEATURE_CATALOG.md
```

---

### 2. Status Update

Recorded in:

```text id="q2k7ls"
FEATURE_TRACKER.md
```

---

### 3. Proof Bundle

Recorded in:

```text id="m7y3vf"
LIVE_SESSION_BRIEF.md
```

Must include:

* commands
* outputs
* behavior verification

---

## REQUIRED EXECUTION FLOW

```text id="c5n8ua"
load context
→ confirm product model
→ identify feature
→ inspect runtime truth
→ define slice
→ implement minimal change
→ verify behavior
→ update tracker + session
```

---

## LEGACY HANDLING RULE

Legacy phase documents may be used only for:

* historical understanding
* mapping reference

They must NEVER be used for:

* execution
* validation
* completion claims

---

## ENFORCEMENT RULE

```text id="y2r4pb"
Any execution not tied to a feature slice is invalid.
```

---

## FAILURE CONDITIONS

Execution is invalid if:

* no feature is identified
* no tracker update exists
* no proof exists
* behavior is not runtime-verified
* phase documents are used as authority

---

## FINAL PRINCIPLE

```text id="t6k9zr"
If work cannot be tied to a feature, it does not exist.
```

---