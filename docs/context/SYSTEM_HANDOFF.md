# 🌌 ASTRONOMY HUB — SYSTEM HANDOFF (AUTHORITATIVE)

---

# 1. PURPOSE

This document is the authoritative system snapshot.

It exists to:
- rehydrate system context in new sessions
- prevent loss of execution state
- prevent document drift
- define current objective clearly

This document MUST be treated as truth unless explicitly updated.

---

# 2. SYSTEM IDENTITY

Astronomy Hub is a:

Multi-engine, filter-driven, scene-instanced decision-support system.

Core question:

"What should I know about the sky right now, and what should I look at?"

---

# 3. CORE ARCHITECTURE LAW

The system MUST follow:

Scope → Engine → Filter → Scene → Object → Detail

Rules:

- Scene is the ONLY visible surface
- Objects MUST come from Scene
- Detail MUST resolve from Object identity
- Engines produce data ONLY
- UI MUST NOT interpret raw data

---

# 4. RUNTIME LAW

- Docker is the ONLY authoritative runtime
- Backend: FastAPI
- Frontend: React + Vite

---

# 5. DATA LAW

- All data MUST be normalized before UI
- No raw external data allowed in frontend
- Contracts MUST be stable

---

# 6. CURRENT SYSTEM REALITY

Backend:
- FastAPI service layer implemented
- /api/v1 routes active
- tests passing

Frontend:
- scene-first layout implemented
- query-boundary normalization complete
- fallback logic removed
- Three.js and Cesium foundations exist
- Vitest and Playwright tests exist

Runtime:
- Docker environment functional

---

# 7. WHAT WAS BROKEN

- vague phase documents
- AI claiming completion incorrectly
- no validation enforcement
- inconsistent data contracts
- UI not aligned with architecture

---

# 8. WHAT HAS BEEN FIXED

- backend stabilized
- frontend normalized
- architecture partially enforced
- testing added

---

# 9. WHAT IS STILL MISSING (CRITICAL)

- validation enforcement system
- context injection system
- Phase 1 formal verification
- full UI alignment with architecture

---

# 10. CURRENT EXECUTION STATE

MODE: CORRECTIVE_EXIT_HANDOFF

Meaning:

- corrective implementation complete (functional)
- system NOT formally verified
- Phase 2 NOT started

---

# 11. CURRENT OBJECTIVE

We are building:

- context retention system
- document injection system
- validation system

We are NOT:
- building features
- modifying UI
- expanding backend

---

# 12. HARD RULES

- DO NOT assume Phase 1 is complete
- DO NOT start Phase 2
- DO NOT rebuild blindly
- ALWAYS verify before modifying
- REQUIRE proof for all claims

---

# 13. DOCUMENT AUTHORITY

Priority order:

1. SYSTEM_VALIDATION_SPEC.md
2. PROJECT_STATE.md
3. MASTER_PLAN.md
4. PHASE documents
5. ARCHITECTURE / DATA docs
6. ASTRONOMY_HUB_MASTER_PLAN (vision only)

---

# 14. NEXT STEP

Create:

- CORE_CONTEXT.md ✅
- LIVE_SESSION_BRIEF.md ✅
- CONTEXT_MANIFEST.yaml ✅
- TASK_PACKS.md ✅
- SYSTEM_VALIDATION_SPEC.md ✅

Next action:

👉 Use these to enforce controlled execution

---

# 15. USAGE

In a new chat:

Read:
docs/context/SYSTEM_HANDOFF.md

Then follow:
- CORE_CONTEXT.md
- LIVE_SESSION_BRIEF.md
- CONTEXT_MANIFEST.yaml
- SYSTEM_VALIDATION_SPEC.md

---

# END