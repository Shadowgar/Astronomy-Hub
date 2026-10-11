# C6 — Google-Earth-Class Global Mapping

## Active C6-1A imagery package — 2026-10-11

PR #70 merged at `3e8276b705143b03af2c71658e8bc513d39b8e94` after exact-head
`5f7748cbccc8473c371d710b466b0c1395f6ae01` passed all eight checks and all three
review threads were resolved. The owner separately authorizes imagery-only local
implementation/qualification, commit/push and one implementation PR. **Do not
merge that PR. Stop for owner actual-mapping visual review.** No C6-2 terrain,
C6-3 geometry, deployment, account/token creation or charges are authorized.

The owner explicitly assumes nonprofit PEMA/PASDA and ion Community eligibility
for **local development**. Missing written eligibility does not block this named
implementation. This establishes neither public-release permission nor financial
authority. Mandatory new provider spending is **$0**. Ion remains opt-in only:
existing publishable attested token, selected asset, separately attested reliable
account-side zero-charge protection and explicit session tile cap (1–120) are all
required. A token alone never enables it; default config is keyless. No live ion
qualification is claimed without that account arrangement. Browser tile limits
cannot guarantee global capacity, aggregate quota compliance or zero charges.

### Implemented ownership and source seams

Reuse the PR #68 adoption blueprint's immutable pin and actual public exports:
`maps/controller`, `maps/defaults`, `maps/catalog`, `maps/imagery`. The filtered
OSM descriptor/factory comes from `createDefaultMapSources` with empty credentials;
terrain/setup/tileset entries are stripped. NASA/EOX/NAIP/PEMA use native Cesium
WMS/UrlTemplate factories. Optional ion invokes the actual pinned
`createIonImagery` only through the admitted opt-in path. Registry and credit
modules execute transitively inside the public map controller. The unexported UI
module is not imported; Hub DOM controls adapt public setStack/subscribe/getState.
Upstream source/pin is unchanged; no complete application or second Viewer.
The capped OSM/ion SDK facade accepts Cesium 1.138 layer-owned reload callback
installation/removal on the facade itself. It does not write provider internals
or upstream controller fields; real SDK/browser regression proves this lifecycle.

Exactly one Hub-owned Natural Earth provider/layer is allocated per Viewer.
Managed registry IDs: `nasa`, `eox-2016`, `usgs-naip`, `pema`, `osm`, plus optional
admitted `ion`. `local` is exclusively the Hub terminal state, never a managed
factory. `defaultId=unknownId=nasa`, `recoveryId=null`. At most one managed remote
layer is raised above the safety base; optional labels are independently owned
above imagery and below independent event layers. No removeAll/private-field
writes. Natural Earth remains unchanged through local/failure/recovery.

Fallback: PEMA → NAIP → EOX 2016 → NASA → existing local safety base; OSM/ion →
NASA. Coverage admission can skip NAIP/EOX when ineligible. Local or total remote
failure invalidates wrapper callbacks, removes owned guards/listeners/labels and
calls public controller.destroy once. Later eligible recovery creates only a new
map controller. Normal switching and successful cached-provider tile retries keep
healthy caches. Rejected factory promises are evicted by upstream; normal eligible
retries keep the controller. A **successfully cached construction fallback** needs
an explicit exceptional controller recreation after cooldown to retry the original
factory, since the pin has no public single-entry eviction. This loses remote
caches and causes bounded refetch, never another local provider. Cancellation
errors emitted by a paused old SDK provider cannot tear down a replacement.

### Admission, imagery truth and bounds

Auto starts from the approved 1.5/2 Mm NASA/EOX and 150/250 km NAIP hysteresis;
PEMA close-view entry/exit is 20/30 km but requires the entire view inside its
verified ORAS interior rectangle. Manual mode persists in browser-tab session storage through Earth/Sky recreation
until Auto; coverage can
substitute fallback without replacing the user's choice. Ion/OSM are never Auto
dependencies. Manual PEMA outside its admitted coverage follows NAIP/global.

PEMA coverage is bounded to an interior rectangle of raster `43001460PAN`,
OBJECTID6697: −79.6009/41.3051/−79.5654/41.3319. One ordinary selected-service
geometry request on 2026-10-11 qualified all four corners; the small response is
retained in `tests/fixtures/earth/pema-oras-footprint.json`. This is integration
coverage evidence, not another provider research/audit or statewide permission.
The response SHA256 was `a5520292bbbefffdce23b1d3f3da247051fe596901d1dd50d28f67fcd5113148`;
URL: `https://maps.pasda.psu.edu/ArcGIS/rest/services/PEMAImagery2021_2023cache/MapServer/2/query?f=json&where=OBJECTID%3D6697&outFields=OBJECTID%2CName%2CLowPS&returnGeometry=true&outSR=4326`.
At ORAS, PEMA tile year2022/native0.1524003m and prior NAIP matched-image
2022-06-23/native0.6m are carried forward; no new flight-day inference. Elsewhere
NAIP dates/GSD remain unknown. EOX is explicitly the 2016/nominal10m mosaic;
NASA is a static nominal500m composite, not current photography.

NAIP Auto requires a footprint containing the whole view; its prior ORAS polygon
is seeded from existing evidence. Other settled CONUS close views may make one
bounded point query/minute (20s,1MiB), at most32 active-runtime records; failures keep
global imagery. No regional request outside geographic admission. NAIP WMS uses
1.3.0/EPSG:3857/transparent PNG; low-level transparent overview tiles are expected
and retain the safety base. Fully transparent close tiles (L12+) trigger no-data
fallback; partially transparent close tiles are marked partial. No claim of global
or uniformly aerial HD. PEMA missing/error tiles fall back. Native min/max levels:
NASA0/8, EOX0/14, NAIP3/18, PEMA13/20, public OSM facade cap18, optional ion facade
cap18, optional EOX labels cap12/defaultOFF. These caps do not manufacture GSD.

