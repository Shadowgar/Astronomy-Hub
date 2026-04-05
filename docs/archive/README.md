# Astronomy Hub Documentation System

## Purpose
This directory is the execution-control system for Astronomy Hub.

It defines:
- what is authoritative
- what is legacy reference only
- how work is selected
- how completion is proven

## Core Rule
If it cannot be proven in runtime behavior, it is not complete.

## Active Execution Model
Execution is feature-first and runtime-truth based.

Authoritative execution docs:
- `docs/validation/SYSTEM_VALIDATION_SPEC.md`
- `docs/context/CORE_CONTEXT.md`
- `docs/context/LIVE_SESSION_BRIEF.md`
- `docs/context/CONTEXT_MANIFEST.yaml`
- `docs/execution/PROJECT_STATE.md`
- `docs/execution/MASTER_PLAN.md`
- `docs/features/FEATURE_EXECUTION_MODEL.md`
- `docs/features/FEATURE_CATALOG.md`
- `docs/features/FEATURE_ACCEPTANCE.md`
- `docs/features/FEATURE_TRACKER.md`

## Architecture Laws (locked)
- `Scope -> Engine -> Filter -> Scene -> Object -> Detail -> Assets`
- `Ingestion -> Normalization -> Storage -> Cache -> API -> Client Rendering`

## Context Loading Law
Load docs through `docs/context/CONTEXT_MANIFEST.yaml` task packs unless explicitly instructed otherwise.

## Legacy Docs
`docs/phases/*` and phase-oriented UI phase docs are retained for history and traceability.
They do not authorize current execution.

## Validation Law
A feature is accepted only with:
- user-visible behavior
- concrete backend/API path
- source provenance
- deterministic behavior checks
- command/output proof artifacts

## Operator Workflow
`load context -> inspect runtime truth -> implement smallest correction -> verify -> update tracker/state`
