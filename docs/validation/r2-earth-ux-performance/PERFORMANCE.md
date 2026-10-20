# Native imagery delivery: measured result

Removing the extra application timer starts source selection immediately after
native camera settlement. The renderer, source quality caps, native scheduling,
cache policy and accepted camera motion remain unchanged. This is a demonstrated
application latency reduction, not a universal public-imagery speed or coverage pass.

## Comparable observations

72 camera cases: six locations × cold-profile/warm/restarted-browser traversals ×
two viewports × before/after.216 original PNGs at requested1/3/8s after native
flight completion, with actual receipt timestamps.1440×844 and390×844, Chromium
software rendering/emulated touch; no physical-device claim. Both variants use
the same contained native viewport, fixed June5 2026 17:00 UTC, camera order,
altitudes and source policies. Public network/CDN state is uncontrolled.

“Cold” means the browser profile begins empty, then visits all six locations in
order; subsequent locations can reuse lower-level tiles from earlier locations.
Warm repeats that traversal in the same browser/profile after a new page load;
restart closes/reopens Chromium with that profile. These are comparable browsing
journeys, not independently flushed per-location cold caches. There is one run
per location/phase; phase-pooled medians are descriptive, not stable hardware or
provider percentiles. Exact per-case metadata/request/cache/tile/idle/capture data:
[before](evidence/baseline-measurements.json), [after](evidence/after-measurements.json).
Original local PNGs: `output/playwright/r2-earth-ux-{baseline,after}`; PEMA remains
local-only and is not published to GitHub. Baseline input bytes are reconstructible
from158a7705 plus [observational patch](evidence/baseline-observation.patch), with
[sealed artifact/input manifest](evidence/baseline-release.json). Baseline artifact
29562cba; after native artifact cb1f579d. The final UI-only spacing correction does
not alter this native artifact or the native measurement viewport.

## Proven bottleneck and bounded correction

| Native settlement → source update | Baseline median / max (n) | After median / max (n) |
|---|---|---|
| Desktop |559.8 /710.8ms (22)|0.0 /0.1ms (23)|
| Mobile emulation |352.6 /591.9ms (25)|0.0 /0.2ms (25)|

The code imposed250ms before scheduling the update; observed browser waits were
longer. The excess beyond250ms is observed scheduling delay, not an established
host/resource diagnosis. Only that timer was removed. Native moveEnd triggers the
existing source controller immediately; latest-view guards, metadata admission,
provider caching, cancellation and native request/render scheduling remain intact.
The focused test fails before and passes after. No controller reconstruction
optimization was justified: all observed cases retained one controller and one
local base. Public sources and useful imagery still take longer than this update.

## Initialization, visibility, transfer and cache

### 1440px viewport

- baseline: viewer initialization 178.4ms median; 277.6ms slower; local decoded image from page start 1616.9ms median; 1624.2ms slower, n3. These are page observations, distinct from target-camera scene detail.
- after: viewer initialization 204.7ms median; 209.8ms slower; local decoded image from page start 1605.2ms median; 1673.0ms slower, n3. These are page observations, distinct from target-camera scene detail.

### 390px viewport

- baseline: viewer initialization 181.2ms median; 189.2ms slower; local decoded image from page start 1003.5ms median; 1109.7ms slower, n3. These are page observations, distinct from target-camera scene detail.
- after: viewer initialization 181.0ms median; 256.8ms slower; local decoded image from page start 1110.8ms median; 1181.8ms slower, n3. These are page observations, distinct from target-camera scene detail.

The first ready native remote texture can be coarse, inherited or only partially
cover the view. `firstNativeTexture` reports eligible ready textures on Cesium's
native selected surface tiles, separately from decoded-image callbacks and the
visual assessment. Neither it nor `globeTilesLoaded` proves recognizable imagery,
complete high-resolution coverage, or the exact displayed frame onset.

Source construction was already cheap; network/header wait, payload/decode and
native refinement dominate image delivery after selection. Each raw trace has
request start/decoded-promise completion times and CDP request/response/transfer
bytes/timing/error/cache flags. Decoded-promise elapsed includes scheduling,
network and image decode; exact decode CPU is not directly exposed and remains
unknown. CDP transfer observations with inconsistent/negative cross-worker
ordering are excluded, rather than invented. The worker separately records
lookup and network-to-headers waits; no additional awaiting or cache-policy work.

