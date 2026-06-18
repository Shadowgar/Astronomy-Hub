# DOCUMENT INDEX — AUTHORITATIVE CONTROL MAP

## 1. Purpose

This document defines:

- document authority
- execution control flow
- product definition hierarchy
- context loading rules
- legacy/stale document handling

This document prevents:

- execution drift
- product drift
- authority conflicts
- stale-document control
- AI misinterpretation

This document is a control map. It does not replace the content of the documents it references.

---

## 2. Core Law

Only specific documents control execution.

All other documents are reference unless explicitly loaded by the context manifest or explicitly named by the active task.

Do not scan the full `/docs` directory by default.

Do not use legacy documents to override current execution state.

Do not use old `/sky-engine` or BabylonJS assumptions to override the active `/oras-sky-engine/` runtime.

---

## 3. Product Model

Astronomy Hub is a location-aware astronomy command center.

Core question:

- What is above me right now, and what should I observe?

The system combines:

- observer location
- time
- object catalogs
- visibility calculations
- relevance ranking
- engine-specific rendering
- curated user-facing output

The Hub is not merely a renderer.

The Sky Engine is not merely a catalog list.

The WordPress/ORAS public feature must be API-driven.

---

## 4. System Models

Primary user-facing model:

- Scope → Engine → Filter → Scene → Object → Detail → Assets

Primary data/system model:

- Ingestion → Normalization → Storage → Cache → API → Client Rendering

Supporting product flow:

- Hub → Engine → Scene → Object → Detail → Exploration

Rendering law:

- Viewport = Active Engine Scene

The Hub defines importance.

Engines define reality.

The viewport renders the active engine truth.

The API must not fake truth.

---

## 5. Current Runtime Anchor

The active ORAS sky runtime is:

- `/oras-sky-engine/`

This is the ORAS-hosted Stellarium Web / Stellarium Web Engine runtime.

Current runtime source paths:

- `vendor/stellarium-web-engine/apps/web-frontend`
- `vendor/stellarium-web-engine/src`
- `frontend/public/oras-sky-engine`

Current API support paths:

- `/api/sky/object`
- `/api/above-me`
- `backend/app/services`
- `backend/app/routes`
- `backend/app/data/sky`

Current validation support includes:

- `scripts/skydata/validate_oras_deep_links.js`
- `frontend/tests`
- backend tests
- Docker Compose runtime

Stale references to `/sky-engine`, BabylonJS sky rendering, or old port-only execution must not control current work unless a newer authority document explicitly restores that direction.

---

## 6. Authority Tiers

### Tier 0 — Operating and Validation Control

These define validation truth, operating rules, and active override modes.

- `AGENTS.md`
- `docs/validation/SYSTEM_VALIDATION_SPEC.md`

Role:

- define proof standards
- define validation status
- define execution boundaries
- define special modes
- define no-fake-data rules
- define runtime proof requirements

Validation authority always applies.

Override modes may alter source/context loading order, but they do not remove proof requirements.

---

### Tier 1 — Core Context Control

These define permanent architecture and active execution state.

- `docs/context/CORE_CONTEXT.md`
- `docs/context/LIVE_SESSION_BRIEF.md`
- `docs/context/CONTEXT_MANIFEST.yaml`

Role:

- define permanent architecture
- define current active execution memory
- define task-specific context loading
- prevent full-doc overloading

`LIVE_SESSION_BRIEF.md` controls current work.

`CORE_CONTEXT.md` controls permanent architecture.

`CONTEXT_MANIFEST.yaml` controls task pack loading.

---

### Tier 2 — Recorded Project State and Execution Control

These define recorded project reality and execution control.

- `docs/PROJECT_STATE.md`
- `docs/MASTER_PLAN.md`

Compatibility aliases may exist at:

- `docs/execution/PROJECT_STATE.md`
- `docs/execution/MASTER_PLAN.md`

Role:

- record project status
- record completed work
- define execution sequence
- record current milestones

If both root and `docs/execution/` variants exist, the active context manifest or `LIVE_SESSION_BRIEF.md` must identify which one controls current work.

Do not let stale duplicate state files override current runtime evidence.

---

### Tier 3 — Product Definition

These define what the system is.

- `docs/DOCUMENT_INDEX.md`
- `docs/README.md`
- `docs/ASTRONOMY_HUB_DIAGRAM.md`
- `docs/product/PRODUCT_VISION.md`
- `docs/ASTRONOMY_HUB_MASTER_PLAN.md`

Role:

- define product identity
- define user-facing direction
- define long-term vision
- provide diagrams and explanatory context

Vision documents are not execution control documents.

Vision documents must not override current execution state.

---

### Tier 4 — Architecture, Engine, Object, Contract, and Ingestion Authority

These define system behavior and interfaces.

