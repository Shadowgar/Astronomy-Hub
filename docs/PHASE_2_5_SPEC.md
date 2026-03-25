# PHASE 2.5 — FOUNDATION REALIGNMENT & SYSTEM HARDENING

## 1. Phase intent

Phase 2.5 exists to transition Astronomy Hub from a functional but unstable prototype into a controlled, deterministic, production-grade foundation. The purpose of this phase is not feature growth. The purpose is to make the system trustworthy enough to carry future complexity.

Phase 1 proved the product direction. Phase 2 expanded the system into a more structured decision-support dashboard. UI Phase B began transforming the interface into a product-grade experience. During that work, a deeper issue became clear: the underlying foundation is not stable enough to justify continued UI investment. Startup is inconsistent, the runtime is brittle, the boundaries between layers are too loose, and the current stack truth has drifted from the intended architecture.

Phase 2.5 corrects that.

This phase establishes a new system law:

> No meaningful system behavior may exist outside of explicit contracts, typed models, controlled runtime boundaries, and a repeatable execution environment.

After Phase 2.5, Astronomy Hub must be able to start reliably, validate its data shape, expose predictable API contracts, run in containers, and support future development without hidden coupling or startup chaos.

---

## 2. Why this phase exists now

Phase 2.5 is being inserted immediately after Phase 2 and before further UI or visualization expansion because the system has reached the point where foundation debt is actively blocking progress.

Current symptoms include:

- unstable startup behavior
- friction restarting frontend and backend
- runtime brittleness
- unclear stack authority
- mismatch between intended architecture and actual repo reality
- UI work landing on top of infrastructure that is not dependable

Continuing UI Phase B while the system remains unstable would create waste. Styling and UX improvements are low-value if the application cannot start predictably or if the codebase is about to move onto different core technologies.

Phase 2.5 therefore pauses UI-forward work and prioritizes architecture control.

---

## 3. Phase position in the roadmap

- Phase 1 — Local Sky MVP
- Phase 2 — Structured decision system
- Phase 2.5 — Foundation realignment and system hardening
- Phase 3 — Sky visualization and exploration
- Phase 4 — Expanded intelligence, broader decision support, future-scale capabilities

Phase 2.5 is not Phase 3 prep in a vague sense. It is the required technical bridge that makes Phase 3 safe to begin.

---

## 4. Core doctrine

### 4.1 Control over expansion

This phase prioritizes control, reliability, and architecture integrity over new capability. No product expansion is allowed to masquerade as technical migration.

### 4.2 Runtime truth must match documentation truth

A stack written in planning documents but absent from the repo is not real. After Phase 2.5, the documented stack and the actual runtime stack must align.

### 4.3 Every important boundary must become explicit

The system must have clear, enforceable boundaries between:

- frontend and backend
- route layer and service layer
- raw payloads and UI-safe models
- environment configuration and source code
- runtime errors and degraded-state signaling

### 4.4 Future complexity must rest on a hardened foundation

Phase 3 and later will introduce more state, more rendering complexity, more data coordination, and more interaction logic. That cannot be safely layered on top of an unstable startup model or implicit data flow.

---

## 5. Scope of this phase

Phase 2.5 includes all of the following as first-class requirements:

### Backend stack realignment
- FastAPI
- Uvicorn
- Pydantic
- backend app restructuring
- centralized configuration and error handling
- explicit response contracts

### Frontend foundation realignment
- TypeScript
- strict typing
- shared domain types
- adapter-controlled data flow
- explicit component contracts

### Infrastructure realignment
- Docker
- Docker Compose
- standard environment management
- repeatable startup and restart paths

### Styling governance decision
- deliberate Tailwind adoption, or
- deliberate rejection of Tailwind in favor of a formalized token/CSS system

### Validation and cutover
- tests
- smoke checks
- regression review
- documentation cutover

---

## 6. Out of scope

The following are explicitly out of scope for Phase 2.5:

- new astronomy features
- new data domains
- Phase 3 visualization features
- sky map or 3D work
- time scrubber behavior
- advanced exploration UX
- additional observing logic not already in scope
- database expansion beyond what is strictly needed for the foundation migration
- product-level module expansion

If work changes what the user can do rather than how the system is structured, that work is out of scope unless it is a bug fix necessary to preserve Phase 1 or Phase 2 behavior.

---

## 7. Official target stack after Phase 2.5

### Frontend
- React
- TypeScript
- Vite
- native fetch or a very thin typed API client
- local React state unless a stronger need emerges
- one deliberate styling system

### Backend
- Python
- FastAPI
- Uvicorn
- Pydantic
- simple controlled cache layer
- no forced database introduction in this phase unless operationally required

### Infrastructure
- Docker
- Docker Compose
- `.env` driven configuration

This is the first phase where this stack becomes a runtime requirement rather than an aspiration.

---

## 8. Architectural transformation goals

Before Phase 2.5, the application may still operate through a loose Python server structure, plain JavaScript frontend modules, and startup methods that depend too heavily on local machine state.

After Phase 2.5:

- backend runtime is canonicalized through FastAPI
- schema enforcement is canonicalized through Pydantic
- frontend typing is canonicalized through TypeScript
- startup is canonicalized through Docker Compose
- data flow is canonicalized through adapters and typed models
- styling is canonicalized through one explicit design system decision

---

## 9. Backend specification

### 9.1 Canonical runtime

The backend must be served by Uvicorn with a FastAPI application as the authoritative entrypoint. Any legacy custom server path must be retired or clearly marked non-canonical and transitional.

### 9.2 Canonical backend structure

