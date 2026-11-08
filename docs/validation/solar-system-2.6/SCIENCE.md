# Solar 2.6 — historical anchors, scale and scientific boundaries

This source/backend work starts at `66050b5e7f3a9cbcfccbf6258645bd1804051b28`
on `recovery/reconcile-20261026`, existing draft PR107. The owner's Solar2.6
directive explicitly supersedes the prior product-expansion stop; it does not
grant visual acceptance, source-release approval or production authorization.
The inherited `solar_reconstruction` context pack, root/backend AGENTS, current
CORE/LIVE/manifest and Solar2.5 science evidence govern this bounded extension.
No existing mission ephemerides, historical source windows or runtime services
were modified. Docker/browser/performance qualification belongs to the integration
report; this document alone is not application or owner acceptance.

## Observations and geometry remain separate

The [NASA Voyager mission account](https://science.nasa.gov/mission/voyager/interstellar-mission/)
identifies the first crossing on **2012-08-25** and the second on **2018-11-05**.
[Rankin's published Voyager analysis](https://doi.org/10.22323/1.395.0032) gives
the first radius as approximately **121.6 AU**; [Richardson et al. (2019)](https://doi.org/10.1038/s41550-019-0929-2)
report the second at approximately **119 AU** using Voyager2 plasma observations.
NASA rounds the first distance to122AU. These are rounded observational summaries,
not centimeter-accurate vectors or two simultaneous measurements.

The context API preserves these facts in `observed` and requests the original
Solar2.5 mission service separately at noon UTC on each published date. Noon is a
navigation convention for day-precision events, not a measured crossing instant.
The admitted source is an **outward prediction from tracking through1992**.
Its position/velocity, Sun-centered ICRF frame, NAIF spacecraft identity,
UTC epoch, TDB Julian date and numerical units are retained unchanged.

At those representative epochs, the original vector norms are:

| Mission | UTC | Source norm (AU) | Published approximate radius (AU) |
| --- | --- | ---: | ---: |
| Voyager1 / NAIF−31 | 2012-08-25T12:00:00Z | 121.60740036459656 | 121.6 |
| Voyager2 / NAIF−32 | 2018-11-05T12:00:00Z | 119.02172745622927 | 119 |

No vector is rescaled to the observed radius. Sun direction is the negative
source position divided by its norm. Comparison mode explicitly represents
separate historical dates; it is not another simulation clock. Individual-event
navigation returns to `/missions/{id}?date=...`. An absent or corrupt mission pack
leaves the observed event available while its geometry is null; no substitute
current position or extrapolated track appears.

The pinned existing mission manifest is
`9b1bf0cde347536ae5d2c923684498c199444084458d72bdbccbe833c4055e94`.
[Fresh reference results](context-reference-checks.json) compare six states
(start, noon and end of each crossing date) with new mission-native Horizons
queries: Sun center10, spacecraft−31/−32, ICRF, geometric corrections`NONE`,
KM-S and TDB. Maximum position difference is **0.008638196km**, velocity difference
**2.5823×10⁻⁸km/s**. These verify interpolation against the native predicted
source; they are not independent tracking measurements or physical orbit-error
bounds. CSPICE_N0067 with the preserved `naif0012.tls` independently verifies
UTC→TDB to **42.8µs** at these epochs. Prior Solar2.5 wider reference checks remain
valid within their recorded scope.

## Heliosphere model disposition

The five explanatory components are solar wind, termination shock, heliosheath,
heliopause and local interstellar medium. NASA records termination-shock
encounters near94AU inDecember2004 and84AU inAugust2007. The heliopause is a plasma
transition; it does not bound solar gravity or the hypothesized Oort Cloud.

[Opher et al.](https://doi.org/10.1038/s41550-020-1036-0), with the
[author preprint](https://arxiv.org/abs/1808.06611), model separate pickup-ion and
thermal populations. Charge-exchange energy loss and magnetic-field assumptions
produce a compact/lobed prediction. [Kleimann et al.'s model review](https://doi.org/10.1007/s11214-022-00902-6)
contrasts analytical, MHD, multifluid and kinetic treatments, including long-tail
solutions. Solar-wind pressure/history, interstellar plasma and magnetic field,
neutral exchange and boundary mixing influence the results. ENA maps require an
emission/transport model before they can constrain spatial structure.

**No numerical scientific shape is qualified here.** Missing are a selected
original output grid or reproducible solver run, its exact parameter/boundary
configuration and coordinate mapping, a numerical comparison to that source,
and applicable redistribution terms for those model artifacts. The2022review is
CCBY4.0; that article license does not qualify an absent grid. The2020paper is a
literature reference, not permission to redistribute its figures. No published
figures or model assets are copied.

Transparent layers therefore carry `representation: illustrative` and
`scientific_model_status: not-qualified`. Their dimensions/shape are artistic
teaching parameters, not a fitted surface, current boundary or reproduced model.
Voyager observations never deform or snap to them. No boundary motion is claimed
from the application's UTC; exact time-dependent reconstruction remains incomplete.

## Oort Cloud and units

[NASA's Oort Cloud account](https://science.nasa.gov/solar-system/oort-cloud/facts/)
gives a broad inner-edge estimate of **2000–5000AU** and outer-edge estimate of
**10000–100000AU**. These are theoretical ranges, not measured boundaries. Any
sparse density visualization has no individual measured identities or calibrated
number density. NASA's long-period examples ISON and Siding Spring are linked as
context; this milestone admits neither a new orbit for them nor a measured
location within the reservoir. Existing qualified Solar2.4 comets remain separate.

[JPL's astrodynamic constants](https://ssd.jpl.nasa.gov/astro_par.html) establish
1AU=149597870.7km, c=299792.458km/s and a Julian year=365.25days. Thus1AU has a
light-time of499.004783836seconds. Camera animation duration is not travel time.

The IBEX direction conversion is independently compared against
`CSPICE pxform('ECLIPJ2000','J2000',0)`. Its matrix is recorded in the reference
receipt; the IAU1976 J2000 obliquity84381.448arcsec agrees to machine precision.
[NAIF frame conventions](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/frames.html)
explain J2000/ICRF naming. This is an angular direction transform at native6°
map sampling, not an inferred distance or heliopause inversion. IMAP displays
scalar magnetic magnitude, not a transformed vector. See [observation source
qualification](OBSERVATIONS.md) for actual product/energy/date/frame, uncertainty,
quality-mask, aggregation and rights details.

## Resource and API bounds

Before acquisition this workstream reserved **32MiB total**, at most32MiB per
response; only **10936bytes** of new Horizons responses were needed. Raw responses
and exact request bodies stay in ignored `data/source-cache/solar26-context`.
The existing leap-second kernel and mission pack were reused unchanged.
Observation acquisition has its own separately recorded96MiB ceiling; no bulk
scientific source enters Git or the Docker image.

The read-only `/api/v1/solar/beyond/context` and
`/api/v1/solar/beyond/observations/{id}` perform no network polling. Observation
IDs/filenames are fixed, the manifest is SHA256-pinned, and each product's size,
hash, identity and metadata must match. Reads are bounded before JSON parsing
(manifest128KiB/product8MiB). Pydantic enforces finite arrays, dimensions,
angular-bin ordering, missing masks, UTC ordering, counts and variability bounds.
Cache fingerprints include inode, size, mtime and ctime so changed files fail
closed. Missing/corrupt products return a controlled503; unknown IDs return404.

Focused commands and results:

```sh
PYTHONPATH=. /home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_beyond_exploration.py -q
# 22 passed; 1 inherited HTTPX app-shortcut deprecation warning.

PYTHONPATH=output/playwright/solar-system-2.4/asset-tools-venv/lib/python3.12/site-packages:. \
 /home/rocco/Astronomy-Hub/.venv/bin/python scripts/skydata/qualify_solar26_context.py
# 6 comparisons; all position/velocity/time/frame checks pass; source_bytes10936.
```

The tests include intentionally incompatible observed radii/source-vector norms
to prove no rescaling; distinct epoch/identity/Sun-direction checks; absent-source
behavior; malformed shape/mask/NaN/time/count rejection; path/hash/metadata/size
tampering after cache load; and safe API errors. Independent review, actual Docker
and browser results are separately required before integration qualification.
