# LIVE SESSION BRIEF — ASTRONOMY HUB (AUTHORITATIVE)

This document defines current execution state.

It MUST be loaded in every task.

It MUST be updated after every completed step.

---

# 1. EXECUTION MODE

MODE: PHASE_2_EXECUTION

Allowed:
- Phase 2 execution
- Phase 2 verification
- Phase 2 tracking/state reconciliation
- minimal fixes required to satisfy Phase 2 build-sequence steps

Disallowed:
- Phase 3 execution
- graph/relationship work
- prediction/personalization work
- uncontrolled UI redesign
- backend expansion outside Phase 2 scope
- speculative feature development

---

# 2. CURRENT PHASE STATUS

Phase 1:
- status: COMPLETED (LOCKED)
- condition: Step 1–14 proofs are established and reconciled in authoritative tracking.

Phase 2:
- status: ACTIVE (UNLOCKED)
- condition: Phase 2 step sequence has been rebased. Prior tracked progress was recorded under the legacy step order and is not discarded, but must be revalidated against the rebased execution model. Effective current step is Phase 2 STEP 0 — CONTRACT LOCK (REVALIDATION REQUIRED).

Phase 3:
- status: NOT STARTED
- condition: Awaiting explicit authorization to begin.

Phase 4:
- status: NOT STARTED
- condition: Blocked until Phase 3 is fully locked.

Phase 5:
- status: NOT STARTED
- condition: Blocked until Phase 4 is fully locked.

---

# 3. CURRENT OBJECTIVE

PRIMARY:
- execute Phase 2 STEP 0 — CONTRACT LOCK (REVALIDATION REQUIRED)
- preserve command-center integrity and backend-authoritative Scene → Object → Detail behavior

SECONDARY:
- prevent Phase 3+ leakage
- preserve backend authority and deterministic scene generation

---

# 4. ACTIVE TASK

TASK:
- PHASE 2 EXECUTION

Scope:
- execute one Phase 2 build-sequence step at a time
- verify before changing anything
- fix minimally when invalid
- update authoritative tracking after each locked step

---

# 5. LAST COMPLETED STEPS

