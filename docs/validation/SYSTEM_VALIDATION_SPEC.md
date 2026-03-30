# SYSTEM VALIDATION SPEC — ASTRONOMY HUB (AUTHORITATIVE)

This document defines system-wide validation rules.

It is the highest authority for determining:
- correctness
- completion
- conflict resolution

If this document is violated, the system is INVALID.

---

# 1. VALIDATION PRINCIPLE

A system component is NOT complete unless:

1. it is implemented
2. it matches specification
3. it is verifiable
4. it passes runtime checks
5. it obeys architecture laws

If any of the above cannot be proven → FAIL

---

# 2. PROOF REQUIREMENT

All claims MUST be proven with:

- file references
- code evidence
- test output
- runtime behavior (if applicable)

Statements without proof are INVALID.

---

# 3. DOCUMENT AUTHORITY RESOLUTION

When documents conflict:

1. SYSTEM_VALIDATION_SPEC.md (this document)
2. PROJECT_STATE.md (actual system reality)
3. MASTER_PLAN.md (execution control)
4. PHASE documents (requirements)
5. ARCHITECTURE / DATA / ENGINE documents
6. ASTRONOMY_HUB_MASTER_PLAN (vision only)

---

## RULES

- reality overrides assumptions
- execution control overrides vision
- validation overrides vague language

---

# 4. ARCHITECTURE VALIDATION

The system MUST follow:

Scope → Engine → Filter → Scene → Object → Detail

---

## FAIL CONDITIONS

- UI renders data not derived from Scene
- Objects exist without Scene origin
- Detail cannot resolve from Object identity
- Engine directly affects UI

---

# 5. DATA VALIDATION

---

## REQUIRED

- All data normalized before UI
- Stable contract structure
- No raw external payloads

---

## FAIL CONDITIONS

- UI receives raw API/provider data
- inconsistent contract shapes
- missing required fields
- identity instability (IDs change across calls)

---

# 6. RUNTIME VALIDATION

---

## REQUIRED

- system runs in Docker
- backend endpoints respond correctly
- frontend builds successfully

---

## FAIL CONDITIONS

- system only works locally (non-Docker)
- broken API routes
- build failures

---

# 7. BACKEND VALIDATION

---

## REQUIRED

- endpoints exist and respond
- service layer isolation
- no dependency on legacy runtime paths

---

## FAIL CONDITIONS

- routes missing or broken
- logic tied to server.py improperly
- inconsistent response formats

---

# 8. FRONTEND VALIDATION

---

## REQUIRED

- scene-first hierarchy enforced
- query-boundary normalization used
- no component-level contract fallback
- UI does not interpret raw data

---

## FAIL CONDITIONS

- component-level data shaping
- envelope handling in components
- UI assembling backend data

---

# 9. PHASE VALIDATION

---

## RULE

A phase is NOT complete unless:

- Phase Spec is satisfied
- Acceptance Criteria pass
- Build Sequence steps verified
- No forbidden scope included

---

## FAIL CONDITIONS

- vague requirement interpretation
- missing acceptance coverage
- Phase N+1 features present
- incomplete verification

---

# 10. CONTEXT VALIDATION

---

## REQUIRED

- CORE_CONTEXT.md loaded
- LIVE_SESSION_BRIEF.md loaded
- documents match CONTEXT_MANIFEST.yaml
- context declared before execution

---

## FAIL CONDITIONS

- full /docs loaded
- undeclared documents used
- missing required context files

---

# 11. COMPLETION LAW

A task or phase is COMPLETE only if:

- ALL validation sections pass
- ALL required proofs are provided
- NO fail conditions triggered

---

# 12. EXECUTION BLOCK RULE

If ANY FAIL condition is triggered:

- execution MUST STOP
- issue MUST be resolved
- validation MUST be rerun

---

# 13. NON-NEGOTIABLE RULE

If something cannot be proven, it is NOT complete.

---

# 14. RECOVERY VALIDATION LAW

Controlled recovery is allowed only as a response to an existing stop condition.

Recovery constraints:

- recovery must follow `docs/enforcement/FAILURE_RECOVERY_PROTOCOL.md`
- recovery state movement must follow `docs/execution/STATE_TRANSITIONS.md`
- one remediation task per recovery cycle
- remediation output must be validated before resume

Resume fail conditions:

- remediation without proof
- resume attempt from `BLOCKED` without reconciliation
- resume attempt that bypasses `VALIDATING -> VERIFIED`

If any resume fail condition occurs:

- execution MUST return to `BLOCKED`
- remediation scope MUST be redefined
- validation MUST be rerun

---

# END
