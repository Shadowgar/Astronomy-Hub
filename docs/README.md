# Astronomy Hub

Astronomy Hub combines astronomy decisions and independent Sky/Earth exploration.
The Hub owns product intent, shell and integration state; SWE owns Sky math,
rendering, native camera and selection. The independently built Earth runtime owns
its Cesium Viewer and bounded adapters. Prefer qualified reuse/wrapping of pinned
God's Eye feature implementations, with documented justification for Hub-specific
science/security/provider paths. Never import the upstream application or Viewer.

## Current foundation and boundaries

C0–C5.6 are completed bounded checkpoints; PRs #63–#65 are merged. Sky remains at
`/oras-sky-engine/`, standalone and mounted in the `/sky-engine` workspace alongside
`/earth-runtime/`. `/` opens the Sky workspace; `/earth` opens Earth.
Observe and Tonight remain focused routes. The versioned bridge,
small product state and serial active-renderer lifecycle are implemented locally.
See [PROJECT_STATE](execution/PROJECT_STATE.md),
[Feature Tracker](features/FEATURE_TRACKER.md) and
[Unified Universe Architecture](architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md).

Completion does not mean full God's Eye parity: aircraft source returned HTTP 503 in the
dated audit and altitude gates hide home-view glyphs; satellites intentionally use
stations only; Weather qualified one modeled point, not a weather map; CONUS radar
is a separate timestamped snapshot. HD imagery is regional, terrain/3D are dormant,
and the dated audit predates C5.7-D’s restored standard Cesium skybox. Local
WSL/Docker qualification is not
production readiness. No owner Release Candidate or deployment is declared.

## Planning and review checkpoint

C5.6.5 audit evidence is preserved. C5.6.75 is historical and superseded by merged
PR #68; PR #69 is merged at `0a231b24d208dc250214c737277a50dcc73d4e70`.
[Earth capability plan](execution/EARTH_CAPABILITY_PLAN.md),
[C5.7 proposed packages and Owner Decision Register](execution/C5_7_EARTH_CORE_RECOVERY_SPEC.md),
[C6 provider-first proposal](execution/C6_GLOBAL_MAPPING_SPEC.md),
[ADR0009 reuse decision](architecture/decisions/0009-owned-earth-feature-reuse.md),
[audit matrix](audits/GODS_EYE_CAPABILITY_IMPLEMENTATION_RECONCILIATION_2026-10-05.md),
[divergence evidence](audits/GODS_EYE_IMPLEMENTATION_DIVERGENCE_2026-10-05.md) and
[reconciliation validation](validation/C5_6_75_DOCUMENTATION_RECONCILIATION_EVIDENCE.md).

The approved order is C5.7-D → C6-0/C6-1 → C6-2 → C6-3 → C6-4/C6-5 →
preserved PR #67 → separately authorized satellites and Weather. The owner accepted
C5.7-D's appearance from space. PR #70 is merged; C6-1A imagery-only local
implementation/qualification is now separately authorized. Its merge and all
later packages remain unapproved. PEMA/ion eligibility is assumed for local
development only; $0 spending and ion account-side protection remain mandatory.
Close-up imagery deficiencies belong to C6. The roadmap activates no later package;
outstanding C5.7 gates remain open.
PR #71 owner correction requires automatic best-available imagery and bounded
stationary coverage/recovery, with read-only source status and credits; no consumer
provider selection or source Retry. Only the named C6-1A provider scope is active;
public-release eligibility and owner acceptance remain open. The next proposed
task is [C6-1A imagery integration](execution/C6_GLOBAL_MAPPING_SPEC.md#active-c6-1a-imagery-package--2026-10-11)
through the existing pinned God's Eye exports. Stop for owner visual review.
D ISS, E body-aware Mars/surfaces, F astronomy
extensions (including `oras_horizon.v1`), G immersive UX and H solar-system scale
remain planned. No feature work begins from these documents.

## Context and authority

Load [CORE_CONTEXT](context/CORE_CONTEXT.md) and
[LIVE_SESSION_BRIEF](context/LIVE_SESSION_BRIEF.md), then the matching
[CONTEXT_MANIFEST](context/CONTEXT_MANIFEST.yaml) pack. Declare all loaded documents;
do not scan the full docs tree. [DOCUMENT_INDEX](DOCUMENT_INDEX.md) separates
execution control, architecture, evidence and product reference.
`execution/MASTER_PLAN.md` is product reference only. Runtime completion follows
[SYSTEM_VALIDATION_SPEC](validation/SYSTEM_VALIDATION_SPEC.md) and Docker/browser
proof; documentation references alone establish no fresh feature qualification.

```text
Scope → Engine → Filter → Scene → Object → Detail → Assets
Ingestion → Normalization → Storage → Cache → API → Client Rendering
```