- `docs/architecture/*`
- `docs/contracts/*`
- `docs/engine/*`
- `docs/object/*`
- `docs/ingestion/*`
- `OBJECT_MODEL.md`
- `DATA_CONTRACTS.md`
- `INGESTION_STRATEGY.md`
- `ENGINE_SPEC.md`
- `ENGINE_CATALOG.md`
- `ARCHITECTURE_OVERVIEW.md`

Role:

- define object model
- define data contracts
- define engine responsibilities
- define ingestion model
- define rendering and viewport boundaries
- define API/client interfaces

If these documents contain stale `/sky-engine` or BabylonJS assumptions, report drift and defer to `LIVE_SESSION_BRIEF.md`, `CORE_CONTEXT.md`, and runtime evidence.

---

### Tier 5 — Feature Execution and Acceptance

These define feature-specific execution behavior.

- `docs/features/FEATURE_EXECUTION_MODEL.md`
- `docs/features/FEATURE_ACCEPTANCE.md`
- `docs/features/FEATURE_TRACKER.md`
- `docs/features/FEATURE_CATALOG.md`
- relevant feature documents

Role:

- define feature slices
- define acceptance criteria
- define feature status
- define implementation constraints

Feature documents must not override validation authority, current execution state, or runtime evidence.

---

### Tier 6 — Support Documents

These are guidance only unless explicitly loaded by a task pack.

- `docs/runtime/*`
- `docs/corrective/*`
- `docs/enforcement/*`
- `docs/ai/*`
- `docs/tools/*`
- `docs/DOC_INVENTORY.md`
- `docs/full_audit.md`
- `docs/features/FEATURE_SPEC_TEMPLATE.md`
- `docs/features/FEATURE_MIGRATION_MAP.md`

Role:

- provide helper context
- provide audits
- provide corrective references
- provide templates
- provide tool guidance

Support documents do not control execution by default.

---

### Tier 7 — Legacy Documents

Legacy documents are non-authoritative unless explicitly reactivated by a newer control document.

- `docs/phases/*`
- `docs/PHASE_STRUCTURE.md`
- old phase trackers
- old `/sky-engine` port plans
- stale BabylonJS Sky Engine documents

Role:

- historical reference only

Legacy documents must not control current execution.

---

## 7. Loading Rules

### Rule 1 — Mandatory Default Context

Always load in Default Mode:

- `docs/context/CORE_CONTEXT.md`
- `docs/context/LIVE_SESSION_BRIEF.md`

Then load task-specific documents from:

- `docs/context/CONTEXT_MANIFEST.yaml`

### Rule 2 — No Full-Docs Loading

Do not load the entire `/docs` directory.

Do not load every architecture document unless the manifest or task requires it.

Do not load legacy documents unless explicitly instructed.

### Rule 3 — Task-Based Loading

Load only what is required for the task.

Suggested task packs:

Frontend/runtime task:

- CORE_CONTEXT
- LIVE_SESSION_BRIEF
- relevant frontend/runtime task pack from CONTEXT_MANIFEST
- relevant contracts
- validation spec

Backend/API task:

- CORE_CONTEXT
- LIVE_SESSION_BRIEF
- relevant backend/API task pack from CONTEXT_MANIFEST
- relevant contracts
- validation spec

Sky Engine task:

- CORE_CONTEXT
- LIVE_SESSION_BRIEF
- ORAS Sky Engine runtime rules
- relevant runtime/source files
- relevant API contracts
- validation spec

High-definition data task:

- CORE_CONTEXT
- LIVE_SESSION_BRIEF
- relevant ingestion/data contracts
- relevant runtime provider config
- validation spec

Documentation task:

- CORE_CONTEXT
- LIVE_SESSION_BRIEF
- DOCUMENT_INDEX
- affected document(s)
- validation spec

### Rule 4 — Override Modes

If `AGENTS.md` activates an override mode, follow that mode's loading rules.

Examples:

- Stellarium Runtime Mode
- High-Definition Data Mode

Override modes may alter loading order.

Override modes do not remove validation requirements.

### Rule 5 — Declare Context

Before starting a task, the AI must declare:

- loaded documents
- active task pack
- whether override mode is active
- whether any extra documents were loaded
- any detected document conflicts

---

## 8. Execution Flow

Default execution flow:

- Context → Architecture → Feature/Task → Implementation → Validation → Report

For runtime-sensitive work:

- Context → Runtime/source inspection → Minimal plan → Implementation → Docker/browser validation → Report

For High-Definition Data work:

- Context → data/source inventory → source selection → ingestion/index plan → safe implementation slice → runtime validation → report

For documentation drift cleanup:

- Context → compare current docs to runtime reality → identify stale claims → rewrite narrowly → report affected documents

---

## 9. Current Product Anchor

Current active product anchor:

