# Astronomy Hub — Backend Operating Rules

## 1. Scope
These rules apply to all work under `backend/`.

They inherit the root `AGENTS.md` and tighten execution for backend work in the corrective system.

Backend corrective work is not the current active track unless the task explicitly requires backend reconciliation.
Do not make backend changes casually during FE corrective work.

---

## 2. Governing Backend Documents

Read these before meaningful backend changes:

1. `docs/Document_Index.md`
2. `docs/PROJECT_STATE.md`
3. `docs/STACK_OVERVIEW.md`
4. `docs/PHASE_STRUCTURE.md`
5. `docs/PHASE_BE_EXECUTION.md`

Also read relevant architecture and contract docs from `Document_Index.md` when touching routes, models, ingestion, assets, or storage behavior.

---

## 3. Locked Backend Stack

Backend stack is locked to:
- FastAPI
- Uvicorn
- Python
- Pydantic
- pydantic-settings
- PostgreSQL
- PostGIS
- SQLAlchemy
- GeoAlchemy2
- Alembic
- Redis
- pytest
- Docker Compose

Rules:
- FastAPI is the only canonical backend runtime
- all endpoints must live under `/api/v1`
- request and response boundaries must use Pydantic
- PostgreSQL is the source of truth
- Redis is cache only
- schema changes must use Alembic
- assets must use streaming/file delivery, not JSON payload substitutes

---

## 4. Backend Change Restriction During FE Corrective Work

Current repository context is FE corrective work.

Therefore:
- do not make backend changes unless they are required by the active FE corrective step
- do not opportunistically refactor backend systems
- do not add features
- do not change contracts casually
- do not “help” the frontend by inventing undocumented behavior

If backend work is required, keep it narrowly scoped to the blocking issue.

---

## 5. Architecture Expectations

Preserve:

`Ingestion → Normalization → Storage → Cache → API → Client Rendering`

and

`Scope → Engine → Filter → Scene → Object → Detail → Assets`

Do not introduce:
- duplicate runtime paths
- inconsistent response structures
- contract ambiguity
- bypasses around validation, logging, storage, or cache rules

---

## 6. Change Discipline

- prefer minimal diffs
- touch only files required by the task
- preserve router/service/model boundaries
- do not silently alter contracts
- do not silently change environment behavior
- do not mark backend work complete without tests or direct verification

If code conflicts with docs, surface the conflict explicitly.

---

## 7. Verification

Before claiming completion, run the relevant backend checks.

Typical verification includes:
- backend tests
- route verification for changed endpoints
- contract validation where applicable
- confirmation that runtime behavior still matches locked stack rules

When reporting completion, state:
- what changed
- what was verified
- what was not verified
- any remaining blockers or assumptions

---

## 8. Working Style

Use:
`brainstorm → plan → execute → review`

Default behavior:
1. inspect governing docs
2. inspect current backend implementation
3. isolate the exact issue
4. make the smallest valid correction
5. verify it

When uncertain, preserve existing behavior and escalate the conflict rather than improvising.

---

## 9. Backend Skills

Use these when relevant:
- `phase-guard`
- `doc-drift-check`
- `backend-change`
EOF