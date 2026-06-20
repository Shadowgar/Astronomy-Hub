# Astronomy Hub — Frontend Operating Rules

## 1. Scope
These rules apply to all work under `frontend/`.

They inherit the root `AGENTS.md` and tighten execution for the active corrective frontend track.

Current corrective context:
- track: FE
- checkpoint: FE8.5

Do not treat this directory as greenfield frontend work.
Do not restart FE from the beginning unless explicitly instructed by authoritative docs.

---

## 2. Governing Frontend Documents

Read these before meaningful frontend changes:

1. `docs/Document_Index.md`
2. `docs/PROJECT_STATE.md`
3. `docs/STACK_OVERVIEW.md`
4. `docs/PHASE_STRUCTURE.md`
5. `docs/PHASE_FE_EXECUTION.md`

If the task affects layout, UX hierarchy, or visual structure, also read the relevant UI authority docs listed in `Document_Index.md`.

If the task affects contracts or backend-facing behavior, also read the relevant architecture/data contract docs listed in `Document_Index.md`.

---

## 3. Locked Frontend Stack

Frontend stack is locked to:
- React
- Vite
- TypeScript
- TanStack Query
- Zustand
- React Router
- BabylonJS for space/sky rendering
- CesiumJS for earth/geospatial rendering when explicitly required
- token-based styling
- Vitest
- Playwright

Rules:
- all new code must be TypeScript
- no direct fetch calls in components
- no manual pathname routing logic
- no prop-drilling for global app state
- no hardcoded shared styling values in final implementation
- do not mix BabylonJS and Cesium responsibilities
- keep Sky Engine as an engine-owned runtime mounted by the host, not as a shared Hub rendering core

---

## 4. FE Execution Rules

Follow `docs/PHASE_FE_EXECUTION.md` exactly.

Core rules:
- only one FE step is active at a time
- do not skip steps
- do not combine steps
- do not expand scope
- frontend must consume backend contracts as defined
- frontend must not invent backend behavior
- frontend must not bypass the approved data layer

Because current corrective context is FE8.5:
- verify FE7 and FE8 boundaries before adding more work
- do not jump ahead to FE9 or FE10 unless the current step explicitly requires it
- do not regress earlier FE layers casually
- repair drift only when it blocks current corrective progress or violates governing docs

---

## 5. Architecture Expectations

Preserve:

`Scope → Engine → Filter → Scene → Object → Detail → Assets`

Frontend responsibilities must remain visually and structurally unambiguous.

Preserve:
- clear command hierarchy
- deterministic scene/object/detail flow
- bounded rendering systems
- explicit state ownership
- deterministic data access through approved abstractions

Do not reintroduce:
- equal-weight dashboard layout
- scattered rendering code
- ad hoc routing
- direct component-level data fetching
- mixed ownership of route/query/UI state

---

## 6. Change Discipline

- prefer minimal diffs
- touch only files required for the current step
- do not redesign unrelated UI
- do not refactor widely unless required by the active FE step
- do not introduce placeholder systems just to satisfy appearance
- do not claim “complete” unless the step criteria are actually met

If a frontend issue reveals a backend or contract problem:
- do not invent a frontend workaround that hides the issue
- surface the dependency clearly

---

## 7. Verification

Before claiming progress, run the relevant checks.

Typical verification includes:
- frontend build
- relevant frontend tests
- local behavior check for the changed flow
- confirmation that the changed area still respects FE step rules

When reporting completion, state:
- what changed
- what was verified
- what was not verified
- what remains blocked or uncertain

---

## 8. Working Style

Use:
`brainstorm → plan → execute → review`

Default behavior:
1. inspect governing docs
2. inspect current frontend implementation
3. determine the exact FE gap
4. make the next valid minimal change
5. verify it

When uncertain, do less, not more.

---

## 9. Frontend Skills

Use these when relevant:
- `phase-guard`
- `doc-drift-check`
- `frontend-change`

---

## 10. Sky Engine Port (module 2)

Work on the sky engine port lives under **`docs/runtime/port/`** (canon). The authoritative single entry point is **`docs/runtime/port/CODEX-HANDOFF.md`** — read it first. It links out to `README.md`, `module2-source-contract.md` (especially **§7** handoff), `module-gates.md`, and `evidence-index.md`. Implementation is mostly in **`frontend/src/features/sky-engine/engine/sky/`**; verify with **`npm run test:module2`** and **`npm run test:module1`** when tile or Eph code changes.

## 11. Codex / Fresh-Agent Handoff Checklist

If another agent (Codex 5.3 or otherwise) is taking over without prior chat context, do not re-derive state from the codebase. Follow the handoff doc verbatim:

1. **Read first (required, in order):**
   - `docs/runtime/port/CODEX-HANDOFF.md` (single entry point — includes current module state, execution order, next coding targets, pinned upstream commit, and hard constraints)
   - `docs/runtime/port/README.md`
   - `docs/runtime/port/module2-source-contract.md`
   - `docs/runtime/port/module-gates.md`
   - `docs/runtime/port/evidence-index.md`

2. **Hard constraints:**
   - Port Stellarium behavior exactly — math, thresholds, frames, lifecycle. No "looks close" approximations.
   - Sky Engine runtime + tooling must stay self-contained. No runtime imports from `study/` or other external trees.
   - Do not show `Stellarium` as user-facing UI branding.
   - Sky Engine loads on port **4173** only (`vite --port 4173 --strictPort`).
   - Work modules strictly in order. Module 2 is active; do not touch module 3+.

3. **Current active module:** `module2-stars-full` — **BLOCKED / partial**. Module bundle passes **32/32 across 9 files** as of EV-0072. Next concrete coding targets are listed in `CODEX-HANDOFF.md §5` and `module2-source-contract.md §7 "Suggested next coding targets"`.

4. **Verification per pass:**
   - `npm run typecheck` (required before claiming done)
   - `npm run test:module2` (must stay green; extend the bundle + CI `paths:` filter when adding new sources/tests)
   - `npm run test:module1` when touching `fileTileRepository.ts`, `healpix.ts`, or `ephCodec.ts`
   - `ReadLints` on touched files
   - Add a new `EV-xxxx` row in `evidence-index.md` (next free ID: **EV-0074**; `EV-0067` / `EV-0068` are intentionally unused)