# `FEATURE_SPEC_TEMPLATE.md`

Your current template is good, but it’s missing:

* viewport / engine alignment
* routing validation
* explicit “no fake behavior” tracking
* stronger proof expectations

We tighten it so every spec becomes **execution-ready**, not just descriptive. 

---

## Replace the entire file with this:

---

# FEATURE SPEC TEMPLATE

---

## PURPOSE

Defines the structure for a **single feature slice specification**.

This template must be used when:

* defining new feature slices
* validating existing behavior
* documenting runtime truth

---

## CORE RULE

```text id="wq3p8d"
A feature spec must describe real, verifiable behavior — not intention.
```

---

## FEATURE

Name of the feature or feature slice.

---

## USER-VISIBLE BEHAVIOR

Describe exactly what the user can:

* see
* click
* interact with

Must be:

* concrete
* observable
* testable

---

## UI ENTRY

Where the user accesses this behavior:

* hub panel
* viewport interaction
* control surface
* engine page

---

## VIEWPORT BEHAVIOR (CRITICAL)

```text id="g8p4dx"
Viewport must reflect the active engine scene
```

Define:

* which engine is active
* what is rendered
* how interaction affects the scene

---

## ENGINE OWNERSHIP

Define:

* owning engine
* sub-engine (if applicable)
* routing behavior

Must answer:

```text id="d6r3kf"
Which engine owns this behavior?
```

---

## API / BACKEND ENTRY

Define:

* endpoint(s)
* route(s)
* request shape
* response shape

---

## BACKEND OWNERSHIP PATH

Define the service chain:

```text
route → service → data source
```

---

## DATA SOURCES

Define:

* external APIs
* internal datasets
* ingestion path

Must be:

* explicit
* verifiable

---

## CONTRACT SHAPE

Reference:

* object model
* data contracts
* response structure

No custom shapes allowed.

---

## ROUTING BEHAVIOR (CRITICAL)

Define:

* how object selection routes
* how engine switching occurs
* how sub-engines activate

---

## EXPLORATION PATH (CRITICAL)

Define how the user continues:

```text id="c9t2qv"
Object → Detail → Related → Deeper Exploration
```

Must NOT dead-end.

---

## DEGRADED / FALLBACK BEHAVIOR

Define:

* what happens when data is missing
* how the system communicates degradation

Must be:

* explicit
* truthful

---

## DETERMINISM CRITERIA

Define:

What inputs must change output:

* time
* location
* user selection
* filters

---

## CURRENT TRUTH GAPS

List:

* fake behavior
* partial behavior
* incorrect behavior

Must be honest.

---

## PROOF

Required:

* commands executed
* endpoints tested
* output samples
* screenshots (if UI)
* routing validation

---

## STATUS

One of:

* REAL
* PARTIAL
* FAKE
* BLOCKED

---

## ACCEPTANCE CHECK

Must pass:

```text
FEATURE_ACCEPTANCE.md
```

---

## FINAL RULE

```text id="m2t8zn"
If this spec cannot be proven in runtime, it is invalid.
```
