````markdown
# SESSION STATE — ASTRONOMY HUB (AUTHORITATIVE)

---

# 1. PURPOSE

This document tracks:

- execution progress
- completed steps
- current position in workflow

It is a **tracking document**, not a control document.

---

# 🚨 CORE RULE

```text
LIVE_SESSION_BRIEF.md defines execution.

SESSION_STATE.md records execution.
````

If this document conflicts with LIVE_SESSION_BRIEF.md:

👉 THIS DOCUMENT IS WRONG

---

# 2. ROLE IN SYSTEM

This document exists to:

* provide continuity between steps
* record completed work
* show current execution position

It does NOT:

* define tasks
* authorize actions
* override execution rules

---

# 3. STRUCTURE

---

## CURRENT POSITION

* current task:
* current step:

---

## COMPLETED STEPS

* step:

  * result:
  * validation:

---

## NEXT STEP (REFERENCE ONLY)

* next step:

⚠️ This must match LIVE_SESSION_BRIEF.md
If it does not → STOP and resolve conflict

---

# 4. RELATION TO OTHER DOCUMENTS

---

### LIVE_SESSION_BRIEF.md (AUTHORITY)

Defines:

* execution mode
* active task
* allowed actions
* next required step

---

### SYSTEM_VALIDATION_SPEC.md

Defines:

* what qualifies as completion
* what must be proven

---

### CONTEXT_MANIFEST.yaml

Defines:

* what documents were loaded during execution

---

# 5. UPDATE RULES

This document MUST be updated:

* after each completed step
* after validation is confirmed

Each update MUST include:

* step name
* result
* validation status

---

# 6. PROHIBITIONS

* Do NOT define new tasks
* Do NOT modify execution flow
* Do NOT contradict LIVE_SESSION_BRIEF.md
* Do NOT log unverified work

---

# 7. FAILURE CONDITIONS

Execution MUST STOP if:

* SESSION_STATE conflicts with LIVE_SESSION_BRIEF
* steps are recorded without validation
* execution position is unclear

---

# FINAL RULE

```text
This document tracks what happened.

It does NOT decide what happens.
```

---

```

---