# `FEATURE_ACCEPTANCE.md`

---

# FEATURE ACCEPTANCE (AUTHORITATIVE)

---

## PURPOSE

Defines the required conditions for a feature or feature slice to be considered valid.

This prevents:

* false completion
* fake behavior
* UI-only implementations
* architecture violations

---

## CORE RULE

```text id="x8n2ka"
A feature is accepted only when every required gate passes with proof.
```

---

## REQUIRED GATES

---

### 1. BEHAVIOR GATE

* user-visible behavior exists
* behavior is usable
* behavior matches feature intent

---

### 2. CONTRACT GATE

* API contract shape is correct
* object model is respected
* no ad hoc data structures

---

### 3. AUTHORITY GATE

* backend ownership path is explicit
* engine ownership is correct
* no frontend fabrication

---

### 4. PROVENANCE GATE

* data source is identifiable
* ingestion path is clear
* no synthetic or invented data

---

### 5. DETERMINISM GATE

* output changes correctly with:

  * time
  * location
  * input parameters

---

### 6. ROUTING GATE (NEW — CRITICAL)

* object routes to correct engine
* engine switching is correct
* sub-engine routing is correct
* no ambiguous ownership

---

### 7. VIEWPORT GATE (NEW — CRITICAL)

```text id="p2s6xj"
Viewport must reflect the active engine scene
```

Requirements:

* correct engine is rendered
* interaction updates scene correctly
* hub does not override engine rendering

---

### 8. EXPLORATION GATE (NEW — CRITICAL)

The system must not dead-end.

Every object must allow:

```text id="a6k9zv"
Detail → Related Data → Further Exploration
```

Failure examples:

* static modal with no next step
* dead-end data panel
* no navigation path

---

### 9. FALLBACK GATE

* degraded behavior is explicit
* missing data is shown honestly
* no silent failure

---

### 10. PROOF GATE

Required artifacts:

* file references
* executed commands
* endpoint output
* runtime screenshots (for UI claims)
* explicit pass/fail statement

---

## REQUIRED PROOF ARTIFACTS

Every feature slice must include:

* code references
* backend endpoint verification
* data output samples
* UI evidence (if applicable)
* routing verification

---

## FAILURE CLASSIFICATION

---

### FAKE

* no real backend path
* placeholder data presented as real
* UI exists without real behavior

---

### PARTIAL

* backend path exists
* but one or more gates fail

---

### REAL

* all gates pass
* behavior is correct
* proof exists

---

### BLOCKED

* cannot satisfy gates due to external constraint

---

## NON-NEGOTIABLE RULE

```text id="j9x2rl"
No feature may be marked REAL without proof.
```

---

## AUTOMATIC FAILURE CONDITIONS

A feature must be rejected if:

* viewport does not match active engine
* routing is incorrect
* objects lack ownership
* UI behavior contradicts backend truth
* contracts are violated
* interaction produces inconsistent results

---

## FINAL PRINCIPLE

```text id="y8p4nf"
If it cannot be proven, it is not real.
```
