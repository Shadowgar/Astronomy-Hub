# FEATURE CATALOG

## Purpose

Defines the bounded feature set for active Astronomy Hub product development.

This document defines feature scope categories, not current execution order.

Current execution order is defined by:

* `docs/execution/PROJECT_STATE.md`
* `docs/context/LIVE_SESSION_BRIEF.md`

---

## Feature List

The current bounded feature set is:

1. Command Center / Hub Surface
2. Scope / Engine / Filter Control
3. Scene Rendering
4. Above Me Orchestration
5. Conditions Decision Support
6. Earth Engine
7. Satellite Awareness
8. Flight Awareness
9. Solar System Context
10. Deep Sky Targeting
11. Solar Activity Awareness
12. Alerts / Events Intelligence
13. Object Detail Resolution
14. News / Knowledge Feed
15. Asset / Media Reliability
16. Performance and Cache Freshness

---

## Feature Role

A feature is a bounded area of user-visible product behavior.

A feature is not:

* a phase
* an architecture layer
* an implementation technique
* a provider integration by itself

A feature must correspond to something the user can experience or rely on.

---

## Feature Definition Requirements

Each feature definition or feature slice must be describable in terms of:

* user-visible behavior
* UI entry point
* backend/API ownership path
* source provenance
* degraded behavior
* determinism criteria
* acceptance proof

Detailed proof requirements are defined in:

* `docs/features/FEATURE_ACCEPTANCE.md`

Suggested feature slice format is defined in:

* `docs/features/FEATURE_SPEC_TEMPLATE.md`

---

## Scope Rules

Do not invent new execution features casually.

A new feature may be added only if:

* it represents a real user-facing behavior boundary
* it is not already covered by an existing feature
* it can be validated independently

Feature names should remain stable once adopted.

---

## Relationship to Engines

Features are not the same thing as engines.

Examples:

* Earth Engine is an engine
* Satellite Awareness is a feature area that may involve Earth Engine + Satellite sub-engine behavior
* Above Me Orchestration is a feature area that consumes outputs from multiple engines

Engine ownership is defined in architecture docs.
Feature ownership is defined by user-visible behavior.

---

## Relationship to Legacy Phase Docs

Legacy phase docs are reference-only.

If a legacy phase document is consulted, its requested work must be translated into one or more features from this catalog before execution.

The mapping reference is:

* `docs/features/FEATURE_MIGRATION_MAP.md`

---

## Final Rule

This document defines what kinds of feature work are valid.

It does not, by itself, authorize what gets built next.
