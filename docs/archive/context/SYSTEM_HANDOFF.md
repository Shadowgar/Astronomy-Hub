# System Handoff (Authoritative Snapshot)

## Execution Model
- Feature-first execution is active.
- Runtime proof controls status changes.
- Legacy phase docs are reference-only.

## Current Working Objective
Stabilize command-center behavior by closing feature gaps with bounded slices.

## Active Authority Set
- `docs/validation/SYSTEM_VALIDATION_SPEC.md`
- `docs/context/CORE_CONTEXT.md`
- `docs/context/LIVE_SESSION_BRIEF.md`
- `docs/context/CONTEXT_MANIFEST.yaml`
- `docs/execution/PROJECT_STATE.md`
- `docs/execution/MASTER_PLAN.md`
- `docs/features/*`

## Current Known Risk
- Some feature claims are still partial and need strict runtime re-verification.
- News/Knowledge feed remains the highest risk of fake/partial behavior unless backed by a dedicated endpoint.

## Handoff Requirements
A receiving agent must:
1. load context via manifest
2. declare active feature + current status
3. verify runtime behavior before coding
4. update feature tracker and session brief only with proof

## Hard Rule
Do not claim completion from documentation alignment alone.
