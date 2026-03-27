# 🌌 ASTRONOMY HUB — CHANGELOG UPDATE RULES (AUTHORITATIVE)

## 0. PURPOSE

This document defines:

> how execution history, session state, public progress, and UI changelog data must be updated after implementation work

It ensures:

- progress is never lost
- AI sessions resume correctly
- internal history stays technical
- public progress stays readable
- the UI changelog page stays in sync

---

## 1. CORE RULE

If a step is implemented and verified, the documentation must be updated immediately after that step is completed.

The following files are part of the changelog/update system:

- `docs/EXECUTION_LOG.md`
- `docs/SESSION_STATE.md`
- `docs/PUBLIC_CHANGELOG.md`
- `frontend/src/content/publicChangelog.json`

---

## 2. UPDATE ORDER (MANDATORY)

After a step is completed and verified, update files in this order:

1. `docs/EXECUTION_LOG.md`
2. `docs/SESSION_STATE.md`
3. `docs/PUBLIC_CHANGELOG.md`
4. `frontend/src/content/publicChangelog.json`

Do not update these files before verification is complete.

---

## 3. EXECUTION_LOG RULES

`docs/EXECUTION_LOG.md` is the technical implementation history.

It must include:
- step number / name
- phase
- exact files changed
- exact work performed
- why the work was done
- verification commands
- verification result
- final status (PASS / FAIL)

This file is for:
- the developer
- future AI sessions
- technical traceability

This file must NOT:
- hide failures
- omit verification
- use vague language like “fixed stuff”
- act like a public marketing log

---

## 4. SESSION_STATE RULES

`docs/SESSION_STATE.md` is the live current-state save file.

It must reflect:
- active execution phase
- current workstream
- current step
- last completed step
- next step
- active constraints

After each completed step:
- move the completed step into “last completed”
- advance the current step
- update the next step if needed

This file must always reflect the current truth of the project.

---

## 5. PUBLIC_CHANGELOG RULES

`docs/PUBLIC_CHANGELOG.md` is the user-facing progress summary.

It must be:
- plain language
- concise
- understandable to non-developers
- focused on visible progress and meaningful milestones

It may include:
- new features completed
- current area of work
- what is coming next
- milestone progress

It must NOT include:
- low-level contract changes
- schema internals
- refactor jargon
- debugging noise
- failed experiments unless intentionally shared

---

## 6. UI CHANGELOG JSON RULES

`frontend/src/content/publicChangelog.json` is the UI-ready structured version of the public changelog.

It must mirror `docs/PUBLIC_CHANGELOG.md` closely enough that the UI and the public document do not drift apart.

It should contain structured fields such as:
- currentStatus
- currentFocus
- recentProgress[]
- inProgress[]
- comingNext[]
- roadmap[]

This file is for rendering in the app UI.

It must NOT contain internal-only technical details.

---

## 7. SOURCE OF TRUTH RELATIONSHIP

The relationship is:

- `EXECUTION_LOG.md` → technical truth
- `SESSION_STATE.md` → current truth
- `PUBLIC_CHANGELOG.md` → public summary
- `publicChangelog.json` → UI rendering source

These files serve different audiences and must not be merged into one file.

---

## 8. WHEN TO UPDATE

Update all four files when:
- a step is fully implemented
- verification has run
- result is known

Do NOT update them when:
- work is only planned
- code is half-finished
- verification has not been performed
- the result is uncertain

---

## 9. FAILURE RULE

If a step fails verification:

- record the attempt in `EXECUTION_LOG.md`
- mark result as FAIL
- do not present it as completed in `PUBLIC_CHANGELOG.md`
- do not advance `SESSION_STATE.md` as if it succeeded
- do not add it to `publicChangelog.json` as finished progress

---

## 10. AI EXECUTION RULE

Any AI working on the repo must:

Before coding:
- read `docs/EXECUTION_LOG.md`
- read `docs/SESSION_STATE.md`
- read `docs/PUBLIC_CHANGELOG.md`
- read this file

After a verified step:
- update all four files
- show the exact diffs before finalizing if requested

---

## 11. FINAL RULE

If implementation changes but the changelog system is not updated, the project state is considered out of sync.