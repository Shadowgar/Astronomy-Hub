# `DOC_INVENTORY.md`

PS2 major-moon implementation, source limits and qualification: [PS2](validation/planetary-systems/ps2/README.md).

Current owner-authorized [planetary systems](validation/planetary-systems/README.md) extend preserved PR92 in bounded PS1/PS2/PS3 draft packages. Earth–Moon first, then qualified major-moon subsets; no merge or deployment. Earlier single-globe restrictions below are historical within this explicit scope.

Current owner-authorized [R4-A lunar Planet View](validation/r4-a-planet-view/README.md) resumes the canonical roadmap from draft PR91; no broad visual redesign, merge or deployment.

Current owner visual rejection activates [G1/G2/V1 glass correction](validation/cinematic-glass/README.md) stacked on PR90. Approved references remain; no visual acceptance, merge, deployment or R4.

Current owner-authorized [Earth/Sky completion](validation/earth-sky-completion/README.md) continues from PR88, preserving owner-confirmed satisfactory Solar responsiveness. Draft delivery and visual acceptance remain separate.

Owner-approved cinematic sizing correction: [current implementation/evidence](validation/solar-cinematic-balance/README.md); prior physical-default qualification remains historical.

Current owner-approved Solar scientific-size/control correction and source-matched
proof: [Solar scientific controls](validation/solar-scientific-controls/README.md).
Prior cinematic/current-time evidence remains historical at its recorded source.

## Current integrated PR88 visual correction evidence — 2026-10-22

[Earth/Solar/Sky corrections, exact commands, current screenshots and limits](validation/cinematic-acceptance/README.md) continue the owner-authorized packages84–88 from4e07ebfb. The approved original visual family is unchanged. This supporting validation report is routed through the five visual/docs/review context packs, adding one unique document to their combined inventory. Original technical/historical evidence remains intact; owner visual and hardware acceptance remain separate. Earlier PR83-only execution wording below is historical where superseded by CORE/LIVE/PROJECT_STATE. No merge, deployment, paid provider or R4 authority.


## Current PR83 refinement evidence

[Reference/actual screenshots, remaining gaps, fresh qualification and exact commands](validation/solar-cinematic/refinement/README.md). Supporting evidence; existing approved direction and draft stack, OWNER VISUAL ACCEPTANCE PENDING. No new phase or merge/deployment authority.

## Cinematic Solar implementation evidence — 2026-10-21

[Validation](validation/solar-cinematic/README.md), [fidelity/screenshots](validation/solar-cinematic/FIDELITY.md), [commands](validation/solar-cinematic/COMMANDS.md), [plan](validation/solar-cinematic/PLAN.md).
Supporting evidence only; owner visual acceptance pending, no merge/deployment or new phase.

## Cinematic owner-approved reference inventory — 2026-10-21

- `docs/design/ASTRONOMY_HUB_CINEMATIC_REFERENCE_2026-10-21.md` — **SUPPORT, owner-approved visual decision/provenance**, with exact concept image hashes, original R1-A/ORA-6 sketch links, source limitations and implementation comparison gates. The canonical design authority remains `docs/design/UNIFIED_WORKSPACE_DESIGN_SPEC.md`. The four original image assets are imported byte for byte from the owner-committed repository ZIP into `docs/design/cinematic-references-2026-10-21/`; all four hashes match the approval ledger and original manifest. This document must be routed through appropriate context packs before visual production implementation.

## Current scope reconciliation — 2026-10-21
R3-A renderer/science decision: [ADR0010](architecture/decisions/0010-r3-a-solar-runtime.md).

R3-A reconciliation/proof: [package ledger](validation/r3-a-solar-system/RECONCILIATION.md), [context inventory](validation/r3-a-solar-system/context.json). These are evidence under the existing authority, not a new master plan.


Current execution: [PROJECT_STATE](execution/PROJECT_STATE.md); canonical R0–R5 and deferred X packages: [MASTER_PLAN](execution/MASTER_PLAN.md).

R3-A alone is owner-authorized after roadmap reconciliation. R1/N1 is OWNER ACCEPTED; R2 PR78/79/80 are delivered drafts with retained provider/device limits. No merge or production deployment. Earlier dated activation/next-step directions are historical where superseded by the current execution record. R4 evaluates Earth, Mars and Moon; Mars is a candidate, not a selected first body.