After traversal worker lookup means ranged1.9–4.3ms; observed maximum15.7ms.
Desktop worker network-header maximum14,593ms and request CDP header wait maximum
8,626ms demonstrate that network/source waits can dwarf lookup and construction.
Restart retained171 owned entries on desktop and147 on mobile. Restart counters
observed207 hits/41 misses desktop and188/12 mobile, with source rights still
excluding PEMA from managed persistence. Baseline driver did not sample worker
messages; no before/after worker speedup is claimed. Detailed cache/worker/status
counts remain in the after receipt. Timing differences are not attributed to a
cache implementation change: policy/store bytes are protected and unchanged.

## Visual checkpoint assessment

Values below are first sampled **useful geographic detail** in requested seconds,
ordered cold/warm/restart. Actual screenshot completion/diagnostic receipts can be
later; the measurement JSON provides upper bounds. `>8` is undemonstrated within
the bounded window; `partial` may show only a patch. Broad scene recognition is
separately recorded in [visual assessment](evidence/visual-assessment.json).

| Location (native ellipsoid height) |Desktop before → after|Mobile before → after|
|---|---|---|
|Reference NW PA35,189m|8/3/3 → 3/3/8|3/1/1 → 3/1/1|
|ORAS medium12,000m|1/1/1 → 1/1/1|1/1/1 → 1/1/1|
|ORAS close900m|>8/3/3 → 3/3/3|3/3/3 → 3/1/1|
|Qualified ORAS US aerial3,000m|8/3/3 → 3/3/>8|8/3/3 → 1/3/3|
|Paris2,000m|8/8/8 → 8/8/8|3/3/3 → 8/3/3|
|Anchorage/uncovered aerial2,000m|3/8/8 → 8/8/8|3/3/3 → 3/3/3|

Across location/phase observations, useful-detail checkpoint median is3s before
and after for each viewport; slower observations reach8s, with one desktop case
undemonstrated by8s in each variant. This is deliberately not a universal visual
speedup claim. The reference cold traversal improved8→3s, but network variability
and source success prevent assigning all visual differences to the timer change.
Desktop NAIP remains partial in successful warm samples; the after restart aerial
screenshot remains coarse despite a ready remote texture in the following native
state. This is why native idle/texture state is not visual completeness.

## Availability, quality and rights

- Reference/ORAS medium/Paris/Anchorage: EOX Sentinel-2 cloudless2016 mosaic,
  nominal10m, max order14. Acquisition day is unknown; no current aerial claim.
  Anchorage is outside admitted CONUS NAIP/PEMA coverage; global mosaic is an
  intentional coverage result, not slow missing high-resolution tiles.
- ORAS close: PEMA2021–2023 collection, local ORAS2022 edition, nominal0.1524m;
  exact capture day unknown, native visible orders16–17 in these views. No public
  redistribution approval or managed persistence. Cold baseline PEMA failed and
  fell back without usable target detail by8s; subsequent source successes are
  not credited to an application networking fix.
- Qualified ORAS NAIP: matched acquisition2022-06-23, nominal0.6m, native visible
  order15 in desktop successful/partial samples. Browser request failures cause
  partial patches or EOX fallback. Mobile viewport footprint often does not fit
  the admitted acquisition ring: that is coverage gating, not a performance fail.
- Natural Earth remains coarse local safety imagery; NASA coarse global overview
  remains available. Labels use the existing admitted EOX/OSM regional overlay,
  limited by native terrain level12 so it cannot stretch across street views.
  Useful search/place context remains available at close zoom.
- Baseline observed24 `net::ERR_FAILED` and2 `ERR_ABORTED`; after9 and1. These
  include PEMA/NAIP transport/browser failures and cancellation. Underlying origin
  HTTP status/CORS/transport causes are not established by those error strings.
  No claim that the optimization fixed providers or reduced their failure rate.
- No source caps, sharpness, upstream files, scheduler, render loop or paid
  provider were changed. Ion remains disabled. No Google imagery/assets/code.

Remaining visual limitations: older/coarse global sources, partial aerial tiles,
external provider reliability, narrow PEMA rights, unavailable scientific terrain
and physical hardware acceptance. Owner reviews actual product screenshots and
preview; these source limits must stay visible in any later imagery work.
