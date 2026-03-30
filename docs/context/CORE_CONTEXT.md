# CORE CONTEXT — ASTRONOMY HUB (AUTHORITATIVE)

This document defines non-negotiable system rules.

It MUST be loaded in every task.

---

# 1. SYSTEM IDENTITY

Astronomy Hub is a:

Multi-engine, filter-driven, scene-instanced decision-support system.

Purpose:
Determine what is relevant in the sky RIGHT NOW and guide user attention.

---

# 2. ARCHITECTURE LAW (NON-NEGOTIABLE)

The system MUST follow:

Scope → Engine → Filter → Scene → Object → Detail

---

## HARD RULES

- Scene is the ONLY visible data surface
- Objects MUST originate from Scene
- Detail MUST resolve from Object identity
- Engines produce data ONLY
- UI MUST NOT assemble or interpret raw data

---

# 3. RUNTIME LAW

- Docker is the ONLY authoritative runtime
- Backend: FastAPI
- Frontend: React + Vite
- All validation must succeed in Docker

---

# 4. DATA LAW

- All data MUST be normalized before reaching frontend
- No raw external data in UI
- Contracts MUST be stable and deterministic
- Query-boundary normalization is REQUIRED

---

# 5. EXECUTION LAW

- MASTER_PLAN.md defines what is allowed
- PROJECT_STATE.md defines what is true
- Phase documents define scoped requirements

---

# 6. COMPLETION LAW

Nothing is complete unless:

- it is implemented
- it is verified
- it matches phase requirements
- it passes validation rules

If it cannot be proven, it is NOT complete.

---

# 7. PROHIBITIONS

- Do NOT bypass architecture pipeline
- Do NOT mix phase scopes
- Do NOT use vision docs to justify implementation
- Do NOT assume completion
- Do NOT interpret vague language

---

# 8. CONTEXT LAW

- ONLY load documents defined by context system
- NEVER scan full /docs
- ALWAYS declare loaded context before work

---

# END