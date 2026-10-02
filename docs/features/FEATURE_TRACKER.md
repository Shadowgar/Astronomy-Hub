# `FEATURE_TRACKER.md`

Your current tracker is actually very good structurally, but:

Problems:

* it does not enforce **viewport correctness**
* it does not explicitly track **engine ownership correctness**
* it allows vague “mixed” states without forcing clarity
* it doesn’t tie tightly enough to execution model

We tighten it so it becomes **brutally honest and actionable**. 

---

## Replace the entire file with this:

---

# FEATURE TRACKER

---

## PURPOSE

Records the **current factual runtime status** of all features.

This document is:

* factual
* pessimistic
* proof-driven

This document does NOT:

* define execution order
* override PROJECT_STATE.md

---

## AUTHORITY RELATIONSHIP

```text id="v5j0s2"
PROJECT_STATE.md = what we are doing now
FEATURE_TRACKER.md = what is actually true
```

If conflict exists:

* PROJECT_STATE defines current work
* TRACKER reflects system reality

---

## STATUS LEGEND

* REAL — fully implemented, proven, and correct
* PARTIAL — exists but fails one or more acceptance gates
* FAKE — placeholder or misleading behavior
* BLOCKED — cannot proceed due to dependency or constraint

Reference:

```text id="nq9b3k"
FEATURE_ACCEPTANCE.md
```

---

## Current Documentation Checkpoint

The active checkpoint is the docs-only Phase B God's Eye + SWE Compatibility /
Upgradeability Study on `unified-runtime-compatibility-study-1`, following merged
Phase A PR #53. The [study](../studies/GODS_EYE_SWE_COMPATIBILITY_STUDY.md) is
complete in PR #54 but remains unmerged pending owner approval. No runtime
capability or feature status is upgraded by the study.

Phase C unified runtime skeleton is the next implementation phase after PR #54
is merged and a bounded implementation task is authorized; it is PLANNED, not
CURRENT. Execution order belongs to [PROJECT_STATE](../execution/PROJECT_STATE.md),
with detailed approved direction in
[Unified Universe Architecture](../architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md).

Current foundation: SWE, Observe, Tonight, shared shell/Home, normalized satellite
identity, TLE releases, freshness/provenance and local propagation source paths.
The shared shell's historical 155 frontend and 16 Docker browser checks are
retained evidence, not rerun here; its console-clean gate remains PARTIAL.

God's Eye integration has NOT started. The approved Earth runtime has NOT been
implemented; the approved planetary runtime has NOT been implemented. Body-aware
planetary surfaces, universal multi-renderer state, external astronomy registry,
and cross-engine handoffs have no implementation/qualification evidence. Legacy
Earth and Solar System rows below do not prove these approved runtimes exist.
Qualified satellite passes remain missing; legacy passes are not production-grade.
The older inventory remains scoped to unfinished legacy workflows.

## RUNTIME TRUTH INVENTORY

| Feature                         | UI Visible | Backend Path | Real Data | Engine Ownership Correct | Viewport Correct | Fake Behavior Present | Status  |
| ------------------------------- | ---------- | ------------ | --------- | ------------------------ | ---------------- | --------------------- | ------- |
| Command Center / Hub Surface    | yes        | yes          | yes       | yes                      | n/a              | no                    | PARTIAL |
| Scope / Engine / Filter Control | yes        | yes          | mixed     | partial                  | no               | yes                   | PARTIAL |
| Scene Rendering                 | yes        | yes          | mixed     | partial                  | no               | yes                   | PARTIAL |
| Above Me Orchestration          | yes        | yes          | mixed     | partial                  | no               | yes                   | PARTIAL |
| Conditions Decision Support     | yes        | yes          | yes       | partial                  | partial          | partial               | PARTIAL |
| Earth Engine                    | limited    | partial      | mixed     | no                       | no               | yes                   | PARTIAL |
| Satellite Awareness             | limited    | yes          | yes       | partial                  | partial          | partial               | PARTIAL |
| Flight Awareness                | limited    | yes          | mixed     | partial                  | partial          | partial               | PARTIAL |
| Solar System Context            | yes        | yes          | yes       | partial                  | partial          | partial               | PARTIAL |
| Deep Sky Targeting              | limited    | yes          | mixed     | partial                  | partial          | yes                   | PARTIAL |
| Solar Activity Awareness        | limited    | yes          | mixed     | partial                  | partial          | yes                   | PARTIAL |
| Alerts / Events Intelligence    | yes        | yes          | mixed     | partial                  | partial          | yes                   | PARTIAL |
| Object Detail Resolution        | yes        | yes          | mixed     | partial                  | partial          | yes                   | PARTIAL |
| News / Knowledge Feed           | limited    | partial      | mixed     | no                       | partial          | yes                   | PARTIAL |
| Asset / Media Reliability       | partial    | partial      | mixed     | no                       | n/a              | yes                   | PARTIAL |
| Performance / Cache Freshness   | partial    | partial      | n/a       | n/a                      | n/a              | n/a                   | PARTIAL |

