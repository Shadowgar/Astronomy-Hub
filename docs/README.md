# Astronomy Hub Documentation System

This file is the single entry point for humans and automated agents to understand the project's documentation authority and where to look first.

## Where to Start (reading order)
1. `docs/ASTRONOMY_HUB_MASTER_PLAN.md`
2. `docs/PROJECT_STATE.md`
3. `docs/SESSION_CONTINUITY_BRIEF.md`
4. Relevant `PHASE_X_SPEC.md` for the active phase (e.g., `PHASE_1_SPEC.md`)
5. `docs/UI_MASTER_PLAN.md`
6. `docs/DATA_CONTRACTS.md` and `docs/contracts/`

## Authority Levels

**AUTHORITATIVE**
- `ASTRONOMY_HUB_MASTER_PLAN.md` (master vision)
- `PROJECT_STATE.md` (current project snapshot)
- `SESSION_CONTINUITY_BRIEF.md` (continuity + next actions)
- `PHASE_*.md` files (per‑phase specs)
- `UI_MASTER_PLAN.md` (UI roadmap)
- `DATA_CONTRACTS.md` and `docs/contracts/*` (data schema truth)

**SUPPORTING**
- Per‑phase UI specs (`UI_PHASE_A_SPEC.md`, `UI_PHASE_B_SPEC.md`, ...)
- `ARCHITECTURE_OVERVIEW.md`
- `VALIDATION_CHECKLIST.md`
- `UI_DESIGN_PRINCIPLES.md` and other design/docs

**HISTORICAL / ARCHIVE**
- `PHASE_2_EXECUTION_TODO.md` (execution history; not an active TODO)
- `UI_GAP_ANALYSIS.md` (audit snapshot)

## Current Project State (locked snapshot)
- Phase 1: COMPLETE
- Phase 2: COMPLETE
- UI Phase A: COMPLETE
- UI Phase B: ACTIVE

## Rules for Future AI and Contributors
- Always read `ASTRONOMY_HUB_MASTER_PLAN.md` first for vision and phase context.
- Always check `PROJECT_STATE.md` second to learn what is complete and what is active.
- Treat `PHASE_*.md` files as the authoritative definition of each phase's scope.
- Never treat documents in the **HISTORICAL / ARCHIVE** section as active plans; do not implement their TODOs without confirmation.
- Do not create new top-level docs in `docs/` without a clear purpose and cross-link from this README.
- When in doubt, prefer conservative changes and update `PROJECT_STATE.md` to reflect any phase transition.

---

This file is intentionally minimal. Follow the reading order and authority map above to avoid drift.