- ORAS Sky Engine at `/oras-sky-engine/`
- `/api/above-me`
- `/api/sky/object`
- future API-first WordPress/ORAS public surface

The active Sky Engine runtime is a contained Stellarium Web runtime.

It is not the old BabylonJS `/sky-engine` target.

Current rules:

- preserve Sky Engine isolation
- Hub does not render scenes
- Hub does not own engine render loops
- Hub defines importance
- Sky Engine owns its runtime behavior
- backend/API provides source-backed object truth
- object links must be stable and runtime-proven
- high-definition imagery/data upgrades must use upstream sources directly where allowed

---

## 10. Current Active Technical Directions

Current accepted technical directions include:

### Above-me discovery

- curated visible/ranked object output
- source-backed objects
- stable Sky Engine links
- bounded results
- no fake visibility

### Sky Engine exact links

- preserve `catalog + source_id + model`
- preserve large IDs as strings
- use RA/Dec as fallback coordinates only
- validate selection and camera centering in browser when claimed

### Catalog/data expansion

- OpenNGC-derived DSO discovery
- Hipparcos/star expansion
- future Gaia DR3 or EDR3 tiled/indexed star pipeline
- future Caldwell alias layer
- future DSO media/thumbnail manifest
- no hand-registered production catalogs

### Solar/satellite support

- JPL-backed solar-system data
- TLE-backed satellite identity
- Skyfield-backed satellite propagation
- no fake ephemeris
- no fake satellite visibility

### Survey imagery

- DSS as safe full-sky fallback
- Pan-STARRS-style high-definition providers where validated
- smart high-definition default only when fallback behavior is proven
- DESI parked unless explicitly approved
- no Stellarium-Web scraping
- no Stellarium CDN copying

### WordPress/ORAS public feature

- deferred unless explicitly approved
- API-first
- consumes `/api/above-me`
- no duplicated sky calculations
- no hardcoded astronomy object lists

---

## 11. Execution Slice Rule

Every implementation slice must identify:

- active mode
- loaded documents
- engine or system area
- feature/task
- data source if applicable
- API path if applicable
- runtime path if applicable
- minimal change plan
- validation commands
- proof output
- remaining gaps

Every slice must verify runtime truth when claiming runtime behavior.

---

## 12. Conflict Resolution

If documents conflict:

1. Follow `SYSTEM_VALIDATION_SPEC.md` for proof and status.
2. Follow `AGENTS.md` for operating rules and override modes.
3. Follow `CORE_CONTEXT.md` for permanent architecture.
4. Follow `LIVE_SESSION_BRIEF.md` for current work.
5. Follow `CONTEXT_MANIFEST.yaml` for task loading.
6. Follow `PROJECT_STATE.md` for recorded project state.
7. Follow `MASTER_PLAN.md` for execution sequence.
8. Use product/vision documents only as secondary reference.
9. Treat legacy documents as historical unless explicitly reactivated.

If runtime evidence conflicts with documentation:

- report document drift
- do not silently force working code to match stale documents
- do not claim documentation-only behavior as real
- validate runtime before completion

---

## 13. Compatibility Alias Rule

The following may exist as compatibility aliases:

- `docs/PROJECT_STATE.md`
- `docs/MASTER_PLAN.md`
- `docs/STACK_OVERVIEW.md`

If equivalent files also exist under `docs/execution/`, the active manifest or `LIVE_SESSION_BRIEF.md` must identify which one controls.

Compatibility aliases must not silently create two competing sources of truth.

If duplication is found:

- report it
- identify the active document
- mark the other as alias, legacy, or stale

---

## 14. Forbidden Execution

Do not:

- follow legacy phase instructions as current truth
- treat Hub as rendering engine
- treat engines as mere filters
- bypass contracts
- bypass object model
- mark completion without proof
- invent new data contracts mid-task
- fake coordinates
- fake visibility
- fake survey coverage
- hand-register production catalogs
- scrape Stellarium-Web
- copy Stellarium CDN data
- bake huge astronomy datasets into Docker without explicit approval
- convert `/oras-sky-engine/` into BabylonJS
- promote DESI without explicit approval
- start WordPress shortcode work without explicit approval

---

## 15. Required Completion Report

Every completed slice must report:

1. active mode
2. loaded documents
3. branch name
4. files changed
5. exact commands run
6. exact outputs or pass/fail counts
7. Docker/runtime validation when applicable
8. browser validation when applicable
9. data/source counts when applicable
10. commit hash if committed
11. push/PR status
12. remaining gaps
13. recommended next task

If validation was not run, state that directly.

Do not claim REAL completion when proof is missing.

---

## 16. Final Principle

Control documents define authority.

Validation defines truth.

Product documents define the system.

Engine documents define behavior.

Support documents assist.

Legacy documents are ignored unless explicitly reactivated.

Runtime evidence must prove completion.
