# God's Eye / SWE compatibility and upgradeability study

Date: 2026-10-02. Phase B; research and documentation only. Hub baseline:
`0ba481f5b16f8f8637ca73628cbc2b3abaad1710` (merged PR #53).
Branch: `unified-runtime-compatibility-study-1`. Governing direction:
[Unified Universe Architecture](../architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md)
and its eight ADRs. [Evidence record](../validation/UNIFIED_RUNTIME_COMPATIBILITY_EVIDENCE.md).

**Evidence vocabulary:** SOURCE = inspected code at the recorded revision;
PROBE = disposable Node fixture outside the Hub; PROPOSED = recommendation;
OPEN = qualification still required. No new renderer/browser/Docker integration
is claimed. Paths prefixed `GE/` below refer to the pinned God's Eye checkout;
`SWE/` refers to the local vendor snapshot unless explicitly called upstream.

## 1. Executive conclusion

Choose **an external, SHA-pinned God's Eye checkout, independently built as its
complete application, with a small ORAS wrapper in the runtime build**. Consume
selected exports inside that wrapper, never inside the Hub React renderer.
Serve Sky and Earth through same-origin, separate documents in disposable frames;
use a versioned, capability-negotiated message bridge. Keep only the active heavy
renderer mounted. Preserve small product state in the Hub, not renderer objects.

Phase C should keep existing Sky behavior and add the full applicable Earth
application under the existing shell. It must not rebuild God's Eye controls
from selected flight/satellite modules. Preserve upstream layer catalogs,
search, camera/tracking, weather, infrastructure, media, tools, share/scene and
voice capability where deployment permissions allow. Disabled providers are
explicitly unavailable; feature preservation does not authorize provider use.

Source supports this direction, with four material qualifications:

1. God's Eye has useful exported constructors and cleanup, but its standalone
   application is page-scoped and single-use. It is not a React component.
2. External layers work before catalog sealing. Full standalone composition
   does not expose a catalog-transform option; propose a small generic hook
   before the astronomy extension phase, rather than copying the application.
3. Earth's satellites use wall-clock time, and weather has its own clock.
   A shared Cesium clock does **not** synchronize all feeds. Phase C negotiates
   live-only Earth temporal capability and preserves requested Hub time honestly.
4. SWE is substantially customized and incompletely source-reproducible from
   the Hub checkout. Recover its ignored source/configuration inputs before
   modifying/rebuilding Sky; do not call its existing vendor tree pristine.

This resolves the preferred topology, consumption, bridge, lifecycle and
extension direction. It does not qualify production hosting, establish timing
benchmarks, or authorize Phase C execution.

## 2. Exact God's Eye revisions studied

| Item | Observed value |
| --- | --- |
| Repository | [bilawalsidhu/gods-eye-view](https://github.com/bilawalsidhu/gods-eye-view) |
| Primary pinned baseline | `e7707d9a0f34d9fbffc300023c319f95caa5be30` |
| Current upstream `origin/main` and HEAD, checked 2026-10-02 | `e7707d9a0f34d9fbffc300023c319f95caa5be30` |
| Commit timestamp | 2026-09-29T00:33:34Z |
| Distance from pin | 0 commits; no package/composition/renderer/catalog/provider/build movement between these two observations |
| Package | Private source package `gods-eye-view` 0.1.1; 148 export targets exist |
| Toolchain | Node `>=24.14.0 <25 || >=26 <27`; lockfile resolves Cesium 1.138.0 and Vite 6.4.3 |

Zero movement since the Phase A pin is not a stability guarantee. The exported
composition surface is broad and the package is private; qualify commits, not
an assumed npm release or semver compatibility promise. Earlier adjacent history
includes OSM provider changes and share-link token reconciliation. Do not import
all 148 exports or automatically float to upstream main.

## 3. SWE baseline and upstream determination

Original upstream is [Stellarium/stellarium-web-engine](https://github.com/Stellarium/stellarium-web-engine).
The configured Hub `stellarium` remote points to the owner's fork,
[Shadowgar/stellarium-web-engine](https://github.com/Shadowgar/stellarium-web-engine).
Its observed HEAD is `63fb3279e85782158a6df63649f1c8a1837b7846`.

Recoverable ancestry: official upstream commit
`023e3b26babf7ffddf45f39293230b14cfe96993` (2026-04-08) is parent of fork commit
`16dbacd4b9a9973421b0438044d3536e300b3260`, “Sync study Stellarium edits from
Astronomy-Hub”; fork HEAD follows that commit. Historical Hub preparation
(`ddd250ac`) assumed an existing archive-like
`study/stellarium-web-engine/source/stellarium-web-engine-master` directory.
`b227a580` moved the integration path to vendor. Neither is a reproducible source
fetch/pin mechanism. No authoritative exact original import SHA was recovered.
Use `023e3b26…` as the **comparison/ancestry anchor**, not a proven import pin.

Current official upstream comparison is
`29870744c470ddc62fa869e153178c82a7824fa4` (2026-09-13). It is 12 commits beyond
`023e3b26…`; their scoped diff changes only `apps/web-frontend/yarn.lock`
(341 insertions, 101 deletions). The owner's fork is not interchangeable with
current official upstream. Its commit subject mentions Vue 3, but actual local
and fork-HEAD manifests pin Vue/compiler 2.6.12; inspect files, not subjects.
The application package version 0.1.0 is not a source or artifact identity.

## 4. Recommended runtime topology

| Topology | Assessment |
| --- | --- |
| One React/JS bundle importing everything | Reject. Vue 2/SWE WASM and page-scoped God's Eye globals, DOM IDs, styling, listeners and toolchains become coupled. Full-app preservation and upgrades become harder; HMR and cleanup boundaries blur. |
| Independent same-origin runtimes as separate pages only | Good build/provenance isolation; full-page navigation loses the persistent shell and weakens transitions/state ownership. |
| Same-origin runtime frames | Preserves whole applications and document lifetimes; bridge and routing work required. Frame removal bounds retained JS/WASM ownership. |
| **Hybrid: independent frames plus small shared protocol/adapter packages** | **Preferred.** Product state and navigation live in Hub; each adapter is built with its renderer. Share only serializable contracts/validation, never engine instances, Cesium, Vue or WebGL objects. |

Same origin simplifies assets/auth and handshake; it is **not a security boundary**.
An iframe may share a browser process, GPU process and origin storage; it does not
guarantee crash or memory isolation. It does isolate document/CSS/global lifetimes
and limits framework collisions. A compromised same-origin runtime can reach the
host; CSP, provider hardening and narrowly validated messages remain necessary.

Build/test each runtime separately, then test the shell switch. HMR remains within
one renderer's dev server behind a same-origin development proxy. Cold starts are
slower than retaining everything; browser HTTP caches can retain immutable bytes
without retaining active render loops. Mobile uses serial teardown/start, no
prewarmed second WebGL context. Visual continuity is a later controlled effect.

## 5. Recommended God's Eye consumption mechanism

Choose **option 6, implemented with option 3 source ownership and option 5 artifact
serving**: separately checked out exact source + external ORAS build/bridge wrapper
+ independently versioned same-origin artifact. This is one mechanism, not three
alternative recommendations. Source is immutable; build overlays live outside it.

| Candidate | Upgrade / preservation / divergence | Build, deployment, developer and qualification consequences |
| --- | --- | --- |
| Git submodule | Strong SHA pin, full tree; low divergence if unedited | Recursive checkout/auth ergonomics; CI needs explicit init; Docker must exclude bulk data. Clear provenance/rollback, but does not solve composition, assets, bridges, patches or security. No compelling benefit over external lock here. |
| Subtree / controlled vendor mirror | Full app; easy browsing; copy drift and accidental edits likely | Repository growth, source/data license mixing and noisy upgrades. Reproducible only with recorded upstream and patch separation. Rollback couples Hub and vendor commits. Reject as default. |
| Separate checkout build dependency | Full app, explicit immutable SHA; cheap upstream comparison | Requires bootstrap/cache/offline artifact workflow and source archive hashes. Independent toolchain, CI and rollback; small developer setup cost. Preferred source ownership. |
| Direct pinned modules in Hub | Fine-grained imports, but catalog/UI defaults easily omitted | Couples dependencies, DOM and GPU lifetimes; reconstructs feature composition; apparent ergonomic simplicity becomes adapter breadth. Reject in Hub bundle. |
| Separate built same-origin runtime + bridge | Preserves complete application; independent artifacts and upgrades | Additional build/deploy/version matrix; must pin source and test base paths, provider routes and bridge. Preferred artifact boundary. |
| Hybrid pinned checkout + selected exports in external runtime wrapper | Preserves full app while exposing controlled host capabilities | Preferred overall. Limit exports/internal-entry coupling to one adapter package, pin lockfiles/toolchain, test every release, retain raw/source provenance and tiny patch queue if needed. |

Proposed future ownership: `integrations/renderers.lock.json` records repositories,
SHAs, source archive/lockfile hashes, toolchain image digests, wrapper revision,
patch series hash and output artifact SHA. `runtimes/earth-adapter/` owns build entry,
bridge and configuration; source checkout/cache is outside the repository and
Docker context. These paths are proposals; none is created by this study.

Don't rely on GitHub branch names, mutable image tags, package version alone or
upstream release cadence. Roll back a qualified Hub/bridge/runtime tuple, not an
unrecorded source checkout. Include assets and provider compatibility in the tuple.

## 6. Recommended SWE upgrade approach

First preserve the current runtime artifact by content hash and recover all build
inputs. The current preparation script checks for source; it does not retrieve a
pin. It rewrites Vue version declarations, may install dependencies and builds
WASM; it must not be treated as a pristine-upstream fetcher.

Then establish an official-upstream baseline + explicit ORAS overlay/patch series
in a clean disposable build, comparing native and frontend behavior against the
existing qualified artifact. Migrate data/config, identity routing, search and
chrome behind adapters incrementally. Keep the native star customization until
its science/identity regressions pass against a replacement. Do not “upgrade” by
replacing the current artifact with upstream HEAD or the owner's fork wholesale.

For Phase C, no SWE version upgrade is needed. Existing artifact deployment remains
valid as the starting point; rebuilding it for bridge/embed work requires the
provenance gate in section 29. Existing dense-star 404 qualification remains an
inherited gap, not evidence that a new build is equivalent.

## 7. God's Eye source architecture findings

| Boundary | SOURCE finding at the pinned revision |
| --- | --- |
| Entry | `GE/src/main.js` constructs, starts and exports `application`; `standalone/application.js` rejects a second construction in the same page. |
| Composition | `app/application.js` accepts scene/controls/data/tools constructors, passes earlier components plus AbortSignal and `defer`, starts in that order and tears down tools/controls/data/scene. `start`, `destroy`, `subscribe`, `getState`, `getComponents` are real. Destroy is terminal. |
| Cesium ownership | `app/scene.js` calls `app/viewer.js`, owns viewer/tileset/map stack, registers destruction. Viewer creates its own canvas/context, visible credits, default 60 fps target, disabled stock widgets and preserved drawing buffer. |
| Page assumptions | Scene uses `cesiumContainer`, body-mounted credits and global key state; controls/tools use full application DOM/templates and window events. `contextStore.js` holds a window store. Separate frame is a natural host. |
| Catalog | `app/constructCatalog.js` constructs the complete static list with injected source objects and shared surface/weather services; `app/catalog.js` validates instances and metadata. `standalone/catalog.js` selects default providers. |
| Registration | `app/data.js` registers every catalog layer, attaches services, seals matching metadata, then mounts presentation/restoration. `LayerLifecycle.register` rejects after sealing. QA-only registration requires explicit dev permission and is unsuitable for production integration. |
| UI discovery | `app/layerPresentation.js` consumes manager `getAll()` and layer row-control methods. `ui/layerPanel.js` gives unknown IDs an “Other layers” group. Core control roles still require named upstream layers; keep them all. |
| Sources | Layer constructors receive source interfaces; `application/requests` accepts injected fetch; application services have configurable slots. This is not a promise that every standalone default can be replaced through one public option. |
| Selection | `contextStore.js` records local IDs, layer IDs, entity and metadata; `gev:entity-selected` differs from aircraft tracking's `gev:awareness-subject-selected` lane. Adapter must normalize both; never serialize Cesium entities. |
| Navigation/tracking | Exported `ui/navigation` owns generations/cancellation and releases follow cameras. Layers own tracking parameters/restore resolution; viewer has camera/tracked-entity events. Don't compete with navigation using arbitrary camera writes. |
| Time | Viewer clock exists, but weather owns a shared observation timeline and satellite rendering/tracking uses `Date`/`Date.now`. Live flight observations have their own source times. No universal simulation-time control is established. |
| Cleanup | App AbortSignal/deferred cleanup, layer disable/destroy, render-governor removal and viewer destruction exist. Whole-app browser teardown remains untested here. |
| Build/server | Exported `build/vite`/`build/html` separate browser configuration/template expansion from `server/standalone/vite.config.js` env loading and provider middleware. Static build alone does not supply provider APIs. |

Representative layers inspected: satellites' source/ingestion/orbits/rendering/
tracking; flights' records/ingestion/rendering and aircraft provider modules;
weather source/clock/index; CCTV source/index/lifecycle. Weather tracks bounded
observation windows and missing coverage. CCTV requires catalog/health/frame/media
methods and separate media cleanup, demonstrating why “just Cesium” loses product
behavior. No whole-repository source audit was performed.

## 8. External extension points and minimum hooks

| Mechanism | Classification | Evidence / constraint |
| --- | --- | --- |
| Application lifecycle constructors | SUPPORTED NOW | Public `application` plus scene/controls/data/tools exports; fixture proves ordered lifecycle, not WebGL. |
| External layer instances in a composed catalog | SUPPORTED WITH WRAPPER / ADAPTER | Build complete default catalog, append namespaced ORAS instances/metadata before `createApplicationData`; preserve `surface`, `weatherClock`, registry and all default layers. PROBE proves registration, activation, cleanup and manager discovery. |
| Hot-register after ready | REQUIRES SMALL GENERIC UPSTREAM HOOK if genuinely needed | Current production manager intentionally seals. Do not use QA globals; no need for hot registration in proposed design. |
| Full standalone app accepts external catalog additions/providers | REQUIRES SMALL GENERIC UPSTREAM HOOK for preferred low-copy path | Standalone factory currently hardwires `createStandaloneCatalog`. Lower-level composition works, but copying standalone orchestration indefinitely defeats full-app upgradeability. |
| Generic toggle UI / per-layer controls | SUPPORTED NOW | Manager rows, `getRowControls`, subscriptions; custom layers land under Other. Custom named Astronomy grouping is adapter UI work or a later generic group-metadata hook, not required for capability. |
| Viewer primitives/data sources / attribution | SUPPORTED WITH WRAPPER / ADAPTER | Scene exposes viewer; layer lifecycle receives it. Own/remove created primitives/data sources; add credits through Cesium credit display, retain required upstream credits. |
| Selection / camera / navigation | SUPPORTED WITH WRAPPER / ADAPTER | Context events, navigation generations, layer tracking APIs and viewer events; normalize types and completion semantics. |
| Source/provider replacement | SUPPORTED WITH WRAPPER / ADAPTER in catalog constructors | `sources.satellites.readGroup`, flight `getSnapshot`, CCTV interface, weather feed. Full standalone needs the catalog hook above. |
| Time updates for external astronomy layers | SUPPORTED WITH WRAPPER / ADAPTER | Adapter time service owned outside upstream; inject into extension constructors and abort stale work. Does not synchronize existing live layers. |
| Historical satellite display synchronized to Hub time | REQUIRES SMALL GENERIC UPSTREAM HOOK | Inject one simulation clock into satellite propagation/render/tracking/orbit paths; retain independent wall clock for acquisition/freshness. Never monkeypatch global Date. |
| Replacing whole catalog/UI to integrate astronomy | REQUIRES DEEP FORK | Rejected; no desired layer requires this approach. |

Minimum proposed full-app hook: export `createStandaloneApplication` under a public
package path and allow a `createCatalog({defaultCatalog, scene, signal})` callback
before controls/data construction. Default behavior remains unchanged. The callback
may return the complete catalog extended with additional layers/metadata; validate
unique IDs and preserve catalog-owned services. For source substitution, expose a
`layerSources` override merged with standalone defaults **before** constructing
that default catalog. Do not copy all default provider choices into ORAS.

These are small generic proposals, not existing APIs. No hook is necessary merely
to frame the complete app or attach a basic Phase C bridge: an external Vite entry
wrapper can import the pinned original `src/main.js`'s exported application. That
single internal entry path is an explicit compatibility seam, tested per upgrade;
prefer the public standalone export once available. Do not depend on debug globals.
Future extensions should wait for the generic composition hook or a separately
approved tiny patch, rather than making Phase C a custom full-app composition.

| Desired future layer | External implementation direction | Status |
| --- | --- | --- |
| EclipseLayer | Source-backed paths/intervals, Cesium geometry, injected Hub time | SUPPORTED WITH WRAPPER / ADAPTER; data/math qualification remains |
| FireballLayer | Dated event points/uncertainty, identity/details/credits | SUPPORTED WITH WRAPPER / ADAPTER |
| AuroraLayer | Timestamped footprint/raster with coverage and expiry | SUPPORTED WITH WRAPPER / ADAPTER |
| LightPollutionLayer | Qualified imagery provider, legend and attribution | SUPPORTED WITH WRAPPER / ADAPTER |
| ObservatoryLayer | Catalog-driven entities and selection records | SUPPORTED WITH WRAPPER / ADAPTER |
| AstronomySmokeLayer | Qualified smoke/forecast imagery; distinguish forecast/observation | SUPPORTED WITH WRAPPER / ADAPTER |
| ORASSiteLayer | Canonical site/context; future measured horizon separate | SUPPORTED WITH WRAPPER / ADAPTER |

All seven share the full-app composition-hook dependency. This is mechanism
feasibility, not a built layer or licensed dataset. Persist ORAS extension state
in Hub namespaces; upstream share-token registry is static and must not be
silently extended or have tokens reassigned. `local-only` fixture metadata proves
lifecycle registration, not production sharing semantics.

## 9. Complete-feature preservation

| Approach | Decision |
| --- | --- |
| Full app inside Hub host | Preserves mature feature/UI relationships best. Wrapper controls product integration, upstream retains Earth-local controls. |
| Selected modules under rewritten ORAS UI | Reject for Phase C: risks dropping tools, controls, sources, media, share state, scene packs and future additions. |
| Staged hybrid | Preferred: full application first, then expose stable capabilities through adapter and gradually unify product chrome without removing local tools. |

Preservation inventory includes civil/military/local aircraft, satellites/orbits/
passes UI, vessels, CCTV/media, traffic, earthquakes/fires/perimeters/launches,
weather/wind/cyclones, maps/terrain/3D/recent imagery, datacenters/dams/cables/
installations/awareness/ALPR, transit/bikeshare/radio/directions, drawing,
annotations, director/scene packs, share links, search, cockpit, display effects,
welcome/settings and optional voice. Full upstream catalog remains the default;
compare its IDs and controls at every upgrade. Added upstream families require
provider qualification, not automatic deletion or automatic public enablement.

Keep one Hub product navigation shell; Earth's controls remain contextual inside
the Earth viewport. Provider settings that write local credential files are not
public-user controls: retain their operator capability in a protected local/admin
surface. An unavailable feed should explain its requirement. Preserve simulated
traffic/estimated poses and launch labels; do not treat those as scientific input.
Commercially incompatible bundled datasets must be excluded from build inputs,
including compiled derived coordinates, with equivalent feature capability retained
through a qualified source or explicit unavailable state. A disabled toggle alone
is not data-license compliance.

## 10. SWE divergence inventory and migration cost

Comparison scope: `src`, `ext_src`, `apps/web-frontend`, `Makefile`, `SConstruct`.
Against `023e3b26…`: 506 upstream files checked, 486 byte-identical, 20 different,
0 missing. Five additional source files (the three `oras_*.js` assets and two ORAS
status dialogs). Same 486/20/0 counts against current official upstream; lockfile
contents differ. This is a scoped file inventory, not a whole-tree size claim.

Only **12 vendor files are tracked** in the Hub. Seven are modifications of
upstream files and five are additions. **13 differing upstream files are ignored
local files**, including main/build config/branding/localization/package inputs.
The vendor has no nested `.git`. Existing public runtime has 3,843 tracked files,
including generated assets/data; do not extend that historical pattern for Earth.

| Category | Concrete files / behavior | Migration recommendation |
| --- | --- | --- |
| A — local data | `App.vue`; `assets/oras_data_config.js`, `oras_catalog_packs.js`, `oras_dense_stars.js`; mounted packs, dense-star chain, satellite feed, local planetary textures, DSS provider choice | Move acquisition/manifests to external generated data and source adapter; keep order/fallback behavior qualified. No bulk Docker data. |
| B — canonical identity/navigation | `App.vue`, `assets/sw_helpers.js`, `selected-object-info.vue`; exact catalog/source/model links, typed materialization, point/lock, fallback coordinates, copy links | Extract external Sky compatibility module/bridge after regression proof. Keep strings and canonical identity; fallback selection alone is not camera proof. |
| C — renderer/science | `src/modules/stars.c`, 204 inserted/50 deleted lines against official anchor | Highest-risk retained native patch: Julian epoch handling, source/EPHE consistency, proper motion, Gaia/HIP identity lookup, magnitude/color/label behavior. Genuine C customization today; external data alone cannot replace native lookup/interpretation. Seek generic upstream changes, do not remove opportunistically. |
| D — UI/chrome | Two ORAS status dialogs, selected-object summary, store profile, loader/toolbar/public title/locales | Move product branding/status to wrapper or Hub; use frontend plugin configuration for embed. Preserve error, selection and attribution access. |
| E — build/runtime | Ignored `.env.production`, `.gitignore`, package.json/yarn.lock, `vue.config.js`, `main.js`; generated npm lock; Hub prepare/build/sync scripts and build marker | Capture safe configuration schema, lockfiles and toolchain; move base paths/data mounts/build overlays outside immutable source. Do not print or commit environment secrets. |
| F — search | `skysource-search.vue`, `target-search.vue`, `sw_helpers.js`; local/API lookup and routing | External search/source adapter with canonical resolver; retain search UI until equivalent host capabilities exist. |
| G — historical/obsolete candidates | `location-mgr.vue` disables network tiles/geocoder; removed JSONP setup; fork `serve_dist.py`; old build/branding changes | Review necessity against current no-external-data policy before removal. “Historical candidate” is not proof it is obsolete. No deletion here. |

Exact 20 differing relative paths:

```text
apps/web-frontend/.env.production
apps/web-frontend/.gitignore
apps/web-frontend/package.json
apps/web-frontend/public/index.html
apps/web-frontend/src/App.vue
apps/web-frontend/src/assets/sw_helpers.js
apps/web-frontend/src/components/gui-loader.vue
apps/web-frontend/src/components/location-mgr.vue
apps/web-frontend/src/components/selected-object-info.vue
apps/web-frontend/src/components/skysource-search.vue
apps/web-frontend/src/components/target-search.vue
apps/web-frontend/src/components/toolbar.vue
apps/web-frontend/src/locales/de.json
apps/web-frontend/src/locales/en.json
apps/web-frontend/src/locales/fr.json
apps/web-frontend/src/main.js
apps/web-frontend/src/store/index.js
apps/web-frontend/vue.config.js
apps/web-frontend/yarn.lock
src/modules/stars.c
```

Other concrete magnitudes at this anchor: App.vue +418/-28, sw_helpers +393/-144,
selected-object-info +143/-29, yarn.lock +1291/-1373 (text line comparison).
Most engine native files match; integration behavior is concentrated but not
trivial. Ignored source inputs are a reproducibility blocker for a clean SWE
rebuild/upgrade, not proof the deployed artifact is broken. Exact original import
and full extra generated/config inventory remain unproven; do not fabricate a pin.

## 11. SWE embedded/chrome recommendation and capability matrix

Least divergence: **external frontend plugin/build overlay inside the Sky frame**,
using existing `onAppMounted`/`onEngineReady` hooks and Vuex `showMainToolBar`,
`showNavigationDrawer` and individual button flags. A wrapper-selected embed
configuration should suppress redundant navigation while retaining contextual
selection/time/view controls until the Hub has equivalents. Standalone keeps its
current controls. No proven stock `?embedded=1` API was found.

`main.js` discovers plugin entries via `require.context`; a future staging overlay
can add an ORAS plugin without editing pristine upstream files. Hook access to
App/store/engine permits bridge initialization. Direct cross-frame DOM scraping
or broad CSS hiding is brittle and can hide credits, errors or keyboard controls.
Narrow runtime-local CSS can be temporary, selector-tested and rollbackable.
Direct Vue composition/alternate canvas entry would discard accumulated data,
search and fallback behavior; defer until those move behind qualified adapters.
If existing flags cannot hide a specific global-chrome element, propose a generic
`embedded` frontend flag with explicit retained controls, not a science change.

All matrix entries below are **SOURCE**, not newly browser-tested bridge support.
“Available” means inside the renderer; every capability still needs protocol
validation and an adapter before the Hub controls it.

| Capability | Classification | Source / limitation |
| --- | --- | --- |
| Set observer/location/elevation | AVAILABLE CLEANLY | `observer.c` longitude/latitude radians, elevation metres; App `setLocation` and query handling coordinate with store. Adapter disables competing auto-location intent. |
| Set/get UTC time | AVAILABLE CLEANLY | `observer.utc` MJD, `date2MJD`/`MJD2date`; do not substitute TT field. |
| Set/get rate | AVAILABLE CLEANLY | `core.time_speed`; query initialization resets it to 1, so sequence bridge hydration after initialization. |
| Canonical search | AVAILABLE THROUGH EXISTING ORAS HOOK | `sw_helpers` local/API resolution, `oras_data_config`; native names alone do not guarantee catalog identity. |
| Canonical focus | AVAILABLE THROUGH EXISTING ORAS HOOK | App exact-link paths, `setSweObjAsSelection`, `pointAndLock`, C identity lookup. Maintain data readiness and ownership cleanup. |
| Selected canonical identity | AVAILABLE THROUGH EXISTING ORAS HOOK | Store/`__orasSkySourceData` and object metadata; unresolved/native-only selection can lack a canonical mapping, report unmapped. |
| Selection events | REQUIRES BRIDGE WORK | `core.selection`, `onValueChanged` and store changes exist; dedupe and normalize canonical identity. |
| Camera direction | AVAILABLE CLEANLY | Observer yaw/pitch/roll/azalt, mount/frame context; bridge must name units and frame. |
| FOV / zoom | AVAILABLE CLEANLY | `core.fov`, `core.zoom`, `zoomTo`; preserve angular versus distance semantics. |
| Layer visibility | AVAILABLE CLEANLY | Module properties / `createLayer`; negotiate specific allowed IDs. |
| Constellations | AVAILABLE CLEANLY | lines/labels/images/bounds visibility in constellations.c. |
| Labels | REQUIRES BRIDGE WORK | Per-module labels/hints, not one proven global all-labels switch. |
| Grids | AVAILABLE CLEANLY | Lines module and named line visibility; map allowlisted grid names. |
| Satellites | AVAILABLE CLEANLY | module visible/hints and mounted data; feed readiness separate. |
| Atmosphere | AVAILABLE CLEANLY | atmosphere.visible. |
| Landscape | AVAILABLE CLEANLY | Landscape module/source state; qualify exact selected landscape and visibility mapping. |
| Engine readiness | AVAILABLE THROUGH EXISTING ORAS HOOK | `onReady`, plugin `onEngineReady`, `window.__ORAS_STEL`; latter is existing local hook, not recommended cross-frame transport. |
| Fully usable data readiness | REQUIRES BRIDGE WORK | Engine ready precedes asynchronous star chain/DSS/catalog loads; report capabilities/degradation separately. |
| Navigation completion | REQUIRES BRIDGE WORK | Point/lock APIs have no proven end-to-end acknowledgement; check requested identity plus settled direction/lock with timeout/cancellation. |
| Errors / failure state | REQUIRES BRIDGE WORK | WASM-support store and catches/logs are not a structured error channel. |
| In-place suspend/destroy/restart | UNKNOWN / NOT SUPPORTED as a complete lifecycle | canvas.js recursively schedules rAF and installs page listeners; object.destroy releases an object, not engine. Safe default is document removal. A reusable in-place lifecycle falls under REQUIRES SWE SOURCE CHANGE. |

## 12. Minimum universal state

Hub owns a small serializable record: mode; UTC time intent (`live` or fixed epoch
plus rate); observer identity/lat/lon/elevation and datum/availability; canonical
selected entity; selected body; camera intent; navigation request ID/action;
applicable namespaced layer preferences; bounded history/return context. Use
revision numbers and identify which renderer/user interaction originated changes.

Renderers own matrices, tracking implementations, ephemerides/propagation execution,
GPU objects, geometry, catalogs/tiles, transient hover, weather playback and
provider acquisition caches. Never mirror every camera tick or full layer records
into Zustand. Runtime-local views can be saved as a bounded opaque snapshot with
runtime-version compatibility, separate from authoritative product intent.

Requested time and displayed data time are different facts. Earth can report
`live-only`, observation epoch, latency, forecast interval or unsupported simulation
request. Phase C preserves fixed Sky time through Earth without relabeling live
Earth feeds as historical. Mode changes do not silently reset time or fabricate
entity correspondence. Universal state is product intent, not a global physics engine.

## 13. Bridge recommendation

Use a typed envelope over **postMessage handshake followed by a MessageChannel**.
Check exact origin, expected frame `event.source`, per-mount nonce and protocol
major before transferring the port. Validate schemas, size bounds, finite values,
allowed operations and string IDs at both ends. Use exact `targetOrigin`, never
wildcard. Same-origin trust limitations still apply; this is coordination, not
protection against compromised same-origin JavaScript. See
[MDN postMessage security guidance](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).

Envelope concept: protocol major/minor, runtime ID/version, mount generation,
request ID, state revision, operation/event, payload. Negotiate capabilities and
limits; reject incompatible major versions; unknown optional capabilities degrade
explicitly. Pin compatible release tuples. Do not freeze a complete production
schema in this study.

Hub→runtime: `initialize`, `setTime`, `setObserver`, `focusEntity`, `exploreBody`,
`setLayer`, `setCameraIntent`, `trackEntity`, `suspend`, `resume`, `destroy`.
Runtime→Hub: `ready`, `capabilities`, `selectionChanged`, `timeChanged`,
`cameraChanged`, `layerStateChanged`, `navigationComplete`, `error` plus correlated
acknowledgements. Advertise only implemented operations. Earth Phase C does not
advertise arbitrary historical satellites; Sky does not advertise in-place restart.

Commands acknowledge accepted/applied/unsupported/failed separately; readiness
is not navigation success. New navigation cancels prior generations; drop late
messages from removed frames. Hydrate only after handshake; avoid feedback loops
by echoing origin/revision and excluding no-op updates. Throttle camera events;
retain only intent-level changes. Failures carry safe codes, affected capability
and retryability, not credentials or provider response bodies.

Identity uses `catalog + source_id + model`, all IDs strings; retain source-backed
RA/Dec fallback and frame/epoch when relevant. Map NORAD and ICAO namespaces
explicitly. Display name is never identity. Do not send renderer object pointers,
raw Cesium entities or WASM handles across the boundary.

## 14. Renderer lifecycle and memory

| Strategy | Decision / tradeoff |
| --- | --- |
| Only active renderer mounted | **Default.** Save product/context snapshot, bounded teardown, remove old document, start next, handshake/hydrate. Cleanest page-global/WASM lifetime; accepts reload cost. |
| Brief overlap | Future opt-in desktop experiment only, with measured budget and hard deadline. Not Phase C or mobile default. |
| Suspended frame cache | Reject default. Pausing rAF retains WASM heap, WebGL allocations, listeners and possibly polling; CSS hiding is not disposal. |

SWE `SConstruct` allows memory growth; its WebGL context and callback/listener graph
are page-owned. `SweObj.destroy()` is reference release, not WASM unload. No fixed
heap/RSS/startup estimate was measured. God's Eye has `application.destroy`, abort
and layer/viewer cleanup; [Cesium Viewer.destroy](https://cesium.com/learn/cesiumjs/ref-doc/Viewer.html#destroy)
releases its widget resources, but browser/GPU reclamation timing must be measured.
God's Eye cockpit effects can create auxiliary GPU work, so “one renderer” does
not imply exactly one canvas/context in that renderer.

On handoff request Earth destroy and await a bounded acknowledgement; always remove
frame after the timeout too. For Sky remove the frame; do not claim nonexistent
complete engine teardown. Release host ports/listeners/snapshot URLs/references.
Create a new document to return. Reuse versioned HTTP asset/tile caches, not live
engine instances. Qualify repeated desktop/mobile cycles for no *inactive*
retained renderer contexts, no continued polling/audio and bounded heap growth.
No performance benchmark or context-reclamation proof was run in Phase B.

## 15. Controlled handoffs and visual continuity

Transfer mode/time/observer/entity/body/camera intent/navigation intent, not a raw
camera matrix. ISS future Sky→Earth carries canonical NORAD identity, relevant UTC,
source release/epoch context and `locate`/`track`; Earth→Sky carries the same identity
and time, canonical ORAS observer and `focus`. Destination validates availability
before claiming centering. A live-only destination rejects or explicitly offers a
live-time transition; it never silently changes a fixed-time ISS request.

Mars future Sky→Planet carries canonical body identity, time and globe/surface
intent. Reverse restores saved local Sky observer/time/body focus. Both need
bounded errors, cancellation, browser history and a usable return path. No ISS
or Mars implementation belongs to Phase C.

Preferred later illusion: **fade/mask to a static transition surface, serially
replace renderer, then reveal the destination**. Optional screenshot under the
mask can retain orientation cues; export may fail from canvas/CORS/provider
restrictions. God's Eye preserves its drawing buffer, SWE does not; neither
proves reliable capture of all providers. Neutral atmosphere/space fade works
without capture. Shared screen-space anchor and apparent body-disc size can help
where measurable; they do not establish common 3D geometry. Preload immutable
bytes if useful, but no second live renderer by default. Crossfade between two
live scenes is a later measured optimization, not a Phase C dependency.

## 16. Scale-driven navigation findings

SWE reports angular FOV/zoom and selected body; Cesium reports camera position,
height/range and movement. These are domain-specific signals, not a common
physical zoom coordinate. Body selection/context is available; unrestricted
solar-system travel remains OPEN (section 21).

Future transitions should use a state machine requiring appropriate selected body,
scale band, explicit user input direction, dwell/hysteresis and no active tracking
or programmatic camera animation. Clamp oscillation and require a reverse threshold
or explicit back action. Never trigger solely because a search animation changed
FOV. Retain explicit Explore Earth/Explore Mars actions and an accessible mobile
button; pinch may arm a visible transition affordance rather than unexpectedly
switch domains. Hardware scroll distance is not a portable threshold.

Thus the local sky→Earth→solar system→planet→surface product path is feasible as
controlled transitions; geometrically continuous zoom is unproven. Phase C has
explicit navigation only. Threshold tuning, mobile gesture QA and solar-system
proof are later tasks.

## 17. Satellite integration recommendation

Keep ORAS canonical identity, versioned normalized TLE releases, provenance,
freshness/deployment policy and validated local observing calculations as authority.
Current anchors: `backend/app/services/satellite_tle_catalog_service.py`,
`satellite_feed_status_service.py`, `satellite_propagation_service.py`, and
`scripts/skydata/build_oras_satellite_tle_release.py`.

God's Eye `createSatellitesLayer({services, source})` accepts `readGroup(group,
{signal}) → {ok,status,text}`. Ingestion expects named two-line TLE entries,
parses through satellite.js and deduplicates NORAD IDs numerically. A future ORAS
source adapter can select qualified release records by explicit groups and render
name/TLE text; normalize bridge IDs back to strings. ORAS release coverage is not
assumed to contain every God's Eye group (including GPS/Galileo/Starlink).
Missing groups stay unavailable; do not invent membership, silently substitute
another release or flood Above Me with Earth catalog entries.

Carry release SHA, TLE epoch/freshness and provenance in a sidecar adapter status;
`{ok,status,text}` alone cannot express the full ORAS truth contract. Reject expired
or unavailable releases according to ORAS policy, and expose status honestly.
Current “CelesTrak” strings must be provider-neutral/accurate before claiming ORAS
source integration. Catalog source injection does not replace God's Eye propagation.

Preserve God's Eye orbit rendering, tracking, labels, catalog and pass UI. Its
satellite.js math must be compared with ORAS Skyfield at the same TLE, UTC and
reference frames before cross-engine science claims. Historical rendering needs
the clock hook in section 8; raw `viewer.clock.currentTime` is insufficient.
Existing God's Eye pass methods can remain as capability, but neither those methods
nor ORAS legacy pass endpoints are certified as production observing predictions.
Provider/propagator authority qualification belongs before Phase D, not this study.

## 18. Flight integration recommendation

**Yes: largely replace the current nearby acquisition implementation later with a
qualified, server-hosted God's Eye flight provider stack and a normalized shared
adapter.** Keep Hub curation/science separate; do not run duplicate upstream polling
in both FastAPI and Earth. A Node provider service can own acquisition; FastAPI
consumes normalized observations for Above Me/flight projection.

SOURCE: `GE/server/providers/aircraft/opensky.js` includes OAuth client credentials,
coalesced token renewal, adaptive successful-response cache, 429 cooldown and
stale response metadata. Regional adsb.lol fallback is bounded to 250 nautical
miles, cached 12 seconds per coarse anchor (bounded 80 entries), when no usable
OpenSky snapshot is available; it is not worldwide completeness. `tracks.js` and
`enrichment.js` provide history/backfill and ADSBDB enrichment. Live-source
normalizers preserve position/time/altitude fields; flight ingestion distinguishes
stale/unknown freshness. Rendering and tracking use motion interpolation,
retention, models, terrain/height heuristics and camera ownership.

Optional browser WebUSB receivers and operator-configured readsb/aircraft.json
feeds are supported upstream, not installed at ORAS. Public hosting must not expose
LAN receiver proxies indiscriminately. Keep local receiver authority and user
permission explicit; preserve hardware capability without assuming mobile support.

Current Hub `fetch_opensky_nearby` fetches states/all with a four-second timeout,
filters up to four nearby flights by default, uses a small cache, discards much of
the source timestamp/altitude context and computes `max(5,min(85,altitude/250))` as
“elevation.” This is not geometric elevation and conflicts with the no-fake-data
rule. Reported here; no repair is authorized in this study. Before future Sky
flight use, remove that heuristic from the consuming path in a bounded task.

God's Eye visual altitude also has fallback behavior: `FlightRecords` can retain
barometric data and use a 10,000 m airborne default in a missing-data label path;
render positions can be terrain-clamped or interpolated. Never use displayed
positions or defaults as scientific observations. Upstream flight acquisition
is the stronger foundation, not automatic scientific certification. OpenSky and
ADSBDB operational/data rights remain provider gates.

## 19. Earth→Sky aircraft projection

Conceptually feasible with genuine simultaneous geodetic positions: convert
observer and aircraft to WGS84 ECEF, subtract, rotate the difference to local ENU;
`az = atan2(E,N)` wrapped to 0–360°, `el = atan2(U,hypot(E,N))`, range is the vector
norm. This is geometric line of sight, not guaranteed visibility or refraction/
horizon correction. [ESA Navipedia](https://gssc.esa.int/navipedia/index.php/Transformations_between_ECEF_and_ENU_coordinates)
provides the reference transformation.

Canonical requested ORAS context is lat 41.321903°, lon -79.585394°, elevation
432.816 m. Qualify the elevation datum before combining it with ellipsoidal
aircraft height. Require observation UTC, source and altitude type; pressure
altitude is not geometric height. Unknown altitude/time means unavailable
projection, not zero/default elevation. Do not project a renderer's clamped or
dead-reckoned coordinate as a measured observation.

Existing `sky_coordinates.py` transforms celestial RA/Dec, not finite terrestrial
geodetic positions. `satellite_propagation_service.py` supplies useful observer/
UTC/topocentric conventions via Skyfield but is satellite-specific. Recommend a
small future `terrestrial_projection_service` with datum-explicit normalized
observations, reference-vector tests (zenith, quadrants, horizon, below-horizon,
missing/stale data) and independent library comparison. No implementation or
numerical proof was run here.

## 20. Planetary / Cesium recommendation

God's Eye remains Earth. Reuse architectural patterns from viewer creation,
camera/navigation ownership, map-source switching, abort/disposal and adapters;
reuse a public module only after proving it has no Earth provider/global assumptions.
Do not import the complete God's Eye scene/catalog into a Mars runtime.

A separate future body-aware Cesium runtime needs qualified body ellipsoid/radii,
planetographic versus planetocentric coordinates, east/west longitude convention,
body-fixed frame and rotation/time, imagery tiling/projection, terrain reference,
atmosphere, nomenclature, labels and source credits. Geology, mission records,
landing sites and rover tracks require body-specific datasets and provenance.
Earth terrain, geoid, geocoding, Google tiles, weather and live layers are not
portable defaults. Cesium Viewer supports custom components, but this study does
not prove arbitrary-body terrain/rendering behavior. Mars is the first bounded
proof; no new renderer dependency is added. The Hub already declares a Cesium
dependency in its frontend; that is not a God's Eye or Mars integration.

## 21. Solar-system renderer conclusion

SWE can select/focus known planets and render local-sky planetary context; current
App loads body survey sources, and native planets/observer modules provide the
foundation. `observer.space` exists, but `observer.c` still builds Earth-referenced
positions, and the inspected exposed properties do not establish a complete
cross-body travel/camera UX. Presence of a space flag is not a solar-system product.

**OPEN:** useful solar-system-scale exploration ownership. Smallest later proof:
in an isolated SWE harness at a recorded SHA, move through Earth/Moon/Mars contexts,
verify supported observer-space positioning, target identity, frame/time consistency,
near/far clipping, body apparent size and return to the ORAS observer. If public
APIs cannot represent the observer position/camera requirements, record the missing
API before considering another renderer. This does not block Phase C Sky/Earth.

## 22. Bounded provider / license inventory

Primary statements below are **upstream-declared**, not independent legal approval:
[LICENSE](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/LICENSE),
[DATA_SOURCES](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/DATA_SOURCES.md),
[SECURITY](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/SECURITY.md).
This is an architecture inventory, not legal advice or complete provider audit.

| Family / provider | Credentials | Upstream terms / attribution | Public-host concern and proposed treatment |
| --- | --- | --- | --- |
| God's Eye code / dependencies | None | MIT source; dependency notices separate | Retain notices; code rights do not cover data/assets/APIs. SWE separately uses AGPL-3.0 or commercial terms; preserve applicable source/license obligations. |
| Flights / OpenSky | OAuth server credentials, anonymous mode possible | Research/noncommercial constraints, operational permission may be needed even for nonprofit; OpenSky/paper credit | Obtain deployment permission/qualified alternative; don't infer permission from nonprofit status. |
| Civil fallback/military/traces / adsb.lol | Generally keyless | ODbL; contributor attribution | Bounded access/caching; qualify distribution and coverage labels. |
| Aircraft/route enrichment / ADSBDB | Keyless | No published general license/rate limit; route database has permission restrictions; credit ADSBDB and named route authors | Hold redistribution/route persistence until qualified; preserve optional enrichment interface. |
| Satellites / CelesTrak, future ORAS release | Usually keyless | Upstream describes government-origin data/citation request | Cite CelesTrak/source; qualify acquisition/redistribution/freshness and release coverage independently. |
| Vessels / AISStream | Server API key | Upstream notes beta/no formal terms; courtesy credit | Unclear rights/quotas are a gate, not blanket public permission. |
| Imagery/3D/places / Google, Cesium ion, Esri | Restricted browser tokens; separate Google server key where needed | Provider-specific terms/eligibility/billing; visible logos/credits | Keep credit line visible; qualify hosted plan, metering, token scopes and imagery use. Keyless Esri still has terms. |
| Terrain / Re:Earth-Mapterhorn | Keyless option | CC BY 4.0 mesh, public-domain EGM2008 note; terrain credits | Qualify datum, quotas and tile access; no bulk mirror assumption. |
| Weather / NOAA, ECMWF, Open-Meteo | Mostly keyless options | NOAA attribution/disclaimers; ECMWF CC BY plus terms/disclaimer; Open-Meteo terms/credit | Distinguish forecast/observation and coverage; check hosted usage limits. Lightning density permission does not cover raw Vaisala detections. |
| Fires/quakes/launches/recent imagery / NASA FIRMS, USGS, Launch Library, NASA GIBS/CMR | FIRMS optional server key; others provider-dependent | Per-source credit/terms; NASA/USGS public-data direction, Launch Library terms separately | Preserve attribution, rate/cache restrictions and estimated launch geometry labels. |
| Roads/infrastructure/ALPR/search / OSM, OpenFreeMap, Photon/Nominatim | Keyless or configured services | ODbL, provider fair-use policies; OSM/OpenMapTiles/provider credits | At-scale service plan/self-hosting where needed; current default avoids public Overpass. Map data rights and tile/API service rights differ. |
| Traffic / TomTom and road simulation | Optional server key | Provider terms; TomTom + road credits | Label simulation; bound metered requests; never infer measured vehicle positions. |
| CCTV / municipal and regional sources | Some keys (e.g. TfL); many keyless | Per-feed open-government/CC BY or distinct terms; camera-provider attribution | Qualify catalog, image and stream rights separately; no general recording/redistribution grant. |
| Transit / agency GTFS-RT; bikeshare / GBFS | Feed-dependent | Agency/feed terms and credits | Maintain feed allowlist, limits, retention and disabled-source status. |
| Radio / Radio Browser + broadcasters | Keyless directory | Directory PDDL; stream rights separate | Direct explicit playback, no recording/relay assumption; preserve broadcaster privacy disclosure. |
| Cables / TeleGeography | Bundled | CC BY-NC-SA 3.0, TeleGeography attribution | Noncommercial qualification or license/alternate dataset; exclude incompatible data from artifact, retain feature. |
| Nepal event pack / Vantor-GeoPera | Bundled | CC BY-NC 4.0; derived source coordinates also restricted | Qualify or exclude imagery AND compiled derived data; witness posts retain their own rights. |
| Aircraft/other 3D models | Bundled | Individual model licenses/author/source/modification credits | Audit asset manifest before distribution; not MIT merely because in repo. |
| Voice / OpenAI; locality news / Google RSS, GDELT | Voice server secret | Service terms, usage costs; Google News personal/noncommercial restriction, publisher rights; GDELT citation | Keep optional capability, qualify hosted use/consent/budgets; sources remain untrusted context. |

Attribution must survive hidden chrome/fullscreen. Extend credit display externally
for ORAS sources. No provider has been activated, purchased or reconfigured here.

## 23. Security and production hosting

Upstream explicitly describes a local-first demo/exploration client, not a hardened
public service. Its provider middleware is a credential broker. Keep OpenAI,
AISStream, OpenSky OAuth and Google server credentials on a protected server;
browser Google/Cesium tokens are intentionally public and require API/origin/asset
scope and quota restrictions. Do not share one over-permissioned Google key for
browser and server in a public deployment.

Run reviewed provider modules behind a production HTTP service/reverse proxy,
not an exposed Vite development server. Preserve upstream fixed-host/registered
URL policies, redirects/body/time caps, normalized errors and OAuth coalescing.
Add appropriate auth for spend-bearing/admin paths, origin/CSRF policy for
mutations, request and concurrency limits, shared quota accounting, bounded caches,
provider billing controls and secret-redacted logs. Process-local opt-in throttles
are not billing caps or distributed protection.

Do not expose local credential-edit/restart or LAN receiver routes publicly.
Retain these as protected operator/local capabilities. Optional voice token
minting must require authorized usage, not merely knowledge of its URL. External
feeds/model outputs cannot authorize host navigation/commands outside the bridge
allowlist. CCTV/media and imported scenes retain their source-specific trust rules.

A concrete embedding obstacle: `GE/build/vite.js` defaults to `X-Frame-Options:
DENY` and `frame-ancestors 'none'` for the settings-bearing document. The ORAS build/
production host must intentionally scope embedding headers to SAMEORIGIN /
`frame-ancestors 'self'` after separating/protecting settings operations. Changing
headers without that protection is not a complete hosting solution. Browser/worker/
media CSP, WebUSB permissions and provider origins require qualification.
No production security assessment or hardening was performed here.

## 24. Build and deployment recommendation

Use one public origin with independent immutable artifacts:

| Public path | Owner / behavior |
| --- | --- |
| `/`, `/observe`, `/tonight`, `/sky-engine` | Existing Hub shell/routes; preserve direct/shareable fallback pages |
| `/oras-sky-engine/` | Existing Sky runtime and exact links; keep stable, no speculative rename |
| `/earth` | Proposed Hub host route, one shell around Earth viewport |
| `/earth-runtime/` | Proposed independently built full God's Eye document/assets |
| `/planet-runtime/:body` | Future only; independent body-aware runtime, not God's Eye parameterization |

Nginx should select versioned artifact directories, serve real static files and
return real 404s for missing assets/APIs (no Hub HTML fallback for WASM/tile/JS).
Only host routes get Hub SPA fallback; runtime deep paths get their own entry
rules. Hash JS/CSS/assets; HTML/release manifest revalidates. Pin a complete release
manifest atomically so rollback never mixes old HTML with new hashed chunks.

Non-root support is **PARTIAL by source inspection**: Vite can accept external
base configuration, and SWE already uses `/oras-sky-engine/`; God's Eye has runtime
absolute URLs such as `/api/celestrak/...` and `/scene-assets/` as well as public
models/assets. Vite base rewriting alone cannot fix all runtime strings. Phase C
should preserve a generated, explicit allowlist of legacy God's Eye API/static
aliases at the same origin, routed to its provider/artifact service, while serving
its document under `/earth-runtime/`. Do not proxy all `/api/*` to Earth: Hub owns
existing endpoints. Reject collisions at build time. If an actual collision is
found, use source-injected URL/asset resolvers or propose a generic base-URL hook
before enabling that feature; do not hide the conflict with global fetch rewriting.
Eventually retire aliases behind qualified base resolvers. No non-root build or
browser path claim is made in this study.

Build God's Eye in a separate pinned Node 24+ builder with its lockfile (`npm ci`),
SWE in its recorded Emscripten/Vue toolchain, and Hub in its own toolchain. Do not
force a shared dependency graph. Application shells may be in images; large
skydata/imagery/scene data remain mounted or independently served. Earth's bundled
asset/data sizes and license inclusion need an explicit artifact budget before
copying `public` wholesale. Independent builds avoid invalidating all caches on
one wrapper change; compatibility tuple controls deployment order and rollback.

Future diagnostic contract reports Hub commit, Sky artifact/native hash and SWE
upstream/overlay revisions, Earth artifact/God's Eye SHA, Planet version or absent,
bridge major/minor and capability version. Current Sky build marker has source and
native hashes but no upstream SHA. Do not substitute its Node memory limit for a
browser WASM memory measurement. No diagnostic endpoint is implemented here.

## 25. Reproducible upstream update workflow

God's Eye: qualified lock → candidate SHA → dedicated upgrade branch → verify
source archive/lock/toolchain hashes and clean checkout → compare export/catalog/
provider/asset manifests → build unchanged upstream plus external wrapper → run
compatibility suite → correct adapter only → Docker/browser/provider qualification
→ review and merge the qualified tuple. Keep previous artifact and provider
configuration for rollback. No floating main, unattended full-catalog enablement
or opportunistic provider credential changes.

SWE: first recover source provenance → record official anchor plus complete ORAS
patch/config/generated input inventory → candidate official SHA → apply explicit
series without fuzz → native + frontend clean build → science/identity/data and
bridge/browser suite → migrate/remove patches only with equivalent proof → review
and merge new tuple. Updating lockfile dependencies is still a qualified upgrade;
the current 12-commit upstream delta being lock-only does not prove safe install.

Store source license notices, archive checksums, dependency locks, build image
digests, commands, patch provenance, data-release identities and output checksums.
Fail CI on unexplained upstream edits. Source reproducibility, artifact equivalence
and live runtime qualification are distinct gates.

## 26. Compatibility CI proposal

| Gate | Required future evidence |
| --- | --- |
| Provenance | Exact pins, clean upstream tree, approved patch list, toolchain/lock/artifact hashes; fail missing ignored-source reconstruction or forbidden bulk data. |
| Earth application | Starts from non-root path; viewer/base globe works; complete default catalog/control inventory retained; no duplicate product navigation. |
| Earth representative capability | Flights, satellites and weather plus CCTV/vessels/nonastronomy infrastructure; toggles, selection, tracking, camera cancellation and provider-unavailable UX. Fixture data for deterministic tests, separately labeled live-provider checks. |
| Earth extension | Synthetic namespaced external layer before seal, control discovery, credit, selection/time updates and cleanup; reject duplicate IDs/late registration. Add after composition hook, not as production astronomy in Phase C. |
| Earth cleanup | App destroy, abort fetch/media/voice, listener/timer release, viewer cleanup, new-document restart; hidden/inactive state does not keep polling/audio. |
| Sky | Boot, ORAS releases load, canonical star/DSO/planet/satellite exact links, string Gaia IDs, selection AND camera lock, observer/elevation, UTC/rate, data readiness/errors, unload/reload. Preserve standalone route. |
| Bridge | Version/capabilities, time intent versus effective time, canonical selection, navigation acknowledgements, stale generation/drop/cancel, invalid origin/source/nonce/schema/IDs rejection, unsupported operations and runtime failure isolation. |
| Browser integration | Desktop and representative mobile, Sky→Earth→Sky, direct route/reload/back/forward, fixed Sky time survives Earth live-only mode, one settled heavy runtime, no retained inactive contexts after repeated cycles. |
| Product/provider | Credits visible, restricted features honestly unavailable, no browser secrets, protected admin/spend routes, API/static alias collision test, failed-runtime fallback to independent decision pages. |

Future tests are not Phase B results. Use targeted adapter tests before full browser
qualification; measure representative devices before promising latency/memory
budgets. Third-party availability must not make fixture tests appear as live proof.

## 27. Patch policy

Priority: existing hook → external wrapper/adapter → generic upstream contribution
→ explicitly approved tiny local patch queue. Suggested future location:
`integrations/patches/{gods-eye,swe}/NNNN-short-purpose.patch`, ordered `series` file
and README with base SHA, upstream issue/PR, rationale, license, tests, owner and
removal condition. Applied output hashes must be in the renderer lock/manifest.

Proposed new-integration budget: at most three narrow patches per renderer, each
one boundary concern and normally ≤200 changed lines excluding tests. This is a
review trigger, not permission to split a deep fork into small files. Exceeding it
requires renewed architectural review. Existing SWE science divergence is an
explicit legacy exception to inventory and qualify, not silently squeezed into
that budget or discarded. No scene/science rewrites for chrome convenience.

Apply from a clean pin with exact context, reject fuzz/offset surprises, rerun
focused and browser compatibility, track upstream acceptance and remove redundant
patches. Never edit checkout files manually after application. No patches are
created by this study and no upstream contribution/message was sent.

## 28. Remaining open questions and entry gates

| Item | Consequence / smallest next proof |
| --- | --- |
| SWE ignored inputs / original import | Clean rebuild gate. Recover safe source/config/lock provenance and reproduce artifact before Sky build changes; exact historical import may remain unknown if a new fully recorded baseline is qualified. |
| God's Eye non-root assets/provider routing | Phase C generated alias manifest + collision check + one browser build proof. Source inspection does not prove deployment. |
| Full-app extension factory hook | Needed before low-divergence full-app external extensions/provider injection; not needed for initial framed app. Propose/test generic hook, no astronomy layer yet. |
| Shared satellite time | Inject qualified clock later; Phase C advertises Earth live-only limits. Gate Phase D identity/time/propagation, not initial Earth hosting. |
| Browser lifecycle / memory/startup | Phase C repeated switch/unload tests; no numerical benchmark asserted now. |
| Public-provider and bundled-asset terms | Public deployment gate. Full feature capability preservation does not establish permission; maintain unavailable/provider-required UI. |
| SWE solar-system travel | Later isolated proof in section 21; does not block Sky/Earth. |
| Existing Hub fake flight elevation / visual altitude defaults | Before scientific flight use, replace with datum/time-qualified projection in a separate task. No runtime repair in Phase B. |
| Existing dense-star 404s | Inherited blanket console-clean limitation, separate follow-up unless they prevent bounded Phase C acceptance. |

No evidence requires a deep God's Eye fork or permanent simultaneous renderers.
The preferred architecture has concrete qualification work, not a claim of readiness.

## 29. Exact bounded Phase C implementation plan

This is the next **recommended** task, not authorization or implemented state.
Keep the existing approved shell; obtain any needed visual approval before new
workspace/chrome design. No redesign is necessary for the initial host skeleton.

1. **C0 — source/artifact gate.** Record current Sky artifact checksums and data
   release requirements. Recover the 13 ignored differing inputs, additional
   build inputs/lockfiles and provenance into an approved reproducible recipe,
   excluding secrets/bulk data. Reproduce current behavior from clean inputs before
   a Sky bridge build. Resolve uncertainty by qualifying a recorded reconstruction,
   not guessing the original import. Create renderer lock/build metadata for the
   pinned God's Eye SHA and existing Sky baseline. No version upgrade.
2. **C1 — external Earth build.** Fetch exact God's Eye checkout outside Hub;
   verify hash/clean tree. Build full upstream entry with an ORAS-owned wrapper
   (`runtimes/earth-adapter` proposed) that imports its exported `application`.
   Keep upstream HTML templates/styles/catalog/tools; attach handshake to app
   subscribe/getComponents/destroy. Pin the single entry-path seam. No copied layer
   list, upstream runtime edits, submodule or in-repo vendor tree.
3. **C2 — delivery/provider profile.** Serve `/earth-runtime/`, workers, models and
   required static assets; generate exact legacy alias inventory and collision
   gate. Build the production provider host from pinned provider exports, preserving
   upstream semantics with deployment guards. Protected local/admin-only settings;
   deny public credential writes and unsafe spend access. Qualify allowed keyless
   providers; unavailable keyed/restricted features keep their controls and clear
   status. No public deployment before provider/data inclusion gates pass.
4. **C3 — shared shell host.** Add `/earth` under current ORAS navigation; retain
   Home/Observe/Tonight/Sky and exact standalone Sky links. Reuse a common renderer
   host abstraction for disposable frames with one active mode, loading/error/retry
   and history/reload state. No final immersive UX redesign or new globe UI.
5. **C4 — minimum protocol/state.** Add shared typed envelope/validation and a small
   Hub state module. Implement version/nonce/capabilities handshake, init, version
   reporting, explicit mode switch, time/observer intent storage and structured
   errors. Sky adapter uses existing plugin hooks for UTC/observer read/write and
   ready signals; Earth advertises `live-only` display and reports effective time
   honestly. Preserve selected identity in state, but no ISS/entity transfer action.
   Unsupported commands reject; no fake acknowledgements. Keep fallback direct links.
6. **C5 — lifecycle and chrome.** Save bounded state; destroy Earth then remove its
   frame; remove Sky document; release ports/references; mount destination only
   after teardown. Mobile uses this serial path too. Sky embed plugin hides only
   duplicate product toolbar/navigation with existing flags; preserve local tools,
   credits/errors and standalone chrome. Earth's full local tool suite remains.
   Basic loading/fade only; no scale-driven transitions or overlap cache.
7. **C6 — qualification and review.** Run Docker integration plus focused browser
   desktop/mobile routes/reloads/switch loops; test complete Earth inventory and
   representative live/fixture features separately, source pins, alias routing,
   bridge invalid/stale messages and capability limits, existing Sky exact links,
   observer/time, teardown and failure return paths. Record artifact hashes,
   supported/degraded capabilities and provider gates. Review bounded PR; don't
   declare production readiness from a successful build alone.

Phase C stops with existing Sky + full applicable Earth in one shell and honest
state/lifetime coordination. No astronomy extensions, ISS handoff, satellite source
replacement, flight acquisition replacement, Mars, horizon, eclipse/fireball or
solar-system-scale implementation. Later D/E/F work keeps its own gates.

## 30. Evidence, commands and revisions

[Detailed evidence and exact probe recipe](../validation/UNIFIED_RUNTIME_COMPATIBILITY_EVIDENCE.md)
records commands, outcomes, limitations and the small reproducible fixture. No
God's Eye install/build/browser or Hub application suite ran; no credentials used.
The probe is intentionally below a renderer qualification claim.

Source anchors are at the pinned God's Eye SHA:

- [Application lifecycle](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/application.js), [standalone composition](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/standalone/application.js).
- [Catalog construction](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/constructCatalog.js), [registration/lifecycle](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/data/lifecycle.js), [UI discovery](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/ui/layerPanel.js).
- [Scene/viewer ownership](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/scene.js), [build configuration](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/build/vite.js), [package exports](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/package.json).
- [Satellite source](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/source.js), [satellite tracking time](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/tracking.js), [OpenSky provider](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/server/providers/aircraft/opensky.js), [flight altitude handling](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/records.js).
- [Weather clock](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/weather/clock.js), [CCTV source](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/cctv/source.js), [selection store](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/data/contextStore.js).

SWE reference: [official comparison commit](https://github.com/Stellarium/stellarium-web-engine/commit/29870744c470ddc62fa869e153178c82a7824fa4),
[ancestry anchor](https://github.com/Stellarium/stellarium-web-engine/commit/023e3b26babf7ffddf45f39293230b14cfe96993),
[fork synchronization commit](https://github.com/Shadowgar/stellarium-web-engine/commit/16dbacd4b9a9973421b0438044d3536e300b3260).
Local changed source references in sections 10–11 are qualified by Hub baseline
and the explicit ignored-file limitation; they are not all retrievable from Hub Git.
