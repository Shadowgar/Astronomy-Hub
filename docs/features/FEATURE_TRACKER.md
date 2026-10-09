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

## Current Execution Checkpoint — 2026-10-08

C0–C5.6 bounded implementation packages are complete; PRs #63/#64/#65 merged.
Current work is C5.6.75 documentation reconciliation, after completed C5.6.5 audit.
[PROJECT_STATE](../execution/PROJECT_STATE.md) controls activation. No C5.7/C6 code
is active. Qualification is local WSL/Docker, not production or full feature parity.
The matrix below separates seven proof gates. Historical means proof at the linked
checkpoint, not freshly rerun here. NOT PROVEN preserves uncertainty; no failed
provider is recast as renderer failure. REAL applies only to explicitly bounded
behavior supported by acceptance proof, never the entire capability family.

Evidence: [audit matrix](../audits/GODS_EYE_CAPABILITY_IMPLEMENTATION_RECONCILIATION_2026-10-05.md),
[divergence](../audits/GODS_EYE_IMPLEMENTATION_DIVERGENCE_2026-10-05.md),
[audit validation handoff](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md),
[C5 expansion](../validation/EARTH_CAPABILITY_EXPANSION_EVIDENCE.md),
[C5.5 HD](../validation/EARTH_HD_MAPPING_EVIDENCE.md),
[C5.6 Sky/development](../validation/LOCAL_DEVELOPMENT_REPAIR_EVIDENCE.md).

| Bounded capability / status | Code | UI control | Fixture/unit proof | Live source proof | Usable content rendering | Coverage truth | Acceptance / remaining gap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Independent Earth Viewer / bridge / workspace — REAL bounded foundation | Exists | Sky/Earth mode, layers, selection | Historical qualified | Provider-independent foundation | Historical Docker/browser | Independent owned Earth, SWE Sky | C1–C4 foundation qualified; full parity not implied |
| Civil aircraft — PARTIAL | FastAPI observer100NM transport + Entity adapter | Exists | Historical bounded admission/error proof | Audit503, zero admitted | Live NOT PROVEN; source/code altitude gating independently established | Near observer only, not global; home15.62Mm hides billboard, point disabled | Provider access and actual admitted visibility/follow need separate proof |
| Earth satellites — PARTIAL | stations-only, cap100,15s propagation | Exists | Historical strict TLE/finite guards | Audit source unavailable; six reference groups502 | No fresh successful population comparison | Intentional stations only; owner approximately five is not fresh census | Small population not a proven loading bug; group expansion/follow/performance unqualified |
| Modeled observer-point Weather — PARTIAL usability | Point fetch/normalize/entity | Exists | Historical point/error tests | Audit200, one point | One ready point proved; field-level usability NOT PROVEN | Local modeled conditions, not global map or seeing | Owner says control appears ineffective; requested wind facts absent; broad visual weather not qualified |
| Latest CONUS radar snapshot — REAL bounded C5 | Exact timestamp/image lease + raster adapter | Separate radar layer | Historical mismatch/age/lease/error tests | Historical C5 source qualification | Historical raster/browser proof | CONUS-only, ≤30min source age, snapshot not forecast/live continuous weather | Historical C5 acceptance; source outage later does not fabricate freshness |
| Clouds / mapped wind / lightning / cyclones / weather history — BLOCKED future | Upstream code available; no qualified Hub layer | No qualified mapped controls | No Hub acceptance | NOT PROVEN for Hub | NOT PROVEN | No advertised global coverage | Scope/provider/hooks/rights require owner authorization |
| USGS earthquakes / NIFC fire perimeters — REAL bounded C5 | Validated event adapters | Exists | Historical DTO/time/geometry/error tests | Historical C5 qualified | Historical Docker/browser | Source-backed selected event products, not all environmental layers | Bounded C5 proof; source/display limitations retained |
| Launches — BLOCKED | Source/adapter exists | Controlled unavailable | Historical failure handling | Launch Library403 | Live launch content NOT PROVEN | Unavailable, no fake launch | Provider access gate unresolved |
| Earth standard skybox — PARTIAL visual presentation | Explicit `skyBox.show=false` | No enabled star background | Configuration established, no enabled acceptance | Static assets not provider | Standard star background disabled | No scientific star-catalog claim | Restore/qualify proposal requires asset/performance/OD4 approval |
| CONUS HD imagery — REAL bounded C5.5 | Keyless USGS regional provider/fallback | Qualified source/camera UI | Historical bounded request/error proof | Historical C5.5 | Historical close-zoom browser proof | Regional HD + coarse global fallback; no global aerial-resolution claim | C5.5 accepted; provider rights/device/detail remain bounded |
| Global HD / terrain / buildings / photorealistic3D — BLOCKED C6 | Dormant ion/map branches, not active services | No qualified global/terrain/3D product | No global acceptance | NOT PROVEN | Ellipsoid baseline, not qualified terrain | Global high detail and heights unavailable | Provider/account/budget/coverage/rights gates precede C6 work |
| Sky wheel/search/deep-link controls — REAL bounded C5.6 | Native SWE inputs + Hub contracts | Both Sky surfaces | Historical regression/native-science proof | Audit smoke only; source coverage separate | Historical exact-head Docker/browser controls proof | Qualified existing catalogs, string IDs preserved | PR65 qualified bounded controls; cold search and coverage limits remain |
| Sky/Gaia catalog depth — PARTIAL coverage | Indexed mounted source catalog support | Existing search/runtime | Historical canonical/materialization tests | Existing supplied datasets only | Existing tiles/selection qualified within scope | Not full Gaia DR3/full-depth completeness | Missing coverage/tiles and cold-search cost retained; no fake stars |
| Physical devices / production — BLOCKED qualification | Local development exists | Local UI | CI/local evidence only | No production qualification here | No physical-device campaign here | WSL/disposable browser ≠ physical fleet/global service | Owner Release Candidate, provider and device gates unresolved |

