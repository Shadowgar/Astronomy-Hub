# `FEATURE_ACCEPTANCE.md`

## Adaptive Explorer product acceptance — R0, 2026-10-13

Apply the existing gates below to [AE-01–AE-11](../product/PRODUCT_VISION.md#minimum-user-visible-acceptance-requirements)
and any subsequently authorized package in the [R0–R5 proposal](../execution/MASTER_PLAN.md#adaptive-explorer-proposed-checkpoints-r0-r5).
A module/backend/fixture/technical test does not prove a usable visible feature.
A passing unit suite cannot qualify an owner-rejected experience.

For future UI work, record the owner-approved reference file/URL, revision and
covered states before implementation; show matched actual-browser captures and
interaction proof at agreed desktop/mobile sizes. Historical ORA-6 geometry/Figma
waivers and a coder-generated substitute do not supply that approval. Exact
Adaptive Explorer screen acceptance remains pending. Any missing visual reference,
measurable package budget or dependent source/science gate stays explicitly open.

Prove mode-only controls are absent elsewhere, keyboard/Explore alternatives,
focus restoration, reduced motion, actual camera/selection agreement and honest
source/detail/fallback state. Handoff tests must exercise both directions,
interruption, return/history and repeated renderer disposal/recreation. Record
actual physical-device acceptance separately from emulated/software browser proof.
Owner visual acceptance and explicit merge approval are distinct gates; neither
starts the next checkpoint. No R0 browser/runtime qualification is claimed.

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
