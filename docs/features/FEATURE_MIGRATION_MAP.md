# `FEATURE_MIGRATION_MAP.md`

---

# FEATURE MIGRATION MAP

---

## PURPOSE

Provides traceability from legacy phase-based work to the current feature-based system.

This document exists to:

* preserve historical mapping
* support reconciliation work
* translate old instructions into valid feature execution

---

## AUTHORITY LEVEL

```text id="n4p6az"
REFERENCE ONLY — NOT EXECUTION AUTHORITY
```

This document:

* does NOT define work
* does NOT authorize execution
* does NOT override current architecture

---

## CORE RULE

```text id="x5z3rm"
Legacy phase instructions must be translated into features before execution.
```

---

## MAPPING TABLE

| Legacy Area               | Current Feature Area                                          |
| ------------------------- | ------------------------------------------------------------- |
| Phase 1 foundation/layout | Command Center / Hub Surface, Scope / Engine / Filter Control |
| Phase 2 conditions engine | Conditions Decision Support                                   |
| Phase 2 satellite engine  | Satellite Awareness                                           |
| Phase 2 solar-system      | Solar System Context                                          |
| Phase 2 deep-sky          | Deep Sky Targeting                                            |
| Phase 2 sun engine        | Solar Activity Awareness                                      |
| Phase 2 events/transients | Alerts / Events Intelligence                                  |
| Phase 2 flight engine     | Flight Awareness                                              |
| Scene/Object/Detail logic | Scene Rendering, Object Detail Resolution                     |
| Media/news placeholders   | News / Knowledge Feed, Asset / Media Reliability              |
| Pipeline/cache hardening  | Performance and Cache Freshness                               |

---

## REQUIRED TRANSLATION PROCESS

When encountering a legacy phase instruction:

---

### Step 1 — Identify Target Feature

Map the instruction to one or more feature areas.

---

### Step 2 — Validate Against Architecture

Confirm:

* engine ownership
* object model usage
* contract compliance
* viewport behavior

---

### Step 3 — Define Feature Slice

Convert into a bounded slice using:

```text id="f4q7pl"
FEATURE_SPEC_TEMPLATE.md
```

---

### Step 4 — Execute Using Current Model

Follow:

```text id="u9z8qf"
FEATURE_EXECUTION_MODEL.md
```

---

### Step 5 — Validate

Apply:

```text id="d6p3km"
FEATURE_ACCEPTANCE.md
```

---

## FORBIDDEN ACTIONS

Do NOT:

* execute phase documents directly
* treat phase docs as authoritative
* recreate phase-based workflows
* merge multiple features into one execution step
* bypass feature slicing

---

## FAILURE CONDITIONS

Execution is invalid if:

* phase instructions are followed directly
* feature boundaries are ignored
* architecture is violated
* contracts are bypassed

---

## FINAL RULE

```text id="j3z9xe"
Phases are history.  
Features are execution.
```

---