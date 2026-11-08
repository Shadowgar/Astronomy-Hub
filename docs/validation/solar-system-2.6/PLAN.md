# Solar System 2.6 — Beyond the Planets implementation plan

**Goal:** connect observed Voyager crossings, qualified directional/particle data
and an explicitly theoretical outer Solar System through a useful, honest spatial
exploration experience, while correcting proven cold-loading work.

**Authority:** owner's November 8 Solar2.6 directive explicitly supersedes the
Solar2.5 expansion stop only for this scope. It grants no prior visual acceptance
or release authority. Verified local/remote start
`66050b5e7f3a9cbcfccbf6258645bd1804051b28`, existing
`recovery/reconcile-20261026`, draft PR107; main
`9a03d8260a529f5858c5c3298cbb9d32b721daeb`.

**Architecture:** a bounded `/beyond` visualization workspace reuses the shared
Three camera, HDR pipeline, resource ownership, time/observer intent and native
renderer handoff. It consumes FastAPI context and immutable observational packs.
It is not a replacement general Solar engine, new simulation clock or concurrent
heavy renderer. React owns controls; Three owns the active spatial visualization.
Observation charts use ordinary canvas/SVG rather than a second WebGL renderer.

**Stack:** existing React/TypeScript/Three0.180/Vite/Vitest/Playwright and
FastAPI/Pydantic/pytest. Acquisition-only scientific readers may be pinned in
ignored tooling environments; no application dependency change is planned.

## Context inventory and reconciliation

Root/frontend/backend AGENTS, CORE_CONTEXT, LIVE_SESSION_BRIEF and
CONTEXT_MANIFEST were refreshed. The existing `solar_reconstruction` pack, loaded
for Solar2.5, remains applicable: canonical SYSTEM_VALIDATION_SPEC,
UNIFIED_UNIVERSE_ARCHITECTURE, ADR0010, cinematic reference/design contract,
adaptive-explorer R1-A reference, owner-acceptance/visual-fidelity evidence,
Solar2–2.5 plans and the listed planetary-system evidence. Canonical validation,
architecture, ADR0010, cinematic design and Solar2.5 plan/handoff were reread for
this task. Unchanged older pack records are reused, not presented as fresh tests.
Exact manifest-selected paths and hashes are recorded in `context.json`.
Only the owner-referenced Solar2.5 science/performance/implementation evidence is
added. No broad docs scan or unrelated task pack.

Older R3-only and Solar2.5 stop text conflicts with the new directive and is
historical for this task. Permanent native-engine, proof, no-fake-data, source
identity and protected-resource rules remain. Root checkout VS Code settings are
unrelated owner state. No merge, production deployment, public tunnel, archive
publication, protected deletion, paid service or account creation.

## Design decisions

Extending the existing Solar scene to treat conceptual boundaries as ordinary
catalog bodies would obscure source classification and expand its camera/source
contracts. A new unrelated renderer would duplicate ownership and precision work.
The bounded shared-foundation workspace keeps observation/model/theory contracts
explicit and returns to the existing Solar, mission and native views.

The entry is **Beyond the Planets** in Solar discovery, with a contextual Voyager
crossing entry in mission exploration. Compact views cover outer Solar context,
Voyager historical comparison, heliosphere explanation, IBEX observations, any
qualified IMAP variable and Oort scale. Existing dark-glass cinematic chrome and
mobile progression apply; no dashboard wall or permanent scientific essay.

Voyager event records distinguish the observed date and approximate published
radius from a predicted source position at representative noon on that date.
No vector is rescaled to fit the published radius. Individual event mode uses
that representative UTC and same-epoch Solar bodies. Comparison mode explicitly
shows two historical snapshots at different dates and does not suggest they are
simultaneous with current Solar bodies or a measured global boundary.

A translucent conceptual heliosphere teaches solar wind, shock, heliosheath,
heliopause and local interstellar medium. It is not a calibrated simulation or
unique empirical shape. Published models are admitted as reproducible geometry
only if coefficients/parameters/rights can be qualified; otherwise their exact
model status stays incomplete and literature is identified separately.

IBEX is an angular flux map with a declared projection, coordinate convention,
energy, interval, units, calibration and missing-cell masks. Its brightness is
data colour, not visible light or distance. IMAP is a bounded historical variable
plot if a published product qualifies; there is no live polling.

