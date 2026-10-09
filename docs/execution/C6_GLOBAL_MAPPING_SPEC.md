# C6 — Google-Earth-Class Global Mapping

**APPROVED PRODUCT DIRECTION — PROPOSED STAGES; NO PROVIDER-SPECIFIC IMPLEMENTATION AUTHORIZED.**
Date: 2026-10-08. C5.6.75 is documentation only; C5.7 approval/recovery comes first.
This title describes intended user experience, not entitlement to Google Earth
imagery or uniform aerial-scale resolution around the planet.

Read [Earth plan](EARTH_CAPABILITY_PLAN.md), [audit](../audits/GODS_EYE_CAPABILITY_IMPLEMENTATION_RECONCILIATION_2026-10-05.md),
[provider forensics](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md),
[ADR0009](../architecture/decisions/0009-owned-earth-feature-reuse.md) and
[OD5/OD6 decisions](C5_7_EARTH_CORE_RECOVERY_SPEC.md#owner-decision-register).
Current bounded CONUS HD/coarse global fallback is qualified historical C5.5;
terrain remains ellipsoid. Optional ion terrain/buildings/photo branches are
dormant, not proof of active global terrain/3D.

## Scope and ordered proposed stages

| Stage | Input / reuse candidate | Required evidence and stop gate |
| --- | --- | --- |
| C6-0 provider qualification | Public MapSourceController, createDefaultMapSources, imagery/terrain construction, createTerrainHeights and photoreal helpers; no pin update | For each candidate name exact service/product, allowed geography/source dates/resolution/datum, credits, credential exposure, account/fees/spend caps, quotas/cache/redistribution/privacy terms, CORS/proxy/abuse boundaries and fallback. Owner approves selected set before keys, paid calls or code; UNKNOWN rights stay BLOCKED. |
| C6-1 global imagery | Wrap source/map switching and bounded request/cache/cancel/credits; retain C5.5 imagery where applicable | Coverage map and source-resolution disclosure; representative multi-continent/latitude/coast/ocean/off-coverage zoom comparison with source dates, no fabricated detail, provider failure/missing tile/auth fallback. Global satellite overview does not imply aerial HD everywhere. |
| C6-2 terrain and heights | createWorldTerrain/createKeylessTerrain; createTerrainHeights/groundFloor and datum-aware service | Real terrain source/body/datum/units; numeric samples against known references with agreed tolerance; missing/geoid-only quality labelled; camera/models anchored without inventing ground. Batch/cache/abort/resource/device budgets. |
| C6-3 buildings/photoreal | loadPhotorealisticTileset, map/tileset generations, mesh floor sampler; standard Cesium approved buildings where appropriate | Per-asset entitlement and tile credits; supported-region/LOD evidence, mesh-versus-terrain mode/grounding, token renewal and failure handling, memory/GPU/frame/request limits. Pin has no dedicated OSM-buildings factory; do not invent one. |
| C6-4 realistic presentation | Map labels/place chain and bounded atmosphere/display helpers | Earth place identity/location/provider facts; Google/Photon/Nominatim policies where selected; accurate source/time/resolution display and accessible credits. Cosmetic styling is not astronomy sensing. Physical device/Apple compatibility explicitly qualified. |
| C6-5 integrated acceptance | Owned Viewer/lifecycle, bridge/state, selected licensed source set | Final head/input/artifact/rollback verification, desktop/mobile and genuine bfcache, imagery/terrain/3D mode switches and≥5Sky/Earth cycles, truthful failures, budgeted resource cleanup; no regressions to science/selection/count contracts. Owner acceptance before release claim. |

## Provider and code boundaries

Prefer wrapped qualified feature-level modules; no full app/Viewer singleton.
Keep pinned `e7707d9a0f34d9fbffc300023c319f95caa5be30` unless a separate upstream-update task is authorized.
Current snapshot Google token helper can renew once on401/403, but its1.5GBcache+
1GBoverflow defaults must not be copied without approved device budgets. Google/
ion proprietary imagery/content terms, billing and credits remain distinct from
code license and token lifetime. Esri keyless response is not production entitlement;
ReEarth terrain attribution/datum/quality requires selected dataset terms. OSM
public tile/Nominatim usage policy is not an unlimited/offline service license.

FastAPI stays canonical. Use browser direct only when selected credentials/CORS/
privacy/quotas permit; bounded proxy/cache when justified. Same-origin is not a
security boundary. Shared polling and source-aware stale fallback prevent spend/
service fan-out; no feed/tile bulk mirror or distribution without permission.

## Proposed acceptance and exclusions

Before C6 code, owner freezes provider/geographic/detail expectations, test target
set, numerical accuracy tolerances, maximum spend, request/memory/GPU/frame budgets
and desktop/mobile/device list. Passing HTTP alone is not useful visual proof.
Source/service qualification precedes acquisition; no keys/accounts/purchases now.
Every visual mode requires source dates/coverage/credit/fallback and owned teardown.
Rebuilt Earth inputs require pinned artifact build and installed/served verification;
unchanged Sky receives regression proof without an unnecessary rebuild.

No Mars/Moon/body relabeling, scientific observing overlays, uniform live imagery,
paid voice or global weather expansion is authorized. Astronomy-aware background,
eclipse/aurora/horizon/seeing layers remain F with validated science/source contracts.
Actual body surfaces require E; solar-system scale requires H. No production/SSH/
Cloudflare/oras.org work before an owner-declared Release Candidate and separate
deployment approval. C6 direction is not provider-specific authorization.
