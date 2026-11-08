# PR71 reuse assessment — source/evidence read only, 2026-10-17

PR71 is OPEN on `c6-1a-global-imagery-adoption-1` at
`35dcc94c1ecc1bdd87118d6dddb8b76fb81bbe9e`, base main. No merge, close,
cherry-pick, asset change or rollback change is performed by R2-A.

## Source inspection and bounded reuse

| Inspected paths at PR71 head | Reuse decision / integration needed |
| --- | --- |
| core/ImageryController.mjs, imageryRequests.mjs | Reuse native dispatch and upstream MapSourceController integration in the next imagery package. Latest camera/source choice and healthy provider reuse are valuable. Integrate with current N1 camera/navigation/lifecycle; do not replace CameraController, RuntimeBridge or entry wholesale. Current R2-A keeps the existing qualified Earth artifact. |
| core/imageryCachePolicy.mjs, imageryCacheStore.mjs, imageryCacheWorker.mjs | Reusable owned CacheStorage policy/store/worker with exact URL/provider/edition keys, cache-header eligibility, bounded quota, integrity/image checks and generation-guarded writes/clear. Admission is per source; reuse is not blanket imagery licensing permission. Preserve the reviewed stale-index eviction correction. |
| core/AdmittedMapSources.mjs, ImagerySelectionPolicy.mjs, imagerySession.mjs, displayConfig.mjs | Reuse automatic selection/fallback/source facts and disabled-by-default ion safeguards, subject to provider rights/coverage. Keep EOX2016 explicitly dated, NAIP footprint/no-data handling, verified-ORAS PEMA scope and Natural Earth safety base. No new paid source is activated here. |
| core/ViewerController.mjs | Reuse public native tile-progress/request-render observation after a narrow merge with the current qualified owned Viewer. Preserve N1 input ownership, accepted gain/animation and disposal. No custom render loop or renderer replacement. |
| entry.mjs, vite.config.mjs, scripts/runtime/record_owned_earth.py, earth_artifact.py | Worker registration/build/metadata require deliberate integration and a fresh independently built Earth artifact. PR71's entry lacks current N1 navigation diagnostics and tracking-preserving persisted departure; copying it would regress accepted behavior. |
| packages/imagery-cache/client.mjs + declarations; frontend ImageryCacheSection.tsx, DiagnosticsSurface.tsx, WorkspaceShell.tsx | Reuse cache status/confirmed owned clear via the existing Sources & display quality surface. Adapt composition to accepted Adaptive Explorer desktop/mobile chrome and current licensing/search/history state. Browser HTTP cache remains separate and cannot be selectively cleared by this control. |
| tests/earth/*imagery*, viewer-imagery-progress, admitted-map-sources; frontend e2e earthImageryCache/earthGlobalImagery | Reuse regression cases and source-bound fixtures as tests during integration. Old passing counts/timings remain historical until applicable changed inputs are requalified. |

Paths under core/ above are relative to runtimes/earth-runtime/. Source hashes for
inspected modules/evidence are retained in pr71-inspection.json. No new runtime
imagery/cache implementation is included in this R2-A search deliverable.

## Existing evidence and its limits

Read the PR description and `docs/validation/EARTH_HD_MAPPING_EVIDENCE.md` at PR71's
exact head, especially “C6-1A native imagery dispatch and persistent cache” and its
review follow-up. The review head records105 Docker Earth tests and16 installed
browser/cache cases. The artifact is
`7a8e04f6a6333ab30e892c4b70dba60e0f6ad6fd5810a72409a668b25ac09a23`, source-input
`715b72e2929824730af2d02e5a8053e88003fe3d97a5f183e2da6097d87e0643`, with44 inputs
and513 payload files. Two independent builds matched. Cache byte reuse across
reload/actual browser restart, corrupt-entry refetch, owned clear/cancel and
unrelated saved-work preservation were qualified there, not rerun by R2-A.

The36 matched performance observations belong to earlier measured artifact
`968d211328c14dac2b69fb0d302d8f70607de8d7a060ae8bcd5841631f99e4f0` at head
`9704054c…`, not the later35dcc94c review follow-up. ORAS warm/restart settlement
was about8.22s in that software-rendered comparison; this is not owner hardware
speed acceptance. NYC NAIP did not fully settle within30s; some visits used EOX
fallback/partial detail. EOX2016 is a dated10m mosaic, not current aerial photography.

## Remaining imagery/cache work and blockers

- Integrate source selection/native dispatch/cache without overwriting current
  N1 camera, navigation snapshots, bridge, tracking or renderer lifecycle.
- Refresh source policy/attribution/availability at integration time. PEMA public
  release/redistribution rights remain unresolved beyond the qualified ORAS scope.
  Optional ion eligibility and zero-charge protection remain unapproved; no credentials
  or provider is enabled by this assessment. No terrain/buildings expansion.
- Rebuild/attest independent artifacts and served bytes; requalify source fallback,
  cache reload/restart/clear, no-store/private/token exclusions and search/Sky return.
- Qualify owner hardware, speed and visible close-up detail separately. Historical
  software-browser proof is not physical-device acceptance or a provider SLA.

R2-A does not expose PR71's sources or claim its cache is active. Its preview
continues to report the existing artifact's actual imagery/terrain state.
