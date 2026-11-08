# Source, preservation and performance ledger

| Resource | Current authority and scope | Disposition |
|---|---|---|
| Sky renderer | SWE source023e3b26, existing qualified native horizon build | Native WASM/vendor chunks unchanged from PR88. Adapter-only UI/context enhancement. |
| Earth renderer | Owned Cesium1.138.0; God's Eye pinned e7707d9a | No upstream edit or new engine/dependency. Native camera controller preserved. |
| Earth orbital imagery | NASA GIBS Blue Marble static500m; Natural Earth fallback | Existing source credits/cache retained. No live weather or night lights. |
| Earth close imagery | EOX2016 Sentinel-2 cloudless10m; footprint-qualified NAIP | Existing coverage/availability/zoom rules retained. Pixel resolution is a source limit. |
| PEMA | Existing local-only imagery; public rights not confirmed | No published screenshot, expanded source admission or new licensing claim. |
| Place/address search | Existing Photon provider; parsed coordinates independent | Live Paris/Eiffel result proof retained. No invented result/elevation. Availability remains external. |
| Sky catalogs/surveys | Existing data-driven catalog/profile, native Milky Way and DSS | No new star list, false positions or external survey admission. DESI remains parked. |
| Solar context | Existing `/api/sky/object` JPL identity/context | Only source-validated native SSO identity accepted; asynchronous stale results rejected. Native selection/math unchanged. |
| Original concept images | Committed archive and four original PNG manifests | All original bytes verified; unchanged copies in gallery. |
| Planet imagery | Original NASA Earth land/cloud and Mars GLB with original UV mapping | Verified hashes; no model/texture/Solar rendering changes. |
| Pennsylvania scenery | Existing original illustrative native panorama | Byte-identical; not surveyed horizon data. |
| Data/settings/rollback | Existing catalogs/ephemerides/mounts; owner settings checkout | No migrations, ingestion, bulk copying, resets, volume deletion or settings rewrite. New display preference is isolated in `oras.sky.display.v1`. |

`evidence/delivery.json` verifies source versus marker, complete served payloads,
repeat builds and protected tracked paths against PR88. Sky artifact:
`7170519bb7adb72195ce0081f52d224f5c01a6165ef67166258c66a89d3fcf8c`.
Earth artifact remains E1
`bba92a4790578f33fe2cb128c9aa6d13a9578574eddd5c147cff4162d7b36e97`.
Sky111, Hub136 and Earth514 served files match local bytes. Sky110 UI files and
Hub136 payload files match repeated builds. 108 common Sky application files are
unchanged from PR88; changed native UI app/index/identity files are enumerated.
Marker fields comparing native WASM to the pristine upstream anchor still reflect
the historical accepted horizon patch, not a native change in this package.

The owner primary checkout still has its pre-existing `.vscode/settings.json`
change. Task previews use readonly data/application mounts. This is preservation
of operations/source identities, **not** a fresh byte-for-byte database/volume
snapshot or proof of zero background writes by existing unrelated services.
No rollback artifact was regenerated or removed.

## Actual performance evidence

All automated GPU observations here use Chromium **SwiftShader**, not a physical
GPU. No owner Earth hardware benchmark was available. Solar retains the owner's
positive visual feedback and satisfactory responsiveness; this is not release
acceptance or a transferable Earth/Sky performance claim.

E1 measured12 intervals from a synthetic native keyboard event through **two RAFs**,
not frames per second: desktop approximately289–1545ms; portrait129–283ms;
short105–272ms. These observations demonstrate severe software-renderer costs,
not a quantified improvement. Browser heap observations were about37–42MB for
that sampled frame; they are not total GPU/process memory or a leak verdict.

Fresh I1 Sky sampled30 consecutive RAF gaps after actual input: desktop median75ms,
p95~133.4ms; portrait median~33.4ms,p95~100.1ms. GPU string explicitly reports
SwiftShader. Samples are short, software-specific and not comparable hardware
benchmarks. Native reported FPS and heap are retained in `evidence/integration.json`.

Actual iframe detach/canvas cleanup is checked during mode transitions. Disposed
native-context watchers invalidate late API results; focused unit cases cover
selection/time/disposal races. The package does not claim the browser releases
all GPU memory synchronously. Tile readiness/coverage/requests are recorded in
Earth diagnostics; unavailable source detail cannot be fixed by display contrast.
