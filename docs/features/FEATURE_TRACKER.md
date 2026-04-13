# `FEATURE_TRACKER.md`

Your current tracker is actually very good structurally, but:

Problems:

* it does not enforce **viewport correctness**
* it does not explicitly track **engine ownership correctness**
* it allows vague “mixed” states without forcing clarity
* it doesn’t tie tightly enough to execution model

We tighten it so it becomes **brutally honest and actionable**. 

---

## Replace the entire file with this:

---

# FEATURE TRACKER

---

## PURPOSE

Records the **current factual runtime status** of all features.

This document is:

* factual
* pessimistic
* proof-driven

This document does NOT:

* define execution order
* override PROJECT_STATE.md

---

## AUTHORITY RELATIONSHIP

```text id="v5j0s2"
PROJECT_STATE.md = what we are doing now
FEATURE_TRACKER.md = what is actually true
```

If conflict exists:

* PROJECT_STATE defines current work
* TRACKER reflects system reality

---

## STATUS LEGEND

* REAL — fully implemented, proven, and correct
* PARTIAL — exists but fails one or more acceptance gates
* FAKE — placeholder or misleading behavior
* BLOCKED — cannot proceed due to dependency or constraint

Reference:

```text id="nq9b3k"
FEATURE_ACCEPTANCE.md
```

---

## CURRENT ACTIVE FEATURE SLICE

```text id="c93ptl"
Feature: Above Me Orchestration
Status: PARTIAL
```

Reason:

* aggregation exists
* but curation, routing, viewport behavior, and detail correctness are not proven

---

## RUNTIME TRUTH INVENTORY

| Feature                         | UI Visible | Backend Path | Real Data | Engine Ownership Correct | Viewport Correct | Fake Behavior Present | Status  |
| ------------------------------- | ---------- | ------------ | --------- | ------------------------ | ---------------- | --------------------- | ------- |
| Command Center / Hub Surface    | yes        | yes          | n/a       | partial                  | no               | yes                   | PARTIAL |
| Scope / Engine / Filter Control | yes        | yes          | mixed     | partial                  | no               | yes                   | PARTIAL |
| Scene Rendering                 | yes        | yes          | mixed     | partial                  | no               | yes                   | PARTIAL |
| Above Me Orchestration          | yes        | yes          | mixed     | partial                  | no               | yes                   | PARTIAL |
| Conditions Decision Support     | yes        | yes          | yes       | partial                  | partial          | partial               | PARTIAL |
| Earth Engine                    | limited    | partial      | mixed     | no                       | no               | yes                   | PARTIAL |
| Satellite Awareness             | limited    | yes          | yes       | partial                  | partial          | partial               | PARTIAL |
| Flight Awareness                | limited    | yes          | mixed     | partial                  | partial          | partial               | PARTIAL |
| Solar System Context            | yes        | yes          | yes       | partial                  | partial          | partial               | PARTIAL |
| Deep Sky Targeting              | limited    | yes          | mixed     | partial                  | partial          | yes                   | PARTIAL |
| Solar Activity Awareness        | limited    | yes          | mixed     | partial                  | partial          | yes                   | PARTIAL |
| Alerts / Events Intelligence    | yes        | yes          | mixed     | partial                  | partial          | yes                   | PARTIAL |
| Object Detail Resolution        | yes        | yes          | mixed     | partial                  | partial          | yes                   | PARTIAL |
| News / Knowledge Feed           | limited    | partial      | mixed     | no                       | partial          | yes                   | PARTIAL |
| Asset / Media Reliability       | partial    | partial      | mixed     | no                       | n/a              | yes                   | PARTIAL |
| Performance / Cache Freshness   | partial    | partial      | n/a       | n/a                      | n/a              | n/a                   | PARTIAL |

---

## UPDATE RULES

When updating this file:

* be factual
* be pessimistic
* reflect real runtime behavior
* explicitly call out fake behavior

---

### Required When Updating a Feature

Must include:

* current behavior
* what is still fake
* what is still incorrect
* what is still missing

---

## PROHIBITED USE

Do NOT:

* plan future work here
* describe intentions
* soften failures
* mark REAL without proof

---

## REAL STATUS REQUIREMENT

A feature may only be marked REAL if:

* all acceptance gates pass
* viewport is correct
* routing is correct
* backend ownership is correct
* data is real
* no fake behavior remains

---

## AUTOMATIC DOWNGRADE RULE

If any of the following occur:

* fake data introduced
* routing breaks
* viewport incorrect
* contracts violated

Then:

```text id="x3j9vb"
Status must revert to PARTIAL or FAKE
```

---

## FINAL RULE

```text id="m8k2rp"
This tracker must reflect reality, even if that reality is bad.
```

---

## STELLARIUM PARITY TRACKING

For strict Sky Engine parity progress against Stellarium source behavior, use:

- `/home/rocco/Astronomy-Hub/parity_list.md`

Current parity anchor (as of 2026-04-12):

- Stars moved from Hipparcos-only ceiling (~8,870) to multi-survey sequencing (~61.7k visible ceiling with current datasets).
- Synthetic deep background star fallback is disabled; real catalog surveys now drive deep star density.
- Remaining star parity gap is deep-survey coverage beyond mag 8.5 and full hint/label limiting-magnitude chain parity.
