# Astronomy Hub — Temporary Execution Authority

## Purpose
This file is the temporary execution truth for audit and verification work.
Use it before relying on drifted project-state documents.

## Actual current state
- Active track: FE
- Active phase: FE 8.5
- Backend engineering: completed enough to support frontend audit and verification
- Frontend engineering: implemented, but must be audited for drift and alignment
- Older phase-state docs may be conceptually useful but are not execution-authoritative for this audit

## Audit objective
Verify actual backend and frontend reality against:
- current implementation
- architecture intent
- contracts
- hierarchy expectations
- known execution history

## Audit rules
- Do not restart the project based on stale docs
- Do not rewrite architecture during the audit
- Do not perform feature work during the audit
- Do not make opportunistic refactors
- Prefer observation, verification, and explicit drift reporting
- Minimal diffs only if needed for instrumentation or audit helpers

## Required interpretation
When project documents conflict with current implementation history:
- treat CURRENT_EXECUTION_STATE.md as the temporary execution authority
- treat drifted phase docs as historical or conceptual unless explicitly confirmed
- do not roll execution backward automatically

## Audit outputs required
Codex must produce:
1. Backend verified / not verified findings
2. Frontend verified / not verified findings
3. Drift findings
4. Risk level for continuing FE without BE changes
5. Recommendation:
   - continue FE
   - correct BE then continue FE
   - correct FE on current BE
   - pause and reconcile docs

## Scope
This file governs audit work only.
After audit, authoritative docs should be reconciled.
