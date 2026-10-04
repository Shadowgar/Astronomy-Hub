# Tonight at ORAS — tonight.v1

`GET /api/tonight?date=YYYY-MM-DD` returns `{status, data: {night, targets,
top_opportunities, forecast}, meta: {contract_version, observer, generated_at,
policy, sources, cache, limitations}}`. The response boundary is
`backend/app/schemas/tonight.py`. `top_opportunities` contains identities into
`targets`. No legacy/demo target or satellite-pass provider is used.

## Site and evening date

The shared small `frontend/src/config/orasSite.json` defines the ORAS site for
Observe and Tonight and is copied narrowly into the backend image. Tonight MVP
supports ORAS only; it does not imply support for arbitrary site timezones.

Date means the local calendar day on which the evening begins. Before noon in
America/New_York the default is the previous date; from noon onward it is today.
Both local noon endpoints are constructed independently and converted to UTC.
DST nights can span 23 or 25 hours. Durations and searches use UTC seconds.

## Astronomy and windows

Mounted local JPL DE442s and Skyfield provide unrefracted topocentric Sun,
Moon, and planet geometry. There is no network ephemeris fallback for Tonight.
Sun altitude thresholds −6°, −12°, −18° define civil, nautical, and astronomical
boundaries. Astronomical darkness is Sun altitude ≤ −18°. Sunset/sunrise are
not included: no convention mixing center altitude and refracted limb altitude.

Numerical searches sample every ten minutes, insert refined local extrema to
retain grazing intervals (endpoint slopes bracket boundary extrema without repeated
searches on monotonic intervals), bracket threshold transitions and bisect to a
one-second numerical tolerance. Local peaks use bounded ternary refinement;
interval endpoints are eligible peaks. This tolerance is not a claim of
one-second physical accuracy for catalog coordinates.

Fixed catalog targets reuse Above Me's unchanged sidereal coordinate helper.
It uses catalog RA/Dec and geometric sidereal conversion; it does not apply a
new proper-motion/precession pipeline in this MVP. Catalog-coordinate accuracy
limits also apply to computed peak times and altitude. Astronomy does not
model atmospheric refraction, the actual ORAS terrain/tree/building horizon,
or equipment detectability.

Existing candidates: local bright-star data, 120 lowest-V-magnitude supported
Hipparcos subset stars, the compact supported Messier set, and the existing
700-object normalized OpenNGC discovery subset. These are bounded subsets,
not complete catalogs. Hipparcos and OpenNGC source loaders keep their existing
source selection; mixed magnitudes are never compared in opportunity ranking.
Messier/OpenNGC duplicates are removed through canonical NGC identity. Moon
and the supported planets are included; the Sun and artificial satellites are
excluded. No catalog/release install is performed.

Each target includes canonical string `catalog + source_id + model`, source
coordinates, peak date/altitude/azimuth, durations above 0° and 20° in darkness,
all geometric horizon windows in the noon interval, and Moon separation and
altitude at peak. Window endpoints may be clipped at evaluation boundaries;
first/last above-horizon fields do not imply rise/set events at those boundaries.
Moon separation uses matching ICRF axes for catalog targets and date-frame
coordinates for moving bodies. Global Moon illumination and altitude refer to
the midpoint of darkness (noon interval midpoint when there is no darkness).

## tonight-opportunity.v1

Lexicographic order: any time above the 20° planning altitude, peak altitude
descending, time above 20° descending, time above 0° in darkness descending,
then catalog/source_id/model ascending. There is no quality score or magnitude,
weather, seeing, transparency, or equipment input.

20° is a planning heuristic used to prefer targets reasonably above the
geometric horizon. It is not a physical visibility threshold.

The public plan retains up to 24 per category. The compact supported Messier
set and six named bright stars are retained before filling their category by
geometric ordering. Top opportunities reserve the highest-ranked target from
each available category, then fill six positions by geometric ordering.
Deterministic reason text reports peak altitude/local time and planning duration.

## Forecast provenance and coverage

One bounded Open-Meteo hourly forecast request per uncached night context uses
UTC Unix timestamps, standard metric units, and factual cloud, visibility,
precipitation probability, temperature, humidity, wind, dew point and weather
code fields. Missing fields remain absent, including valid zeros being preserved.
`generated_at` is unknown; `fetched_at` is retrieval time, not model generation.

Coverage refers to the darkness interval (noon interval if astronomy is absent).
`available` means hourly timestamps cover it without gaps and include cloud
facts; incomplete hours/fields give `partial`; provider failure, empty facts or
out-of-coverage dates give `unavailable`. Expired evidence is never presented
as current; the normalizer supports `stale`. No current-weather substitution.
At-peak forecast context uses a nearest hour only within 30 minutes. Weather
never changes ranking and failures preserve astronomy.

## Cache and degradation

Redis astronomy key v3 hashes contract/policy, complete shared site, evening
date, actual loaded candidate coordinates, source inventory, and ephemeris
release/checksum. TTL is one hour; only fully successful astronomy is cached.
Forecast uses a separate v1 site/UTC-interval key and ten-minute TTL. No
unavailable forecast is cached. Without Redis, evaluation still works.

Absent or out-of-range local ephemeris gives an explicit degraded night with
no darkness/target claims. No darkness and no supported dark-window candidates
have distinct states. Individual catalog/body failures yield a partial plan;
remaining candidates survive. The frontend consumes facts through React Query.

## Exact engine handoff

Every link uses `build_sky_engine_object_url`, canonical identity, fallback
coordinates at the computed peak, `date`, `lat`, `lng`, and `elev`. String IDs
stay strings. The contained Stellarium runtime owns selection and camera;
Tonight does not inject scene data. Browser acceptance must independently
verify identity, camera, and engine observer time/site.

Primary references: [Skyfield almanac](https://rhodesmill.org/skyfield/almanac.html),
[Open-Meteo hourly forecast](https://open-meteo.com/en/docs).