The backend must be reorganized into a layered structure such as:

```text
backend/
  app/
    main.py
    api/
      routes/
    schemas/
    services/
    core/
    dependencies/
```

Equivalent naming is acceptable only if the same separation of authority exists.

### 9.3 Route layer doctrine

Route handlers must remain thin. Their responsibilities are limited to:

- receiving request context
- calling the appropriate service
- returning model-bound responses

Routes must not become shadow service layers.

### 9.4 Service layer doctrine

Business logic, orchestration, normalization, cache interaction, and domain shaping belong in services. Services own domain behavior.

### 9.5 Schema authority

All meaningful response objects must be defined with Pydantic models. These schemas are authoritative for runtime response validation. Unknown fields must be rejected by default unless there is a documented reason to allow them.

### 9.6 Response envelope

A consistent API response model must exist across success, degraded, and error states. The exact envelope may evolve during implementation, but it must remain stable, documented, and used consistently.

At minimum, responses must clearly communicate:

- status
- data
- metadata
- error or degradation information

### 9.7 Error handling

Centralized error mapping must be introduced. Backend exceptions must not leak unpredictably to clients. Known failure modes must produce structured, documented responses.

### 9.8 Degraded mode preservation

Degraded mode behavior from earlier phases must be preserved and formalized. The system must be able to indicate degraded results explicitly rather than failing silently.

### 9.9 Configuration authority

Environment variables, ports, feature flags, and runtime toggles must be controlled centrally rather than scattered across the codebase.

### 9.10 Async readiness

The backend structure must be compatible with future asynchronous evolution even if all services do not become deeply async in this phase.

---

## 10. Frontend specification

### 10.1 TypeScript migration

The frontend must migrate to TypeScript with strict mode enabled. This is a required stack realignment, not a stretch goal.

### 10.2 Type authority

Shared domain types must be defined centrally and must mirror backend contract shapes. Type duplication across modules is not acceptable as a long-term pattern.

### 10.3 Data flow doctrine

The frontend data path must follow this model:

```text
API response -> adapter -> typed frontend model -> UI component
```

UI components must not consume raw backend payloads directly.

### 10.4 Adapter authority

Adapters are responsible for:

- normalizing payloads
- handling defaults
- mapping degraded states
- isolating backend shape changes from UI code

### 10.5 Component contract rules

Each component must define explicit prop types and avoid hidden assumptions. Components should render already-shaped data rather than performing deep transformation work.

### 10.6 Frontend state handling

Every major user-facing module must handle:

- loading
- empty
- degraded
- error
- success

### 10.7 Build and type enforcement

The frontend must compile cleanly under strict type settings. Temporary exceptions, if any, must be documented and intentionally bounded.

---

## 11. Styling system specification

Phase 2.5 requires a styling system decision. It does not force a predetermined answer, but it forbids accidental hybridity.

### Option A: Tailwind adoption

If Tailwind is adopted, it must be deliberate and system-wide enough to count as a coherent strategy. Tokens, spacing, hierarchy, and semantics must be mapped intentionally.

### Option B: Formalized token/CSS system

If the current CSS or token approach is retained, it must be documented and normalized as an official design system. Spacing, typography, color semantics, and module shell patterns must be explicit.

### Forbidden state

The forbidden outcome is a mixed system in which Tailwind, ad hoc CSS, and legacy one-off overrides all coexist without governance.

---

## 12. Infrastructure specification

### 12.1 Dockerization

The application must run in separate frontend and backend containers.

### 12.2 Compose orchestration

Docker Compose becomes the canonical local startup path.

### 12.3 Environment control

Environment configuration must be documented and managed through `.env` conventions and an `.env.example` file.

### 12.4 Restart and log ergonomics

The system must become easier to start, stop, restart, inspect, and rebuild than the current manual process.

### 12.5 Future extensibility

The compose model should allow later addition of infrastructure such as a reverse proxy or database without requiring a fundamental rework.

---

## 13. Testing and validation requirements

### Backend
- endpoint smoke coverage
- schema validation tests
- degraded mode tests
- error response tests

### Frontend
- TypeScript compile validation
- build success
- smoke verification of primary modules

### System
- container startup verification
- environment sanity verification
- regression comparison against pre-migration baseline

---

## 14. Preservation requirements

The following must survive the migration:

- the dashboard remains the primary product surface
- the system remains decision-support first
- core Phase 1 and Phase 2 user behavior remains intact unless intentionally fixed
- UI Phase B’s direction is preserved for later continuation
- no user-facing module loses essential behavior due to stack migration

---

## 15. Phase execution model

Implementation must proceed in controlled workstreams:

1. planning and audit
2. Docker and environment foundation
3. backend FastAPI migration
4. contract and schema enforcement
5. frontend TypeScript migration
6. styling system formalization
7. validation, cleanup, and documentation cutover

This order is intentional. It prevents the migration from turning into undifferentiated churn.

---

## 16. Completion criteria

Phase 2.5 is complete only when all of the following are true:

- `docker compose up` reliably starts the app
- frontend and backend are independently restartable
- FastAPI is the canonical backend runtime
- Uvicorn is the standard server path
- Pydantic governs API contracts
- the frontend runs under TypeScript strict mode
- adapters are authoritative between API and UI
- a single styling system decision is documented and applied
- no critical regression has been introduced
- authoritative docs match actual repo truth

---

## 17. Final statement

Phase 2.5 is the phase where Astronomy Hub stops being a promising prototype with architectural intent and becomes a governed application with runtime authority.

This phase is not overhead. It is the cost of making every later phase worth building.
