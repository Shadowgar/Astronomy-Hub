# MASTER PLAN - PRODUCT REFERENCE

## Purpose

This document defines the product direction that current and future execution
must align with.

It does not authorize implementation by itself. Current execution is controlled
by:

- `docs/context/LIVE_SESSION_BRIEF.md`
- `docs/execution/PROJECT_STATE.md`
- the active task prompt

If this file conflicts with those execution authorities, report the conflict and
follow the higher authority.

## Approved roadmap reference

PR #69 is in documentation finalization after owner acceptance of appearance from
space; STOP for final owner merge approval. Close-up imagery deficiencies belong
to C6. The next proposed step is free global mapping qualification and separately
authorized integration through existing God's Eye code; see the C6 plan. This
reference activates no later package and does not close unfinished C5.7 gates.

Owner approved the visual-first order on 2026-10-10: **C5.7-D → C6-0/C6-1 → C6-2 → C6-3 → C6-4/C6-5 → preserved C5.7-A/PR #67 review → separately approved satellites and Weather**.
Only **C5.7-D** is active: standard bundled Cesium stars, atmosphere and appearance
within the Hub-owned Viewer. Matching local-browser visual proof precedes heavy
qualification. C6 imagery/terrain/3D implementation is NOT AUTHORIZED; each later
package requires separate approval. Outstanding C5.7 acceptance, physical-device,
provider, science and integrated qualification gates remain open.

Provider spending is mandatory **$0**. No accounts, tokens, billing or subscriptions.
Cesium ion Community is conditional until written club/public-use eligibility and
zero-charge protection are established; it is not an approved provider. Reuse
qualified God's Eye/Cesium functionality rather than rebuilding it. No new assets,
dependencies, pin updates, full upstream Viewer factory or scientific star catalog.
PR #67 stays open and unmerged; no production/SSH/Cloudflare deployment.

[PROJECT_STATE](execution/PROJECT_STATE.md) controls activation; this remains a
product reference, not execution authority.

## Product Model

Astronomy Hub is a unified astronomy, Earth, and planetary exploration workspace
with astronomy intelligence. The detailed approved direction is
[Unified Universe Architecture](architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md).
Current foundation: PR #52 shell, Observe, Tonight and SWE. God's Eye Earth,
Cesium Planet Mode, universal state and handoffs are planned. Phase B selected
external pinned source/independent builds, same-origin disposable frames, a
versioned Hub bridge and active-only heavy-renderer lifetime. Exact bridge/API,
runtime qualification and solar-system-scale renderer remain open. The observing
capability reference below does not select renderers or define the next task.

Primary question:

```text
What is above me right now, and what should I observe?
```

Core user flow:

```text
Hub -> Engine -> Scene -> Object -> Detail -> Exploration
```

Current system model:

```text
Scope -> Engine -> Filter -> Scene -> Object -> Detail -> Assets
```

Data model:

```text
Ingestion -> Normalization -> Storage -> Cache -> API -> Client Rendering
```

## Current Runtime Direction

The active public sky runtime is:

```text
/oras-sky-engine/
```

`/oras-sky-engine/` is the ORAS-hosted Stellarium Web / Stellarium Web Engine
runtime.

`/sky-engine` is the current Hub host for this contained runtime. The old
BabylonJS sky target is not the active runtime direction.

The ORAS Sky Engine is isolated and owns:

- scene rendering
- object selection
- camera behavior
- survey imagery behavior
- runtime data loading
- Stellarium runtime math and thresholds

The Hub does not own ORAS Sky Engine rendering.

## Command Center / Hub

The Hub is the decision layer.

It should eventually answer:

- what is above the user right now
- what is visible
- what matters most
- why it matters
- where to open the object in the correct engine

The Hub should output small, curated, source-backed object lists.

It must not become:

- a raw catalog dump
- a full scene renderer
- a duplicate Sky Engine runtime
- a place where astronomy data is faked

## ORAS Sky Engine

The ORAS Sky Engine provides the primary visual sky experience at
`/oras-sky-engine/`.

Product goals:

- more stars through scalable catalog ingestion
- richer DSO coverage through normalized catalogs
- exact links for stars, DSOs, planets, satellites, and future object classes
- reliable camera centering on linked objects
- higher-definition survey imagery where validated
- DSS fallback for broad compatibility
- meaningful detail panels
- runtime behavior equivalent to Stellarium where applicable

Implementation must remain source-backed and validation-driven.

## Above Me API

`/api/above-me` is the backend discovery contract for future Hub and WordPress
surfaces.

It should return curated objects with stable Sky Engine links.

Required identity direction:

- `catalog`
- `source_id`
- `model`
- `ra`
- `dec`
- `sky_engine_url`

Rules:

- `catalog + source_id + model` are authoritative
- slug/display name is cosmetic
- large IDs remain strings
- coordinates and visibility must not be fabricated

## Future WordPress / ORAS Shortcode

WordPress/ORAS shortcode work is deferred until explicitly approved.

Expected future path:

```text
WordPress page or shortcode
-> /api/above-me
-> curated cards/list
-> object click
-> /oras-sky-engine/ exact link
```

Do not build this until the user explicitly starts that lane.

## High-Definition Data and Imagery

High-definition data and imagery remain a future active lane.

Directions:

- Gaia DR3/EDR3-style tiled or indexed star data
- richer OpenNGC/Caldwell/other DSO data where license-compatible
- DSO thumbnail/media manifests
- validated satellite freshness and propagation
- validated high-definition survey providers
- smart fallback to DSS

Constraints:

- do not scrape TheSkyLive
- do not scrape Stellarium-Web
- do not copy Stellarium CDN data
- do not promote DESI without explicit approval
- do not bake huge skydata into Docker
- do not fake coverage or completeness

Credits-update work is not part of this lane unless explicitly requested.

## Feature Domains

Reference domains:

- Hub / Command Center
- ORAS Sky Engine
- Above Me discovery
- conditions intelligence
- satellite intelligence
- flight awareness
- solar-system context
- deep-sky targeting
- solar activity
- events and alerts
- object detail system
- news and knowledge
- asset and data reliability
- performance and stability

These define product scope, not build order.

## Completion Rule

A feature is complete only if:

- it works in runtime
- behavior is correct
- results are meaningful
- data is source-backed
- output supports user decisions
- validation is proven

## Final Principle

The Master Plan defines product direction.

Execution documents decide what is built now.