## Known Category B limits

Cold-search cost, incomplete Gaia/catalog coverage, source/data/asset restrictions,
Launch Library403, regional imagery/global detail, dormant terrain/3D and unqualified
physical-device performance remain limits. They do not invalidate completed bounded
packages or authorize implementation. Detailed per-capability evidence and owner
decisions live in [Earth plan](../execution/EARTH_CAPABILITY_PLAN.md).

## Historical Documentation Checkpoint — Phase B

The following records the pre-merge PR #54 study checkpoint. Its execution state
and unimplemented-Earth statements are historical, superseded by the current
checkpoint above; they are not instructions to restart Phase B or Phase C.

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

## Historical legacy runtime truth inventory

This pre-owned-Earth inventory is retained for legacy workflows only. Its Earth,
flight, satellite and viewport flags are not current claims about the qualified
owned runtime; the current proof matrix above supersedes them for those surfaces.

### Legacy rows

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

Historical parity anchor (as of 2026-04-12), not a current catalog census:

- Stars moved from Hipparcos-only ceiling (~8,870) to multi-survey sequencing (~61.7k visible ceiling with current datasets).
- Synthetic deep background star fallback is disabled; real catalog surveys now drive deep star density.
- Remaining star parity gap is deep-survey coverage beyond mag 8.5 and full hint/label limiting-magnitude chain parity.

## Tonight at ORAS — bounded MVP (2026-10-01)

`/tonight` consumes `tonight.v1` with local full-night geometry, independent
hourly forecast, and exact peak-time Sky handoffs. Qualification evidence and
known limits are in `docs/validation/TONIGHT_MVP_EVIDENCE.md`. Runtime/browser
checks and final performance revalidation have passed. Runtime status: REAL
for the bounded behavior and limits documented in the evidence. PR #51 merged on 2026-10-01; current CI/review state is authoritative on GitHub. This entry does not change the broader legacy Hub status inventory.


## Historical shared public shell qualification (PR #52 merged 2026-10-02)

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
