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
Mode: ORAS_SKY_ENGINE_MODERNIZATION
Approach: reconcile authority before the next catalog/data superiority pass
```

---

## CURRENT OBJECTIVE

Keep the contained ORAS Sky Engine aligned with its active runtime surface:

```text
/oras-sky-engine/ = ORAS-hosted Stellarium Web / Stellarium Web Engine
```

The Hub remains the decision layer. Hub homepage and WordPress shortcode work
remain deferred until explicitly approved.

---

## ACTIVE FEATURE

```text
Feature: ORAS Sky Engine Runtime and Data Parity
Status: PARTIAL
```

---

## CURRENT PRIORITY

Complete this docs reconciliation, then move to a separately approved,
source-backed catalog/data superiority pass. Current runtime priorities remain:

* preserve exact object identity and centering at `/oras-sky-engine/`
* expand catalog depth through scalable ingestion and indexes
* improve high-definition imagery without overstating survey coverage
* keep DSS as the safe full-sky fallback, not the long-term visual ceiling
* keep Pan-STARRS query-only and experimental
* preserve validated satellite and solar-system behavior

---

## KNOWN ISSUES

* Gaia DR3-scale ingestion and zoom-aware star delivery are not complete
* DSO media and higher-definition imagery remain incomplete
* Pan-STARRS does not provide safe full-sky default coverage
* WordPress consumption of `/api/above-me` has not started

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
* `/api/above-me` is the public object-discovery contract
* `/api/v1/scene/above-me` is legacy scene support, not the future public product API

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
* implement or refactor Hub home-route (`/`) panels/viewport without explicit approval
* fabricate catalog, coordinate, visibility, magnitude, or survey data
* commit raw Gaia bulk or giant browser catalog dumps
* bake bulk skydata into Docker images
* add the full upstream vendor tree when only maintained runtime sources are needed

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

After this docs-only reconciliation, prepare a bounded catalog/data superiority
pass for `/oras-sky-engine/` and `/api/above-me` that:

* uses source-backed, license-compatible inputs
* keeps large catalogs tiled, indexed, mounted, or streamed
* preserves `catalog + source_id + model` identity
* keeps Gaia and other large identifiers as strings
* validates runtime impact before claiming parity

Do not start the Gaia DR3 importer, WordPress integration, or Hub homepage work
without a separately approved task.

---

## FINAL RULE

```text
If the system is not usable from the user's perspective,
the feature is not complete.
```