---

## UPDATE RULES

When updating this file:

* be factual
* be pessimistic
* reflect real runtime behavior
* explicitly call out fake behavior

---

### Required When Updating a Feature

Must include:

* current behavior
* what is still fake
* what is still incorrect
* what is still missing

---

## PROHIBITED USE

Do NOT:

* plan future work here
* describe intentions
* soften failures
* mark REAL without proof

---

## REAL STATUS REQUIREMENT

A feature may only be marked REAL if:

* all acceptance gates pass
* viewport is correct
* routing is correct
* backend ownership is correct
* data is real
* no fake behavior remains

---

## AUTOMATIC DOWNGRADE RULE

If any of the following occur:

* fake data introduced
* routing breaks
* viewport incorrect
* contracts violated

Then:

```text id="x3j9vb"
Status must revert to PARTIAL or FAKE
```

---

## FINAL RULE

```text id="m8k2rp"
This tracker must reflect reality, even if that reality is bad.
```

---

## STELLARIUM PARITY TRACKING

For strict Sky Engine parity progress against Stellarium source behavior, use:

- `/home/rocco/Astronomy-Hub/parity_list.md`

Current parity anchor (as of 2026-04-12):

- Stars moved from Hipparcos-only ceiling (~8,870) to multi-survey sequencing (~61.7k visible ceiling with current datasets).
- Synthetic deep background star fallback is disabled; real catalog surveys now drive deep star density.
- Remaining star parity gap is deep-survey coverage beyond mag 8.5 and full hint/label limiting-magnitude chain parity.

## Tonight at ORAS — bounded MVP (2026-10-01)

`/tonight` consumes `tonight.v1` with local full-night geometry, independent
hourly forecast, and exact peak-time Sky handoffs. Qualification evidence and
known limits are in `docs/validation/TONIGHT_MVP_EVIDENCE.md`. Runtime/browser
checks and final performance revalidation have passed. Runtime status: REAL
for the bounded behavior and limits documented in the evidence. PR #51 merged on 2026-10-01; current CI/review state is authoritative on GitHub. This entry does not change the broader legacy Hub status inventory.


## Shared public shell and decision homepage (PR #52 merged 2026-10-02)

The public application model is Home `/`, Observe `/observe`, Tonight `/tonight`
and Sky `/sky-engine`. One ORAS shell owns navigation/landmarks/focus and shared
visual tokens. Home independently consumes Tonight and Observe; current
conditions use qualified current weather facts from Observe's shared cache.
No quality score or fabricated astronomy is exposed. Foundation components
remain in the repository without being rendered as the public homepage.

Status: PARTIAL. UI behavior is qualified (155 frontend tests and 16 Docker
browser tests). Blanket console-clean acceptance remains partial because unchanged standalone and
embedded Sky emit missing dense-star tile 404s. This is a Category B unrelated
follow-up; see PROJECT_STATE.md for exact evidence. Standalone
`/oras-sky-engine/`, scientific contracts and backend algorithms are unchanged.
This bounded entry supersedes the legacy Command Center/Hub Surface row for
public presentation; it does not claim completion of unfinished engines.

`oras_horizon.v1` is not implemented. Its placement and the next task are governed
by current execution authority and the unified architecture, not this older UI milestone.
