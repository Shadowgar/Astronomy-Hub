# DOCUMENT INDEX - AUTHORITATIVE CONTROL MAP

## 1. Purpose

This document defines:

- document authority
- execution control flow
- product definition hierarchy
- context loading rules

It prevents execution drift, product drift, authority conflicts, and stale
runtime assumptions.

## 2. Core Law

Only specific documents control execution.

All others are reference.

## 3. Product Model

Astronomy Hub is a unified astronomy, Earth, and planetary exploration workspace.
The Hub owns product context and astronomy decisions; specialized renderers own
domain scenes and math. Detailed approved direction and ADRs are in
[Unified Universe Architecture](architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md).

```text
Scope -> Engine -> Filter -> Scene -> Object -> Detail -> Assets
Ingestion -> Normalization -> Storage -> Cache -> API -> Client Rendering
```

## 4. Current Runtime Anchor

C0–C5.6 are completed bounded local WSL/Docker checkpoints; PRs #63, #64 and
#65 are merged. The sky-first workspace is `/` and `/sky-engine`, with
Earth workspace `/earth` and focused Observe `/observe` and Tonight `/tonight`. The host mounts independent SWE Sky and
Hub-owned Cesium Earth `/earth-runtime/` through the versioned bridge with serial
renderer lifetime. `/oras-sky-engine/` remains standalone SWE; SWE owns sky math,
selection and camera. Hub owns the Earth Viewer and selectively reuses/wraps
pinned God's Eye feature code, never the complete app or upstream Viewer singleton.
Evidence/status: [PROJECT_STATE](execution/PROJECT_STATE.md) and
[FEATURE_TRACKER](features/FEATURE_TRACKER.md). Bounded merges do not prove complete
capability parity or production readiness; owner Release Candidate is still required.

## 5. Authority Tiers

### Tier 1 - Core Control

These define execution truth:

- `docs/validation/SYSTEM_VALIDATION_SPEC.md`
- `docs/context/CORE_CONTEXT.md`
- `docs/context/LIVE_SESSION_BRIEF.md`
- `docs/context/CONTEXT_MANIFEST.yaml`
- `docs/DOCUMENT_INDEX.md`
- `docs/execution/PROJECT_STATE.md`


### Tier 2 - Product Definition

These define product and architecture reference:

- `docs/execution/MASTER_PLAN.md` — product reference only; cannot activate work

- `docs/README.md`
- `docs/ASTRONOMY_HUB_DIAGRAM.md`
- `docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md` — detailed approved direction
- `docs/architecture/decisions/*` — concise accepted decisions, not implementation proof
- remaining `docs/architecture/*`
- `docs/contracts/*`

### Tier 3 - Execution Model

These define how work is performed:

- `docs/execution/EARTH_CAPABILITY_PLAN.md` — normal Earth planning reference; activation remains in PROJECT_STATE
- `docs/execution/C5_7_EARTH_CORE_RECOVERY_SPEC.md` — proposed, unapproved packages and owner decisions
- `docs/execution/C6_GLOBAL_MAPPING_SPEC.md` — approved direction, unapproved provider-specific stages

- `docs/features/FEATURE_EXECUTION_MODEL.md`
- `docs/features/FEATURE_ACCEPTANCE.md`
- `docs/features/FEATURE_TRACKER.md`
- `docs/features/FEATURE_CATALOG.md`

### Tier 4 - Support

These are guidance only:

- `docs/audits/*` — dated evidence, no implementation authority
- `scripts/validation/private_evidence_links.json` — exact private historical reference/hash registry, no runtime proof or publication rights
- `docs/validation/*_EVIDENCE.md` — bounded historical proof, not current activation

- `docs/product/*`
- `docs/runtime/*`
- `docs/corrective/*`
- `docs/enforcement/*`
- `docs/ai/*`
- `docs/tools/*`
- `docs/DOC_INVENTORY.md`
- `docs/full_audit.md`
- `docs/features/FEATURE_SPEC_TEMPLATE.md`
- `docs/features/FEATURE_MIGRATION_MAP.md`

