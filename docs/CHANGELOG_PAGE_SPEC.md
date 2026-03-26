# 🌌 ASTRONOMY HUB — CHANGELOG / PROGRESS PAGE SPEC (AUTHORITATIVE)

---

# 0. PURPOSE

This document defines:

> **The user-facing Progress / Changelog page for Astronomy Hub**

It exists to:

* show visible project progress
* communicate what is being built
* make development understandable to users
* separate public-facing updates from internal execution logs

This page is part of the product experience, but it is **not** an internal engineering log.

---

# 1. CORE RULE

```text id="chgpage01"
This page is for users and supporters of the project.

It must communicate progress clearly,
without exposing internal engineering noise.
```

---

# 2. PAGE GOAL

The page must answer:

* What is the current status of Astronomy Hub?
* What is being worked on right now?
* What was completed recently?
* What is coming next?
* Where is the project headed?

A user should leave the page feeling:

* informed
* confident
* interested in the next milestone

---

# 3. DATA SOURCE

The page must render from:

```text id="chgpage02"
frontend/src/content/publicChangelog.json
```

This JSON is the UI-ready source of truth for the page.

It should be kept in sync with:

* `docs/PUBLIC_CHANGELOG.md`

---

# 4. PAGE NAME

Allowed page titles:

* Progress
* Development Progress
* Project Progress
* What’s New

Preferred title:

```text id="chgpage03"
Development Progress
```

---

# 5. PAGE STRUCTURE (LOCKED)

The page must contain the following sections in this order.

---

## 5.1 Current Status Hero

### Purpose

Provide the user with an instant snapshot of the project.

### Must include

* current phase
* short summary
* optional note about active rebuild / milestone

### Example

* “Phase 1 — Command Center Rebuild”
* “Astronomy Hub is being rebuilt into a real astronomy command center.”

### Rule

```text id="chgpage04"
The hero must be concise and immediately understandable.
```

---

## 5.2 Current Focus

### Purpose

Show what the team is actively working on now.

### Must include

* 2–5 active focus items

### Examples

* Building the Above Me scene
* Establishing object detail flow
* Replacing the old prototype dashboard structure

### Rule

```text id="chgpage05"
Current Focus must describe active work, not long-term dreams.
```

---

## 5.3 Recent Progress

### Purpose

Show completed work in a human-readable format.

### Must include

* recent completed milestones
* short explanation of what changed
* no deep technical jargon

### Rule

```text id="chgpage06"
This section should feel encouraging and concrete.
```

---

## 5.4 In Progress

### Purpose

Show what has started but is not yet complete.

### Must include

* active work items
* short plain-language summary

### Rule

```text id="chgpage07"
Do not present in-progress work as finished.
```

---

## 5.5 Coming Next

### Purpose

Set expectations for what users should anticipate next.

### Must include

* near-term upcoming milestones
* 2–5 items maximum

### Rule

```text id="chgpage08"
This section must stay realistic and near-term.
```

---

## 5.6 Roadmap Overview

### Purpose

Show the big picture without overwhelming the user.

### Must include

* phase cards or timeline entries
* one short summary per phase

### Required phases

* Phase 1
* Phase 2
* Phase 3
* Phase 4
* Phase 5

### Rule

```text id="chgpage09"
Roadmap entries must be short and high level.
```

---

# 6. VISUAL HIERARCHY

The page must prioritize information in this order:

1. Current Status
2. Current Focus
3. Recent Progress
4. In Progress
5. Coming Next
6. Roadmap

### Rule

```text id="chgpage10"
The page must communicate current reality before future ambition.
```

---

# 7. CONTENT STYLE RULES

The page content must be:

* plain language
* concise
* positive but honest
* readable by non-technical users

It must NOT be:

* deeply technical
* full of schema/backend terminology
* exaggerated
* vague marketing fluff

### Allowed

* “New object detail system is being built”
* “The Above Me view is now being implemented”

### Not allowed

* “Canonical SceneContract added with strict field validation”
* “Refactored Pydantic schema ownership boundaries”

---

# 8. UI COMPONENT MODEL

The page should use a small set of repeatable components.

### Recommended components

* Hero status card
* Section heading
* Progress card
* Milestone / roadmap card
* Status badge

### Optional

* simple timeline layout
* collapsible roadmap sections

### Rule

```text id="chgpage11"
The page should feel structured and calm, not busy.
```

---

# 9. STATUS BADGES

Allowed status states:

* Complete
* In Progress
* Coming Next
* Planned

### Rule

```text id="chgpage12"
Status badges must be consistent across the page.
```

---

# 10. RESPONSIVE BEHAVIOR

---

## Desktop

* all sections visible in clean vertical flow
* roadmap may use multi-column cards

## Tablet

* cards compress cleanly
* roadmap may become 2-column or stacked

## Mobile

* all content stacks vertically
* hero remains prominent
* roadmap becomes single-column

### Rule

```text id="chgpage13"
The page must remain readable and uncluttered on mobile.
```

---

# 11. UPDATE MODEL

This page is updated indirectly by changing:

* `docs/PUBLIC_CHANGELOG.md`
* `frontend/src/content/publicChangelog.json`

The page itself must not require manual layout changes for normal update cycles.

### Rule

```text id="chgpage14"
Normal progress updates should be content-only, not code-heavy.
```

---

# 12. FORBIDDEN PATTERNS

The page must NOT:

* expose internal execution logs
* expose failed engineering attempts as public wins
* duplicate internal developer notes
* read directly from `EXECUTION_LOG.md`
* become a technical status console
* look like a raw markdown dump

---

# 13. OPTIONAL FUTURE FEATURES

These are allowed later, but not required initially:

* screenshots of recent milestones
* milestone percentage indicators
* release tags
* version grouping
* filter by phase
* “last updated” timestamp

These must not complicate the first implementation.

---

# 14. VALIDATION CRITERIA

The page is correct only if:

* a non-technical user can understand current progress
* current status is immediately visible
* recent progress feels concrete
* in-progress work is clearly separated from completed work
* the roadmap is understandable
* the page remains clean on mobile

---

# 15. FAILURE CONDITIONS

The page is considered failed if:

* it exposes internal technical logs
* users cannot tell what is done vs in progress
* it becomes cluttered
* it requires frequent code changes just to update content
* it feels like a developer console instead of a product page

---

# 16. FINAL STATEMENT

```text id="chgpage15"
The Progress page is not a developer log.

It is a public-facing confidence page
that shows the project is alive, moving, and becoming real.
```

---

# 17. PRACTICAL SUMMARY

The Progress / Changelog page should feel like:

* a living roadmap
* a clear status update
* a simple project journal for users

It should not feel like:

* a Git commit history
* an engineering notebook
* a debugging screen

---