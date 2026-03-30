````markdown
# 🌌 ASTRONOMY HUB — DOCUMENT INDEX (AUTHORITATIVE)

---

# 0. PURPOSE

This document defines:

- what documents exist
- how they relate to each other
- how they should be interpreted

It is a **human-readable map of the system**.

---

# 🚨 CORE RULE

```text
This document DOES NOT control execution.

CONTEXT_MANIFEST.yaml controls what is loaded.
````

If this document conflicts with:

* SYSTEM_VALIDATION_SPEC.md
* CORE_CONTEXT.md
* LIVE_SESSION_BRIEF.md

👉 THIS DOCUMENT IS WRONG

---

# 1. AUTHORITY HIERARCHY (CANONICAL)

All decisions must follow this order:

1. docs/validation/SYSTEM_VALIDATION_SPEC.md
2. docs/context/CORE_CONTEXT.md
3. docs/context/LIVE_SESSION_BRIEF.md
4. docs/DOCUMENT_INDEX.md
5. docs/execution/PROJECT_STATE.md
6. docs/product/ASTRONOMY_HUB_MASTER_PLAN.md
7. phase / execution / UI documents

---

# 2. DOCUMENT SYSTEM MODEL

The documentation system is composed of:

---

## A. EXECUTION CONTROL (MACHINE-ENFORCED)

### CONTEXT_MANIFEST.yaml

Defines:

* what documents are allowed to be loaded
* what context is required per task

Rules:

* ONLY documents in the manifest may be loaded
* /docs directory MUST NOT be scanned
* CORE_CONTEXT.md and LIVE_SESSION_BRIEF.md are ALWAYS required

---

## B. SYSTEM RULES (NON-NEGOTIABLE)

### CORE_CONTEXT.md

Defines:

* architecture law
* runtime law
* data law
* execution law

---

### SYSTEM_VALIDATION_SPEC.md

Defines:

* what is considered complete
* how correctness is proven
* all failure conditions

This is the **highest authority**.

---

## C. SESSION CONTROL

### LIVE_SESSION_BRIEF.md

Defines:

* current execution mode
* current task
* allowed/disallowed actions
* next required step

This is the **single source of truth for current work**.

---

## D. SYSTEM STATE

### PROJECT_STATE.md

Defines:

* what is actually implemented
* what is verified
* current system reality

---

## E. PRODUCT VISION

### ASTRONOMY_HUB_MASTER_PLAN.md

Defines:

* long-term product vision
* conceptual direction

⚠️ This document does NOT authorize implementation

---

## F. EXECUTION & PHASE DOCUMENTS

Examples:

* PHASE_1_SPEC.md
* PHASE_1_BUILD_SEQUENCE.md
* PHASE_2_SPEC.md
* PHASE_2_5_SPEC.md
* execution TODO documents

Defines:

* scoped work per phase
* requirements
* acceptance criteria

---

## G. SUPPORTING DOCUMENTS (LOW AUTHORITY)

Examples:

* README.md
* CHANGELOG.md

Used for:

* navigation
* explanation
* summaries

They do NOT control execution.

---

# 3. CONTEXT LOADING RULE

```text
DO NOT use this document to decide what to load.

ONLY use CONTEXT_MANIFEST.yaml.
```

---

# 4. CONFLICT RESOLUTION

If documents conflict:

1. SYSTEM_VALIDATION_SPEC.md wins
2. CORE_CONTEXT.md wins over all non-validation docs
3. LIVE_SESSION_BRIEF.md defines current task truth
4. DOCUMENT_INDEX.md must be corrected

---

# 5. DRIFT PREVENTION

Execution MUST STOP if:

* required documents are missing
* context is not declared
* instructions conflict
* phase boundaries are violated

---

# 6. REMOVALS / CORRECTIONS

This document intentionally removes:

* layer-based loading system ❌
* SESSION_CONTINUITY_BRIEF.md ❌
* implicit document authority ❌

Replaced with:

* manifest-driven loading ✅
* explicit authority hierarchy ✅
* session-controlled execution ✅

---

# FINAL RULE

```text
This document explains the system.

It does NOT control the system.
```

---

```