- Phase 1 authoritative closeout pass completed
- Phase 1 Step 1–14 proof reconstruction completed
- docs/phases/PHASE_1_ACCEPTANCE_CRITERIA.md reconciled to proven checks
- docs/execution/SESSION_STATE.md populated with Phase 1 step lock records
- final Phase 1 lock re-evaluated against runtime + tests + authority docs
- Phase 1 status updated to LOCKED
- Phase 2 STEP 1 (STATE FOUNDATION) locked with implementation + tracking proof
- Phase 2 STEP 2 (SCOPE SYSTEM) locked with implementation + tracking proof
- Phase 2 STEP 3 (ENGINE SYSTEM) locked with implementation + tracking proof
- Phase 2 STEP 4 (FILTER SYSTEM) locked with implementation + tracking proof
- Phase 2 STEP 5 (SCENE GENERATION) locked with implementation + tracking proof
- Phase 2 STEP 6 (ABOVE ME MERGE MODE) locked with implementation + tracking proof
- Phase 2 STEP 7 (COMMAND BAR ACTIVATION) locked with implementation + tracking proof
- Phase 2 STEP 8 (SCENE TRANSITIONS) locked with implementation + tracking proof
- Phase 2 STEP 9 (OBJECT SYSTEM) locked with implementation + tracking proof
- Phase 2 STEP 10 (DATA BOUNDARY ENFORCEMENT) locked with implementation + tracking proof
- Phase 2 STEP 11 (PERFORMANCE CONTROL) locked with implementation + tracking proof
- Phase 2 STEP 12 (TESTING) locked with implementation + tracking proof
- Phase 2 STEP 13 (ANTI-SCOPE) locked with implementation + tracking proof
- Phase 2 final lock evaluation executed: LOCKED (Section 14 user-validation criteria proven in runtime and acceptance tracking updated).
- Phase 2 reopened: new authoritative Step 14 (live data/location-time authority) added to spec/build/acceptance and remains unproven.
- Phase 2 STEP 14 (LIVE DATA & LOCATION-TIME AUTHORITY) locked with provider-backed runtime proof, explicit degraded-mode proof, and acceptance tracking updates.
- Phase 2 STEP 15 (DATA INGESTION SYSTEM) locked with Provider → Adapter → Normalizer → Validator → Cache → Engine Input implementation proof and ingestion-pipeline test coverage.
- Phase 2 STEP 16 (CACHE SYSTEM) locked with provider-specific TTL proof, stale-input detection proof, cache refresh proof, and runtime freshness-trace exposure.
- Phase 2 STEP 17 (ENGINE INPUT REFACTOR) locked with provider-backed engine-input enforcement in legacy scene assembly, removal of `get_targets`/`MOCK_ALERTS` runtime dependencies, and runtime proof of no `engine=mock` scene objects.
- Phase 2 STEP 18 (REMOVE MOCK DATA) locked with runtime `MOCK_*` removal from FastAPI services (`conditions_service`), provider-backed `/api/v1/conditions` payload assembly, and explicit degraded-mode signaling with no static success fallback.
- Phase 2 STEP 19 (ABOVE ME ORCHESTRATION) locked with runtime proof that Above Me merges multiple engine outputs into one scene, applies global visibility/time-oriented filters (`visible_now` vs `short_window`), and preserves deterministic relevance-based ordering.
- Phase 2 STEP 20 (SCENE AUTHORITY ENFORCEMENT) locked with proof that surfaced objects are scene-derived (`/api/v1/scene` object IDs are authoritative source for `/api/v1/targets` and `/api/v1/passes` supporting outputs) and mounted scene rendering in `AboveMeScene` is sourced from `scene.objects` with object detail resolved via `/api/v1/object/{id}`.
- Phase 2 STEP 21 (TRACEABILITY SYSTEM) locked with contract-level provider-source enforcement (`SceneObjectSummary.provider_source`, `ObjectDetail.provider_source`), scene assembly propagation of provider source across satellite/solar-system/deep-sky paths, and runtime/test proof that scene payloads include provider trace timestamps/degraded state while every surfaced object and resolved detail exposes provider source.

---

# 6. NEXT REQUIRED STEP

- execute Phase 2 STEP 0 — CONTRACT LOCK (REVALIDATION REQUIRED)
- verify rebased phase contract inputs (scope/engine/filter/scene model and engine spec presence) before proceeding to later rebased steps

---

# 7. BLOCKERS

- no Phase 1 blockers
- Phase 2 lock is blocked by unproven Section 20+ checks in `docs/phases/PHASE_2_ACCEPTANCE_CRITERIA.md`
- Phase 3+ remains blocked by phase-gate law

---

# 8. ENFORCEMENT STATE

- context injection: NOT IMPLEMENTED
- validation enforcement: NOT IMPLEMENTED
- controlled recovery: DOCUMENTED
- state transitions: DOCUMENTED

---

# 9. RULES

- Only ONE active task at a time
- Do NOT skip steps
- Do NOT batch Phase 2 build-sequence steps
- Do NOT proceed without validation
- All changes must be provable
- CONTEXT_MANIFEST.yaml controls document loading
- A step is not operationally locked until:
  1. implementation proof exists
  2. authoritative tracking documents are updated
- If a stop condition is triggered, enter controlled recovery before any resume
- State transitions must follow docs/execution/STATE_TRANSITIONS.md
- FAILURE_PATTERNS.md is optional support memory only in debug/review/reconciliation/planning contexts
- Phase 2 must preserve:
  - command-center primary surface
  - backend-authored meaning
  - Scene → Object → Detail integrity
- Phase 2 must not introduce:
  - immersive/spatial mode
  - graph relationships
  - prediction/personalization
  - frontend meaning-making

---

# 10. CONTROLLED RECOVERY INVOCATION

If execution enters `BLOCKED`:

1. invoke `docs/enforcement/FAILURE_RECOVERY_PROTOCOL.md`
2. classify one failure
3. execute one remediation task
4. validate remediation proof
5. resume only through legal state transition

Recovery cannot bypass validation law or context law.

---

# FINAL RULE

```text
If it cannot be proven, it is NOT complete.