The Oort view is a sparse illustrative density/extent, with broad inner
2,000–5,000 AU and outer10,000–100,000 AU ranges. Its points are not catalog objects
and its visual density is not a fitted population. Known comets remain distinct,
with existing source-backed orbit entry only where actually supported.

Scale presets and a logarithmic distance control cover planetary, Voyager and
Oort distances. CPU doubles remain in AU; subtraction precedes GPU float32
uploads, and the shared metre/depth compositor remains authoritative. Camera
travel is visualization motion. Optional camera limits preserve all old defaults.

## Acquisition and runtime budgets declared before transfer

- New source acquisition:128 MiB aggregate;32 MiB per response.
- Observation workstream:96 MiB total (IBEX32, IMAP56, metadata8).
- Physics/reference workstream:32 MiB total.
- Immutable normalized runtime pack:16 MiB; first observation transfer≤2 MiB,
  optional total observational products≤8 MiB. No whole multi-GB archives.
- Added observation textures/buffers:64 MiB maximum; shared source-texture budget
  remains128 MiB. Compositor/driver allocations are measured separately.
- Raw sources stay in an ignored acquisition cache. Versioned runtime packs are
  hash-pinned and mounted read-only. Runtime acquisition/polling and browser
  persistent caches are not added. In-memory data and GPU work belong to one
  active workspace lifetime and are disposed on departure.

## Implementation and ownership

1. **Source qualification:** independent workstreams inspect primary Voyager,
   IBEX/IMAP, Oort and model references. Preserve exact URLs, versions, times,
   units, frames, quality/missing values, rights and original hashes. Observation
   agent owns `scripts/skydata/acquire_solar26_observations.py`, its tests, new
   ignored pack and `OBSERVATIONS.md`. Physics agent owns `SCIENCE.md`.
2. **Backend admission:** physics agent creates `backend/app/{schemas,services,
   routes}/beyond_exploration.py` and focused tests. Context records have strict
   evidence classes and optional geometry; absent source packs produce controlled
   unavailable results. Root registers the router and opt-in read-only mount.
3. **Numeric contracts:** root adds `frontend/src/features/beyond/beyondContracts.ts`
   and `beyondMath.ts`, with tests for unit conversions, separate epochs, rejected
   identities/frames, masks, projection seams/poles, precision and camera ranges.
   Run focused red tests before admission/math implementation.
4. **Visualization:** root adds `BeyondScene.ts`, `BeyondWorkspace.tsx`, observation
   charts and scoped styling. Reuse shared camera/HDR/assets/clock contracts;
   preserve explicit source omissions and one active renderer. Add only bounded
   Solar/mission route-entry/return changes.
5. **Cold stalls:** performance agent profiles the unchanged2.5 private preview
   with CPU/CDP/WebGL timings, then corrects proven synchronous work without
   lowering quality. Owns focused shared preparation changes/tests and
   `PERFORMANCE.md`. Root coordinates builds and exclusive hardware access.
6. **Independent review:** cross-review source/units/projection/rights and obtain
   non-author application/visual review. Independently review shared-performance
   changes. Preserve red receipts and recheck introduced high-priority findings.
7. **Qualification:** focused science/frontend tests, relevant existing mission/
   Solar regressions, types, Docker build/API tests; actual headed Windows Edge/
   RTX3060 desktop1440×900, portrait390×844 and landscape844×390 journeys A–E,
   four real recordings where supported, lifecycle/context recovery and warm/cold
   performance. Inspect rendered images, not only assertions.
8. **Handoff:** source/build/served-byte binding, preservation audit, final exact
   commit/push to existing branch, hosted integrity/Playwright/CodeQL and factual
   PR107 update. Owner acceptance, physical iPhone and corresponding-source
   publication remain separate gates. Stop at the scoped2.6 handoff.

## Initial runtime observations

At task start only the unrelated owner frontend container was running. The prior
private preview had stopped with exit255, without an OOM flag; the stop cause is
not established. The four existing read-only backend containers and existing
preview were started without changing ports/configuration/mounts. Preview and
mission catalog returned200. Baseline inventory preserves157container IDs and
90volume names in `output/playwright/solar-system-2.6/inventory-before.json`.
Do not infer that this was a software crash or alter unrelated owner workloads.
