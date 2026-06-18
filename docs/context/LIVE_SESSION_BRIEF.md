# LIVE SESSION BRIEF

## Purpose

This document defines the current active execution state for Astronomy Hub.

It is always loaded with `docs/context/CORE_CONTEXT.md`.

If this document conflicts with older execution, phase, tracker, or vision
documents, this document wins for current work unless
`docs/validation/SYSTEM_VALIDATION_SPEC.md`, `AGENTS.md`, or an explicitly
activated override mode says otherwise.

## Current Execution Status

Astronomy Hub is in an ORAS Sky Engine modernization and high-definition data
cycle.

The active public sky runtime is:

```text
/oras-sky-engine/
```

This is the ORAS-hosted Stellarium Web / Stellarium Web Engine runtime.

The current active work is not the old `/sky-engine` BabylonJS lane.

The current active work is not a full Hub homepage build.

Current focus:

- preserve and improve the contained Stellarium runtime
- expand source-backed astronomy data
- improve object discovery through `/api/above-me`
- improve exact-link behavior into `/oras-sky-engine/`
- improve survey imagery and visual parity
- keep WordPress/ORAS shortcode integration deferred until explicitly started

## Current Product Definition

The active product direction is:

- a source-backed astronomy intelligence layer
- a contained ORAS Sky Engine runtime at `/oras-sky-engine/`
- stable object links that open the Sky Engine centered on the correct object
- curated Above Me object discovery through `/api/above-me`
- future WordPress/ORAS display consuming `/api/above-me`

Primary user-facing flow:

```text
user asks what is above me
-> backend computes and ranks visible objects
-> UI or WordPress page renders curated cards/list
-> user clicks object
-> /oras-sky-engine/ opens centered on that object
```

The front-page Hub route `/` is not the current implementation target unless
explicitly approved.

## Active Execution Surface

Active runtime surface:

- `/oras-sky-engine/`

Supporting API surfaces:

- `/api/sky/object`
- `/api/above-me`

Supporting runtime paths:

- `vendor/stellarium-web-engine/apps/web-frontend`
- `vendor/stellarium-web-engine/src`
- `frontend/public/oras-sky-engine`

Supporting backend paths:

- `backend/app/routes`
- `backend/app/services`
- `backend/app/data/sky`
- `backend/tests`

Supporting validation paths:

- `scripts/skydata/validate_oras_deep_links.js`
- `frontend/tests`
- backend tests

## Explicit Stale Assumption Corrections

These assumptions are stale and must not drive current work:

- active surface is `/sky-engine`
- Sky Engine is BabylonJS
- current goal is a BabylonJS port
- Hub homepage `/` is the active implementation target
- the Sky Engine should become a shared Hub renderer
- production objects should be hand-registered
- visual parity should be blocked by stale phase documents

Correct current assumptions:

- active surface is `/oras-sky-engine/`
- runtime is contained Stellarium Web / Stellarium Web Engine
- Hub is API/decision layer
- Sky Engine owns its own scene/rendering/runtime behavior
- data must be source-backed and scalable
- Docker/runtime validation is authoritative for runtime-sensitive claims
- browser/runtime validation must prove visual behavior when claimed

## Active Boundaries

### Hub

Allowed:

- decision layer
- object filtering/ranking
- curated output
- stable engine links
- API consumption

Not allowed:

- raw rendering ownership
- full scene rendering
- raw object flood
- fake visibility
- duplicate Sky Engine calculations

### ORAS Sky Engine

Allowed:

- own contained Stellarium runtime
- own rendering and scene lifecycle
- own selection/camera behavior
- own visual math and thresholds
- consume defined observer/time/location/config/object inputs

Not allowed:

- become BabylonJS
- become a shared Hub renderer
- depend on Hub internals for rendering
- accept fake coordinates or fake visibility

### Backend / API

Allowed:

- normalize data
- provide `/api/sky/object`
- provide `/api/above-me`
- generate stable Sky Engine URLs
- compute validated visibility/ranking where implemented

Not allowed:

- fake coordinates
- fake visibility
- fake object availability
- hand-register production catalogs as a substitute for scalable data

## Active Work Lanes

Current allowed lanes:

- ORAS Sky Engine runtime stability
- exact-link correctness
- source-backed `/api/above-me` data expansion
- high-definition data and survey imagery evaluation
- runtime/browser validation

Current deferred lanes:

- WordPress shortcode/page
- Hub homepage UI
- credits-update work
- DESI promotion
- TheSkyLive scraping
- broad OpenNGC/Pan-STARRS UI expansion unless explicitly approved

## Current Validation Rule

Runtime-sensitive claims require Docker/runtime evidence.

For Sky Engine changes, expected proof can include:

- running Docker services
- API responses
- frontend/backend tests
- `npm run validate:oras-deep-links`
- browser screenshots or Playwright validation

Do not mark behavior complete from panel text alone when camera/object centering
or visual behavior is part of the claim.

## Final Rule

Current work must align future Hub/WordPress linking around source-backed
objects and stable `/oras-sky-engine/` URLs, without starting that UI work until
explicitly approved.
