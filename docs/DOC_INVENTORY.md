# `DOC_INVENTORY.md`

---

# DOCUMENT INVENTORY (SYSTEM CLASSIFICATION — AUTHORITATIVE)

---

## PURPOSE

Classifies every document in `docs/` by **role and authority**.

This prevents:

* execution drift
* authority confusion
* legacy phase leakage
* AI misuse of context

---

## CORE RULE

```text
Not all documents are equal.
Only specific documents control execution.
```

---

## CLASSIFICATION TYPES

---

### CORE_CONTROL

Defines execution truth and system state.

These documents:

* control execution
* cannot be overridden
* must always be respected

---

### PRODUCT_DEFINITION

Defines what Astronomy Hub **is**.

These documents:

* define system behavior
* define UX model
* define rendering model

---

### ENGINE_AUTHORITY

Defines how the system actually works.

These documents:

* define engines
* define object model
* define contracts
* define ingestion

---

### EXECUTION_MODEL

Defines how work is performed and validated.

---

### SUPPORT

Helpful but not authoritative.

---

### LEGACY

Historical reference only.

Cannot control execution.

---

## ROOT DOCUMENTS

| File                            | Classification       |
| ------------------------------- | -------------------- |
| `docs/ASTRONOMY_HUB_DIAGRAM.md` | PRODUCT_DEFINITION   |
| `docs/DOCUMENT_INDEX.md`        | CORE_CONTROL         |
| `docs/FEATURE_DOC_REBASE.md`    | SUPPORT              |
| `docs/full_audit.md`            | SUPPORT              |
| `docs/MASTER_PLAN.md`           | SUPPORT (alias only) |
| `docs/PHASE_STRUCTURE.md`       | LEGACY               |
| `docs/PROJECT_STATE.md`         | SUPPORT (alias only) |
| `docs/README.md`                | PRODUCT_DEFINITION   |
| `docs/STACK_OVERVIEW.md`        | SUPPORT (alias only) |

---

## CONTEXT SYSTEM

| File                                 | Classification |
| ------------------------------------ | -------------- |
| `docs/context/CONTEXT_MANIFEST.yaml` | CORE_CONTROL   |
| `docs/context/CORE_CONTEXT.md`       | CORE_CONTROL   |
| `docs/context/LIVE_SESSION_BRIEF.md` | CORE_CONTROL   |
| `docs/context/SYSTEM_HANDOFF.md`     | CORE_CONTROL   |
| `docs/context/TASK_PACKS.md`         | CORE_CONTROL   |

---

## EXECUTION SYSTEM

| File                                  | Classification |
| ------------------------------------- | -------------- |
| `docs/execution/MASTER_PLAN.md`       | CORE_CONTROL   |
| `docs/execution/PROJECT_STATE.md`     | CORE_CONTROL   |
| `docs/execution/SESSION_STATE.md`     | CORE_CONTROL   |
| `docs/execution/STATE_TRANSITIONS.md` | CORE_CONTROL   |
| `docs/execution/env_setup.md`         | CORE_CONTROL   |
| `docs/execution/backend/*`            | LEGACY         |
| `docs/execution/frontend/*`           | LEGACY         |

Stack authority is defined in `docs/architecture/STACK_OVERVIEW.md` and surfaced through the `docs/STACK_OVERVIEW.md` compatibility alias.

---

## FEATURE SYSTEM

| File                                       | Classification  |
| ------------------------------------------ | --------------- |
| `docs/features/FEATURE_EXECUTION_MODEL.md` | EXECUTION_MODEL |
| `docs/features/FEATURE_ACCEPTANCE.md`      | EXECUTION_MODEL |
| `docs/features/FEATURE_TRACKER.md`         | EXECUTION_MODEL |
| `docs/features/FEATURE_CATALOG.md`         | EXECUTION_MODEL |
| `docs/features/FEATURE_SPEC_TEMPLATE.md`   | SUPPORT         |
| `docs/features/FEATURE_MIGRATION_MAP.md`   | SUPPORT         |

---

## ARCHITECTURE / ENGINE SYSTEM

| File                  | Classification   |
| --------------------- | ---------------- |
| `docs/architecture/*` | ENGINE_AUTHORITY |
| `docs/contracts/*`    | ENGINE_AUTHORITY |

These define:

* engine behavior
* object model
* API contracts
* ingestion rules

---

## VALIDATION SYSTEM

| File                                        | Classification |
| ------------------------------------------- | -------------- |
| `docs/validation/SYSTEM_VALIDATION_SPEC.md` | CORE_CONTROL   |
| `docs/validation/VALIDATION_CHECKLIST.md`   | SUPPORT        |
| `docs/validation/STYLING_AUDIT.md`          | SUPPORT        |

---

## PRODUCT / UI SYSTEM

| File             | Classification |
| ---------------- | -------------- |
| `docs/product/*` | SUPPORT        |

These guide design but do not override execution or architecture.

---

## RUNTIME / LOGS

| File             | Classification |
| ---------------- | -------------- |
| `docs/runtime/*` | SUPPORT        |

---

## ENFORCEMENT / RECOVERY

| File                 | Classification |
| -------------------- | -------------- |
| `docs/enforcement/*` | SUPPORT        |
| `docs/corrective/*`  | SUPPORT        |

---

## AI / TOOLING

| File           | Classification |
| -------------- | -------------- |
| `docs/ai/*`    | SUPPORT        |
| `docs/tools/*` | SUPPORT        |

---

## LEGACY DOCUMENTS

These are explicitly **non-authoritative**.

| File                      | Classification |
| ------------------------- | -------------- |
| `docs/phases/*`           | LEGACY         |
| `docs/PHASE_STRUCTURE.md` | LEGACY         |

---

## CRITICAL SYSTEM RULES

---

### Rule 1 — Core Control Wins

If conflict exists:

```text
CORE_CONTROL overrides everything
```

---

### Rule 2 — Product Defines Behavior

If feature or execution docs conflict with product definition:

```text
Product must be corrected — not ignored
```

---

### Rule 3 — Engines Own Reality

No document may redefine engine behavior outside:

```text
docs/architecture/*
```

---

### Rule 4 — Hub Does Not Render

Any document suggesting hub renders scenes is invalid.

---

### Rule 5 — Viewport Is Always Engine

```text
ACTIVE ENGINE VIEWPORT is required
```

---

### Rule 6 — Legacy Cannot Control Execution

Legacy docs:

* cannot define features
* cannot define architecture
* cannot define execution

---

### Rule 7 — Sky Engine Is Anchor

Frontend work must start from:

```text
Sky Engine + Babylon.js
```

---

### Rule 8 — Sky Engine Runtime Is Engine-Owned

The Hub may mount Sky Engine, but it must not own Sky Engine's internal render loop, module composition, or runtime state.

---

## FINAL PRINCIPLE

```text
Correct classification prevents incorrect execution.
```

---
