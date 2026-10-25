# Satellite source audit and bounded status repair

Branch `sky-satellite-live-repair-1`, unchanged base HEAD `9ee6d85982edb3db276490706a82af83538e5e8d`. No commit, push, PR, promotion, deployment, protected data replacement, container restart or protected mount change by this agent.

Context: owner directive attachment `0b000802-b699-4e00-9379-0ac835f0a65f/Pasted text.txt`; task inventory `docs/validation/sky-satellite-live/loaded-documents.json`; bounded CORE_CONTEXT, LIVE_SESSION_BRIEF, SYSTEM_VALIDATION_SPEC, UNIFIED_UNIVERSE_ARCHITECTURE and task manifest lookup. Default Mode; parent established frontend/backend/validation/review/debug packs. No extra project documents were read.

## Confirmed actual source

`/home/rocco/Astronomy-Hub/frontend/public/oras-sky-engine/skydata/tle_satellite.jsonl.gz` is the actual native file served by the 4225 PS3 preview and read by `oras-ps2-backend`. Both mounts are read-only. Served raw bytes equal local protected bytes:

`431592eb5ec6db56d79c26792853f3fafe36ddf76c98834d9ddb36ddc0846436`, 1,360,442 bytes, two gzip layers.

Actual fresh read at 2026-10-24 07:55 UTC found 14,281 nonblank JSONL records, 14,281 distinct NORAD identities, 14,281 structurally consistent records and valid paired TLE checksums, zero invalid/checksum failures/duplicates. Leading zero TLE catalog fields are compared as integers while returned identities remain strings. Backend independently reports 14,281 parsed, zero malformed, 10,497 Starlink and 3,784 non-Starlink.

Every current TLE is stale against the existing 14-day candidate threshold. No future epochs. Distribution:

| Epoch statistic | UTC |
|---|---|
| Oldest | 2026-05-16T02:33:04.425408Z |
| 10th percentile | 2026-06-01T08:00:01.999872Z |
| 25th percentile | 2026-06-02T03:19:20.302752Z |
| Median | 2026-06-03T07:13:19.554528Z |
| 75th percentile | 2026-06-03T14:39:55.088928Z |
| 90th percentile | 2026-06-03T20:50:08.368224Z |
| Newest | 2026-06-05T23:36:57.501504Z |

255 epochs are in May; 14,026 in June. Age at initial audit: minimum140.3465 days, maximum161.2242 days. Representatives: ISS25544 June3 17:01:40Z age142.621d; HST20580 June2 08:13:52Z age143.988d; Tiangong48274 June3 22:06:57Z age142.409d; NOAA20/43013 June3 21:22:50Z age142.440d. See exact epochs/TLE values in `native-catalog-audit.json`. These are historical simulation elements, never evidence for current accurate orbital positions.

No adjacent `manifest.json`, no release identifier/acquisition metadata, and no per-record provenance exists for this mounted legacy file. Its mtime2026-06-18T22:58:40Z is not an acquisition date. Provider and release provenance remain unqualified; do not label this legacy native file a verified CelesTrak release. No existing `data/runtime-packs/satellite-tle` directory was found in the owner checkout or immediate worktrees searched.

## Proven feed status defects and correction

The canonical existing endpoint is `/api/sky/satellite-feed`. `/api/v1/sky/satellite-feed` returns404; no alias was added. Original API returns mounted:false/record_count0/unavailable solely because the manifest is absent, despite native HTTP200 and a successfully parsed actual catalog. The original freshness helper also calls a release fresh when only one nearest epoch meets14days; the mixed-age fixture proves that does not qualify all records.

Changed only:

- `backend/app/services/satellite_feed_status_service.py`
- `backend/app/routes/satellite_feed.py`
- `backend/tests/test_satellite_feed_api.py`

Status now separates native mounted presence from manifest availability/validation and provenance. It reports normalized native count, malformed count, fresh/stale/unknown epoch counts, requested-time age range and epoch distribution. Fresh means every parsed record meets the14-day threshold and no malformed records exist; mixed/stale/unavailable remain degraded. Missing/unvalidated manifests cannot fabricate provider/release/acquired time or ready status. Source parsing reuses the existing catalog normalizer, cached by actual feed/manifest file identity; no catalog scan per status poll. Cache invalidation on file replacement and preserved configuration-error handling are tested.