## R2-B imagery/cache support — 2026-10-17

[Implementation and evidence](validation/r2-b-earth-imagery-cache/README.md) ·
[Bounded integration plan](validation/r2-b-earth-imagery-cache/plan.md).
R2-A remains draft and N1 owner accepted; historical records retain their identities.


## R2-A support inventory — 2026-10-17

- `docs/validation/r2-a-earth-search/README.md` — bounded implementation, actual preview,
  commands/browser/screenshots, exact identities and remaining qualification.
- `docs/validation/r2-a-earth-search/plan.md` — owner-authorized inline design/implementation.
- `docs/validation/r2-a-earth-search/PR71_REUSE.md` — exact-head reuse/integration and
  retained rights/hardware limitations; does not authorize PR71 merge.

LIVE/PROJECT_STATE activate R2-A and record N1 OWNER ACCEPTED. Historical R1/N1
inventory/acceptance language below describes earlier checkpoints only.

## R1-A design reference inventory — SUPPORT, 2026-10-13

- `docs/design/adaptive-explorer-r1a/README.md`: design scope, preview, evidence and open decisions; routed through five applicable context packs.
- `docs/design/adaptive-explorer-r1a/{index,explorer,review,system}.html`: editable review gallery, shared four-mode layouts, mobile frame and component/token reference.
- `docs/design/adaptive-explorer-r1a/{reference,gallery}.css` and `reference.js`: isolated reference styling and sample interactions; never application/runtime inputs.
- `docs/design/adaptive-explorer-r1a/verify.mjs` and `evidence/*`: focused browser capture/check runner, PNG screenshots and source-hash/browser ledger.

All R1-A/01 screens are **PENDING OWNER VISUAL ACCEPTANCE**. Canonical product/design
and execution authority remain in the existing documents; these are proposals/proof.

---

# DOCUMENT INVENTORY (SYSTEM CLASSIFICATION — AUTHORITATIVE)

---

## PURPOSE

Classifies every document in `docs/` by **role and authority**.

This prevents:

* execution drift
* authority confusion
* legacy phase leakage
* AI misuse of context

---

## CORE RULE

```text
Not all documents are equal.
Only specific documents control execution.
```

---

## CLASSIFICATION TYPES

---

### CORE_CONTROL

Defines execution truth and system state.

These documents:

* control execution
* cannot be overridden
* must always be respected

---

### PRODUCT_DEFINITION

Defines what Astronomy Hub **is**.

These documents:

* define system behavior
* define UX model
* define rendering model

---

### ENGINE_AUTHORITY

Defines how the system actually works.

These documents:

* define engines
* define object model
* define contracts
* define ingestion

---

### EXECUTION_MODEL

Defines how work is performed and validated.

---

### SUPPORT

Helpful but not authoritative.

---

### LEGACY

Historical reference only.

Cannot control execution.

---

## ROOT DOCUMENTS

| File                            | Classification       |
| ------------------------------- | -------------------- |
| `docs/ASTRONOMY_HUB_DIAGRAM.md` | PRODUCT_DEFINITION   |
| `docs/DOCUMENT_INDEX.md`        | CORE_CONTROL         |
| `docs/FEATURE_DOC_REBASE.md`    | SUPPORT              |
| `docs/full_audit.md`            | SUPPORT              |
| `docs/MASTER_PLAN.md`           | SUPPORT (product reference) |
| `docs/PHASE_STRUCTURE.md`       | LEGACY               |
| `docs/PROJECT_STATE.md`         | SUPPORT (alias only) |
| `docs/README.md`                | PRODUCT_DEFINITION   |
| `docs/STACK_OVERVIEW.md`        | SUPPORT (alias only) |

---

## CONTEXT SYSTEM

| File                                 | Classification |
| ------------------------------------ | -------------- |
| `docs/context/CONTEXT_MANIFEST.yaml` | CORE_CONTROL   |
| `docs/context/CORE_CONTEXT.md`       | CORE_CONTROL   |
| `docs/context/LIVE_SESSION_BRIEF.md` | CORE_CONTROL   |
| `docs/context/SYSTEM_HANDOFF.md`     | CORE_CONTROL   |
| `docs/context/TASK_PACKS.md`         | CORE_CONTROL   |

---

## EXECUTION SYSTEM

