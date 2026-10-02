# Astronomy Hub

Astronomy Hub is a unified, continuously navigable astronomy, Earth, and
planetary exploration workspace. Its astronomy intelligence answers what is
above an observer and what deserves attention, within a broader exploration
product.

## Current foundation

Merged PR #52 provides one public ORAS shell: Home `/`, Observe `/observe`,
Tonight `/tonight`, and Sky host `/sky-engine`. The contained Stellarium Web
runtime at `/oras-sky-engine/` owns sky rendering and remains available standalone.
Existing satellite identity, TLE release/freshness/provenance and local propagation
work remains valid. Qualified satellite passes are still future work.

Historical qualification and known gaps are in
[PROJECT_STATE](execution/PROJECT_STATE.md) and
[FEATURE_TRACKER](features/FEATURE_TRACKER.md). This documentation checkpoint
claims no fresh runtime qualification.

## Approved direction and open choices

[Unified Universe Architecture](architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md)
is the detailed architecture reference, with eight concise ADRs. The planned
flagship is a full-viewport, sky-centered workspace with contextual controls.
Observe and Tonight stay independent routes and later gain workspace drawers.
Home/Sky may converge conceptually; no routes change in this checkpoint.

The future Hub owns small universal product state and cross-engine intent. SWE
owns Sky rendering; complete applicable God's Eye View owns the planned Earth
runtime; body-aware Cesium is the planned planetary surface direction.
Astronomy Earth additions are external additive layers. Upstream source is
immutable by default and remains pinned, qualified and upgradeable. Source-code
licensing never automatically licenses third-party data, visual assets or providers.

God's Eye integration, planetary surfaces, universal state and renderer handoffs
are not implemented. The [Phase B study](studies/GODS_EYE_SWE_COMPATIBILITY_STUDY.md)
selects external pinned sources, independent full-app builds, same-origin frames,
a versioned capability bridge and active-only renderer lifetime. Exact APIs,
browser/provider qualification and solar-system-scale rendering remain open.

## Context and execution

Start with [CORE_CONTEXT](context/CORE_CONTEXT.md) and
[LIVE_SESSION_BRIEF](context/LIVE_SESSION_BRIEF.md), then load the matching pack
from [CONTEXT_MANIFEST](context/CONTEXT_MANIFEST.yaml).
[DOCUMENT_INDEX](DOCUMENT_INDEX.md) defines document authority;
[SYSTEM_VALIDATION_SPEC](validation/SYSTEM_VALIDATION_SPEC.md) defines proof.
Do not load the full docs tree or use archive phase instructions as current work.

Preserve both models:

```text
Scope → Engine → Filter → Scene → Object → Detail → Assets
Ingestion → Normalization → Storage → Cache → API → Client Rendering
```

The active task is the docs-only Phase B compatibility study. Its next recommended
task is the bounded Phase C skeleton in study section 29. The approved sequence is
architecture → study → runtime skeleton → ISS slice → Mars proof → astronomy
extensions, including the still-important `oras_horizon.v1`. Horizon is not next.
Each implementation task requires separate bounded authorization and appropriate
Docker/browser/source proof. No runtime implementation or merge in this checkpoint.
