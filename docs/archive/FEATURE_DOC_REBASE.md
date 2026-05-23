# Feature-First Documentation Rebase

## Goal
Convert execution control from phase-first tracking to feature-first runtime truth.

## Completed Rebase Actions
- Established `docs/features/*` as active execution authority.
- Updated authority hierarchy in `docs/DOCUMENT_INDEX.md`.
- Updated context packs in `docs/context/CONTEXT_MANIFEST.yaml`.
- Updated validation rules for feature evidence in `docs/validation/SYSTEM_VALIDATION_SPEC.md`.
- Added runtime-truth feature inventory in `docs/features/FEATURE_TRACKER.md`.
- Added phase-to-feature mapping in `docs/features/FEATURE_MIGRATION_MAP.md`.
- Added compatibility aliases for legacy paths:
  - `docs/PROJECT_STATE.md`
  - `docs/MASTER_PLAN.md`
  - `docs/STACK_OVERVIEW.md`
- Marked phase docs as legacy reference-only.

## New Operating Standard
Every execution slice must resolve to:
- one feature from `FEATURE_CATALOG.md`
- one status update in `FEATURE_TRACKER.md`
- one proof bundle in `LIVE_SESSION_BRIEF.md`

## What Legacy Docs Still Provide
- historical planning rationale
- sequence traceability
- prior acceptance language for migration reference

Legacy docs do not authorize current status claims.