| File                                  | Classification |
| ------------------------------------- | -------------- |
| `docs/execution/MASTER_PLAN.md`       | PRODUCT_DEFINITION — non-executing product reference |
| `docs/execution/PROJECT_STATE.md`     | CORE_CONTROL — current roadmap and activation |
| `docs/execution/EARTH_CAPABILITY_PLAN.md` | EXECUTION_MODEL — authoritative Earth planning reference; no activation |
| `docs/execution/C5_7_EARTH_CORE_RECOVERY_SPEC.md` | EXECUTION_MODEL — PROPOSED; owner approval required |
| `docs/execution/C6_GLOBAL_MAPPING_SPEC.md` | EXECUTION_MODEL — approved direction; proposed stages, no implementation authority |
| `docs/execution/SESSION_STATE.md`     | CORE_CONTROL   |
| `docs/execution/STATE_TRANSITIONS.md` | CORE_CONTROL   |
| `docs/execution/env_setup.md`         | CORE_CONTROL   |
| `docs/execution/backend/*`            | LEGACY         |
| `docs/execution/frontend/*`           | LEGACY         |

Stack authority is defined in `docs/architecture/STACK_OVERVIEW.md` and surfaced through the `docs/STACK_OVERVIEW.md` compatibility alias.

---

## FEATURE SYSTEM

| File                                       | Classification  |
| ------------------------------------------ | --------------- |
| `docs/features/FEATURE_EXECUTION_MODEL.md` | EXECUTION_MODEL |
| `docs/features/FEATURE_ACCEPTANCE.md`      | EXECUTION_MODEL |
| `docs/features/FEATURE_TRACKER.md`         | EXECUTION_MODEL |
| `docs/features/FEATURE_CATALOG.md`         | EXECUTION_MODEL |
| `docs/features/FEATURE_SPEC_TEMPLATE.md`   | SUPPORT         |
| `docs/features/FEATURE_MIGRATION_MAP.md`   | SUPPORT         |

---

## ARCHITECTURE / ENGINE SYSTEM

| File                  | Classification   |
| --------------------- | ---------------- |
| `docs/architecture/*` | ENGINE_AUTHORITY |
| `docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md` | ENGINE_AUTHORITY (approved direction; current/planned/open explicit) |
| `docs/architecture/decisions/*` | ENGINE_AUTHORITY (dated accepted decisions; supersession explicit, not implementation proof) |
| `docs/architecture/decisions/0009-owned-earth-feature-reuse.md` | ENGINE_AUTHORITY — current owned Earth/reuse decision; supersedes full-app topology |
| `docs/contracts/*`    | ENGINE_AUTHORITY |

These define:

* engine behavior
* object model
* API contracts
* ingestion rules

---

## Validation support registry

`scripts/validation/private_evidence_links.json` is SUPPORT metadata for sixteen
private historical C5 artifact links, not a document controller, committed media
or fresh runtime proof. Validation authority defines the exact bounded exception;
all other relative repository/source links remain mandatory.

## VALIDATION SYSTEM

| File                                        | Classification |
| ------------------------------------------- | -------------- |
| `docs/validation/SYSTEM_VALIDATION_SPEC.md` | CORE_CONTROL   |
| `docs/validation/VALIDATION_CHECKLIST.md`   | SUPPORT        |
| `docs/validation/C5_7_D_EARTH_APPEARANCE_EVIDENCE.md` | SUPPORT — historical local appearance/artifact/lifecycle proof; space appearance owner-accepted, physical gates pending |
| `docs/validation/C5_6_75_DOCUMENTATION_RECONCILIATION_EVIDENCE.md` | SUPPORT — documentation checks and preservation, no feature proof |
| `docs/audits/*2026-10-05*` | SUPPORT — eight immutable dated audit outputs; draft input is not execution authority |
| `docs/audits/GODS_EYE_MASTER_ADOPTION_BLUEPRINT_2026-10-10.md` | SUPPORT — owner-review adoption matrix; no implementation authority |
| `docs/audits/EXTERNAL_COMPONENTS_AND_DATA_GAPS_2026-10-10.md` | SUPPORT — official-source code/data/provider alternatives and unresolved gates |
| `docs/audits/EARTH_VISUAL_FOUNDATION_DECISION_PACKET_2026-10-10.md` | SUPPORT — visual tiers, reuse paths and future owner/device acceptance |
| `docs/audits/GODS_EYE_ROADMAP_REPRIORITIZATION_PROPOSAL_2026-10-10.md` | SUPPORT — proposed ordering only; approved execution controls unchanged |
| `docs/audits/gods-eye-adoption-register-2026-10-10.json` | SUPPORT — v2 derivation of immutable historical inventory; recommendations separate from implementation |
| `docs/audits/gods-eye-adoption-coverage-2026-10-10.json` | SUPPORT — source/asset discovery hashes; no asset admission or execution proof |
| `docs/audits/MASTER_ADOPTION_AUDIT_VALIDATION_2026-10-10.md` | SUPPORT — exact context, checks and preservation handoff; no fresh visual proof |
| `docs/audits/C6_0_FREE_MAPPING_PROBES_2026_10_11.json` | SUPPORT — eight bounded anonymous service requests and hashes; no runtime qualification or execution authority |
| `docs/validation/STYLING_AUDIT.md`          | SUPPORT        |
| `docs/validation/EARTH_HD_MAPPING_EVIDENCE.md` | SUPPORT — provider investigation and local qualification |
| `docs/validation/LOCAL_DEVELOPMENT_REPAIR_EVIDENCE.md` | SUPPORT — laptop workflow and measured local repair |

