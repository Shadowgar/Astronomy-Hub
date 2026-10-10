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
| `docs/MASTER_PLAN.md`           | SUPPORT (product reference) |
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
| `docs/execution/MASTER_PLAN.md`       | PRODUCT_DEFINITION — non-executing product reference |
| `docs/execution/PROJECT_STATE.md`     | CORE_CONTROL — current roadmap and activation |
| `docs/execution/EARTH_CAPABILITY_PLAN.md` | EXECUTION_MODEL — authoritative Earth planning reference; no activation |
| `docs/execution/C5_7_EARTH_CORE_RECOVERY_SPEC.md` | EXECUTION_MODEL — PROPOSED; owner approval required |
| `docs/execution/C6_GLOBAL_MAPPING_SPEC.md` | EXECUTION_MODEL — approved direction; proposed stages, no implementation authority |
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
| `docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md` | ENGINE_AUTHORITY (approved direction; current/planned/open explicit) |
| `docs/architecture/decisions/*` | ENGINE_AUTHORITY (dated accepted decisions; supersession explicit, not implementation proof) |
| `docs/architecture/decisions/0009-owned-earth-feature-reuse.md` | ENGINE_AUTHORITY — current owned Earth/reuse decision; supersedes full-app topology |
| `docs/contracts/*`    | ENGINE_AUTHORITY |

These define:

* engine behavior
* object model
* API contracts
* ingestion rules

---

## Validation support registry

`scripts/validation/private_evidence_links.json` is SUPPORT metadata for sixteen
private historical C5 artifact links, not a document controller, committed media
or fresh runtime proof. Validation authority defines the exact bounded exception;
all other relative repository/source links remain mandatory.

## VALIDATION SYSTEM

| File                                        | Classification |
| ------------------------------------------- | -------------- |
| `docs/validation/SYSTEM_VALIDATION_SPEC.md` | CORE_CONTROL   |
| `docs/validation/VALIDATION_CHECKLIST.md`   | SUPPORT        |
| `docs/validation/C5_6_75_DOCUMENTATION_RECONCILIATION_EVIDENCE.md` | SUPPORT — documentation checks and preservation, no feature proof |
| `docs/audits/*2026-10-05*` | SUPPORT — eight immutable dated audit outputs; draft input is not execution authority |
| `docs/audits/GODS_EYE_MASTER_ADOPTION_BLUEPRINT_2026-10-10.md` | SUPPORT — owner-review adoption matrix; no implementation authority |
| `docs/audits/EXTERNAL_COMPONENTS_AND_DATA_GAPS_2026-10-10.md` | SUPPORT — official-source code/data/provider alternatives and unresolved gates |
| `docs/audits/EARTH_VISUAL_FOUNDATION_DECISION_PACKET_2026-10-10.md` | SUPPORT — visual tiers, reuse paths and future owner/device acceptance |
| `docs/audits/GODS_EYE_ROADMAP_REPRIORITIZATION_PROPOSAL_2026-10-10.md` | SUPPORT — proposed ordering only; approved execution controls unchanged |
| `docs/audits/gods-eye-adoption-register-2026-10-10.json` | SUPPORT — v2 derivation of immutable historical inventory; recommendations separate from implementation |
| `docs/audits/gods-eye-adoption-coverage-2026-10-10.json` | SUPPORT — source/asset discovery hashes; no asset admission or execution proof |
| `docs/audits/MASTER_ADOPTION_AUDIT_VALIDATION_2026-10-10.md` | SUPPORT — exact context, checks and preservation handoff; no fresh visual proof |
| `docs/validation/STYLING_AUDIT.md`          | SUPPORT        |
| `docs/validation/EARTH_HD_MAPPING_EVIDENCE.md` | SUPPORT — provider investigation and local qualification |
| `docs/validation/LOCAL_DEVELOPMENT_REPAIR_EVIDENCE.md` | SUPPORT — laptop workflow and measured local repair |

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

### Rule 4 — Preserve Renderer Ownership

Hub shell/product state does not become a shared rendering core or own SWE math.
The independent Earth runtime owns its Cesium Viewer and scene; Hub owns that
runtime implementation and adapters. Selective God's Eye reuse preserves this boundary.

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
Hub decision layer + contained ORAS Stellarium runtime at /oras-sky-engine/
```

---

### Rule 8 — Sky Engine Runtime Is Engine-Owned

The Hub may mount Sky Engine and owns product context. It must not own the
SWE engine's internal render loop, module composition, or renderer-local state.
Current small product state and camera/selection intent are Hub-owned under
`docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md`; adapters realize intent.
Owned Cesium Earth and selective pinned God's Eye feature reuse are current; full
capability parity, body-aware surfaces and broad astronomy extensions are not.

---

## FINAL PRINCIPLE

```text
Correct classification prevents incorrect execution.
```

---
