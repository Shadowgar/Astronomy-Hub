---

You are working on a project called **Astronomy Hub**.

You are NOT free-coding.

You are operating inside a **strict, document-driven architecture**.

---

# 🔒 REQUIRED FIRST ACTION

Before doing anything else:

1. Read and follow:

```
docs/DOCUMENT_INDEX.md
```

2. Then load ALL Layer 1 documents:

* docs/ASTRONOMY_HUB_MASTER_PLAN.md
* docs/MASTER_PLAN.md
* docs/PROJECT_STATE.md
* docs/SESSION_CONTINUITY_BRIEF.md

3. Then load ALL Layer 2 documents:

* docs/ARCHITECTURE_OVERVIEW.md
* docs/ENGINE_SPEC.md
* docs/OBJECT_MODEL.md
* docs/DATA_CONTRACTS.md
* docs/INGESTION_STRATEGY.md

4. Then load execution + validation:

* docs/PHASE_1_BUILD_SEQUENCE.md
* docs/VALIDATION_CHECKLIST.md
* docs/env_setup.md

---

# 📍 CURRENT PROJECT STATE (MANDATORY)

* Active Phase: **Phase 1 — Command Center (RESTARTED)**
* Current Workstream: **Phase 1 — Sequenced Rebuild**

---

# ⚠️ HARD RULES

You MUST:

* follow MASTER_PLAN.md
* follow PROJECT_STATE.md
* follow DATA_CONTRACTS.md
* follow ENGINE_SPEC.md
* follow OBJECT_MODEL.md

You MUST NOT:

* add new features
* redesign UI
* introduce new engines
* skip steps
* change architecture
* invent schemas

---

# ⚙️ EXECUTION RULES

* Follow PHASE_1_BUILD_SEQUENCE.md EXACTLY
* Perform ONE step at a time
* Use minimal diffs only
* Verify after every step
* Do not batch changes

---

# 🧠 SYSTEM MODEL (NON-NEGOTIABLE)

```
Scope → Engine → Filter → Scene → Object → Detail
```

* One active scene
* One active filter
* Backend owns data
* Frontend renders only

---

# 🔍 DATA RULES

* ALL data must follow DATA_CONTRACTS.md
* NO raw API responses
* NO inconsistent schemas

---

# 🧪 BEFORE YOU WRITE CODE

You MUST:

1. State which step from PHASE_1_BUILD_SEQUENCE.md you are executing
2. Explain the minimal change you will make
3. Confirm it does not violate any rules

---

# 🛑 STOP CONDITIONS

You MUST STOP if:

* a step is unclear
* documents conflict
* implementation would break constraints
* you are about to introduce a new feature

---

# ✅ OUTPUT FORMAT

Every response must include:

1. Step being executed
2. Files to modify
3. Exact code changes
4. Verification steps

---

# 🔥 FINAL RULE

You are not designing.

You are executing a controlled system.

Follow the documents.
Follow the phase.
Do not drift.

---

## ⚡ Pro Tip (use this every time)

After pasting that, your next message should be:

👉
**“Proceed with Step 1”**

or

👉
**“Continue from last verified step”**

---

## 🧭 What this gives you

* Forces BitFrog to load ALL critical docs
* Prevents it from skipping architecture
* Prevents feature creep
* Keeps it inside Phase 1
* Keeps changes small and controlled

---

Flights are excluded from Phase 1.
The Flight Engine first appears in Phase 2.

---