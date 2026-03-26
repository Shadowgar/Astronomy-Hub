# 🌌 ASTRONOMY HUB — DOCUMENT INDEX (AUTHORITATIVE)

---

# 0. PURPOSE

This document defines:

> **The complete list of authoritative documents and how they must be used**

It ensures:

* AI reads the correct documents
* no document is ignored
* no outdated document is followed
* system remains aligned

---

# 1. 🧠 CORE RULE

```text
If a document is not listed here,
it is NOT authoritative.
```

---

# 2. 📚 DOCUMENT HIERARCHY

Documents are divided into **layers of authority**.

---

## 🧱 LAYER 1 — SYSTEM FOUNDATION (HIGHEST AUTHORITY)

These define the system itself.

AI MUST ALWAYS READ THESE FIRST.

---

### Required Reading Order

1. `ASTRONOMY_HUB_MASTER_PLAN.md` → full vision
2. `MASTER_PLAN.md` → execution control
3. `PROJECT_STATE.md` → current reality
4. `SESSION_CONTINUITY_BRIEF.md` → session rules

---

## 🧠 LAYER 2 — ARCHITECTURE

Defines how the system works internally.

---

### Required

* `ARCHITECTURE_OVERVIEW.md`
* `ENGINE_SPEC.md`
* `OBJECT_MODEL.md`
* `DATA_CONTRACTS.md`
* `INGESTION_STRATEGY.md`

---

## 🎨 LAYER 3 — UI & DESIGN SYSTEM

Defines how the system is presented.

---

### Required

* `UI_INFORMATION_ARCHITECTURE.md`
* `UI_PHASE_A_SPEC.md`
* `UI_PHASE_B_SPEC.md`
* `UI_PHASE_C_SPEC.md`
* `UI_DESIGN_PRINCIPLES.md`
* `styling_decision.md`
* `styling_audit.md`

---

## ⚙️ LAYER 4 — EXECUTION & VALIDATION

Defines how work is done and verified.

---

### Required

* `PHASE_1_SPEC.md`
* `PHASE_2_SPEC.md`
* `PHASE_2_5_SPEC.md`
* `PHASE_3_SPEC.md`
* `PHASE_4_SPEC.md`
* `PHASE_5_SPEC.md`
* `PHASE_2_EXECUTION_TODO.md`
* `VALIDATION_CHECKLIST.md`
* `env_setup.md`

---

## 📊 LAYER 5 — SUPPORTING DOCUMENTS

Lower authority, supporting only.

---

### Examples

* `README.md`
* `CHANGELOG.md`
* `PROJECT_STATE_HISTORY.md`

---

---

# 3. 🚫 NON-AUTHORITATIVE DOCUMENTS

These must NOT influence development:

* brainstorm notes
* temp plans
* old specs
* archived docs

---

## Rule

```text
If a document conflicts with this index,
the index wins.
```

---

# 4. 🧠 AI EXECUTION RULE

When working on this project, the AI must:

---

## Step 1 — Load Context

Read:

* Layer 1 (ALL)
* Relevant Layer 2 docs
* Relevant Layer 3 docs (if UI work)

---

## Step 2 — Follow Constraints

* obey MASTER_PLAN.md
* obey PROJECT_STATE.md
* obey DATA_CONTRACTS.md

---

## Step 3 — Execute

* follow PHASE_2_EXECUTION_TODO.md
* perform minimal diffs
* verify each step

---

---

# 5. ⚠️ DRIFT PREVENTION RULE

AI must STOP if:

* a required document is missing
* instructions conflict
* a request violates phase rules

---

---

# 6. 🔥 FINAL STATEMENT

```text
This document controls which documents matter.

If this is ignored,
the system will drift again.
```

---