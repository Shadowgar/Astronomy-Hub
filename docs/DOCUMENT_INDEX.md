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

The current shared shell contains Home `/`, Observe `/observe`, Tonight `/tonight`,
and Sky host `/sky-engine` (merged PR #52). `/oras-sky-engine/` is the contained
ORAS-hosted Stellarium Web runtime, also reachable standalone. The host route is
not a replacement renderer or a placeholder.

God's Eye Earth, body-aware Cesium Planet Mode, universal state, and cross-engine
handoffs are approved plans, not integrated runtimes. SWE owns its internal
scene/render/camera/selection lifecycle. The future Hub owns product intent and
visible application chrome through qualified adapters. No BabylonJS sky replacement.
No fake data. Docker/browser proof remains required for runtime claims.

## 5. Authority Tiers

### Tier 1 - Core Control

These define execution truth:

- `docs/validation/SYSTEM_VALIDATION_SPEC.md`
- `docs/context/CORE_CONTEXT.md`
- `docs/context/LIVE_SESSION_BRIEF.md`
- `docs/context/CONTEXT_MANIFEST.yaml`
- `docs/DOCUMENT_INDEX.md`
- `docs/execution/PROJECT_STATE.md`
- `docs/execution/MASTER_PLAN.md`

### Tier 2 - Product Definition

These define product and architecture reference:

- `docs/README.md`
- `docs/ASTRONOMY_HUB_DIAGRAM.md`
- `docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md` — detailed approved direction
- `docs/architecture/decisions/*` — concise accepted decisions, not implementation proof
- remaining `docs/architecture/*`
- `docs/contracts/*`

### Tier 3 - Execution Model

These define how work is performed:

- `docs/features/FEATURE_EXECUTION_MODEL.md`
- `docs/features/FEATURE_ACCEPTANCE.md`
- `docs/features/FEATURE_TRACKER.md`
- `docs/features/FEATURE_CATALOG.md`

### Tier 4 - Support

These are guidance only:

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

PR #52 provides the shared-shell foundation, Observe and Tonight remain decision
pages, and SWE remains the active sky runtime. Runtime status and retained
qualification gaps are recorded in `PROJECT_STATE.md` and `FEATURE_TRACKER.md`.
The renderer-centered flagship workspace is planned.

## 9. Current Sequence and Deferred Work

The active task is the docs-only [Phase B compatibility study](studies/GODS_EYE_SWE_COMPATIBILITY_STUDY.md),
with [source/fixture evidence](validation/UNIFIED_RUNTIME_COMPATIBILITY_EVIDENCE.md).
It resolves preferred runtime topology/consumption/lifetime. The next recommended
task is its bounded Phase C skeleton; ISS, Mars and astronomy extensions follow.
`oras_horizon.v1` remains approved but is deferred to the astronomy-extension
phase; it is not next. Consult the unified architecture for the complete A–F order.

Do not start WordPress, DESI promotion, scraping, credits work, or any runtime
implementation from this documentation approval. Data/imagery upgrades retain
source/license and runtime qualification gates.

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
