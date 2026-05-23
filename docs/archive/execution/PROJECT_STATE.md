# PROJECT STATE — EXECUTION AUTHORITY

## Purpose

Defines the current factual execution state of Astronomy Hub.

This is the only document that defines:

* what is being worked on now
* what is active
* what is constrained

If this document conflicts with any execution, phase, or feature document, this document wins.

---

## Current Mode

* Mode: FEATURE_EXECUTION
* Approach: bounded, feature-first stabilization

---

## Current Objective

Stabilize a usable product surface centered on:

> Above Me (hub) + correct engine routing + real data behavior

---

## Active Feature

* Feature: Above Me Orchestration
* Status: PARTIAL

---

## Known Issues

* panel ownership unclear
* feeds mixing domains incorrectly
* hub not properly curated
* incorrect or generic detail behavior

---

## Constraints

Must preserve:

* Scope → Engine → Filter → Scene → Object → Detail
* hub = decision layer
* engines = exploration layers
* backend owns meaning
* contracts must be deterministic

Must not:

* fabricate data
* mix hub and engine responsibilities
* claim completion without proof
* expand into unrelated engines

---

## Execution Rule

Only one bounded feature slice may be active at a time.

Work must follow:

```text
verify → fix minimally → verify again
```

---

## Next Action

Continue refining Above Me behavior until:

* output is curated
* objects are correct
* routing is correct
* detail is meaningful

Only then move to next feature.

---

## Final Rule

If the system is not usable from the user's perspective, the feature is not complete.
