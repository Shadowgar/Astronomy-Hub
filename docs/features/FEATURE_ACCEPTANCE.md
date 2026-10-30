# `FEATURE_ACCEPTANCE.md`

## Current visual proof requirement — owner decision 2026-10-21

For AE-03/AE-11 and future Sky/Earth/Planet visual packages, the owner-approved cinematic reference family is recorded with original PNG SHA-256 in [Cinematic Design Reference](../design/ASTRONOMY_HUB_CINEMATIC_REFERENCE_2026-10-21.md). Implementation cannot claim visual acceptance without exact reference assets imported, matching desktop/mobile actual-browser screenshots, side-by-side assessment, recorded justified scientific/licensing/performance deviations, accessibility/reduced-motion checks and explicit owner review. Previous R1-A/ORA-6 sketches remain applicable for interactions. Image illustrations must not supply astronomical ephemerides, unlicensed geography or fabricated object statistics. R3-A's present visual output is **REJECTED**, its scientific baseline remains a separate qualified slice. Do not confuse green code/build tests with completed owner visual acceptance.

## Current scope reconciliation — 2026-10-21

Current execution: [PROJECT_STATE](../execution/PROJECT_STATE.md); canonical R0–R5 and deferred X packages: [MASTER_PLAN](../execution/MASTER_PLAN.md).

R3-A alone is owner-authorized after roadmap reconciliation. R1/N1 is OWNER ACCEPTED; R2 PR78/79/80 are delivered drafts with retained provider/device limits. No merge or production deployment. Earlier dated activation/next-step directions are historical where superseded by the current execution record. R4 evaluates Earth, Mars and Moon; Mars is a candidate, not a selected first body.

## R3-A bounded qualification contract — 2026-10-21

Owner directive supplies bounded implementation authority within approved Adaptive
Explorer styling; new Solar screens remain PENDING OWNER VISUAL ACCEPTANCE.
Sun/Earth/Mars must render from a named source/epoch/frame/units, with two independent
known-time reference checks; no visual-plausibility substitute. Selected identity
must agree with actual camera target. State display exaggeration and orbit model
limits. Exercise desktop/mobile keyboard/reduced-motion, Back/Forward and return,
abort/error/retry and serial cleanup. R4 contract tests must preserve identity,
origin/frame/time/camera intent/radii/units/shape/orientation provenance/surface
availability/capabilities and cancellation/failure/return. No unsupported surface
entry. Docker runtime, exact served source/artifacts and preservation required.
Initial R3-A budgets: three body glyphs, at most two bounded orbit lines, one active
heavy renderer, no polling ephemeris or background renderer, no network on gestures.
Report measured software browser timing; no unmeasured physical speed claim.

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
