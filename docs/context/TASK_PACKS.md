# TASK PACKS — ASTRONOMY HUB (AUTHORITATIVE REFERENCE)

This document explains the context injection system.

It is NOT a substitute for CONTEXT_MANIFEST.yaml.
It is a human-readable reference for enforcement and auditing.

---

# 1. PURPOSE

The system uses task-based context injection to:

- prevent document overload
- eliminate AI guessing
- enforce consistent execution behavior
- reduce drift across sessions

The AI MUST only load documents defined in CONTEXT_MANIFEST.yaml.

---

# 2. GLOBAL CONTEXT (ALWAYS LOADED)

All tasks MUST load:

- docs/context/CORE_CONTEXT.md
- docs/context/LIVE_SESSION_BRIEF.md

These define:

CORE_CONTEXT.md:
- system identity
- architecture law
- runtime law
- data law
- execution law

LIVE_SESSION_BRIEF.md:
- current execution mode
- current task
- next step
- blockers

---

# 3. TASK TYPES

## 3.1 BACKEND_CHANGE

Used when:
- modifying backend logic
- working on FastAPI routes/services
- handling data ingestion or normalization

Loads:

- architecture documents
- data contracts
- stack overview
- environment setup
- validation spec
- backend phase execution document

Reason:

Backend work requires:
- strict adherence to architecture pipeline
- correct data normalization
- correct runtime behavior (Docker)

---

## 3.2 FRONTEND_CHANGE

Used when:
- modifying UI components
- working with React structure
- consuming backend APIs

Loads:

- architecture overview
- data contracts
- stack overview
- validation spec
- frontend phase execution document

Reason:

Frontend must:
- NOT interpret raw data
- follow scene → object → detail flow
- respect contract boundaries

UI documents are ONLY loaded when explicitly required.

---

## 3.3 DOCS_CHANGE

Used when:
- modifying documentation
- reconciling system state
- updating phase or execution docs

Loads:

- document index
- master plan
- project state
- ONLY documents being modified

Reason:

Documentation must:
- remain authoritative
- avoid drift
- align with actual system state

---

## 3.4 VALIDATION

Used when:
- verifying phase completion
- auditing system behavior
- confirming correctness

Loads:

- validation spec
- Phase 1 spec
- Phase 1 acceptance
- Phase 1 build sequence

Reason:

Validation requires:
- strict comparison against defined requirements
- no interpretation
- proof-based confirmation

---

# 4. ENFORCEMENT RULES

The AI MUST:

- load only documents defined in CONTEXT_MANIFEST.yaml
- declare all loaded documents before starting
- confirm no additional documents were used

---

# 5. PROHIBITIONS

The AI MUST NOT:

- scan the entire /docs directory
- guess relevant documents
- mix documents across task types
- use documents outside the manifest

---

# 6. FAILURE CONDITIONS

A task is INVALID if:

- required documents are not loaded
- extra documents are loaded
- context is not declared
- task type is incorrect

---

# 7. SYSTEM PRINCIPLE

The AI does NOT need all documents.

The AI needs ONLY the correct documents.

---

# END