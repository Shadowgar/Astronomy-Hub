# FEATURE TRACKER

## Purpose

Records the current truth status of the feature set.

This is a factual tracking document.
It does not replace `PROJECT_STATE.md` as the primary execution authority.

`PROJECT_STATE.md` defines what is active now.
This file records the broader feature status landscape.

---

## Status Legend

* `REAL` — complete and proven
* `PARTIAL` — implemented in some form but missing required proof or truthfulness
* `FAKE` — placeholder or non-authoritative behavior presented as real
* `BLOCKED` — cannot proceed because of dependency or conflict

Reference:

* `docs/features/FEATURE_ACCEPTANCE.md`

---

## Current Active Feature Slice

* Feature: Above Me Orchestration
* Status: PARTIAL

Why:

* core Above Me behavior exists
* curation, routing, detail quality, and domain separation still need proof and correction

The current active slice must also match:

* `docs/execution/PROJECT_STATE.md`
* `docs/context/LIVE_SESSION_BRIEF.md`

If this file disagrees with those documents, those documents win for current execution.

---

## Runtime Truth Inventory

| Feature                         | UI visible? | Real backend path? | Real data source? | Placeholder or fake behavior active? | Status  |
| ------------------------------- | ----------- | ------------------ | ----------------- | ------------------------------------ | ------- |
| Command Center / Hub Surface    | yes         | yes                | n/a               | yes                                  | PARTIAL |
| Scope / Engine / Filter Control | yes         | yes                | mixed             | yes                                  | PARTIAL |
| Scene Rendering                 | yes         | yes                | mixed             | yes                                  | PARTIAL |
| Above Me Orchestration          | yes         | yes                | mixed             | yes                                  | PARTIAL |
| Conditions Decision Support     | yes         | yes                | yes               | partial                              | PARTIAL |
| Earth Engine                    | limited     | partial            | mixed             | yes                                  | PARTIAL |
| Satellite Awareness             | limited     | yes                | yes               | partial                              | PARTIAL |
| Flight Awareness                | limited     | yes                | mixed             | partial                              | PARTIAL |
| Solar System Context            | yes         | yes                | yes               | partial                              | PARTIAL |
| Deep Sky Targeting              | limited     | yes                | mixed             | yes                                  | PARTIAL |
| Solar Activity Awareness        | limited     | yes                | mixed             | yes                                  | PARTIAL |
| Alerts / Events Intelligence    | yes         | yes                | mixed             | yes                                  | PARTIAL |
| Object Detail Resolution        | yes         | yes                | mixed             | yes                                  | PARTIAL |
| News / Knowledge Feed           | limited     | partial            | mixed             | yes                                  | PARTIAL |
| Asset / Media Reliability       | partial     | partial            | mixed             | yes                                  | PARTIAL |
| Performance and Cache Freshness | partial     | partial            | n/a               | n/a                                  | PARTIAL |

---

## Update Rules

Update this file only when a feature status can be stated truthfully.

When updating a row:

* keep wording factual
* identify remaining fake/partial behavior honestly
* do not mark `REAL` without proof matching `FEATURE_ACCEPTANCE.md`

Do not use this file to:

* plan future work in narrative form
* override current execution state
* preserve stale claims after runtime truth changes

---

## Final Rule

This tracker should be pessimistic, factual, and hard to impress.
