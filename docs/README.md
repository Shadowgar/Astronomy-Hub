````
# 🌌 Astronomy Hub — Documentation System

---

## 1. PURPOSE

This directory contains the authoritative documentation system for Astronomy Hub.

It defines:

- how the system works
- how execution is controlled
- how validation is enforced
- how context is loaded

This is NOT a general documentation folder.

It is a **controlled system**.

---

## 2. CORE RULE

```text
If it cannot be proven, it is NOT complete.
````

All work must be:

* implemented
* verified
* validated
* aligned with system laws

---

## 3. SYSTEM STRUCTURE

Astronomy Hub follows a strict architecture:

```
Scope → Engine → Filter → Scene → Object → Detail
```

Rules:

* Scene is the ONLY visible surface
* Objects MUST originate from Scene
* Detail MUST resolve from Object identity
* UI MUST NOT interpret raw data
* All data MUST be normalized before UI

---

## 4. DOCUMENT SYSTEM

This system is controlled by two components:

### 1. CONTEXT_MANIFEST.yaml (AUTHORITATIVE)

Defines:

* what documents are allowed to be loaded
* what context is required per task

This controls execution.

---

### 2. DOCUMENT_INDEX.md

Defines:

* what documents exist
* how they relate to each other
* human-readable system structure

This explains the system.

---

## RULE

```text
The manifest controls behavior.
The index explains the system.
```

---

## 5. AUTHORITY HIERARCHY

All decisions must follow:

1. SYSTEM_VALIDATION_SPEC.md
2. CORE_CONTEXT.md
3. LIVE_SESSION_BRIEF.md
4. DOCUMENT_INDEX.md
5. PROJECT_STATE.md
6. ASTRONOMY_HUB_MASTER_PLAN.md
7. Phase / execution / UI documents

---

## 6. EXECUTION MODEL

* Work is phase-controlled
* Only one task may be active
* Each step must be verified before proceeding
* No assumptions are allowed

---

## 7. PROHIBITIONS

* Do NOT scan /docs directory
* Do NOT load documents outside CONTEXT_MANIFEST.yaml
* Do NOT assume completion
* Do NOT bypass validation
* Do NOT mix phase scopes

---

## 8. CURRENT STATE

* Backend: stable (FastAPI, services, tests)
* Frontend: normalized (no fallback logic)
* Runtime: Docker functional

System status:

* Phase 1: UNVERIFIED
* Phase 2: BLOCKED

---

## 9. CURRENT OBJECTIVE

We are building:

* context system
* validation system

We are NOT:

* building features
* expanding backend
* redesigning UI

---

## 10. HOW TO USE THIS SYSTEM

In any session:

1. Load required context using CONTEXT_MANIFEST.yaml
2. Confirm execution mode from LIVE_SESSION_BRIEF.md
3. Follow authority hierarchy
4. Execute ONE task at a time
5. Provide proof for all claims

---

## 11. FAILURE CONDITIONS

Execution must STOP if:

* documents conflict
* required context is missing
* validation cannot be proven
* scope is violated

---

## FINAL RULE

```text
If something cannot be proven, it does not exist.
```

---

```