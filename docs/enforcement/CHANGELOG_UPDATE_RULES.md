````markdown
# CHANGELOG UPDATE RULES — ASTRONOMY HUB (AUTHORITATIVE)

---

# 1. PURPOSE

This document defines:

- when the changelog must be updated
- how updates must be written
- what proof is required

The changelog is a **validation artifact**, not a narrative log.

---

# 2. CORE RULE

```text
If a change is not recorded, it does not exist.
````

All system changes MUST be:

* documented
* verifiable
* traceable to execution

---

# 3. WHEN TO UPDATE

The changelog MUST be updated when:

* a task is completed
* a document is rewritten
* a system rule changes
* validation status changes
* execution state changes

---

# 4. WHAT MUST BE INCLUDED

Each entry MUST include:

### 1. Change Type

* docs
* backend
* frontend
* validation
* system

---

### 2. Files Affected

Exact file paths

---

### 3. Description

* what changed
* why it changed
* what problem it resolves

---

### 4. Validation Impact

* what validation rule is affected
* proof of correctness (if applicable)

---

### 5. Execution Context

* execution mode (from LIVE_SESSION_BRIEF.md)
* active task

---

# 5. FORMAT (REQUIRED)

```text
[DATE] — [CHANGE TYPE]

FILES:
- path/to/file

DESCRIPTION:
- ...

VALIDATION:
- ...

CONTEXT:
- mode: ...
- task: ...
```

---

# 6. PROHIBITIONS

* Do NOT write vague summaries
* Do NOT omit affected files
* Do NOT log unverified changes
* Do NOT log planned work
* Do NOT use narrative or commentary

---

# 7. VALIDATION REQUIREMENT

A changelog entry is VALID only if:

* the change exists in the system
* the change can be verified
* the change aligns with validation rules

If proof cannot be provided → INVALID ENTRY

---

# 8. RELATION TO SESSION SYSTEM

* LIVE_SESSION_BRIEF.md defines current task and mode
* Changelog reflects completed, verified steps only
* SESSION_STATE.md tracks execution flow
* Changelog records permanent system changes

---

# 9. FAILURE CONDITIONS

Execution MUST STOP if:

* a change is made without a changelog entry
* a changelog entry lacks required fields
* a change cannot be validated
* changelog contradicts system reality

---

# FINAL RULE

```text
The changelog is a record of verified truth.

If it is not verifiable, it must not be recorded.
```

---

```

---