### Tier 5 - Legacy

These are non-authoritative:

- `docs/phases/*`
- `docs/PHASE_STRUCTURE.md`

## 6. Loading Rules

Always load:

- `docs/context/CORE_CONTEXT.md`
- `docs/context/LIVE_SESSION_BRIEF.md`

Then load only the matching task pack from:

- `docs/context/CONTEXT_MANIFEST.yaml`

Do not:

- load the full `docs/` directory
- load legacy docs by default
- load unrelated feature docs

Before starting a task, agents must list loaded documents, confirm the task pack,
and confirm that no extra documents were loaded.

## 7. Execution Flow

```text
Context -> Architecture -> Feature/Task -> Validation
```

Docs-only cleanup follows:

```text
Context -> Target files -> Markdown validation -> Git diff proof
```

## 8. Current Product Anchor

The renderer-centered workspace, product intent and Sky/Earth bridge are implemented
within the qualified C0–C5.6 scope. Body-aware surfaces and broad astronomy
extensions remain planned. Product vision cannot override execution gates.

## 9. Current Sequence and Deferred Work

[PROJECT_STATE](execution/PROJECT_STATE.md) is the authoritative checkpoint sequence;
LIVE_SESSION_BRIEF identifies the current task. C5.6.5 audit evidence is complete;
C5.6.75 documentation reconciliation is current. Next is owner review, then only
explicitly approved C5.7-A → B → C → D → E, one package at a time. C6 is approved
direction, not implemented. D ISS → E planetary surfaces → F astronomy extensions
→ G immersive UX → H solar-system scale remain planned with separate approval.
`oras_horizon.v1` stays in F. No WordPress, DESI or production integration is active.

The original `GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md` records the
pre-preservation snapshot: its “eight staged files / no new audit commit” wording
is historical. Those unchanged outputs now belong to audit commit
`09495238c2b5aebe358c66f9a09801382758f4f8`; current branch/PR/check status is in
PROJECT_STATE and the C5.6.75 evidence, not that frozen audit handoff.

Planning and evidence discovery: [Earth capability plan](execution/EARTH_CAPABILITY_PLAN.md),
[C5.7 proposed packages and Owner Decision Register](execution/C5_7_EARTH_CORE_RECOVERY_SPEC.md),
[C6 provider-first proposal](execution/C6_GLOBAL_MAPPING_SPEC.md),
[ADR0009 reuse decision](architecture/decisions/0009-owned-earth-feature-reuse.md),
[audit matrix](audits/GODS_EYE_CAPABILITY_IMPLEMENTATION_RECONCILIATION_2026-10-05.md),
[divergence evidence](audits/GODS_EYE_IMPLEMENTATION_DIVERGENCE_2026-10-05.md) and
[reconciliation validation](validation/C5_6_75_DOCUMENTATION_RECONCILIATION_EVIDENCE.md).

## 10. Conflict Resolution

If documents conflict:

1. follow authority tier
2. prefer current runtime evidence over stale assumptions
3. report the conflict
4. revalidate after changes

## 11. Forbidden Execution

Do not:

- follow legacy phase instructions as current authority
- treat Hub as the Sky Engine renderer
- treat `/sky-engine` as a replacement renderer rather than the current Hub host
- treat BabylonJS as the active ORAS Sky Engine
- bypass contracts
- fake data
- mark completion without proof

## Final Rule

Future agents must treat `/oras-sky-engine/` as the active ORAS-hosted
Stellarium Web runtime unless a later authority document explicitly changes it.

## HD Earth mapping checkpoint

[HD mapping investigation, plan and proof](validation/EARTH_HD_MAPPING_EVIDENCE.md)
records the bounded WSL/disposable package; live/project state governs execution.

## Local laptop development workflow

[Local development workflow and measured repair](validation/LOCAL_DEVELOPMENT_REPAIR_EVIDENCE.md)
records stable artifact provisioning, bounded qualification cleanup, native
watching, restart/browser proof and resource measurements; it is support evidence.