Optional `?norad=25544` accepts a canonical positive string of1–9 ASCII digits, rejecting zero/leading zeros and adds `selected:{norad_id,tle_epoch,tle_age_days,freshness_status,freshness_reference:'current_utc',as_of_utc}`. Selected age explicitly refers to actual current UTC even when the scene/status query uses a historical time. Unknown identities yield unavailable with null epoch/age. No source ID, orbit, magnitude, ephemeris, native renderer or visibility calculation is changed.

Disposable Docker using the exact mounted legacy source verifies corrected mounted:true/degraded,14,281 stale,0fresh,0unknown, no validated release/provenance; ISS/HST age142.626/143.992d at2026-10-24T08:02:57Z. First parse310ms; cached poll0.195ms; one cachehit/one miss. This is local Docker process timing, not a product browser performance qualification. Receipt `corrected-status-actual-native-docker.json`.

The candidate selector rejects ages>14days before propagation; actual current candidates were empty. Its `is_visible` is geometric altitude>0, not optical point eligibility. Direct propagation does not itself reject stale elements. No claim of native optical eligibility/discovery completion, current accuracy or visible motion is made by this source audit.

## Refresh attempt, controls and remaining source gate

Official primary sources checked2026-10-24:

- https://celestrak.org/usage-policy.php
- https://celestrak.org/NORAD/documentation/gp-data-formats.php

Policy permits freely available data with one download per update(two hours for GP), and requires stopping on non200 responses. Format documentation states TLE lacks newly cataloged six-digit objects after2026-07-11; an active TLE refresh remains incomplete for those identities. No completeness claim or fabricated conversion is justified.

After root coordination, one request used the existing approved builder source `https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=TLE`, bounded by8MiB, timeout120s, redirects disabled, no retries, into a new ignored output staging directory. It failed with `URLError:<urlopen error timed out>` after120s(07:56:32–07:58:32Z), with no HTTP status or source bytes. No release was built, installed or promoted. Exact receipt `refresh-attempt.json`; reproducible bounded wrapper `stage_refresh_once.py`. Do not rerun automatically.

A successful fetch would call the existing builder using `--input` for acquired bytes, `--minimum-count1000`, required ISS/HST identities, then its validation. Existing direct downloader uses unbounded response.read and follows redirects, so this audit wrapper enforces the bounded acquisition. Existing installer checks checksum/count/required IDs, rejects symlinks, copies to staging, retains a previous backup and publishes manifest last. It was inspected, never run on protected data. Release validator verifies SHA/count/identity/required entries, not freshness. Existing process-lifetime catalog caches and Docker bind-inode behavior require separate qualification on any future promotion; no refresh promotion is authorized by this audit.

## Validation receipts and scope limits

`feed-tests-red.txt`:3failed/7passed/1existinghttpx warning before main status repair. `feed-selected-tests-red.txt`:5failed/7passed/1warning before selected/status changes. New config-preservation check also has retained RED. Final local focused suite:39passed/2existinghttpx warnings. Final Docker focused suite:39passed/3existinganyio/httpx warnings. Results are in `backend-targeted-green.txt` and `backend-docker-targeted-green.txt`. `canonical-norad-red.txt` retains the zero/leading-zero regression failure before its correction.

`-W error` is not passing: `feed-tests-final-werror.txt` records pre-existing httpx TestClient app-shortcut DeprecationWarning as collection error. No warning was suppressed. Docker also reports existing anyio BlockingPortal deprecation. Normal scoped test counts are reported separately and do not imply warning-clean qualification. Full backend suite/browser/native visual tests are the root agent's broader task, not run by this source audit.

Recommended next task: root's focused preview/browser motion and state verification using the preserved historical source where explicitly labelled simulation, then resolve current source acquisition and qualify a new staged release separately. Current Live orbital accuracy remains blocked by stale data and failed refresh acquisition.

## Independent review P2 follow-up

Independent review reproduced release validation reading canonical manifest.json/tle_satellite.jsonl.gz while native status parsed a different configured file in the same directory. A valid canonical2-record release plus a configured1-record alternate feed incorrectly produced release_validated:true/ready and borrowed canonical required identities/provenance. Configured alternate manifest filenames could likewise be ignored. Two focused tests retained RED in `configured-path-binding-red.txt`. The fix requires both configured files to use the exact canonical validated filenames in their shared directory before declaring release validity. Wrong-path native fallback still reports its actual parsed count/freshness with release_validated:false, provenance unavailable and no borrowed manifest fields. No source admission policy, protected bytes or runtime process was changed. Source hash after this review fix: `02fadd8bf060a174326f02443bfbcb44f5bb32c515acc8e721d7cfd6c83b6809` for satellite_feed_status_service.py; full source/test/protected-data hashes are in `final-file-hashes.txt`. The task backend process must be reloaded by root after browser qualification; this agent has not restarted it.

