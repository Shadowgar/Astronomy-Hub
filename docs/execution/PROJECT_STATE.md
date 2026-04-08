# `PROJECT_STATE.md`


---

# PROJECT STATE — EXECUTION AUTHORITY

---

## PURPOSE

Defines the **current, factual execution state** of Astronomy Hub.

This is the only document that defines:

* what is being worked on
* what is active
* what is allowed
* what is constrained

If any document conflicts with execution:

```text
PROJECT_STATE.md wins
```

---

## CURRENT MODE

```text
Mode: FEATURE_EXECUTION
Approach: bounded, architecture-aligned stabilization
```

---

## CURRENT OBJECTIVE

Stabilize a usable product surface centered on:

```text
Above Me Hub + self-contained Sky Engine viewport + correct engine routing
```

---

## ACTIVE FEATURE

```text
Feature: Above Me Orchestration
Status: PARTIAL
```

---

## CURRENT PRIORITY

Focus only on fixing:

* hub curation (must be small and meaningful)
* correct object selection
* correct engine ownership and routing
* meaningful object detail
* viewport reflecting active engine
* restoring Sky Engine runtime ownership behind a thin host mount

---

## KNOWN ISSUES

* panel ownership unclear
* feeds mixing domains incorrectly
* hub not properly curated
* detail behavior generic or incorrect
* viewport not correctly tied to engine
* Sky Engine runtime ownership blurred into page/component code

---

## HARD CONSTRAINTS

Must preserve:

```text
Scope → Engine → Filter → Scene → Object → Detail
```

And:

* hub = decision layer
* engines = domain authority
* viewport = active engine scene
* hub mounts engines but does not own engine runtimes
* backend owns meaning
* contracts must be deterministic

---

## FORBIDDEN ACTIONS

Do NOT:

* fabricate data
* mix hub and engine responsibilities
* expand into new engines
* introduce new architecture
* bypass contracts
* create placeholder UI
* simulate correctness without validation

---

## EXECUTION RULE

Only one bounded feature slice may be active.

Work must follow:

```text
verify → fix minimally → verify again
```

---

## COMPLETION REQUIREMENT

A feature is NOT complete unless:

* behavior works in runtime
* output is correct
* user can make a decision from it
* interaction behaves correctly
* system is stable

---

## NEXT ACTION

Continue refining Above Me until:

* outputs are curated
* routing is correct
* viewport reflects engine
* detail is meaningful
* Sky Engine owns its runtime again

Only then:

```text
move to next feature
```

---

## FINAL RULE

```text
If the system is not usable from the user's perspective,
the feature is not complete.
```
