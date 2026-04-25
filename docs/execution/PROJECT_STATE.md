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
Approach: bounded, architecture-aligned Stellarium parity execution
```

---

## CURRENT OBJECTIVE

Complete Sky Engine Stellarium parity on the dedicated runtime surface:

```text
/sky-engine runtime parity + correct ownership/routing + validated Stellarium-equivalent behavior
```

Hub panel and viewport work on `/` is deferred until parity completion.

---

## ACTIVE FEATURE

```text
Feature: Sky Engine Stellarium Port
Status: PARTIAL
```

---

## CURRENT PRIORITY

Focus only on fixing:

* Sky Engine parity behavior across core runtime modules
* correct engine ownership and routing
* meaningful object selection/detail behavior within Sky Engine
* `/sky-engine` viewport runtime correctness
* replacing local heuristics where Stellarium source defines behavior

---

## KNOWN ISSUES

* parity gaps across interaction shell and module behavior
* object ownership/routing mismatches in some detail paths
* non-parity heuristics still present in parts of the runtime
* validation coverage incomplete for parity-sensitive behaviors

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
* implement or refactor Hub home-route (`/`) panels/viewport until parity is complete

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

Continue Stellarium parity work in `/sky-engine` until:

* core behavior matches source-defined math, thresholds, and lifecycle
* routing is correct
* viewport behavior is validated in runtime
* detail is meaningful
* Sky Engine ownership is fully isolated and stable

Only then:

```text
unlock Hub integration work on '/'
```

---

## FINAL RULE

```text
If the system is not usable from the user's perspective,
the feature is not complete.
```