Shared remote bounds remain ≤6/runtime, ≤4/host including EOX+labels, ≤2 NAIP
(and PEMA/ion), ≤2 starts/sec with burst6,12s tile timeout,20s factory timeout.
When ion is active the global bound tightens to4 because its tile hosts are opaque.
401/403 stop the host for the active-runtime session; no unauthorized retry.429 stops the whole
host until explicit retry after max(5min,Retry-After); other failures have≥60s
source cooldown plus a latched circuit breaker: elapsed time/camera movement
never retries a failed source; the explicit Retry action reopens the eligible
selected source. Even a cached fallback provider cannot dispatch while latched.
Guards pause reversibly on switching and stop at owned teardown. Ion accepted-tile
usage also survives renderer recreation in the same tab; unavailable/failed session
storage disables ion. This ledger is not an account quota or billing guarantee.
No prefetch, mirror, offline pack, service worker or new proxy cache. Allowlist cache
maximum is five remote providers, or six with explicitly admitted ion, plus one
optional label provider; one remote layer is active. Provider-specific HTTP caches
remain authoritative. First usable ≤5s and frame targets remain qualification
criteria, not asserted outcomes; report actual network/software-renderer limits.

The original C6-0 qualification/proposal below is preserved **historical evidence**.
Its no-implementation/no-PEMA/no-ion development statements describe the earlier
scope and are superseded only by this named owner authorization. The probe ledger,
source recommendation, prior retry correction and unfinished acceptance gates
remain evidence; no research repeat or new audit follows from this package.

## Historical C6-0 authorization and proposal

**C6-0 QUALIFICATION AUTHORIZED — NO PROVIDER-SPECIFIC IMPLEMENTATION AUTHORIZED.**
Date: 2026-10-10. C5.7-D appearance comes first; C6-0 through C6-5 precede
resumed C5.7-A/PR #67 review and separately approved satellite/Weather packages.
PR #69 is merged; only C6-0 research/planning/docs are active. C6-1 implementation
is not authorized. Provider spending is fixed at $0.
Cesium ion Community remains conditional until written club/public-use eligibility
and zero-charge protection are established. Paid providers are inadmissible.
This title describes intended user experience, not entitlement to Google Earth
imagery or uniform aerial-scale resolution around the planet.