---

## PRODUCT / UI SYSTEM

| File             | Classification |
| ---------------- | -------------- |
| `docs/product/PRODUCT_VISION.md` | PRODUCT_DEFINITION — canonical Adaptive Explorer intent; no execution authority |
| `docs/design/UNIFIED_WORKSPACE_DESIGN_SPEC.md` | PRODUCT_DEFINITION — current direction and pending owner screen/reference acceptance; ORA-6 baseline retained historically |
| other `docs/product/*` | SUPPORT |

These guide design but do not override execution or architecture.

---

## RUNTIME / LOGS

| File             | Classification |
| ---------------- | -------------- |
| `docs/runtime/*` | SUPPORT        |

---

## ENFORCEMENT / RECOVERY

| File                 | Classification |
| -------------------- | -------------- |
| `docs/enforcement/*` | SUPPORT        |
| `docs/corrective/*`  | SUPPORT        |

---

## AI / TOOLING

| File           | Classification |
| -------------- | -------------- |
| `docs/ai/*`    | SUPPORT        |
| `docs/tools/*` | SUPPORT        |

---

## LEGACY DOCUMENTS

These are explicitly **non-authoritative**.

| File                      | Classification |
| ------------------------- | -------------- |
| `docs/phases/*`           | LEGACY         |
| `docs/PHASE_STRUCTURE.md` | LEGACY         |

---

## CRITICAL SYSTEM RULES

---

### Rule 1 — Core Control Wins

If conflict exists:

```text
CORE_CONTROL overrides everything
```

---

### Rule 2 — Product Defines Behavior

If feature or execution docs conflict with product definition:

```text
Product must be corrected — not ignored
```

---

### Rule 3 — Engines Own Reality

No document may redefine engine behavior outside:

```text
docs/architecture/*
```

---

### Rule 4 — Preserve Renderer Ownership

Hub shell/product state does not become a shared rendering core or own SWE math.
The independent Earth runtime owns its Cesium Viewer and scene; Hub owns that
runtime implementation and adapters. Selective God's Eye reuse preserves this boundary.

---

### Rule 5 — Viewport Is Always Engine

```text
ACTIVE ENGINE VIEWPORT is required
```

---

### Rule 6 — Legacy Cannot Control Execution

Legacy docs:

* cannot define features
* cannot define architecture
* cannot define execution

---

### Rule 7 — Sky Engine Is Anchor

Frontend work must start from:

```text
Hub decision layer + contained ORAS Stellarium runtime at /oras-sky-engine/
```

---

### Rule 8 — Sky Engine Runtime Is Engine-Owned

The Hub may mount Sky Engine and owns product context. It must not own the
SWE engine's internal render loop, module composition, or renderer-local state.
Current small product state and camera/selection intent are Hub-owned under
`docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md`; adapters realize intent.
Owned Cesium Earth and selective pinned God's Eye feature reuse are current; full
capability parity, body-aware surfaces and broad astronomy extensions are not.

---

## FINAL PRINCIPLE

```text
Correct classification prevents incorrect execution.
```

---
