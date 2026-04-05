# CHANGELOG UPDATE RULES

## Purpose

This document defines how permanent, verified changes should be recorded in the changelog.

The changelog is a record of completed, meaningful changes.
It is not a planning tool and not a narrative journal.

This document is a supporting enforcement document only.

Related authority:

* `docs/context/CORE_CONTEXT.md`
* `docs/context/LIVE_SESSION_BRIEF.md`
* active execution docs
* active validation docs

---

## Core Rule

Changes that materially affect the system should be recorded once they are real and verifiable.

Do not record:

* planned work
* speculative changes
* partial intentions
* unverified claims

---

## When to Update

Update the changelog when a change is both:

1. completed enough to matter permanently
2. verified enough to describe truthfully

Examples:

* a feature slice is completed
* a document authority rule changes
* a contract is changed
* a backend or frontend behavior changes in a meaningful way
* validation status changes in a durable way

Do not force a changelog update for tiny temporary edits that are not yet stable.

---

## Required Entry Contents

Each entry must include:

### Change Type

One of:

* docs
* backend
* frontend
* contracts
* validation
* system

### Files Affected

Exact file paths

### Description

A concise explanation of:

* what changed
* why it changed
* what problem it resolved

### Validation

What proof exists, if applicable

### Execution Context

The current execution context or active work focus

---

## Required Format

```text
[DATE] — [CHANGE TYPE]

FILES:
- path/to/file

DESCRIPTION:
- what changed
- why it changed

VALIDATION:
- proof, test, or verification note

CONTEXT:
- active focus: ...
```

---

## Prohibitions

Do not:

* write vague summaries
* omit affected files
* record planned work
* record unverified system claims
* use the changelog as a substitute for validation evidence

---

## Validation Rule

A changelog entry is valid only if it reflects system reality.

If the change cannot be verified or accurately described, do not record it yet.

---

## Relationship to Other Docs

* `LIVE_SESSION_BRIEF.md` defines what is currently active
* execution docs define what is being worked on
* validation docs define what counts as proven
* the changelog records completed, durable change

The changelog does not define authority and does not control scope.

---

## Final Rule

The changelog should record verified, durable truth.

It should be strict enough to prevent fiction, but not so rigid that it blocks normal development flow.