Read [Earth plan](EARTH_CAPABILITY_PLAN.md), [audit](../audits/GODS_EYE_CAPABILITY_IMPLEMENTATION_RECONCILIATION_2026-10-05.md),
[provider forensics](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md),
[ADR0009](../architecture/decisions/0009-owned-earth-feature-reuse.md) and
[OD5/OD6 decisions](C5_7_EARTH_CORE_RECOVERY_SPEC.md#owner-decision-register).
Current bounded CONUS HD/coarse global fallback is qualified historical C5.5;
terrain remains ellipsoid. Optional ion terrain/buildings/photo branches are
dormant, not proof of active global terrain/3D.

## Next proposed C6-0 task

PR #69 is merged and the owner has separately authorized bounded **free
global mapping qualification**, research and planning through existing God's Eye code. Follow the
merged PR #68 [adoption blueprint](../audits/GODS_EYE_MASTER_ADOPTION_BLUEPRINT_2026-10-10.md):
qualify existing `MapSourceController` / `createDefaultMapSources` and standard
Cesium imagery construction seams while preserving the Hub-owned Viewer, existing
imagery, overlays, navigation, lifecycle and rollback identities. Reuse the prior
ORAS comparison rather than repeating it. Record exact global service coverage,
source dates/resolution, allowed public-club use, attribution, access/CORS,
quotas/cache/distribution limits, $0 protection and current-imagery fallback before
an owner-approved source selection. C6-1 integration needs separate authorization;
no mapping provider is implemented or activated by PR #69 or this roadmap.

Carried-forward ORAS findings (prior comparison, not fresh qualification here):

| Source | Finding / remaining gate |
| --- | --- |
| PEMA/PASDA | Best confirmed regional detail; permission for intended public-club use remains outstanding. |
| USGS NAIP | Broader free aerial imagery; eligible coverage/access and integration still need qualification for the selected global mapping package. |
| 2024 Pennsylvania NAIP | Newer owner-identified candidate; access/integration unqualified; not tested in the prior comparison. |
| NASA imagery | Global overview fallback; does not establish high-resolution aerial detail everywhere. |
| Recent satellite imagery | Separate freshness option; not a replacement for high-resolution aerial imagery. |

Provider spending remains mandatory **$0**. No accounts, tokens, subscriptions or
billing are authorized. Cesium ion Community is conditional on written
club/public-use eligibility and zero-charge protection. Regional sources do not
establish global coverage. Terrain, 3D and later packages remain separately gated.

## C6-0 qualification and C6-1 proposal — 2026-10-11

**Current authorization: C6-0 research, selection proposal and documentation only.**
Verified merged main `0a231b24d208dc250214c737277a50dcc73d4e70` includes PR #69
at accepted head `7e7019db373f8c03baf7b693e7a06ca1a891a5db`. Earth-from-space
appearance is owner-accepted. No C6-1 code, new account/token, paid call, terrain,
3D, upstream update or deployment is authorized. The proposed arrangement targets
a donated application for a nonprofit educational club of fewer than 100 members;
member count does not establish concurrent-user capacity or a provider SLA.

The merged PR #68 [adoption blueprint and reuse register](../audits/GODS_EYE_MASTER_ADOPTION_BLUEPRINT_2026-10-10.md#reuse-details)
remain the source map. This bounded qualification does not repeat their audit.
The original stages below remain separately gated. Source eligibility means the
stated online use is documented at $0, not that integration, performance, all
locations, production-origin CORS or owner visual acceptance have passed.

### Source shortlist, permission and hierarchy

Recommended automatic hierarchy: **bundled Natural Earth safety base → NASA
Blue Marble at space scale → EOX 2016 at continental/regional scale → proven USGS
NAIP at covered close views**. A failed source follows **NAIP → EOX → NASA →
local**, with a per-session circuit breaker rather than a request loop. Keep the
existing bounded USGS cache in the preserved rollback, not the first active registry. Choose one
remote imagery stack, not every provider. Recent satellite imagery is a separate
future freshness option, not an aerial-detail substitute.

| ID / classification | Coverage, date and effective detail | Exact access / use evidence and remaining limits |
| --- | --- | --- |
| `local` — **ELIGIBLE — VERIFIED $0**, Hub terminal state outside the managed registry | Existing bundled Natural Earth II, global cartographic raster; not photography, no property acquisition date or aerial GSD | Exactly one permanent provider/layer at `/earth-runtime/cesium/Assets/Textures/NaturalEarthII`, owned independently by the Hub. No second local factory in MapSourceController. Public-domain data; no external service/account/quota. Preserve SDK/data notices. [Terms](https://www.naturalearthdata.com/about/terms-of-use/). |
| `nasa` — **ELIGIBLE — VERIFIED $0** | Existing global static Blue Marble shaded-relief/bathymetry, nominal 500 m; composite, not a current observation | Existing GIBS WMS `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi`, layer `BlueMarble_ShadedRelief_Bathymetry`. Anonymous educational web use; acknowledge NASA, no endorsement or third-party-rights inference. [NASA policy](https://www.nasa.gov/nasa-brand-center/images-and-media/), [GIBS integration](https://nasa-gibs.github.io/gibs-api-docs/map-library-usage/). No ordinary numeric per-session quota/SLA established; no bulk acquisition. |
| `eox-2016` — **ELIGIBLE — VERIFIED $0** | Sentinel-2 natural-colour cloudless mosaic, nominal 10 m source detail; metadata identifies **2016 product**, not the property's exact capture date. Web Mercator is limited to ±85.051129°; advertised global bounding box does not prove uniform photographic coverage or detail | Anonymous HTTPS WMTS/XYZ: `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg`. Cap proposed L14 (256px); retain NASA/local at poles/no data. Product-specific capabilities identify **CC BY 4.0**; provider explicitly invites application embedding with linked credits. [Capabilities](https://tiles.maps.eox.at/wmts/1.0.0/WMTSCapabilities.xml), [free access](https://cloudless.eox.at/pricing), [service permission](https://maps.eox.at/), [10 m product](https://cloudless.eox.at/documentation/introduction). One actual ORAS JPEG succeeded; no global visual campaign performed. |
| `usgs-naip` — **ELIGIBLE — VERIFIED $0** | CONUS NAIP acquisition footprints, not worldwide or every ocean/urban pixel. Prior ORAS point and matching imagery prove 0.6 m, raster `m_4107944_nw_17_060_20220623`, acquisition **2022-06-23**; source dates/resolution vary elsewhere | `https://imagery.nationalmap.gov/arcgis/services/USGSNAIPImagery/ImageServer/WMSServer`, layer `USGSNAIPImagery:NaturalColor`; WMS 1.3.0 / EPSG:3857 / transparent PNG, 256px proposed L18 cap. Native Cesium WMS avoids an ImageServer REST adapter. The National Map permits public-domain/free map-service use and requests agency acknowledgement. [USGS terms](https://www.usgs.gov/faqs/what-are-terms-uselicensing-map-services-and-data-national-map). WMS path and exact image equality were already proved in the ORAS comparison. No numeric public-service SLA or sustained-load entitlement established. |
| `usgs-cache` — **ELIGIBLE — VERIFIED $0**, retained optional source | Existing admitted CONUS envelope −125/24/−66/50; approximately 1.79 m/cache pixel at ORAS at L16. Exact local acquisition date unknown; advertised mosaic years are not a property capture date | Existing `https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}`, cap16. Same National Map use permission. Preserve coverage restriction excluding separately restricted Alaska content and existing fallback. |
| `naip-plus` — **CONDITIONAL** integration alternative | Prior ORAS 0.6 m, same 2022-06-23 raster as NAIP; no demonstrated local-detail gain | `https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPPlus/ImageServer`. USGS data/service rights admitted; its WMS timed out in prior comparison and is unqualified. REST needs `exportImage`, not MapServer `export`. Not selected; no new retry/comparison. |
| `pema` — **CONDITIONAL** | Pennsylvania county/tile coverage, 2021–2023 collection; ORAS footprint supports approximately 0.1524003 m GSD and **2022 tile year**, exact flight date unknown. Prior visual leader | `https://maps.pasda.psu.edu/ArcGIS/rest/services/PEMAImagery2021_2023cache/MapServer/tile/{z}/{y}/{x}`. Source data access is not sustained-hosted-service permission. Public-club traffic/caching/export confirmation outstanding. If later cleared, existing UrlTemplate pattern, cap20; do not use cached ArcGIS factory's ineffective maximumLevel option. Absent from enabled registry until approval. |
| `pa-naip-2024` — **CONDITIONAL** | Catalog advertises 0.6 m 2024 NAIP. Its sampled metadata bounds are −75.941400/39.871784/−75.870650/39.941209, dated 2024-10-05: **not ORAS**. New exact-point USGS query returned zero PA/2024 rows at ORAS, not proof that no such imagery exists elsewhere | [PASDA metadata](https://www.pasda.psu.edu/uci/FullMetadataDisplay.aspx?file=NAIP2024.xml) gives no data-use restrictions and requests USDA credit. Sampled PASDA imagery-service directory advertised NAIP through 2022, not a 2024 service. No direct 2024 Cesium endpoint or ORAS detail established. Do not substitute a download catalog for a qualified hosted tile service or display 2024 as property's date. |
| `eox-2024` — **CONDITIONAL** selection | Same nominal 10 m, 2024 mosaic product, exact local acquisition date unknown; one ORAS JPEG succeeded | `s2cloudless-2024_3857` at the same WMTS endpoint. Published free noncommercial access under CC BY-NC-SA 4.0; owner/operator must confirm the actual public deployment and derivative-image obligations fit, rather than equating nonprofit status with every permitted use. Prefer2016 CC BY initially. No commercial licence purchase or automatic selection. [Licence](https://cloudless.eox.at/documentation/license). |
| `esri` — **CONDITIONAL**, disabled | World Imagery offers geographically variable dates/detail; no new pixel comparison | Pinned `createEsriImagery` endpoint `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer`. Keyless response is not sufficient organizational/public-service entitlement or protection from fees; no exact permitted $0 access arrangement established here. [Esri terms](https://www.esri.com/en-us/legal/terms/web-site-service). Exclude upstream automatic default. |
| `ion` — **CONDITIONAL**, disabled | Content-dependent coverage/detail and attribution; no active source | Written club/public-use eligibility and zero-charge protection outstanding. No account/token creation. [Pricing](https://cesium.com/platform/cesium-ion/pricing/), [terms](https://cesium.com/legal/terms-of-service). Keep separate from free CesiumJS SDK. |
| Google direct / billing-enabled imagery or trial — **REJECTED** | Not admissible under this package's mandatory $0/no-billing-account boundary | No factory calls, subscriptions, liability-producing trials, tokens or accounts. Existing dormant branches remain preserved, not activated. |

EOX tiles returned seven-day cache headers. Honour origin HTTP caches for selected
services; no cache-busting, service worker/offline packs, bulk mirror, proprietary
asset bundle, new server tile cache or account-backed fallback. EOX publishes rate
limiting and may return errors/redirects; no numeric allowance is published. NASA
bulk-use documentation is not this application's interactive request budget. USGS
availability and quota stability are not guaranteed. A public educational website
can use the eligible sources under the cited terms and low-volume interactive
conditions; this establishes no capacity guarantee or release approval.

### Roads, labels and boundaries

**Recommended optional labels: EOX `overlay_bright_3857`**, a pre-rendered
transparent PNG WMTS at the same template, replacing the layer name/extension.
Use native Cesium UrlTemplate imagery, proposed cap12, default OFF, above imagery
and below weather/fire/radar. EOX explicitly permits application embedding with
linked EOX::Maps, EOX/MapServer rendering and OSM-contributor attribution; the
[service page](https://maps.eox.at/) distinguishes its rendered layers from source
[OSM ODbL data](https://www.openstreetmap.org/copyright). These are contextual
labels/borders/streets, not complete surveyed roads or authoritative boundaries.
Rights/access: **ELIGIBLE — VERIFIED $0** for the documented online use; useful
coverage remains a C6-1 visual gate. ORAS L14 returned a fully transparent tile;
New York L12 returned nonuniform RGBA content. Never treat an empty label tile as
proof of roads or make imagery depend on label availability. Credits remain when
labels are enabled, and failure disables labels without hiding Earth.

**OSMF Standard raster streets: ELIGIBLE — VERIFIED $0 for policy-compliant
interactive viewing**, optional manual streets mode, not a transparent aerial
label overlay. Reuse pinned `createOsmImagery`; enforce a public maximumLevel18
provider facade because pinned factory leaves the SDK level unbounded. Qualify
facade/URL behaviour before enabling. Use exactly `https://tile.openstreetmap.org/{z}/{x}/{y}.png`.
The [hosting policy](https://operations.osmfoundation.org/policies/tiles/) is
separate from ODbL data: visible linked attribution, genuine browser Referer,
normal browser User-Agent, origin caching or minimum seven days where headers
cannot be read, no no-cache defaults/prefetch/offline downloading. Best-effort
service may block access without notice; no numeric entitlement/SLA. No new vector
renderer, MVT client, geocoder/autocomplete or OSM data ingestion is proposed.

### Minimal adoption wrapper and exact C6-1 file plan

Only these cataloged pinned modules were investigated; no complete new upstream
audit. Public source URLs are recorded in the PR #68 reuse register.

| Pinned module / seam | Exact adoption / wrapper requirement |
| --- | --- |
| `src/maps/controller.js` / `gods-eye-view/maps/controller` | Instantiate `MapSourceController` with the **existing Hub Viewer**, filtered registry, initialStack, onChange/onError/requestRender and injected createImageryLayer; explicitly call setStack during initialization. Reuse generations, provider cache, fallback and destroy; never duplicate switching or import the app. `_cached()` evicts rejected promises; successful providers and successful construction-fallback resolutions remain cached. Keep the controller and healthy caches for ordinary retries; follow the distinct retry cases below. |
| `src/maps/defaultSources.js` / `gods-eye-view/maps/defaults` | Obtain upstream descriptors/OSM factory composition with empty credentials, then copy only owner-selected remote raster entries. Remove terrain/tileset/setup routes; set defaultId/unknownId to `nasa` and recoveryId to `null` as specified below. `local` is a Hub state, never a managed factory or fallback ID. No calls to world/keyless terrain, Google, Esri or ion. Do not mutate upstream source or returned shared descriptors. |
| `src/maps/catalog.js` / `gods-eye-view/maps/catalog` | Reuse immutable descriptor shape and the filtered OSM descriptor; append Hub-owned NASA/EOX/NAIP remote facts. Keep local safety-base facts separately in the wrapper. Unselected descriptors are absent, not merely hidden while callable. |
| `src/maps/imagery.js` / `gods-eye-view/maps/imagery` | Exact `createOsmImagery`, wrapped for level/request bounds; no Esri/ion invocation. NASA/NAIP reuse existing Hub native Cesium factories; EOX adds standard UrlTemplate factory configuration. Allocate the existing Natural Earth safety provider/layer once outside this registry; no custom renderer or managed local factory. |
| `src/maps/registry.js` | Internal dependency used transitively by the public controller; reuse duplicate/unknown/cycle rejection. Add wrapper checks for tileFailureFallback IDs/cycles as well as constructionFallback; the pinned index validates only the latter. |
| `src/maps/credits.js` | Internal dependency used transitively; preserves source-following credits. Test pinned Cesium1.138 `scene.frameState.creditDisplay` compatibility and retain Hub AttributionManager as accessible, visible fallback if that private seam fails. Escape/static-allowlist credit markup; no fetched HTML. |
| `src/ui/mapSourceControls.js` | Selection/subscription/generation and listener cleanup are reusable design, but this file has **no dedicated public export** at the immutable pin; do not bypass Vite's public-export guard. First package uses existing Hub DOM controls as a thin adapter to public controller getStacks/subscribe/setStack. Dedicated exact UI-module adoption needs a later approved generic export/patch seam; no pin update or full-app DOM import here. |

**First proposed coding package: C6-1A — admitted raster-source adoption.** It
includes the selected hierarchy, automatic close-view policy, optional raster
labels/streets, truthful facts, lifecycle/credits/fallback tests and real screenshot
handoff. No terrain/3D, new dependency, backend science/data route, universal-state
schema or source-pin change. It may begin only after owner approval of this
specification's exact source set/budgets and separate implementation authorization.

| Hub file / artifact input (future change only) | Bounded responsibility |
| --- | --- |
| `runtimes/earth-runtime/core/ImageryController.mjs` | Thin wrapper around public upstream controller; keep one bundled local safety layer, selected managed imagery, source facts, optional raster labels and diagnostics. Remove owned listeners/guards/layers on disposal; never removeAll or affect independent overlays. |
| Proposed `runtimes/earth-runtime/core/AdmittedMapSources.mjs` | Filter upstream defaults/catalog, register qualified existing/new native factories, source facts and acyclic fallback; public max-level facade where factory has no bound. No account lookup, credential activation or remote registry discovery. |
| Proposed `runtimes/earth-runtime/core/ImagerySelectionPolicy.mjs` | Small deterministic camera/coverage/hysteresis policy; chooses admitted remote controller IDs or the Hub-owned local terminal state, not another provider-switching engine. Manual source wins until explicit Auto. |
| `runtimes/earth-runtime/core/imageryRequests.mjs` | Preserve scheduler undefined-return/cancellation semantics; add reversible pause/resume and cancel-pending for cached source switches, permanent stop only at teardown, and shared admitted tile budget. Cached providers must be reusable without recreating Viewer. |
| `runtimes/earth-runtime/core/VisualFoundation.mjs` | Wire wrapper into existing initialization/retry/quality; keep terrain and3D dormant for this package. Do not turn imagery selection into an ion/configuration approval path. |
| `runtimes/earth-runtime/core/EarthRuntime.mjs`, `entry.mjs`, `index.html`, `style.css` | Mount an accessible source/Auto selector and optional label control, present source/product-year/GSD and status, expose diagnostics and dispose controls. Preserve camera/selection/bridge/scientific time. Source choice is session-local; no new Hub state contract. |
| `tests/earth/imagery-controller.test.mjs`, `imagery-requests.test.mjs`; proposed source/selection tests | Fake-provider races, admission/coverage/level caps, empty imagery, construction/tile/timeout/429 failures, cache reuse after pause, credits/ordering and teardown. Tests need actual wrong-behaviour cases, not snapshots of implementation. |
| Proposed `frontend/tests/e2e/earthMapping.spec.ts` | Matching-camera source/fallback/loading screenshots and Earth/Sky regression using actual Docker-served runtime plus bounded fixtures. No generated map detail. |
| `scripts/runtime/earth_artifact.py`, `scripts/runtime/build_owned_earth.sh` (existing builder, no redesign), `integrations/renderers.lock.json`, `frontend/public/runtime-versions.json` | Once source inputs change, use established attested Earth build/install/served-byte/rollback qualification. Preserve Sky artifact; do not rebuild it for Earth-only inputs. Metadata may change only to a reproduced artifact, not a claimed version bump. |

The controller inserts its layer at collection index0. With a permanent local
safety layer, inject createImageryLayer to register the exact managed layer and
use an owned layerAdded listener to raise **only that layer one position above
the safety base**, leaving overlays in their original relative order. Remove the
listener on destruction. Label layer has its own owned slot below event overlays.
Do not solve this by changing Viewer, upstream index0, removeAll or raising all
imagery to the top. Test that the local opaque base never obscures the selected
source and that radar/fire content remains above both imagery and labels.

Provider factories receive an AbortSignal, but that alone does not cancel Cesium
tile requests. The Hub wrapper controls per-provider requestImage admission,
reversible pause/cancel on deactivation, and disposal; on late completion only the
current generation may activate status/layers. Constructor/provider caches are
limited by the fixed registry; no arbitrary source URLs/IDs can expand them.

#### Single safety base and terminal local lifecycle

Allocate **exactly one Natural Earth provider and layer per Viewer lifetime**,
owned by the Hub independently of MapSourceController. Keep it visible beneath
the managed remote imagery; controller creation, fallback, retry and recreation
must never allocate or destroy it. The managed registry has exactly the remote
IDs **`nasa`, `eox-2016`, `usgs-naip`, `osm`**. `local` remains available in the Hub
selector/status model, but is not a registry descriptor, imagery factory,
constructionFallback, tileFailureFallback, defaultId, unknownId or recoveryId.
Set **defaultId = unknownId = `nasa`; recoveryId = `null`**. At this pin,
`setStack()` checks `getStack(recoveryId)` before recovery, so null disables a
second construction-recovery attempt; it does not create a local layer.

The controller owns remote switching: both construction and tile-failure graphs
use **usgs-naip → eox-2016 → nasa**, with manual OSM failure directed to NASA.
NASA has no downstream controller fallback. Do not pass `local` to `setStack()`:
an unknown ID would select unknownId/NASA, not detach imagery. The wrapper owns
only the terminal transition **NASA unavailable → local**, using its existing
factory/request diagnostics and public onChange/subscription results to identify
the effective source and exhausted eligible fallbacks. A construction fallback
that successfully activates EOX/NASA is not total failure; nor is a stale error
from an older generation. Observe terminal NASA tile failure through the owned
request guard/error listener; do not attach another remote switching engine or
interpret the controller's returned ready status alone as construction success.
Existing cooldown/host-stop gates prevent automatic re-entry to exhausted sources.

There is **no public detach API** at the immutable pin. The valid terminal path
uses [public destroy(), lines395–428](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/controller.js#L395-L428):
invalidate the wrapper activation generation, unsubscribe its controller callbacks,
stop/cancel owned remote request guards and remove owned layerAdded/error listeners,
then call destroy() once and release that controller reference. It removes only
its managed imagery layer through the controller's owned lifecycle, clears its
subscriptions/credits/caches, aborts construction and disposes cached/late providers.
Remove/dispose the separately owned label layer/guard through its own lifecycle
and suspend labels in local mode. Never mutate private fields, call private
`_removeImageryLayer()`, removeAll(), or manually detach a layer behind a live
controller's cached reference. The permanent safety layer and existing event
overlays remain in place; the Hub Viewer, camera, Sky bridge and state survive.

Explicit user-selected **Local** uses this same terminal transition, pins manual
local mode until a remote/Auto choice, and performs no new remote requests.
Publish actual source `local`/Natural Earth with the failure reason or manual-mode
status; remove only owned remote/label credits and retain safety-base/SDK and
independent overlay attribution. Do not report the requested remote as displayed.
Natural Earth reads/textures use the existing base only, with zero duplicate local
requests. Other event-layer requests retain their independent contracts.

Recovery from local requires an explicit eligible remote/Auto choice after the
existing cooldown; recreate **only the map controller and its owned guards and
listeners**, reuse the same remote registry, and call setStack(selectedRemoteId)
once. Gate callbacks by the new wrapper generation, subscribe once and install
only the selected managed layer above the same safety base. Restore optional
labels only when user-enabled and eligible. Failed recovery returns to terminal
local without recursion or automatic retries. This exceptional detach/recovery
cost is loss of controller-owned remote caches/textures and later bounded refetch;
it is not a Viewer/renderer rebuild or a second local provider. Normal
remote-to-remote switching and ordinary eligible retries keep the existing
controller and healthy caches, as specified below.

#### Retry cases at the immutable pin

Source evidence at `e7707d9a0f34d9fbffc300023c319f95caa5be30`:
[controller.js lines300–335](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/controller.js#L300-L335)
delete a rejected cached promise, but `_getImageryProvider()` can catch a factory
failure and resolve a construction fallback under the **original** source ID.
[setStack lines163–221](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/controller.js#L163-L221)
reports the effective source and can recover separately after an activation rejection.
[Tile-error handling lines338–378](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/controller.js#L338-L378)
switches stacks without evicting the original resolved provider.

| Outcome | Smallest future C6-1A retry policy and required test |
| --- | --- |
| Factory/cache promise rejects, including an unsuccessful construction fallback | `_cached()` removes that entry. After the existing eligibility/cooldown gate, one explicit `setStack(originalId)` on the **same controller** attempts construction again; healthy caches and subscriptions remain. Test first rejection then success, factory call count2 and unchanged controller/healthy provider. Registry recovery succeeding in `setStack()` does not convert the original rejected entry into a cached construction fallback. |
| Original factory resolves successfully | Repeated `setStack(originalId)` reuses the provider, not a fresh factory attempt. Test one construction across repeated selections and preserved subscriptions. |
| Construction fallback resolves successfully | The original ID caches the resolution with the fallback's `effectiveStackId`; repeated `setStack(originalId)` reuses it and **does not retry the original factory**. Keep the effective fallback and truthful status by default. Test original/fallback construction counts1, repeated selection still showing the effective fallback and correct credit. |
| Tile-error fallback transition | `_watchProvider()` chooses `tileFailureFallback` for the **effective** provider and calls `setStack(fallbackId)`; this leaves the original successful cache entry intact. After an eligible explicit retry, resume its reversible request guard and call `setStack(originalId)` on the same controller. This retries tile loading through the cached provider, not factory construction; test cache identity, new-generation listener, no duplicate listeners and no retry before cooldown. If the original ID already resolves to a cached construction fallback, the preceding row still applies. |

The controlled retry gate remains unchanged: no automatic retries, no unauthorized
provider retry, existing host-wide401/403/429 stop/Retry-After and at least5min
eligible explicit retry; other source failures retain at least60s cooldown.
Record whether the action resumes tile loading, retries a rejected factory, or
requests a fresh factory after a cached construction fallback. Never label a
cached fallback re-selection as restored original imagery.

The following retry cases apply while the remote controller remains live; recovery
after terminal local disposal uses the distinct lifecycle above. The pin has
**no public per-source cache invalidation method**. Among live-controller retries,
only an explicit,
eligible request for a **fresh original factory attempt after a cached successful
construction fallback** may use exceptional map-controller/wrapper recreation,
after cooldown, keeping the Hub Viewer, independent local safety layer, camera,
overlays and state intact. Dispose owned listeners/guards/providers, reattach
subscriptions once and activate the requested source once; acknowledge that this
exception discards controller-owned healthy caches. Test that ordinary rejected
factory and tile retries never enter it, while this exceptional path actually
calls the original factory again and leaves no old-controller callback/request.
Do not mutate private cache maps or invent an invalidation API. A future qualified
public invalidation seam could avoid this exception, but needs separate approval;
no source-pin change or runtime implementation is authorized here.

### Close-view selection, metadata and failure policy

Proposed thresholds are owner-review parameters, not measured performance:
space→EOX below 1.5 Mm, EOX→space above 2 Mm; NAIP below 150 km and exit above 250 km.
Debounce camera changes 500 ms and permit at most one automatic switch per2 s.
Use a finite ellipsoid ground-centre/view rectangle; no terrain-height work.
NAIP admission requires covered land at the ground centre and a view wholly
within the admitted CONUS envelope. At mixed/out-of-coverage/polar/no-ground
views keep global imagery. Use selected-service footprint metadata only on a
settled close view, at most one point request/minute; absence, timeout or ambiguous
coverage keeps the global source. This is not a promise of complete CONUS data.

Do not infer blank-tile content from HTTP 200. Transparent NAIP pixels retain the
local safety base; fully empty/missing imagery must produce an unavailable/no-data
state and switch to global. Qualify empty-tile detection against actual selected
WMS responses before advertising automatic close coverage. A partially filled
view must be labelled partial and must not be presented as uniformly 0.6 m.
Region crossing must not oscillate or enqueue all possible regional providers.
PEMA/2024/NAIP Plus remain absent from the admitted registry until their gates close.

Facts distinguish product/mosaic year, location-supported acquisition time,
native GSD, cache/display pixel scale, geography, selected versus actual fallback,
and current loading state. Scene time does not date imagery. Unless exact rendered
pixel provenance is supported, display **dates vary / capture date unavailable**;
a catalog footprint alone is not proof of which row the WMS mosaic rendered.
At ORAS carry the prior matched-image2022-06-23 / 0.6 m proof; elsewhere no invented
property year. Raw error bodies/tokens/remote HTML do not enter product UI.

Proposed budget: one bundled safety base plus one managed imagery stack and at
most one user-enabled label overlay; only active remote providers may dispatch.
Aggregate ≤6 active tile requests/runtime, ≤4 to any host (including shared EOX
imagery+labels), ≤2 for NAIP WMS; ≤2 new remote tile requests/second with a burst of 6.
12 s tile timeout (current bound), 20 s metadata/factory timeout. No automatic tile
retry; one failure switches to admitted fallback. On401/403/429 stop **all sources
on that host** for the session, honour Retry-After and require explicit eligible
retry after at least 5 min; never retry an unauthorized provider. Other failures
get at least 60 s source cooldown. No polling/mirror/background warmup.

The first managed registry contains only nasa/eox-2016/usgs-naip/osm;
local is exclusively the Hub terminal state using the one permanent safety base. Keep the
existing cached USGS source in rollback; adding it later cannot silently increase
the allowlist budget. Allocate at most four lazily created remote source providers,
exactly one permanent local provider/layer and at most one optional label provider/layer.
Only one managed remote layer may be active; in local mode there are zero managed
remote/label layers or their active tile requests. No duplicate local textures or
overlapping old/new controller resources may inflate the existing texture budget;
dispose the old owned generation before remote recreation. Bounded by the allowlist,
no provider is constructed
just to preview a picker. Warm-repeat/metadata cache ≤32 exact-view records in
memory and one session; origin HTTP image caching remains authoritative. Target
first usable imagery ≤5 s on representative broadband (fallback visible immediately)
and median frame time ≤33 ms desktop /50 ms mobile emulation; collect p95 and label
network/device conditions. These are proposed acceptance limits, not measured
results or provider quotas. Physical-device qualification stays distinct. User
concurrency/traffic is not guaranteed by a per-client limiter; public rollout needs
owner-selected concurrency/resource expectations and graceful 429 proof.

### Matching-scale visual and regression acceptance

C6-1A must capture **actual Docker/local browser** current-versus-proposed imagery
at identical camera/time/viewport/DPR, selected and effective source, source
revision/artifact, camera height/direction, capture UTC, supported acquisition date,
native/effective detail, attribution, active requests, tile errors/loading time and
fallback. No AI enhancement or increased cache level passed off as new detail.

| Checkpoint | Required visible evidence |
| --- | --- |
| Full Earth from space (≈20 Mm) | Preserve owner-accepted sunlight/terminator/stars/atmosphere, NASA/local global coverage; no eager regional requests. |
| Continental Europe / North America (≈1 Mm) | EOX 2016 actually visible and credited; sharper than 500 m overview at matching scale, honestly historical 10 m mosaic; no claim of aerial/property detail. |
| ORAS 41.321903,−79.585394 (nadir ≈1.5km and≈350m) | Current L16 cache versus admitted NAIP at equal pixels/ground extent; useful known 0.6 m detail and2022 evidence, no PEMA/2024 invocation. Keep prior comparison as reference rather than repeating its shootout. |
| New York 40.7128,−74.0060 (≈1.5km) | NAIP where footprint supports it; optional labels at usable scale/credits; date unknown unless proven for rendered pixels. |
| Paris 48.8566,2.3522 (≈1.5km) | Global EOX, no USGS requests;10 m limitation explicit, no invented aerial-resolution result. |
| Remote ocean 0,−140; high latitude 88,0; source boundary −125,40 | Useful NASA/local or global fallback, no endless loading, geographic limits and no regional fetch outside admission. |

Also test missing/transparent tiles, simulated timeout/403/429, EOX whole-host
shutdown including labels, empty/unknown/cyclic registry, rapid manual/Auto changes,
Earth/Sky navigation and at least five serial renderer destruction/recreation
cycles. Event/Weather/fire/quake overlays and scientific selection/time contracts
must survive switching. Measure no late dispatched provider request after teardown,
no revived layer/listener/timer, no growing provider/texture counts beyond caps.
Additional **future C6-1A regression requirements**, not tests implemented here:

1. Instrument Natural Earth construction/layer allocation: exactly one of each
   per Viewer lifetime across initialization, all failures, Local selection and
   repeated remote recovery; no managed registry entry can allocate another.
2. Verify every selected remote layer sits above that exact safety-base identity
   and below separately owned labels/event overlays.
3. Exhaust eligible remote factories or terminal NASA tiles: destroy the owned
   controller once and expose only the safety base in the base-imagery stack,
   with no surviving failed remote/label layer or request loop.
4. Confirm no duplicate local provider, tile fetch or texture allocation during
   fallback/recovery; zero new managed imagery/label requests in Local mode.
5. Recover after cooldown: one fresh remote activation above the unchanged base,
   one set of subscriptions/error/layer listeners, and no old-generation callback.
   Normal remote switching/rejected-factory retries still preserve healthy caches.
6. Preserve Weather/radar/fire/quakes and other independent event layers, their
   identities/order and credits, across local disposal and remote recovery.
7. Verify requested versus actual source, failure/manual-local status and credits
   reflect displayed imagery, including effective construction/tile fallbacks.
8. At renderer teardown destroy the permanent base once through its Hub owner,
   dispose all managed/label resources and prove no stale listener/request/texture.

Run focused tests/visual proof first, correct failures, then established bounded
Earth regression/artifact checks; preserve rollback and no production deployment.
Desktop/mobile browser emulation does not establish physical-device acceptance.
**Owner must approve real screenshots before any later implementation merge.**

### Permission drafts and owner stop gate

No provider was contacted. Only conditional sources need confirmation drafts:

- **PASDA/PEMA draft:** “May a donated nonprofit astronomy-club public website
  (<100 members) embed your PEMA2021–2023 cached service with attribution, no
  bulk/offline downloads, bounded interactive requests and normal HTTP caching?
  Please confirm hosted-use permission, traffic/concurrency limits, cache and
  screenshot/redistribution terms, and that this use requires no account or fee.”
- **Cesium draft:** “Please confirm in writing whether ion Community permits an
  organization-operated public educational astronomy application donated to a
  nonprofit club (<100 members), and whether limits can stop service without
  invoices, overage charges, automatic upgrades or billing activation. No paid
  products/accounts may be enabled.”

Owner decisions before C6-1: approve the NASA/EOX 2016/USGSNAIP/local set and older
mosaic tradeoff; optional EOX labels/manual OSM; exact coverage/thresholds/budgets,
representative device/network/concurrency expectations; metadata/date presentation;
public max-level/UI seam limitations; and the named C6-1A coding package. EOX2024,
PEMA, PA2024, ion and other conditional sources remain gated. The proposed coding
scope grants no permission by itself. **STOP for owner approval; do not start C6-1.**

### Bounded evidence and documentation validation

The [eight-request ledger](../audits/C6_0_FREE_MAPPING_PROBES_2026_10_11.json)
records exact URLs, UTC, status, response bytes/hash, timing and CORS/cache headers.
The manifest parser supports only Markdown/YAML load entries. The `docs_change`,
`planning`, `review` and `validation` pack comments therefore designate this
listed specification as the required supporting-evidence entry point and name
the exact JSON path. After mandatory context/architecture, agents using those
packs **must read the linked ledger directly** as supporting evidence required
by this specification, not as another execution authority. No duplicate evidence
document or validator expansion is needed. Read its recorded values unchanged;
do not regenerate the ledger or repeat probes.
Cap was 12 total direct requests, 8 MiB each, 20 s timeout, no redirects/retries;
all 8 returned HTTP 200, with zero denials/timeouts. Requests: EOX capabilities,
PASDA 2024 metadata, one PASDA directory, two EOX product tiles, one exact-point
USGS 2024 query, two raster-label tiles. Ordinary official-document browsing is
separate from this service-probe ledger. Raw responses remain in
`/tmp/c6-0-free-global-mapping-20261011`; no imagery bulk or runtime asset was added.

JPEG/PNG headers and decompressed PNG content were checked with existing system
`file` and Python standard-library struct/zlib after two Pillow import attempts
failed in available Python environments; no dependency was installed. Both JPEGs
are 256×256; ORAS label tile has one fully transparent palette entry, while the
New York tile contains nonuniform 256×256 RGBA content. This is format/content
proof, not a browser visual quality pass. Prior ORAS comparison/evidence files are
unchanged at `output/playwright/c6-oras-imagery-20261011`; its PEMA/NAIP findings
remain historical measurements rather than a new comparison run.

No renderer build, database/container/volume mutation, app-wide test campaign,
provider registration, source-pin update, deployment, C6-1 code or merge. Document
validators/reference/authority/whitespace and preservation results are recorded
in this PR's handoff. Current artifact inputs and all historical audit/data/rollback
identities remain unchanged; no fresh runtime/physical qualification is claimed.

Fresh documentation checks on this C6-0 patch: both repository document validators
PASS,21 documentation tests PASS, changed-file links/fragments/authority/JSON-hash
checks PASS and git diff --check PASS. Fifteen documentation/evidence files only;
all non-document runtime/build inputs and renderer identity metadata unchanged.
The PR #68 append-only addenda preserve every prior byte and the reuse JSON stays
unchanged. Owner settings and listed68 container/81 volume identities match the
read-only baseline. Docker's unordered mount display initially failed an exact
string comparison; sorting the unchanged listed mount sets resolved that check.
No Docker operation changed containers or data. These checks prove documentation
and preservation, not new browser or physical-device mapping quality.

## Scope and ordered proposed stages

| Stage | Input / reuse candidate | Required evidence and stop gate |
| --- | --- | --- |
| C6-0 provider qualification | Public MapSourceController, createDefaultMapSources, imagery/terrain construction, createTerrainHeights and photoreal helpers; no pin update | For each candidate name exact service/product, allowed geography/source dates/resolution/datum, credits, credential exposure, account/fees/spend caps, quotas/cache/redistribution/privacy terms, CORS/proxy/abuse boundaries and fallback. Owner approves the selected $0 set before integration; keys/accounts/paid calls remain blocked. UNKNOWN rights stay BLOCKED. |
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
set, numerical accuracy tolerances, mandatory $0 spend, request/memory/GPU/frame budgets
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
