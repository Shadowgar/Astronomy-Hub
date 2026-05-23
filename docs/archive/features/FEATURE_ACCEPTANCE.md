# Feature Acceptance (Authoritative)

## Binary Acceptance Rule
A feature is accepted only when every required gate passes.

## Required Gates
1. **Behavior Gate**: user-visible output exists and is usable.
2. **Contract Gate**: API/UI contract shape is stable and documented.
3. **Authority Gate**: backend ownership path is explicit.
4. **Provenance Gate**: source data provenance is explicit.
5. **Determinism Gate**: behavior changes correctly with relevant inputs.
6. **Fallback Gate**: degraded behavior is explicit and truthful.
7. **Proof Gate**: commands and outputs are attached.

## Required Proof Artifacts
- file references
- executed commands
- endpoint output snippets
- runtime screenshots (when UI behavior is claimed)
- explicit pass/fail statement

## Failure Classification
- `FAKE`: no real backend/source path, or placeholder presented as real
- `PARTIAL`: runtime path exists but one or more gates fail
- `REAL`: all gates pass with proof
- `BLOCKED`: cannot satisfy gates due external dependency/conflict

## Non-Negotiable
No feature may be moved to `REAL` without proof artifacts.
