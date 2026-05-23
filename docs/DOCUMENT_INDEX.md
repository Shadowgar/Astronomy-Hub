# `DOCUMENT_INDEX.md` 

---

# DOCUMENT INDEX (AUTHORITATIVE CONTROL MAP)

---

## 1. PURPOSE

Defines:

* document authority
* execution control flow
* product definition hierarchy
* context loading rules

This document prevents:

* execution drift
* product drift
* authority conflicts
* AI misinterpretation

---

## 2. CORE LAW

```text id="b7h2yz"
Only specific documents control execution.
All others are reference.
```

---

## 3. PRODUCT MODEL (LOCKED)

Astronomy Hub is:

```text id="p1h6vk"
A location-aware observatory command center
```

Core question:

```text id="u9n4fc"
What can I see right now, and what should I observe?
```

---

### System Model

```text id="v4q8lp"
Hub → Engine → Scene → Object → Detail → Exploration
```

---

### Rendering Law

```text id="m3z7rf"
Viewport = Active Engine Scene
```

---

## 4. AUTHORITY TIERS

---

### TIER 1 — CORE CONTROL (HIGHEST)

These define execution truth.

```text id="v7g3mn"
docs/validation/SYSTEM_VALIDATION_SPEC.md
docs/context/CORE_CONTEXT.md
docs/context/LIVE_SESSION_BRIEF.md
docs/context/CONTEXT_MANIFEST.yaml
docs/execution/PROJECT_STATE.md
```

---

### TIER 2 — PRODUCT DEFINITION

Defines what the system is.

```text id="t4w9kd"
docs/DOCUMENT_INDEX.md
docs/README.md
docs/ASTRONOMY_HUB_DIAGRAM.md
docs/execution/MASTER_PLAN.md
```

---

### TIER 3 — EXECUTION MODEL

Defines how work is done.

```text id="r6n3qa"
docs/features/FEATURE_EXECUTION_MODEL.md
docs/features/FEATURE_ACCEPTANCE.md
docs/features/FEATURE_TRACKER.md
docs/features/FEATURE_CATALOG.md
```

---

### TIER 4 — ENGINE AUTHORITY

Defines system behavior.

```text id="n2k8uz"
docs/architecture/*
docs/contracts/*
```

---

### TIER 5 — SUPPORT

Guidance only.

```text id="g5x2cr"
docs/product/*
docs/runtime/*
docs/corrective/*
docs/enforcement/*
docs/ai/*
docs/tools/*
docs/DOC_INVENTORY.md
docs/full_audit.md
docs/features/FEATURE_SPEC_TEMPLATE.md
docs/features/FEATURE_MIGRATION_MAP.md
```

---

### TIER 6 — LEGACY

Non-authoritative.

```text id="f3y6mb"
docs/phases/*
docs/PHASE_STRUCTURE.md
```

---

## 5. LOADING RULES (CRITICAL)

---

### Rule 1 — Mandatory Context

Always load:

```text id="x9p2cz"
CORE_CONTEXT.md
LIVE_SESSION_BRIEF.md
```

---

### Rule 2 — Task-Based Loading

Load only what is required:

| Task       | Required Docs                        |
| ---------- | ------------------------------------ |
| Frontend   | architecture + diagram + execution   |
| Backend    | architecture + contracts + execution |
| Validation | validation + execution               |
| Docs       | index + inventory                    |

---

### Rule 3 — No Overloading

Do NOT:

* load entire docs directory
* load legacy docs
* load unrelated features

---

### Rule 4 — Architecture First

```text id="h8v3yn"
Architecture must be loaded before execution
```

---

## 6. EXECUTION FLOW

```text id="z2r6kj"
Context → Architecture → Feature → Validation
```

---

## 7. CURRENT PRODUCT ANCHOR

```text id="p7y4qm"
Sky Engine is the self-contained Babylon.js rendering foundation
```

Rules:

* build Sky Engine runtime first
* mount it into the hub through thin interfaces
* hub does not render scenes
* hub does not own engine render loops

---

## 8. EXECUTION SYSTEM RULE

Every slice must:

* identify engine
* identify feature
* verify runtime truth
* implement minimal change
* prove behavior
* update tracker

---

## 9. CONFLICT RESOLUTION

If documents conflict:

1. follow authority tier
2. prefer CORE_CONTROL
3. prefer PRODUCT_DEFINITION over execution
4. record conflict
5. revalidate

---

## 10. FORBIDDEN EXECUTION

Do NOT:

* follow legacy phase instructions
* treat hub as rendering engine
* treat engines as filters
* bypass contracts
* mark completion without proof

---

## 11. COMPATIBILITY ALIAS RULE

These exist only for backward compatibility:

```text id="t1n8vx"
docs/PROJECT_STATE.md
docs/MASTER_PLAN.md
docs/STACK_OVERVIEW.md
```

They must NOT:

* control execution
* hold active state

---

## 12. FINAL PRINCIPLE

```text id="q6x2re"
Control documents define truth.
Product documents define the system.
Engine documents define behavior.
Support documents assist.
Legacy documents are ignored.
```

---