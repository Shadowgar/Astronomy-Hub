# 🌌 ASTRONOMY HUB — SESSION CONTINUITY BRIEF (AUTHORITATIVE)

---

# 0. PURPOSE

This document ensures:

> **Every new session, AI agent, or coding assistant continues the project correctly without drift**

It provides:

* system context
* current phase
* rules of engagement
* allowed actions
* forbidden actions

---

# 1. 🧠 CORE RULE

```text
You are working on Astronomy Hub.

You are NOT designing freely.
You are executing within a locked system.

All work must follow:
- MASTER_PLAN.md
- PROJECT_STATE.md
- ARCHITECTURE_OVERVIEW.md
- DATA_CONTRACTS.md
```

---

# 2. 📍 CURRENT STATE (MANDATORY CONTEXT)

---

## Active Phase

```text
Phase 1 — Command Center (RESTARTED)
```

---

## Current Workstream

```text
Phase 1 — Sequenced Rebuild
```

---

## System Status

* prototype backend exists
* Docker environment works
* frontend + backend run
* architecture has been rewritten
* data contracts are defined
* Phase 1 audit has been completed

---

## System Problems (KNOWN)

* backend is not canonical
* data is not fully normalized
* contracts not enforced
* UI is misaligned with architecture
* frontend compensates for backend
* authoritative docs previously disagreed on current phase and flight scope

---

# 3. 🎯 CURRENT OBJECTIVE

```text
Rebuild the Phase 1 command center in a controlled order
without Phase 2 leakage
```

---

# 4. ⚙️ WHAT YOU ARE ALLOWED TO DO

---

## Backend

* implement the canonical Phase 1 scene endpoint
* implement the canonical Phase 1 object detail endpoint
* normalize limited Phase 1 engine outputs
* enforce data contracts for Phase 1
* keep backend as the data authority

---

## Frontend

* build the Phase 1 command-center shell
* render the Above Me scene from backend-owned data
* implement object detail flow
* align UI behavior with the Phase 1 information architecture

---

## System

* improve reliability
* improve consistency
* reduce ambiguity
* execute `PHASE_1_BUILD_SEQUENCE.md` one step at a time

---

# 5. 🚫 WHAT YOU ARE NOT ALLOWED TO DO

---

## Strictly Forbidden

* adding new features
* adding Phase 2 scopes
* introducing flight tracking in Phase 1
* implementing Phase 2+ functionality
* expanding product scope beyond Phase 1

---

## Also Forbidden

* skipping phases
* rewriting architecture
* ignoring contracts
* creating new data formats
* bypassing normalization

---

# 6. 🧠 SYSTEM MODEL (MANDATORY UNDERSTANDING)

---

All work must align with:

```text
Scope → Engine → Filter → Scene → Object → Detail
```

---

## Key Rules

* one active scene
* one active filter
* backend owns data
* frontend renders only
* no global computation

---

# 7. 🔍 DATA RULE

```text
All data must conform to DATA_CONTRACTS.md
```

---

## Required

* normalized objects
* consistent schemas
* structured responses

---

## Forbidden

* raw API responses
* inconsistent formats
* partial data

---

# 8. 🧪 EXECUTION STYLE

---

## Required Workflow

```text
1. Read relevant document(s)
2. Check PHASE_1_BUILD_SEQUENCE.md
3. Plan minimal change
4. Implement one step
5. Verify result
6. Report outcome
```

---

## Rules

* one step at a time
* no large unverified changes
* no speculative refactors
* minimal diffs only

---

# 9. 🧭 DECISION RULE

---

If unsure:

```text
Check:
1. PROJECT_STATE.md
2. MASTER_PLAN.md
3. PHASE_1_BUILD_SEQUENCE.md
4. ARCHITECTURE_OVERVIEW.md
5. DATA_CONTRACTS.md
```

---

If still unclear:

```text
Ask for clarification
```

---

## Never

* guess
* invent
* assume missing features

---

# 10. 🔄 CONTINUITY REQUIREMENT

---

Every response must:

* respect current phase
* respect system constraints
* avoid future-phase leakage
* maintain architectural alignment

---

# 11. ⚠️ DRIFT DETECTION

---

You must stop and correct if:

* solution introduces new features
* solution ignores contracts
* solution changes system behavior unexpectedly
* solution expands scope

---

# 12. 🎯 SUCCESS CRITERIA (CURRENT PHASE)

---

Success =

* backend is stable
* contracts are enforced
* API is predictable
* frontend no longer patches data

---

# 13. 🔥 FINAL STATEMENT

```text
You are not building freely.

You are executing a controlled system.

Follow the phase.
Follow the contracts.
Follow the architecture.
```

---

## Where you are now

You’ve locked:

* vision
* architecture
* phases
* state
* execution rules

This document ensures:

👉 every future session stays aligned

---

## Next document

👉 `VALIDATION_CHECKLIST.md`

This will define:

* how to verify each phase
* what “done” actually means
* how to catch hidden failures

---