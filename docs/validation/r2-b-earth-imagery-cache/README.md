# R2-B Earth imagery and persistent cache

**Owner-review candidate; no merge or deployment. Live place-search requalification remains blocked.**

Branch `r2-b-earth-imagery-cache-1` starts at R2-A
`27f34a94198f2061c0a5083a68beebd567c7d87f` (draft PR #78). Draft base remains
`r2-a-earth-search-1`. PR #71, #73, #74 and #78 remain unmerged. R3 is not started.

Preview: <http://127.0.0.1:4204/earth>. Actual desktop/mobile screenshots:
[owner-local gallery](http://127.0.0.1:4204/evidence/gallery/index.html).
These are genuine source responses in software Chromium, with emulated mobile;
owner hardware performance and visual acceptance remain open.

## Implementation and reuse

Selected PR #71 source at `35dcc94c1ecc1bdd87118d6dddb8b76fb81bbe9e` supplies
native MapSourceController dispatch, coverage-aware selection, request observation,
session/ion gates and eligible cache storage/worker/client. No merge or blind
cherry-pick. [Reuse hashes](evidence/reused-pr71.json) distinguish exact copies
from adapted modules. Current CameraController, RuntimeBridge, EarthRuntime,
R2-A search, observer/time/tracking/selection and accepted navigation remain intact.
Only a native tile-progress listener was added to ViewerController; the current
entry retains N1 lifecycle logic. Cesium owns scheduling/refinement/rendering.
No custom scheduler, throttle, render loop, dependency or upstream patch is added.

One Natural Earth safety base and at most one managed remote imagery layer are
maintained. Current provider/known edition/nominal source resolution/loading and
fallback are exposed through the existing bounded quality contract. Sources &
display quality includes owned-cache status and confirmed clear, without a
permanent provider toolbar. Internal proof seams are loopback/query-only;
public product navigation remains Astronomy Hub's contextual interface.

Cache keys retain provider, edition and exact URL. Only eligible public,
decodable responses with valid expiry are admitted. Private/no-store, credential,
token, opaque, unsupported-Vary and cookie responses are excluded. Integrity,
expiry, quota, async ownership after clear/camera/source changes/disposal and
owned-only deletion have focused tests. Browser HTTP cache is not owned or cleared.

## Provider facts and limitations

| Source | Admission and observed availability | Rights / quality |
| --- | --- | --- |
| Natural Earth | Always-present local safety base | Coarse public-domain overview |
| NASA Blue Marble | Genuine global fallback decoded | Coarse static composite, nominal500m; no capture date invented |
| EOX Sentinel-2 cloudless | Genuine Paris imagery and managed reuse; partial tiles and occasional fallback observed | Exact WMTS layer is2016, nominal10m, max level14; CC BY4.0 with linked attribution. Not current aerial photography |
| USGS NAIP | Only verified full-view footprint admission; ORAS geometry retained. Browser decoded partial NAIP then fell back | USGS public-domain source; matched ORAS image2022-06-23,0.6m. Bounded HTTP probe returned image200 with Cache-Control private, so these bytes are not managed-cache eligible |
| PEMA/PASDA | Existing verified ORAS extent, loopback only. Browser tile failures triggered fallback | Collection2021–2023, qualified ORAS tile2022, nominal0.5US survey foot. Public redistribution rights remain unverified. Excluded from managed persistence; ORAS screenshots remain owner-local |
| Cesium ion | Disabled/unqualified; zero observed session requests | No credentials/accounts/spending added |

EOX application use and attribution: [EOX Maps](https://maps.eox.at/).
[USGS terms](https://www.usgs.gov/faqs/what-are-terms-uselicensing-map-services-and-data-national-map).
[PEMA collection](https://www.pasda.psu.edu/uci/DataSummary.aspx?dataset=5178).
Exact EOX capabilities, selected-layer metadata and the two bounded aerial HTTP
probes are retained under ignored `output/r2-b/provider/`. No provider expansion,
bulk acquisition, new terrain or buildings. Browser aerial failures were
`net::ERR_FAILED`; later single HTTP probes returned image200 with CORS headers.
Their underlying browser transport cause is **unknown**. Do not claim that PEMA
or complete NAIP detail was qualified on this host.

## Browser qualification

Fresh final-artifact desktop1440 and emulated mobile390:

- Genuine imagery journeys: Paris cold/reload/real process restart, ORAS900m,
  qualifying full-view US aerial geometry3000m, Anchorage outside admitted aerial,
  rapid ORAS/Alaska/Paris movement, one base/managed-layer bound, zero ion starts.
  ORAS source failures/fallback are recorded, not relabeled successful aerial.
- Both viewports pass actual cache reuse with unchanged saved body SHA/expiry,
  confirmed/cancelled owned clear, unrelated localStorage/CacheStorage retained.
- Both pass controlled denial/local fallback; corrupt/expired refetch; private,
  no-store/tokenized/opaque exclusion; actual late response after clear;
  declared429 cooldown followed by genuine EOX recovery. Only statuses/cache
  headers are fixtures; image bodies are captured genuine EOX bytes. Cooldown is
  advanced by Playwright virtual time, not a physical five-minute measurement.
- Actual Hub coordinate-result selection, accepted wheel zoom and source/cache
  interface pass at both sizes. Desktop happened to show NASA fallback; mobile
  showed EOX. Internal native proof screenshots are additional measurement evidence.
- Fresh coordinate/navigation journeys cover invalid/zero coordinates, native
  destination, wheel/anchor, Back/Forward, reload, two Sky/Earth round trips,
  unchanged native UTC/observer/Pennsylvania landscape, one renderer, canonical
  ORAS context. No N1 full navigation timeout suite was rerun.

| Viewport | Cold journey / native observation | Reload / observation | Real browser restart / observation | Cache hits cold / warm / restart |
| --- | --- | --- | --- | --- |
| Desktop1440 |7282ms /4816ms|7317ms /4867ms|7539ms /4943ms|0 /36 /36|
| Mobile390 |4292ms /2743ms|3996ms /2762ms|3633ms /2358ms|0 /36 /36|

Each phase retained36 managed EOX entries. Times measure this software browser
only; they show no performance improvement claim. Native globe idle does not mean
complete source coverage: desktop Paris was marked partial in all three phases;
mobile cold/reload ready, restart partial. ORAS desktop remained partial at30s.
The row `settled` in raw proof means native globe idle, not full image availability.

**Live place-search gap:** final desktop and mobile R2-A suites each completed
only initial Earth-ready/one-renderer, then failed the first real Springfield
lookup:503 returned,200 expected. Backend response after about7s; not a browser
stall. Underlying Photon failure cause unknown. No timeout increase or repeat full
suite. Address/place/ambiguous-result groups were not freshly reached. Phase1
R2-B browser journeys passed14 groups on each size using actual provider results;
they remain explicitly historical at artifact `3c6c5ffa…`, not fresh final passes.
All their non-artifact source hashes still match; the only native input delta is
the reviewed ImageryController cache invalidation hooks. Accepted navigation,
search/API source and data contracts are unchanged. Fresh provider-independent
journeys qualify the final renderer's coordinate/history/Sky behavior separately.

## Tests, builds and review

- Complete host runtime/Earth:223/223 PASS (`GODS_EYE_SOURCE=/var/tmp/oras-cesium/gods-eye node --test tests/runtime/*.test.mjs tests/earth/*.test.mjs`).
- Pinned Docker Earth scope:135/135 PASS; exact argv in
  [docker-earth-test-command.json](evidence/docker-earth-test-command.json).
  Initial all-runtime Docker attempt failed7 deployment-preflight tests because
  the pinned Node image lacks Python. Complete host223 includes these tests and
  the export boundary test; no Python installation or deployment/SSH occurred.
- Frontend291/291 in41 files; `npm --prefix frontend test`.
  `npm --prefix frontend run typecheck` PASS. These source-matched results precede
  only the cache-controller review correction; frontend source is unchanged.
- Existing backend search/aircraft/events regressions43 PASS with8 warnings
  initially (deprecations plus pytest cache denied on intentional read-only mount).
  Fresh explicit `docker exec -w /work oras-r2-b-backend python -m pytest
  backend/tests/test_earth_search.py backend/tests/test_earth_aircraft.py
  backend/tests/test_earth_events.py -q -p no:cacheprovider`:43PASS,7deprecation warnings.
- Architecture/context validator PASS:309 manifest entries/8packs.
  Architecture links PASS:57documents/1552references/9ADRs.
  Reconciliation PASS:67records/51source entrypoints/434links/65fragments, after
  correcting the stale basemaps row from removed boundImageryRequests to current
  observeImageryRequests; its earlier failure remains recorded.
- Earth built independently twice in pinned readonly-dependency Docker,50source
  inputs/513payload files/111 notices; final artifact
  `e0a904a201b11b7c6202cc1467b2cd3c80c02beed58bb0956eab2372c37ac0bf`.
  Hub built twice to matching130-file maps. No package installation.
- Original Sky artifact remains
  `b57c40ddceca090224ac58f4758fde9d2193a649c571e58cb0a618b289649c19`.
  Original N1 Earth artifact `662e6170…` and original R2-A branch/rollback outputs
  retained. Source pins unchanged; only qualified public maps exports and Earth
  artifact/admission hashes updated.
- Independent provisional review of8d5bbe42 found one P2: automatic native source
  fallback could admit late old-scene writes. Reproduced33pass/1fail, corrected
  subscriber invalidation, complete223GREEN and rebuilt both final artifacts.
  Independent source review of2a788110 found no new actionable findings;82
  focused tests and independent artifact verify PASS. Final documentation-only
  exact-head follow-up is recorded in the PR and local review receipt.

Exact commands and raw outputs: [evidence](evidence/), full ignored originals
`output/r2-b/`; browser drivers are `scripts/validation/verify_r2b_{imagery,cache_failures,hub_imagery,navigation}.mjs`.
At each width use `R2B_WIDTH=1440` or390 with existing420s imagery,240s failure/
navigation and180s Hub journey caps. Final full-search attempts used
`R2_BASE=http://127.0.0.1:4204 R2_WIDTHS=1440` or390,
`R2_EVIDENCE=output/playwright/r2-b-search-desktop` ormobile,
`timeout 180s node scripts/validation/verify_r2_earth_search.mjs`.
Delivery identity checks use `python3 scripts/validation/verify_r2b_delivery.py`
(and `--committed` after commit). No historical failures were overwritten.

## Preservation and acceptance

All103 original container IDs/mounts and90 volumes remain; owner settings SHA
`6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`
unchanged. Eight original container state records differ: seven running→stopped and one
frontend has a later StartedAt. Observed on continuation; cause unknown. Do not claim unchanged running status. This
continuation started only its two own R2-B containers; no unrelated restart/stop,
resource pruning, data/setting write or production deployment. Docker mounts serve
source-matched final Earth/Hub bytes; receipt records exact identities and drift.

N1 remains OWNER ACCEPTED. Its historical5/22desktop and7/22mobile240s caps remain
FAIL/UNKNOWN, never a fresh44-group pass. No accepted landscape/satellite/camera
change. Owner visual/hardware acceptance, reliable live Photon requalification,
complete aerial-source browser availability and PEMA public rights remain open.
This draft is not merge-ready or production-qualified. Next task: owner review of
this bounded preview, then separately authorize remaining source/hardware work.
Do not merge71/73/74/78/R2-B or beginR3.

[Loaded context](context.json), [61-document ledger](loaded-documents.txt),
[plan](plan.md), [exact changed files](CHANGED_FILES.txt).

EOX Paris screenshots in [desktop](evidence/paris-1440.png) and
[mobile](evidence/paris-390.png) are Sentinel-2 cloudless2016, ©EOX::Maps,
CC BY4.0; [source and attribution](https://maps.eox.at/). Partial resolution is
retained as captured. ORAS/PEMA pixels are not included in the public evidence.
