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

Astronomy Hub is a location-aware astronomy intelligence system.

Core question:

```text
What can I see right now, and what should I observe?
```

System model:

```text
Scope -> Engine -> Filter -> Scene -> Object -> Detail -> Assets
```

Data model:

```text
Ingestion -> Normalization -> Storage -> Cache -> API -> Client Rendering
```

## 4. Current Runtime Anchor

The active public ORAS sky runtime is:

```text
/oras-sky-engine/
```

`/oras-sky-engine/` is the ORAS-hosted Stellarium Web / Stellarium Web Engine
runtime.

Stale assumptions that must not control execution:

- active route is `/sky-engine`
- active Sky Engine is BabylonJS
- Hub owns Sky Engine rendering
- Sky Engine is a shared visualization layer

Current rules:

- Sky Engine remains isolated
- Hub remains the decision layer
- backend/API provides source-backed object identity and curated discovery
- no fake data
- Docker/runtime validation remains authoritative

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
- `docs/architecture/*`
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

The current product anchor is:

```text
Hub decision layer + contained ORAS Sky Engine runtime at /oras-sky-engine/
```

The Hub:

- ranks and curates source-backed objects
- consumes `/api/above-me`
- links objects into `/oras-sky-engine/`

The ORAS Sky Engine:

- owns Stellarium runtime behavior
- owns scene/rendering/camera/selection behavior
- consumes validated observer/time/location/config/object inputs

## 9. Deferred Work

Do not start without explicit approval:

- WordPress shortcode/page
- Hub homepage UI
- DESI promotion
- TheSkyLive scraping
- credits-update work

High-definition data and imagery remain a future active lane, but still require
bounded tasks, source/license review, no fake data, and runtime validation.

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
- treat `/sky-engine` as active
- treat BabylonJS as the active ORAS Sky Engine
- bypass contracts
- fake data
- mark completion without proof

## Final Rule

Future agents must treat `/oras-sky-engine/` as the active ORAS-hosted
Stellarium Web runtime unless a later authority document explicitly changes it.