## Independent historical native/Skyfield position comparison

After root declared final4226 build ready, an isolated Playwright context sampled exact mounted NORAD43689(MetopC) and28096(NOSS3-2 rocket body) at2026-06-04T02:58:00Z,+4s,+8s using native API state. Observer was measured as41.3219030000159N,-79.58539400000345E,432.816m, matching the ORAS configuration. Zero page errors. All six native record TLE arrays exactly equal the mounted bundle bytes. Evidence-only scripts did not alter application source, orbital math, magnitudes or provider data.

Existing Skyfield/SGP4 independently propagated the same TLEs/site/UTC in the actual task backend. Historical TLE ages were0.218024–0.218117days for43689 and1.295295–1.295388days for28096. Both were geometrically above horizon at every sample:43689 altitude31.887–32.763degrees;28096 altitude56.788–54.936degrees.

| NORAD | Native displacement over8s | Skyfield displacement over8s |
|---|---:|---:|
|43689|2.308232455degrees|2.308361985degrees|
|28096|2.421352626degrees|2.421147660degrees|

Native apparent ICRF versus standard Skyfield geometric ICRF residuals measured19.326–26.834arcsec. An explicit relative-lighttime correction variant measured maximum24.487arcsec. Native source converts its SGP4 true-equator vector toJ2000 and applies relative-position/lighttime/aberration treatment; standard Skyfield output is geometric. Those coordinate definitions are not asserted identical. No new precision acceptance threshold or exact numerical-parity claim is invented. The bounded comparison independently confirms source-backed historical orbital position progression; optical pixel motion remains the root browser proof and currentOctober orbital accuracy remains unqualified.

Receipts: `native-independent-samples.json`(six native samples), `native-vs-skyfield.json`(six independent calculations, exact TLE hashes, angular residuals and limits). Native sample input SHA256 `1f931641761a63cfcaada4661dd85332771dcd320081840b1df08369ad43bd0d`. No source refresh was retried.

## Bounded preservation verification

`preservation.json` freshly compares107 protected tracked files against PR95 `9ee6d85982edb3db276490706a82af83538e5e8d`: zero mismatches. Scope includes PS1–PS3 system/Solar/Planet source and assets, Earth runtime source, ORAS observer config, shared materials, Pennsylvania horizon assets, native horizon patch and WASM, planetary services and unchanged satellite propagation/catalog services. Native upstream comparison anchor/output hashes and complete Earth pin fields match PR95; adapter application admission fields intentionally change for the repair.

Task planetary pack+manifest hashes equal the protected PS2 release. Seven mounted scientific files match their already admitted source hashes: planetary pack,DE442s,three lunar orientation files,and lunar source TIFF/runtimePNG. The existing read-only Earth artifact verifier validates513 output files and52 source inputs against the qualified Earth artifact `bba92a4790578f33fe2cb128c9aa6d13a9578574eddd5c147cff4162d7b36e97`; source/admission/runtime-version checks pass.

ExistingPS3 preview andPS2 backend mount maps exactly match the initial audit receipt by destination. Eight protected stacks retain their original running container IDs and start times prior to this audit; task-only backend/preview resources are listed separately. Sixteen current project Docker volumes are inventoried without reading/changing contents.

Owner checkout currently remains at `1cb71b848a1ed46390945fe0fa636676b8b8f744`, with only the known pre-existing modified `.vscode/settings.json`. Its current SHA256 is `6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`(480bytes,mtime2026-10-01). Root confirmed no initial session settings hash exists; this is present-state evidence, not a full-session before/after settings-byte attestation. Full bulk catalog trees/database volumes likewise lack an initial per-byte snapshot; unchanged readonly binds and absence of task write/promotion operations do not establish forensic zero writes by every possible host process.

Inside the actual reloaded task backend, the existing feed/propagation suite passes24tests with2retained anyio/httpx deprecation warnings. Receipt `task-docker-feed-propagation.txt`. No implementation change, restart, commit or push was performed for this independent follow-up.
