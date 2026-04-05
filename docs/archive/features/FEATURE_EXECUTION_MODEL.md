# Feature Execution Model (Authoritative)

## Purpose
Define how Astronomy Hub is executed and corrected using feature slices.

## Core Law
Execute one bounded feature slice at a time using:
`verify -> classify -> correct minimally -> verify -> record evidence`

## Runtime-Truth Requirement
A feature is valid only if all are provable:
1. user-visible behavior exists
2. backend/API path exists and responds
3. source provenance is explicit
4. output behavior is deterministic under relevant input changes
5. tests/build/runtime checks support the claim

## Feature Evidence Card (mandatory)
Every executed slice must record:
- feature name
- user-visible output
- UI/API entry
- backend service chain
- source data
- known fake/partial remainder
- proof commands + outputs
- resulting status (`REAL`/`PARTIAL`/`FAKE`/`BLOCKED`)

## Locked System Models
Preserve both:
- `Scope -> Engine -> Filter -> Scene -> Object -> Detail -> Assets`
- `Ingestion -> Normalization -> Storage -> Cache -> API -> Client Rendering`

## Prohibitions
- no doc-only completion claims
- no frontend-owned meaning assembly
- no raw provider payload in UI
- no cross-feature scope expansion inside one slice

## Relationship to Phase Docs
Phase docs are legacy planning references.
Execution authority is feature-first and governed by `docs/features/*` + validation/state docs.
