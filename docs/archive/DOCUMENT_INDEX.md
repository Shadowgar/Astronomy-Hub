# Astronomy Hub Document Index (Authoritative Map)

## 1. Authority Order
1. `docs/validation/SYSTEM_VALIDATION_SPEC.md`
2. `docs/context/CORE_CONTEXT.md`
3. `docs/context/LIVE_SESSION_BRIEF.md`
4. `docs/context/CONTEXT_MANIFEST.yaml`
5. `docs/execution/PROJECT_STATE.md`
6. `docs/execution/MASTER_PLAN.md`
7. `docs/features/FEATURE_EXECUTION_MODEL.md`
8. `docs/features/FEATURE_CATALOG.md`
9. `docs/features/FEATURE_ACCEPTANCE.md`
10. `docs/features/FEATURE_TRACKER.md`
11. `docs/architecture/*`
12. `docs/contracts/*`
13. `docs/ASTRONOMY_HUB_DIAGRAM.md`
14. `docs/product/ASTRONOMY_HUB_MASTER_PLAN.md` (vision reference)

## 2. Execution System
Active execution is **feature-first**, not phase-first.

Mandatory behavior:
- evaluate runtime truth first
- classify feature state as `REAL`, `PARTIAL`, `FAKE`, or `BLOCKED`
- implement one bounded corrective slice
- prove outcome with commands and outputs

## 3. Active vs Legacy
### Active execution-control docs
- `docs/context/*` (except archive-style notes)
- `docs/execution/*`
- `docs/features/*`
- `docs/validation/SYSTEM_VALIDATION_SPEC.md`

### Active design/system references
- `docs/architecture/*`
- `docs/contracts/*`
- `docs/ASTRONOMY_HUB_DIAGRAM.md`

### Legacy planning/history docs
- `docs/phases/*`
- `docs/PHASE_STRUCTURE.md`
- phase-labeled UI planning docs under `docs/product/ui/*`

Legacy docs are traceability references only and do not authorize execution state.

## 4. Compatibility Aliases
The following root-level compatibility docs exist to prevent path drift in older runbooks:
- `docs/PROJECT_STATE.md` -> `docs/execution/PROJECT_STATE.md`
- `docs/MASTER_PLAN.md` -> `docs/execution/MASTER_PLAN.md`
- `docs/STACK_OVERVIEW.md` -> `docs/execution/STACK_OVERVIEW.md`

## 5. Conflict Rule
If documents conflict:
- follow authority order
- record conflict in `LIVE_SESSION_BRIEF.md`
- do not mark feature state complete until conflict is reconciled and revalidated
