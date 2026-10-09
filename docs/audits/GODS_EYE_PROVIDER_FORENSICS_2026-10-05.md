# Provider, dataset and asset forensics — 2026-10-08

[Canonical audit](GODS_EYE_CAPABILITY_IMPLEMENTATION_RECONCILIATION_2026-10-05.md) · [Machine inventory](gods-eye-implementation-inventory-2026-10-05.json)

73 records: 50 service/source rows and 9 bundled dataset rows from pinned DATA_SOURCES, plus 14 additional Hub/current-main/asset/local-source boundaries. Counts are records, not distinct companies. Source code MIT license and license carve-outs were checked; current LICENSE is byte-identical. Only expressly marked primary facts have current primary-page support. Upstream claims, prices, unidentified numerical limits and rights gaps remain explicit; successful HTTP responses are not legal approval. Source cache budgets are not provider caching permission.

## P01 — **NOAA GFS (wind)** (`noaa-gfs-bdp-pds.s3.amazonaws.com`)

**Exact service:** Global 10 m wind, optional 2 m temperature and mean sea-level pressure for Wind. Keyless; latest 6-hourly 0.25° cycle, byte-range GRIB2 reads, cached for an hour

**Upstream paths/functions:** `server/providers/wind.js` (windProxy), `server/providers/wind/gfs.js` (parseGfsIdx, windMessageRanges, fetchText, fetchRange, loadOptionalScalar, fetchGfsWind), `src/layers/wind/source.js` (createWindSource)

**Endpoint evidence:** `https://${GFS_BUCKET}.s3.amazonaws.com/${gfsObjectKey({`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: U.S. public domain (NOAA); keyless via NOAA Open Data on AWS |
| Attribution | "NOAA Global Forecast System (GFS)" (courtesy; not an endorsement) |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P02 — **ECMWF IFS (wind)** (`data.ecmwf.int/forecasts`, ECMWF Open Data)

**Exact service:** The alternative Wind model: 10 m wind, optional 2 m temperature and mean sea-level pressure. Keyless; latest 6-hourly 0.25° run, byte-range GRIB2 reads, cached for an hour

**Upstream paths/functions:** `server/providers/wind/ifs.js` (IFS_BASE, selectLatestIfsCycle, ifsObjectUrls, parseIfsIndex, ifsWindRanges, nearestIfsStep, fetchIfsWind), `src/layers/wind/source.js` (createWindSource)

**Endpoint evidence:** `https://data.ecmwf.int/forecasts`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | Open-data endpoint keyless. |
| Free / paid | Open dataset; no service SLA or unbounded bandwidth entitlement inferred. |
| Rate limits | UNKNOWN hard quota; upstream bounded byte-range/cycle cache is client stewardship. |
| Commercial / data rights | CC BY4.0 plus ECMWF terms/disclaimer; modeled forecast, not measured observation. |
| Attribution | "This service is based on data and products of the European Centre for Medium-Range Weather Forecasts (ECMWF)", with the CC BY 4.0 link, the modification notice and ECMWF's liability disclaimer — shown in-app |
| Caching permission | Attribution/modification/disclaimer required; confirm downstream distribution plan. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Primary provider page checked this audit |

**Primary/provenance links:** [Provider/source documentation](https://www.ecmwf.int/en/forecasts/datasets/open-data)

## P03 — **NOAA nowCOAST observed weather** (`nowcoast.noaa.gov/geoserver/observations/{weather_radar,satellite}/ows`, WMS 1.1.1)

**Exact service:** Rain radar (MRMS base reflectivity, contiguous US, about 4-minute updates) and Satellite clouds (GOES-19/18 Band 14 regional infrared, about 5-minute updates; global infrared mosaic, hourly). Keyless; layer metadata refreshed every 2 minutes, exact-time images cached for up to 24 hours

**Upstream paths/functions:** `server/providers/weather.js` (parseWeatherCapabilities, weatherImageBbox, weatherTileBounds, weatherProxy), `src/layers/weather/source.js` (WEATHER_PRODUCTS, validateWeatherSnapshot, WEATHER_IMAGE_SIZES, WEATHER_DETAIL_SIZE, weatherImageUrl, weatherTileUrl, createWeatherSource)

**Endpoint evidence:** `https://nowcoast.noaa.gov/geoserver/observations/`

**Hub path:** backend/app/services/earth_events.py acquire/normalize_radar (radar only); EventLayers createEventAdapter.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: [NOAA disclaimer](https://oceanservice.noaa.gov/disclaimer.html) |
| Attribution | "NOAA nowCOAST · NWS/OAR MRMS radar; NESDIS GOES and global satellite partners" |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** [Provider/source documentation](https://oceanservice.noaa.gov/disclaimer.html)

## P04 — **NOAA nowCOAST lightning density** (`nowcoast.noaa.gov/geoserver/observations/lightning_detection/ows`)

**Exact service:** Lightning density: 15-minute accumulated strike density on an approximately 8 km grid, Americas and Pacific. Keyless; layer metadata refreshed every 10 minutes, exact-time images cached for up to 24 hours

**Upstream paths/functions:** `server/providers/weather.js` (parseWeatherCapabilities, weatherImageBbox, weatherTileBounds, weatherProxy), `src/layers/weather/source.js` (WEATHER_PRODUCTS, validateWeatherSnapshot, WEATHER_IMAGE_SIZES, WEATHER_DETAIL_SIZE, weatherImageUrl, weatherTileUrl, createWeatherSource)

**Endpoint evidence:** `https://nowcoast.noaa.gov/geoserver/observations/`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | Keyless WMS. |
| Free / paid | Public Level-5 service. |
| Rate limits | UNKNOWN hard quota;10min metadata and bounded tiles upstream. |
| Commercial / data rights | Public distribution of derived Level-5 density described by NOAA; raw Vaisala strike data separate. |
| Attribution | "NOAA/NWS nowCOAST; derived from Vaisala NLDN/GLD360" |
| Caching permission | Use derived density/coverage/accumulation and keep NOAA product attribution; no raw-strike grant. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Primary provider page checked this audit |

**Primary/provenance links:** [Provider/source documentation](https://ocean.weather.gov/lightning/lightning_pdd.php)

## P05 — **NOAA NHC / CPHC advisories** (`www.nhc.noaa.gov/CurrentStorms.json` + the `mapservices.weather.noaa.gov` tropical weather summary MapServer)

**Exact service:** Cyclone advisories: storm positions, forecast tracks, points and cones for the Atlantic and eastern/central North Pacific. Keyless through `/api/cyclones`; cached for 5 minutes

**Upstream paths/functions:** `server/providers/cyclones.js` (parseCycloneStatus, attachCycloneGeometry, cycloneProxy), `src/layers/cyclones/source.js` (CYCLONE_RESPONSE_LIMIT, validateCycloneSnapshot, createCycloneSource)

**Endpoint evidence:** `https://mapservices.weather.noaa.gov/tropical/rest/services/tropical/NHC_tropical_weather_summary/MapServer`; `https://www.nhc.noaa.gov`; `https://www.nhc.noaa.gov/CurrentStorms.json`; `https://www.nhc.noaa.gov/gtwo.php?basin=atlc&fdays=7`; `https://www.nhc.noaa.gov/gtwo.php?basin=cpac&fdays=7`; `https://www.nhc.noaa.gov/gtwo.php?basin=epac&fdays=7`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: [NWS public-data terms](https://www.weather.gov/disclaimer); no endorsement implied |
| Attribution | "NOAA/NWS NHC / CPHC" |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** [Provider/source documentation](https://www.weather.gov/disclaimer)

## P06 — **OpenStreetMap**

**Exact service:** Map and place data (roads, military areas and names, ALPR, place search, outlines); via vector tiles, hourly ALPR extract, bundled data, Nominatim and optional self-configured Overpass

**Upstream paths/functions:** `src/maps/imagery.js` (ESRI_ATTRIBUTION_HTML, createOsmImagery, createEsriImagery, createIonImagery), `server/providers/overpass.js`, `src/sources/overpassFeatures.js` (geometryOutputBox, createOverpassFeatureSource)

**Endpoint evidence:** `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer`; `https://tile.openstreetmap.org/`; `https://www.esri.com`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) |
| Attribution | © OpenStreetMap contributors |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** [Provider/source documentation](https://opendatacommons.org/licenses/odbl/1-0/)

## P07 — **Google Map Tiles API** (Photorealistic 3D Tiles) + Places/Geocoding

**Exact service:** The 3D globe, voice scene context, and on-demand nearby installation search

**Upstream paths/functions:** `src/maps/google3d.js` (selectMapStartupRoute, loadPhotorealisticTileset, createGoogleDirectTileset, createGoogleIonTileset), `server/providers/places/google.js` (validatePlacesCoordinates, googlePlacesContextProxy), `server/providers/cctv.js` (cctvProxy)

**Endpoint evidence:** `https://maps.googleapis.com/maps/api/streetview`; `https://places.googleapis.com/v1/places:searchNearby`; `https://places.googleapis.com/v1/places:searchText`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | Owner key/billing for direct Tiles/Places/StreetView; ion-hosted entitlement separate. |
| Free / paid | Paid platform, usage SKU and account limits. |
| Rate limits | Account/SKU-dependent; no owner account inspected. |
| Commercial / data rights | Proprietary Maps terms; visible credits and third-party tile credits. |
| Attribution | "Google" / "Google Maps" logo — **shown in-app**, required |
| Caching permission | Content caching/export/redistribution restricted per product; short-lived tokens do not relax data terms. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Primary provider page checked this audit |

**Primary/provenance links:** [Provider/source documentation](https://developers.google.com/maps/documentation/tile/policies)

## P08 — **OpenSky Network**

**Exact service:** Primary worldwide live-flight snapshot

**Upstream paths/functions:** `server/providers/aircraft/opensky.js` (getOpenSkyToken, adsbLolFallbackAnchor, openSkyProxy), `src/sources/live/standalone.js` (createOpenSkySource, createAdsbLolSource, createAisStreamSource)

**Endpoint evidence:** `https://api.adsb.lol/v2/lat/${roundedLat}/lon/${roundedLon}/dist/${ADSBLOL_POINT_RADIUS_NM}`; `https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token`; `https://opensky-network.org/api/states/all?extended=1`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | Anonymous or authenticated OAuth2; pinned code also has legacy Basic modes, not current auth recommendation. |
| Free / paid | Anonymous and account tiers; commercial/large public use requires provider agreement. |
| Rate limits | 400 anonymous / 4,000 standard daily credits per endpoint bucket; global states cost4; account quotas differ. |
| Commercial / data rights | Research/education licensing; owner must verify intended public/commercial use. |
| Attribution | Schäfer et al., _"Bringing Up OpenSky"_, IPSN 2014 + opensky-network.org |
| Caching permission | Implement bounded source-age cache under provider agreement; do not assume redistribution grant. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | View-anchored ADSB.lol point250NM on unusable snapshot/auth/error/rate/stale; Hub no OpenSky path. |
| Evidence confidence | Primary provider page checked this audit |

**Primary/provenance links:** [Provider/source documentation](https://openskynetwork.github.io/opensky-api/rest.html), [Provider/source documentation](https://opensky-network.org/about/faq)

## P09 — **adsb.lol point API**

**Exact service:** Bounded live-flight fallback when OpenSky has no usable snapshot

**Upstream paths/functions:** `server/providers/aircraft/opensky.js` (getOpenSkyToken, adsbLolFallbackAnchor, openSkyProxy), `src/data/adsbLolFallback.js` (normalizeAdsbLolAircraftState, normalizeAdsbLolPointResponse)

**Endpoint evidence:** `https://api.adsb.lol/v2/lat/${roundedLat}/lon/${roundedLon}/dist/${ADSBLOL_POINT_RADIUS_NM}`; `https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token`; `https://opensky-network.org/api/states/all?extended=1`

**Hub path:** backend/app/routes/earth.py fetch_aircraft (point only); military/trace path absent.

| Boundary | Finding |
| --- | --- |
| Authentication | No key for public point/military endpoints. |
| Free / paid | Open public service; no published numerical quota found on checked API page. |
| Rate limits | UNKNOWN numerical limit; cache/coalesce and honor failures/429 rather than assuming unlimited. |
| Commercial / data rights | ODbL1.0 attribution/database obligations. |
| Attribution | adsb.lol contributors; `api.adsb.lol/v2/lat/{lat}/lon/{lon}/dist/{radius}` |
| Caching permission | ODbL data rights do not promise unlimited service or cover adsbdb/models. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | This is OpenSky fallback upstream; sole100NM provider in Hub. |
| Evidence confidence | Primary provider page checked this audit |

**Primary/provenance links:** [Provider/source documentation](https://www.adsb.lol/docs/open-data/api/)

## P10 — **adsb.lol**

**Exact service:** Military flights + aircraft traces

**Upstream paths/functions:** `server/providers/aircraft/adsb-lol.js` (adsbLolProxy), `server/providers/aircraft/tracks.js` (trackBackfillProxies)

**Endpoint evidence:** `https://adsb.lol/data/traces/${hex.slice(-2)}/trace_full_${hex}.json`; `https://api.adsb.lol/v2/mil`; `https://api.adsb.lol/v2/mil.`; `https://opensky-network.org/api/tracks/all?icao24=${icao24}&time=0`

**Hub path:** backend/app/routes/earth.py fetch_aircraft (point only); military/trace path absent.

| Boundary | Finding |
| --- | --- |
| Authentication | No key for public point/military endpoints. |
| Free / paid | Open public service; no published numerical quota found on checked API page. |
| Rate limits | UNKNOWN numerical limit; cache/coalesce and honor failures/429 rather than assuming unlimited. |
| Commercial / data rights | ODbL1.0 attribution/database obligations. |
| Attribution | "adsb.lol" (ODbL) |
| Caching permission | ODbL data rights do not promise unlimited service or cover adsbdb/models. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Primary provider page checked this audit |

**Primary/provenance links:** [Provider/source documentation](https://www.adsb.lol/docs/open-data/api/)

## P11 — **adsbdb** (`api.adsbdb.com`)

**Exact service:** Aircraft type, model name and registration by ICAO hex for enriched flights; airline and origin/destination airports for the tracked flight's callsign

**Upstream paths/functions:** `server/providers/aircraft/enrichment.js` (adsbdbProxy), `src/sources/live/standalone.js` (createOpenSkySource, createAdsbLolSource, createAisStreamSource)

**Endpoint evidence:** `https://api.adsbdb.com/v0/aircraft/${encodeURIComponent(key)}`; `https://api.adsbdb.com/v0/callsign/${encodeURIComponent(key)}`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: No licence or rate limit is published for the service. Its own credits: aircraft data from PlaneBase, ICAO-to-N-number conversion by Guillaume Michel, and flight route data that "is the work of David Taylor, Edinburgh and Jim Mason, Glasgow, and may not be copied, published, or incorporated into other databases without the explicit permission of David J Taylor, Edinburgh" |
| Attribution | "adsbdb — api.adsbdb.com" (courtesy); route data credited to David Taylor, Edinburgh, and Jim Mason, Glasgow |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P12 — **AISStream.io**

**Exact service:** Live vessels (AIS)

**Upstream paths/functions:** `server/providers/vessels/ais-live.js` (aisLiveProxy), `src/sources/live/standalone.js` (createOpenSkySource, createAdsbLolSource, createAisStreamSource)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | AISSTREAM_API_KEY server-side WebSocket; no key provided. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: Free, beta, no formal ToS; AIS is a public broadcast |
| Attribution | "AISStream.io" (courtesy) |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P13 — **CelesTrak**

**Exact service:** Satellite TLEs (SGP4)

**Upstream paths/functions:** `server/providers/space/celestrak.js` (celestrakProxy), `src/layers/satellites/source.js` (createSatelliteSource), `src/data/spaceProviderRequests.js` (celestrakTleUrl, launchLibraryRecentUrl)

**Endpoint evidence:** `https://celestrak.org/NORAD/elements/gp.php`; `https://celestrak.org/NORAD/elements/gp.php?GROUP=`; `https://ll.thespacedevs.com/2.3.0/launches/`

**Hub path:** runtimes/earth-runtime/layers/GodsEyeSatellitesAdapter.mjs createSatellitesAdapter (stations only).

| Boundary | Finding |
| --- | --- |
| Authentication | No key; identifying server client and canonical GP queries. |
| Free / paid | Public service; rights/redistribution scope requires explicit review. |
| Rate limits | Download only required groups once per update; GP2-hour update cadence. Repeated error requests can trigger blocking. |
| Commercial / data rights | Primary usage policy verified; government origin alone does not establish complete service/data license. |
| Attribution | "CelesTrak (celestrak.org), Dr. T.S. Kelso" |
| Caching permission | Share bounded cache across clients; upstream6h/Hub4h per-instance cache is implementation, not permission to refetch on every reload. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | Yes: pinned server explicitly documents missing CORS; share group cache and source-age metadata; browser-direct safety unqualified. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | Upstream warm memory/disk stale and partial group retention; no provider replacement. |
| Evidence confidence | Primary provider page checked this audit |

**Primary/provenance links:** [Provider/source documentation](https://celestrak.org/usage-policy.php), [Provider/source documentation](https://celestrak.org/NORAD/documentation/gp-data-formats.php)

## P14 — **The Space Devs — Launch Library 2 v2.3**

**Exact service:** Recent launch, payload, stage, and recovery metadata for Space Missions (30d)

**Upstream paths/functions:** `server/providers/space.js`, `src/layers/launches/source.js` (createLaunchSource), `src/data/spaceProviderRequests.js` (celestrakTleUrl, launchLibraryRecentUrl)

**Endpoint evidence:** `https://celestrak.org/NORAD/elements/gp.php`; `https://ll.thespacedevs.com/2.3.0/launches/`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | Anonymous free tier, optional higher-rate key. |
| Free / paid | Free15calls/hour; paid/supporter higher tier. |
| Rate limits | 15calls/hour free; verify chosen tier. |
| Commercial / data rights | TSD permits data use/sharing, discourages forwarding without added value; attribution encouraged, accuracy not guaranteed. |
| Attribution | "Launch Library 2 — The Space Devs" (courtesy attribution) |
| Caching permission | TSD recommends server caching rather than direct client fan-out. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Primary provider page checked this audit |

**Primary/provenance links:** [Provider/source documentation](https://github.com/TheSpaceDevs/Tutorials/blob/main/faqs/faq_TSD.md)

## P15 — **Esri World Imagery** (ArcGIS Online tile service)

**Exact service:** The keyless satellite basemap — the default landing when no Google/ion credential is configured, and the "Esri Satellite" map stack

**Upstream paths/functions:** `src/maps/imagery.js` (ESRI_ATTRIBUTION_HTML, createOsmImagery, createEsriImagery, createIonImagery)

**Endpoint evidence:** `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer`; `https://tile.openstreetmap.org/`; `https://www.esri.com`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | Pinned classic WorldImagery endpoint keyless; account-hosted alternatives differ. |
| Free / paid | Observed public endpoint; public-scale entitlement not proven by HTTP200. |
| Rate limits | UNKNOWN numeric quota; no SLA inferred. |
| Commercial / data rights | Esri hosted-service agreement plus imagery-provider rights; review deployment entitlement. |
| Attribution | "Powered by Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community" (provider carries the service's own credit line) |
| Caching permission | UNKNOWN selected service caching/redistribution permission; do not mirror. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | Keyless map startup path; map-controller fallback/switch generations. |
| Evidence confidence | Primary provider page checked this audit |

**Primary/provenance links:** [Provider/source documentation](https://www.esri.com/en-us/legal/terms/full-master-agreement)

## P16 — **USGS**

**Exact service:** Earthquakes

**Upstream paths/functions:** `src/layers/earthquakes/source.js` (createUsgsEarthquakeSource)

**Endpoint evidence:** `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson`

**Hub path:** backend/app/services/earth_events.py acquire/normalize_quakes; routes/earth.py earthquakes.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: U.S. public domain |
| Attribution | "Data courtesy of the U.S. Geological Survey" |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | Current FastAPI justified for normalized typed source/time/size/ranking contract; browser-capable provider does not require wholesale Node sidecar. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P17 — **NASA GIBS** (WMTS tiles + Worldview Snapshots) and **NASA CMR** (granule catalog)

**Exact service:** Recent Imagery layer: HLS S30/L30 (Sentinel-2, Landsat 8/9) and VIIRS true-colour tiles draped on the map, per-day thumbnails and PNG exports; the HLS granule catalog (dates, cloud, footprints) for a selected box

**Upstream paths/functions:** `src/layers/recentImagery/catalog.js` (fetchCmrPages, parseCmrUmm, cmrSearchUrl, searchHls), `src/layers/recentImagery/model.js` (CATALOG_DAYS, PRODUCTS, boxSideKm, validateBox, viewTooLargeMessage, fitViewHeightM, boxCentre, boxFromPin, boxFromRectangle, quantizeBox, dequantizeBox, utcDay, shortDay, hhmm, candidateKey, parseCandidateKey, groupGranulesByDay, viirsCandidates, mergeCandidates, coverageFor, rankLatest, formatCandidateReadout, gibsTemplate, wvsSnapshotUrl, thumbnailOrder), `src/layers/recentImagery/rendering.js` (TILE_RENDER_REASON, TILE_RETRY_DELAY_MS, createRecentImageryRenderer)

**Endpoint evidence:** `https://cmr.earthdata.nasa.gov/search`; `https://gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/${spec.gibsLayer}/default/${day}/GoogleMapsCompatible_Level${spec.maxLevel}/{z}/{y}/{x}.${spec.format}`; `https://wvs.earthdata.nasa.gov/api/v1/snapshot`

**Hub path:** runtimes/earth-runtime/core/ImageryController.mjs coarse NASA fallback only; recent-imagery layer absent.

| Boundary | Finding |
| --- | --- |
| Authentication | Keyless CMR/GIBS/Worldview routes used here. |
| Free / paid | Public data services, product-specific data rights still checked. |
| Rate limits | No numerical production quota verified; viewport/request budgets retained. |
| Commercial / data rights | Access documentation verified; sensor-product license/provenance must accompany each product. |
| Attribution | "We acknowledge the use of imagery provided by services from NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Science Data and Information System (ESDIS)." — [gibs.earthdata.nasa.gov](https://gibs.earthdata.nasa.gov), [HLS](https://lpdaac.usgs.gov/products/hlss30v002/) |
| Caching permission | No bulk mirror; transient browser tiles/catalog per documented product terms. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Primary provider page checked this audit |

**Primary/provenance links:** [Provider/source documentation](https://nasa-gibs.github.io/gibs-api-docs/access-basics/)

## P18 — **NIFC WFIGS** (Wildland Fire Interagency Geospatial Services, ArcGIS feature service)

**Exact service:** Fire Perimeters layer: current interagency wildfire incident perimeters, containment, and incident facts

**Upstream paths/functions:** `src/layers/perimeters/source.js` (createWfigsPerimeterSource)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** backend/app/services/earth_events.py acquire/normalize_fires; routes/earth.py fire_perimeters.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: U.S. public domain (interagency wildland-fire data published through the [NIFC Open Data portal](https://data-nifc.opendata.arcgis.com/)); fetched keyless through `/api/fire-perimeters` (5-minute server cache) with `exceededTransferLimit` paging |
| Attribution | "Wildfire perimeters: National Interagency Fire Center (WFIGS)" |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** [Provider/source documentation](https://data-nifc.opendata.arcgis.com/)

## P19 — **InciWeb** (inciweb.wildfire.gov)

**Exact service:** Per-incident "InciWeb ↗" card links to official incident pages (narratives, evacuation/closure notices)

**Upstream paths/functions:** `src/layers/perimeters/inciweb.js` (resolveInciwebNodeLink, inciwebNodeId, isCurrentPublication, createInciwebPublicationSource, findInciwebLink, createInciwebIndexSource)

**Endpoint evidence:** `https://inciweb.wildfire.gov/node/${candidates[0].incident_id}`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: U.S. government public incident information. Links are matched best-effort by incident name and state, with incident page origin and update times checked on selection. Same-origin `/api/fire-perimeters/inciweb` routes cache the catalog for 1 hour and publication metadata for 30 minutes; linked pages remain InciWeb content |
| Attribution | "Incident information: InciWeb (inciweb.wildfire.gov)" |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P20 — **OpenFreeMap / OpenMapTiles**

**Exact service:** Vector tiles

**Upstream paths/functions:** `src/layers/installations/source.js` (installationResponseSaturated, MILITARY_TILE_MIN_ZOOM, MILITARY_TILE_MAX, installationTileZoom, installationAnchorBox, createInstallationSource), `src/layers/traffic/source.js` (trafficDetailBounds, outsideDetailTiles, RoadRequestError, roadRequestError, createTrafficSource)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: OpenStreetMap data under ODbL 1.0 |
| Attribution | OpenFreeMap © OpenMapTiles |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P21 — **Overture Maps Foundation**

**Exact service:** Military area names pack

**Upstream paths/functions:** `src/data/militaryNames.js` (MILITARY_POINT_CAP, MILITARY_LABEL_CAP, MILITARY_NAMES_TIMEOUT_MS, createMilitaryNamesLoader, loadMilitaryNames, nameMilitaryFragment, militaryNamesInView)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/) |
| Attribution | Overture Maps Foundation |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** [Provider/source documentation](https://opendatacommons.org/licenses/odbl/1-0/)

## P22 — **TomTom Traffic API** (flow vector tiles)

**Exact service:** Traffic roads and live congestion (optional, BYOK)

**Upstream paths/functions:** `server/providers/traffic.js` (tomtomProxy), `src/layers/traffic/flowSource.js` (createFlowTileSource)

**Endpoint evidence:** `https://api.tomtom.com/traffic/map/4/tile/flow/relative/`; `https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.pbf`; `https://docs.tomtom.com/pricing/).`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | TOMTOM_API_KEY server-side, optional BYOK. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: [TomTom for Developers terms](https://developer.tomtom.com) (proprietary, your own key; free tier currently 200K tile requests/month — see [current pricing](https://docs.tomtom.com/pricing/)) |
| Attribution | "Traffic flow data © TomTom" — registered when live mode activates |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** [Provider/source documentation](https://developer.tomtom.com), [Provider/source documentation](https://docs.tomtom.com/pricing/)

## P23 — **Photon** (komoot)

**Exact service:** Keyless place search — the fallback when no Google Maps key is configured, or when Google declines the Geocoding request

**Upstream paths/functions:** `src/keylessGeocoder.js` (photonResultTypes, photonExtentToBounds, photonResultLabel, normalizePhotonFeature, photonSearchUrl, normalizeToponym, selectPhotonFeature, geocodeKeylessWithOutcome, geocodeKeyless, createPhotonGeocoder)

**Endpoint evidence:** `https://photon.komoot.io/api/`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: Service: free public instance, [fair use](https://photon.komoot.io) (no bulk/heavy use); underlying data: **ODbL 1.0** |
| Attribution | "Photon (komoot)" |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | Google→Photon→Nominatim source chain upstream; not implemented Hub. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** [Provider/source documentation](https://photon.komoot.io)

## P24 — **Open-Meteo**

**Exact service:** Current weather in the cockpit Local Info page and cockpit-local dynamic atmospheric effects

**Upstream paths/functions:** `server/providers/regional/weather.js`, `src/data/regionalModel.js` (normalizeRegionalPlace, normalizeRegionalArticles, normalizeRegionalWeather, weatherCodeLabel, regionalDistanceM)

**Endpoint evidence:** `https://api.open-meteo.com/v1/forecast?${params}`

**Hub path:** runtimes/earth-runtime/layers/GodsEyeWeatherAdapter.mjs createWeatherAdapter (browser-direct).

| Boundary | Finding |
| --- | --- |
| Authentication | Free endpoint no key; commercial customer endpoint/key separate. |
| Free / paid | Free hosted service only for noncommercial use; paid commercial plan available. |
| Rate limits | Free600/min,5000/hour,10000/day,300000/month at audit date. |
| Commercial / data rights | Data CC BY4.0; hosted free-service restriction separate. |
| Attribution | Linked "Weather data by Open-Meteo.com" beside the displayed local data |
| Caching permission | Data license permits reuse subject to attribution; service quotas and paid-host restrictions still apply. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | Browser-direct observed200; CORS alone does not resolve noncommercial service/aggregate quota/privacy. Proxy may be justified for quota/cache. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Primary provider page checked this audit |

**Primary/provenance links:** [Provider/source documentation](https://open-meteo.com/en/terms)

## P25 — **Google News RSS**

**Exact service:** Primary locality-matched headlines in the cockpit Regional News page

**Upstream paths/functions:** `server/providers/regional/news.js`

**Endpoint evidence:** `https://api.gdeltproject.org/api/v2/doc/doc?${params}`; `https://news.google.com/rss/search?${rssParams}`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: [Google News Terms of Service](https://www.google.com/intl/en_us/terms_google_news.html) restrict use to personal, noncommercial use; linked articles remain third-party publisher content and retain publisher terms |
| Attribution | "Google News RSS" plus each article's linked publisher/domain |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | GDELT if RSS fails/empty; source-labelled. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** [Provider/source documentation](https://www.google.com/intl/en_us/terms_google_news.html)

## P26 — **GDELT Project DOC 2.0**

**Exact service:** Fail-soft fallback for location-matched cockpit headlines

**Upstream paths/functions:** `server/providers/regional/news.js`

**Endpoint evidence:** `https://api.gdeltproject.org/api/v2/doc/doc?${params}`; `https://news.google.com/rss/search?${rssParams}`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: [GDELT Terms of Use](https://www.gdeltproject.org/about.html#termsofuse): unrestricted academic/commercial/governmental dataset use, with citation and link required; linked articles retain publisher terms |
| Attribution | "GDELT Project" plus each article's linked publisher/domain |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** [Provider/source documentation](https://www.gdeltproject.org/about.html#termsofuse)

## P27 — **City of Austin Open Data**

**Exact service:** CCTV camera catalog + frames

**Upstream paths/functions:** `server/providers/cctv/constants.js` (DEFAULT_CCTV_SOURCE_FILE, DEFAULT_AUSTIN_ROWS_URL, DEFAULT_AUSTIN_MAX_SOURCES, DEFAULT_CCTV_MAX_SOURCES, CCTV_MAX_SOURCES_CEILING, AUSTIN_DOWNTOWN, TXDOT_ORIGIN, TXDOT_CCTV_STATUS_URL, TXDOT_CCTV_SNAPSHOT_URL, TXDOT_DISTRICTS, DEFAULT_TXDOT_DISTRICTS, DEFAULT_TXDOT_MAX_SOURCES, TXDOT_ANCHORS, TXDOT_DISTRICT_ELEVATION_M, TXDOT_DEFAULT_ELEVATION_M, CALTRANS_CCTV_URL, DEFAULT_CALTRANS_DISTRICTS, DEFAULT_CALTRANS_MAX_SOURCES, CALTRANS_ANCHORS, TFL_JAMCAM_URL, TFL_IMAGE_ORIGIN, DEFAULT_TFL_MAX_SOURCES, LONDON_CENTER, ONTARIO_511_CAMERAS_URL, ONTARIO_511_IMAGE_ORIGIN, DEFAULT_ONTARIO_MAX_SOURCES, ONTARIO_ANCHORS, FINTRAFFIC_STATIONS_URL, FINTRAFFIC_IMAGE_ORIGIN, DIGITRAFFIC_USER, DEFAULT_FINTRAFFIC_MAX_SOURCES, FINTRAFFIC_GROUND_ELEVATION_M, FINLAND_ANCHORS, DRIVEBC_WEBCAMS_URL, DRIVEBC_IMAGE_URL, DEFAULT_DRIVEBC_MAX_SOURCES, DRIVEBC_ANCHORS, DEFAULT_TALLINN_SOURCE_FILE, DEFAULT_TALLINN_MAX_SOURCES, TALLINN_IMAGE_ORIGIN, TALLINN_CENTER, TARKTEE_LOCATIONS_URL, TARKTEE_IMAGES_URL, TARKTEE_IMAGE_ORIGIN, DEFAULT_TARKTEE_MAX_SOURCES, TARKTEE_ANCHORS, DEFAULT_WARENDORF_SOURCE_FILE, WARENDORF_IMAGE_ORIGINS, NSW_CAMERAS_URL, NSW_IMAGE_ORIGIN, DEFAULT_NSW_MAX_SOURCES, SYDNEY_CENTER, NSW_IMAGE_USER_AGENT, NSW_MAX_VIEW_LABEL, DEFAULT_CALGARY_ROWS_URL, CALGARY_IMAGE_ORIGIN, DEFAULT_CALGARY_MAX_SOURCES, CALGARY_DOWNTOWN, CALGARY_MAX_CATALOG_BYTES, DELDOT_CCTV_URL, DEFAULT_DELDOT_MAX_SOURCES, DELDOT_ANCHORS, CCTV_SOURCE_CACHE_MS, CCTV_SOURCE_FETCH_TIMEOUT_MS, CCTV_FRAME_FETCH_TIMEOUT_MS, CCTV_FRAME_MAX_BODY_BYTES, CCTV_MEDIA_FETCH_TIMEOUT_MS, CCTV_MEDIA_IDLE_TIMEOUT_MS, CCTV_MEDIA_MAX_BODY_BYTES), `server/providers/cctv/catalog.js` (createCctvCatalog), `server/providers/cctv/sources.js` (loadAustinSourcesFromOpenData, loadCaltransSourcesFromOpenData, loadTflSourcesFromOpenData, loadOntarioSourcesFromOpenData, loadFintrafficSourcesFromOpenData, driveBcImageCredit, loadDriveBcSourcesFromOpenData, normalizeTxdotDistrictPayload, loadTxdotSourcesFromOpenData, loadTallinnSourcesFromCatalog, parseTarkteeDatexLocations, parseTarkteeDatexImages, loadTarkteeSourcesFromDatex, loadWarendorfSourcesFromCatalog, nswCameraLabel, nswCameraToSource, loadNswSourcesFromOpenData, normalizeCalgaryImageUrl, calgaryCameraId, calgaryCameraName, calgaryCameraToSource, loadCalgarySourcesFromOpenData, loadDelDOTSourcesFromOpenData), `server/providers/cctv.js` (cctvProxy)

**Endpoint evidence:** `http://webcam.warendorf.de/`; `https://511on.ca/api/v2/get/cameras?format=json&lang=en`; `https://511on.ca/map/Cctv/`; `https://api.tfl.gov.uk/Place/Type/JamCam`; `https://cctv.austinmobility.io/image/${encodeURIComponent(cameraId)}.jpg`; `https://cwwp2.dot.ca.gov/`; `https://cwwp2.dot.ca.gov/data/d${district}/cctv/cctvStatusD${String(district).padStart(2,`; `https://data.austintexas.gov/api/views/b4k4-adkb/rows.json?accessType=DOWNLOAD`; `https://data.calgary.ca/resource/k7p9-kppz.json?$limit=500`; `https://data.livetraffic.com/cameras/traffic-cam.json`; `https://its.txdot.gov`; `https://maps.googleapis.com/maps/api/streetview`; `https://ristmikud.tallinn.ee/`; `https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraImages`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraLocations`; `https://tarktee.transpordiamet.ee/images/`; `https://tarktee.transpordiamet.ee/images/…`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: City of Austin Open Data Terms of Use |
| Attribution | "City of Austin, TX — data.austintexas.gov" |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified for allowlisted upstream frame/HLS transport, payload/time caps and mixed-content/CORS; do not create open URL proxy. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P28 — **TxDOT ITS (its.txdot.gov)**

**Exact service:** CCTV camera catalogs + frames, Texas districts

**Upstream paths/functions:** `server/providers/cctv/constants.js` (DEFAULT_CCTV_SOURCE_FILE, DEFAULT_AUSTIN_ROWS_URL, DEFAULT_AUSTIN_MAX_SOURCES, DEFAULT_CCTV_MAX_SOURCES, CCTV_MAX_SOURCES_CEILING, AUSTIN_DOWNTOWN, TXDOT_ORIGIN, TXDOT_CCTV_STATUS_URL, TXDOT_CCTV_SNAPSHOT_URL, TXDOT_DISTRICTS, DEFAULT_TXDOT_DISTRICTS, DEFAULT_TXDOT_MAX_SOURCES, TXDOT_ANCHORS, TXDOT_DISTRICT_ELEVATION_M, TXDOT_DEFAULT_ELEVATION_M, CALTRANS_CCTV_URL, DEFAULT_CALTRANS_DISTRICTS, DEFAULT_CALTRANS_MAX_SOURCES, CALTRANS_ANCHORS, TFL_JAMCAM_URL, TFL_IMAGE_ORIGIN, DEFAULT_TFL_MAX_SOURCES, LONDON_CENTER, ONTARIO_511_CAMERAS_URL, ONTARIO_511_IMAGE_ORIGIN, DEFAULT_ONTARIO_MAX_SOURCES, ONTARIO_ANCHORS, FINTRAFFIC_STATIONS_URL, FINTRAFFIC_IMAGE_ORIGIN, DIGITRAFFIC_USER, DEFAULT_FINTRAFFIC_MAX_SOURCES, FINTRAFFIC_GROUND_ELEVATION_M, FINLAND_ANCHORS, DRIVEBC_WEBCAMS_URL, DRIVEBC_IMAGE_URL, DEFAULT_DRIVEBC_MAX_SOURCES, DRIVEBC_ANCHORS, DEFAULT_TALLINN_SOURCE_FILE, DEFAULT_TALLINN_MAX_SOURCES, TALLINN_IMAGE_ORIGIN, TALLINN_CENTER, TARKTEE_LOCATIONS_URL, TARKTEE_IMAGES_URL, TARKTEE_IMAGE_ORIGIN, DEFAULT_TARKTEE_MAX_SOURCES, TARKTEE_ANCHORS, DEFAULT_WARENDORF_SOURCE_FILE, WARENDORF_IMAGE_ORIGINS, NSW_CAMERAS_URL, NSW_IMAGE_ORIGIN, DEFAULT_NSW_MAX_SOURCES, SYDNEY_CENTER, NSW_IMAGE_USER_AGENT, NSW_MAX_VIEW_LABEL, DEFAULT_CALGARY_ROWS_URL, CALGARY_IMAGE_ORIGIN, DEFAULT_CALGARY_MAX_SOURCES, CALGARY_DOWNTOWN, CALGARY_MAX_CATALOG_BYTES, DELDOT_CCTV_URL, DEFAULT_DELDOT_MAX_SOURCES, DELDOT_ANCHORS, CCTV_SOURCE_CACHE_MS, CCTV_SOURCE_FETCH_TIMEOUT_MS, CCTV_FRAME_FETCH_TIMEOUT_MS, CCTV_FRAME_MAX_BODY_BYTES, CCTV_MEDIA_FETCH_TIMEOUT_MS, CCTV_MEDIA_IDLE_TIMEOUT_MS, CCTV_MEDIA_MAX_BODY_BYTES), `server/providers/cctv/catalog.js` (createCctvCatalog), `server/providers/cctv/sources.js` (loadAustinSourcesFromOpenData, loadCaltransSourcesFromOpenData, loadTflSourcesFromOpenData, loadOntarioSourcesFromOpenData, loadFintrafficSourcesFromOpenData, driveBcImageCredit, loadDriveBcSourcesFromOpenData, normalizeTxdotDistrictPayload, loadTxdotSourcesFromOpenData, loadTallinnSourcesFromCatalog, parseTarkteeDatexLocations, parseTarkteeDatexImages, loadTarkteeSourcesFromDatex, loadWarendorfSourcesFromCatalog, nswCameraLabel, nswCameraToSource, loadNswSourcesFromOpenData, normalizeCalgaryImageUrl, calgaryCameraId, calgaryCameraName, calgaryCameraToSource, loadCalgarySourcesFromOpenData, loadDelDOTSourcesFromOpenData), `server/providers/cctv.js` (cctvProxy)

**Endpoint evidence:** `http://webcam.warendorf.de/`; `https://511on.ca/api/v2/get/cameras?format=json&lang=en`; `https://511on.ca/map/Cctv/`; `https://api.tfl.gov.uk/Place/Type/JamCam`; `https://cctv.austinmobility.io/image/${encodeURIComponent(cameraId)}.jpg`; `https://cwwp2.dot.ca.gov/`; `https://cwwp2.dot.ca.gov/data/d${district}/cctv/cctvStatusD${String(district).padStart(2,`; `https://data.austintexas.gov/api/views/b4k4-adkb/rows.json?accessType=DOWNLOAD`; `https://data.calgary.ca/resource/k7p9-kppz.json?$limit=500`; `https://data.livetraffic.com/cameras/traffic-cam.json`; `https://its.txdot.gov`; `https://maps.googleapis.com/maps/api/streetview`; `https://ristmikud.tallinn.ee/`; `https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraImages`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraLocations`; `https://tarktee.transpordiamet.ee/images/`; `https://tarktee.transpordiamet.ee/images/…`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: Public TxDOT traffic camera data |
| Attribution | "Texas Department of Transportation" (courtesy) |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified for allowlisted upstream frame/HLS transport, payload/time caps and mixed-content/CORS; do not create open URL proxy. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P29 — **City of Tallinn (ristmikud.tallinn.ee)**

**Exact service:** CCTV camera catalog + frames, Tallinn intersections

**Upstream paths/functions:** `server/providers/cctv/constants.js` (DEFAULT_CCTV_SOURCE_FILE, DEFAULT_AUSTIN_ROWS_URL, DEFAULT_AUSTIN_MAX_SOURCES, DEFAULT_CCTV_MAX_SOURCES, CCTV_MAX_SOURCES_CEILING, AUSTIN_DOWNTOWN, TXDOT_ORIGIN, TXDOT_CCTV_STATUS_URL, TXDOT_CCTV_SNAPSHOT_URL, TXDOT_DISTRICTS, DEFAULT_TXDOT_DISTRICTS, DEFAULT_TXDOT_MAX_SOURCES, TXDOT_ANCHORS, TXDOT_DISTRICT_ELEVATION_M, TXDOT_DEFAULT_ELEVATION_M, CALTRANS_CCTV_URL, DEFAULT_CALTRANS_DISTRICTS, DEFAULT_CALTRANS_MAX_SOURCES, CALTRANS_ANCHORS, TFL_JAMCAM_URL, TFL_IMAGE_ORIGIN, DEFAULT_TFL_MAX_SOURCES, LONDON_CENTER, ONTARIO_511_CAMERAS_URL, ONTARIO_511_IMAGE_ORIGIN, DEFAULT_ONTARIO_MAX_SOURCES, ONTARIO_ANCHORS, FINTRAFFIC_STATIONS_URL, FINTRAFFIC_IMAGE_ORIGIN, DIGITRAFFIC_USER, DEFAULT_FINTRAFFIC_MAX_SOURCES, FINTRAFFIC_GROUND_ELEVATION_M, FINLAND_ANCHORS, DRIVEBC_WEBCAMS_URL, DRIVEBC_IMAGE_URL, DEFAULT_DRIVEBC_MAX_SOURCES, DRIVEBC_ANCHORS, DEFAULT_TALLINN_SOURCE_FILE, DEFAULT_TALLINN_MAX_SOURCES, TALLINN_IMAGE_ORIGIN, TALLINN_CENTER, TARKTEE_LOCATIONS_URL, TARKTEE_IMAGES_URL, TARKTEE_IMAGE_ORIGIN, DEFAULT_TARKTEE_MAX_SOURCES, TARKTEE_ANCHORS, DEFAULT_WARENDORF_SOURCE_FILE, WARENDORF_IMAGE_ORIGINS, NSW_CAMERAS_URL, NSW_IMAGE_ORIGIN, DEFAULT_NSW_MAX_SOURCES, SYDNEY_CENTER, NSW_IMAGE_USER_AGENT, NSW_MAX_VIEW_LABEL, DEFAULT_CALGARY_ROWS_URL, CALGARY_IMAGE_ORIGIN, DEFAULT_CALGARY_MAX_SOURCES, CALGARY_DOWNTOWN, CALGARY_MAX_CATALOG_BYTES, DELDOT_CCTV_URL, DEFAULT_DELDOT_MAX_SOURCES, DELDOT_ANCHORS, CCTV_SOURCE_CACHE_MS, CCTV_SOURCE_FETCH_TIMEOUT_MS, CCTV_FRAME_FETCH_TIMEOUT_MS, CCTV_FRAME_MAX_BODY_BYTES, CCTV_MEDIA_FETCH_TIMEOUT_MS, CCTV_MEDIA_IDLE_TIMEOUT_MS, CCTV_MEDIA_MAX_BODY_BYTES), `server/providers/cctv/catalog.js` (createCctvCatalog), `server/providers/cctv/sources.js` (loadAustinSourcesFromOpenData, loadCaltransSourcesFromOpenData, loadTflSourcesFromOpenData, loadOntarioSourcesFromOpenData, loadFintrafficSourcesFromOpenData, driveBcImageCredit, loadDriveBcSourcesFromOpenData, normalizeTxdotDistrictPayload, loadTxdotSourcesFromOpenData, loadTallinnSourcesFromCatalog, parseTarkteeDatexLocations, parseTarkteeDatexImages, loadTarkteeSourcesFromDatex, loadWarendorfSourcesFromCatalog, nswCameraLabel, nswCameraToSource, loadNswSourcesFromOpenData, normalizeCalgaryImageUrl, calgaryCameraId, calgaryCameraName, calgaryCameraToSource, loadCalgarySourcesFromOpenData, loadDelDOTSourcesFromOpenData), `server/providers/cctv.js` (cctvProxy)

**Endpoint evidence:** `http://webcam.warendorf.de/`; `https://511on.ca/api/v2/get/cameras?format=json&lang=en`; `https://511on.ca/map/Cctv/`; `https://api.tfl.gov.uk/Place/Type/JamCam`; `https://cctv.austinmobility.io/image/${encodeURIComponent(cameraId)}.jpg`; `https://cwwp2.dot.ca.gov/`; `https://cwwp2.dot.ca.gov/data/d${district}/cctv/cctvStatusD${String(district).padStart(2,`; `https://data.austintexas.gov/api/views/b4k4-adkb/rows.json?accessType=DOWNLOAD`; `https://data.calgary.ca/resource/k7p9-kppz.json?$limit=500`; `https://data.livetraffic.com/cameras/traffic-cam.json`; `https://its.txdot.gov`; `https://maps.googleapis.com/maps/api/streetview`; `https://ristmikud.tallinn.ee/`; `https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraImages`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraLocations`; `https://tarktee.transpordiamet.ee/images/`; `https://tarktee.transpordiamet.ee/images/…`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: Public City of Tallinn traffic camera data |
| Attribution | "City of Tallinn — ristmikud.tallinn.ee" (courtesy) |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified for allowlisted upstream frame/HLS transport, payload/time caps and mixed-content/CORS; do not create open URL proxy. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P30 — **Transpordiamet / Tarktee**

**Exact service:** CCTV camera catalog + frames, Estonia road-weather cameras

**Upstream paths/functions:** `server/providers/cctv/constants.js` (DEFAULT_CCTV_SOURCE_FILE, DEFAULT_AUSTIN_ROWS_URL, DEFAULT_AUSTIN_MAX_SOURCES, DEFAULT_CCTV_MAX_SOURCES, CCTV_MAX_SOURCES_CEILING, AUSTIN_DOWNTOWN, TXDOT_ORIGIN, TXDOT_CCTV_STATUS_URL, TXDOT_CCTV_SNAPSHOT_URL, TXDOT_DISTRICTS, DEFAULT_TXDOT_DISTRICTS, DEFAULT_TXDOT_MAX_SOURCES, TXDOT_ANCHORS, TXDOT_DISTRICT_ELEVATION_M, TXDOT_DEFAULT_ELEVATION_M, CALTRANS_CCTV_URL, DEFAULT_CALTRANS_DISTRICTS, DEFAULT_CALTRANS_MAX_SOURCES, CALTRANS_ANCHORS, TFL_JAMCAM_URL, TFL_IMAGE_ORIGIN, DEFAULT_TFL_MAX_SOURCES, LONDON_CENTER, ONTARIO_511_CAMERAS_URL, ONTARIO_511_IMAGE_ORIGIN, DEFAULT_ONTARIO_MAX_SOURCES, ONTARIO_ANCHORS, FINTRAFFIC_STATIONS_URL, FINTRAFFIC_IMAGE_ORIGIN, DIGITRAFFIC_USER, DEFAULT_FINTRAFFIC_MAX_SOURCES, FINTRAFFIC_GROUND_ELEVATION_M, FINLAND_ANCHORS, DRIVEBC_WEBCAMS_URL, DRIVEBC_IMAGE_URL, DEFAULT_DRIVEBC_MAX_SOURCES, DRIVEBC_ANCHORS, DEFAULT_TALLINN_SOURCE_FILE, DEFAULT_TALLINN_MAX_SOURCES, TALLINN_IMAGE_ORIGIN, TALLINN_CENTER, TARKTEE_LOCATIONS_URL, TARKTEE_IMAGES_URL, TARKTEE_IMAGE_ORIGIN, DEFAULT_TARKTEE_MAX_SOURCES, TARKTEE_ANCHORS, DEFAULT_WARENDORF_SOURCE_FILE, WARENDORF_IMAGE_ORIGINS, NSW_CAMERAS_URL, NSW_IMAGE_ORIGIN, DEFAULT_NSW_MAX_SOURCES, SYDNEY_CENTER, NSW_IMAGE_USER_AGENT, NSW_MAX_VIEW_LABEL, DEFAULT_CALGARY_ROWS_URL, CALGARY_IMAGE_ORIGIN, DEFAULT_CALGARY_MAX_SOURCES, CALGARY_DOWNTOWN, CALGARY_MAX_CATALOG_BYTES, DELDOT_CCTV_URL, DEFAULT_DELDOT_MAX_SOURCES, DELDOT_ANCHORS, CCTV_SOURCE_CACHE_MS, CCTV_SOURCE_FETCH_TIMEOUT_MS, CCTV_FRAME_FETCH_TIMEOUT_MS, CCTV_FRAME_MAX_BODY_BYTES, CCTV_MEDIA_FETCH_TIMEOUT_MS, CCTV_MEDIA_IDLE_TIMEOUT_MS, CCTV_MEDIA_MAX_BODY_BYTES), `server/providers/cctv/catalog.js` (createCctvCatalog), `server/providers/cctv/sources.js` (loadAustinSourcesFromOpenData, loadCaltransSourcesFromOpenData, loadTflSourcesFromOpenData, loadOntarioSourcesFromOpenData, loadFintrafficSourcesFromOpenData, driveBcImageCredit, loadDriveBcSourcesFromOpenData, normalizeTxdotDistrictPayload, loadTxdotSourcesFromOpenData, loadTallinnSourcesFromCatalog, parseTarkteeDatexLocations, parseTarkteeDatexImages, loadTarkteeSourcesFromDatex, loadWarendorfSourcesFromCatalog, nswCameraLabel, nswCameraToSource, loadNswSourcesFromOpenData, normalizeCalgaryImageUrl, calgaryCameraId, calgaryCameraName, calgaryCameraToSource, loadCalgarySourcesFromOpenData, loadDelDOTSourcesFromOpenData), `server/providers/cctv.js` (cctvProxy)

**Endpoint evidence:** `http://webcam.warendorf.de/`; `https://511on.ca/api/v2/get/cameras?format=json&lang=en`; `https://511on.ca/map/Cctv/`; `https://api.tfl.gov.uk/Place/Type/JamCam`; `https://cctv.austinmobility.io/image/${encodeURIComponent(cameraId)}.jpg`; `https://cwwp2.dot.ca.gov/`; `https://cwwp2.dot.ca.gov/data/d${district}/cctv/cctvStatusD${String(district).padStart(2,`; `https://data.austintexas.gov/api/views/b4k4-adkb/rows.json?accessType=DOWNLOAD`; `https://data.calgary.ca/resource/k7p9-kppz.json?$limit=500`; `https://data.livetraffic.com/cameras/traffic-cam.json`; `https://its.txdot.gov`; `https://maps.googleapis.com/maps/api/streetview`; `https://ristmikud.tallinn.ee/`; `https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraImages`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraLocations`; `https://tarktee.transpordiamet.ee/images/`; `https://tarktee.transpordiamet.ee/images/…`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: Public Transpordiamet / Tarktee road camera data |
| Attribution | "Transpordiamet / Tarktee — tarktee.transpordiamet.ee" (courtesy) |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified for allowlisted upstream frame/HLS transport, payload/time caps and mixed-content/CORS; do not create open URL proxy. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P31 — **Stadt Warendorf webcam**

**Exact service:** Webcam frames, Marktplatz / Historisches Rathaus (`config/cctv_sources.warendorf.json`)

**Upstream paths/functions:** `server/providers/cctv/constants.js` (DEFAULT_CCTV_SOURCE_FILE, DEFAULT_AUSTIN_ROWS_URL, DEFAULT_AUSTIN_MAX_SOURCES, DEFAULT_CCTV_MAX_SOURCES, CCTV_MAX_SOURCES_CEILING, AUSTIN_DOWNTOWN, TXDOT_ORIGIN, TXDOT_CCTV_STATUS_URL, TXDOT_CCTV_SNAPSHOT_URL, TXDOT_DISTRICTS, DEFAULT_TXDOT_DISTRICTS, DEFAULT_TXDOT_MAX_SOURCES, TXDOT_ANCHORS, TXDOT_DISTRICT_ELEVATION_M, TXDOT_DEFAULT_ELEVATION_M, CALTRANS_CCTV_URL, DEFAULT_CALTRANS_DISTRICTS, DEFAULT_CALTRANS_MAX_SOURCES, CALTRANS_ANCHORS, TFL_JAMCAM_URL, TFL_IMAGE_ORIGIN, DEFAULT_TFL_MAX_SOURCES, LONDON_CENTER, ONTARIO_511_CAMERAS_URL, ONTARIO_511_IMAGE_ORIGIN, DEFAULT_ONTARIO_MAX_SOURCES, ONTARIO_ANCHORS, FINTRAFFIC_STATIONS_URL, FINTRAFFIC_IMAGE_ORIGIN, DIGITRAFFIC_USER, DEFAULT_FINTRAFFIC_MAX_SOURCES, FINTRAFFIC_GROUND_ELEVATION_M, FINLAND_ANCHORS, DRIVEBC_WEBCAMS_URL, DRIVEBC_IMAGE_URL, DEFAULT_DRIVEBC_MAX_SOURCES, DRIVEBC_ANCHORS, DEFAULT_TALLINN_SOURCE_FILE, DEFAULT_TALLINN_MAX_SOURCES, TALLINN_IMAGE_ORIGIN, TALLINN_CENTER, TARKTEE_LOCATIONS_URL, TARKTEE_IMAGES_URL, TARKTEE_IMAGE_ORIGIN, DEFAULT_TARKTEE_MAX_SOURCES, TARKTEE_ANCHORS, DEFAULT_WARENDORF_SOURCE_FILE, WARENDORF_IMAGE_ORIGINS, NSW_CAMERAS_URL, NSW_IMAGE_ORIGIN, DEFAULT_NSW_MAX_SOURCES, SYDNEY_CENTER, NSW_IMAGE_USER_AGENT, NSW_MAX_VIEW_LABEL, DEFAULT_CALGARY_ROWS_URL, CALGARY_IMAGE_ORIGIN, DEFAULT_CALGARY_MAX_SOURCES, CALGARY_DOWNTOWN, CALGARY_MAX_CATALOG_BYTES, DELDOT_CCTV_URL, DEFAULT_DELDOT_MAX_SOURCES, DELDOT_ANCHORS, CCTV_SOURCE_CACHE_MS, CCTV_SOURCE_FETCH_TIMEOUT_MS, CCTV_FRAME_FETCH_TIMEOUT_MS, CCTV_FRAME_MAX_BODY_BYTES, CCTV_MEDIA_FETCH_TIMEOUT_MS, CCTV_MEDIA_IDLE_TIMEOUT_MS, CCTV_MEDIA_MAX_BODY_BYTES), `server/providers/cctv/catalog.js` (createCctvCatalog), `server/providers/cctv/sources.js` (loadAustinSourcesFromOpenData, loadCaltransSourcesFromOpenData, loadTflSourcesFromOpenData, loadOntarioSourcesFromOpenData, loadFintrafficSourcesFromOpenData, driveBcImageCredit, loadDriveBcSourcesFromOpenData, normalizeTxdotDistrictPayload, loadTxdotSourcesFromOpenData, loadTallinnSourcesFromCatalog, parseTarkteeDatexLocations, parseTarkteeDatexImages, loadTarkteeSourcesFromDatex, loadWarendorfSourcesFromCatalog, nswCameraLabel, nswCameraToSource, loadNswSourcesFromOpenData, normalizeCalgaryImageUrl, calgaryCameraId, calgaryCameraName, calgaryCameraToSource, loadCalgarySourcesFromOpenData, loadDelDOTSourcesFromOpenData), `server/providers/cctv.js` (cctvProxy)

**Endpoint evidence:** `http://webcam.warendorf.de/`; `https://511on.ca/api/v2/get/cameras?format=json&lang=en`; `https://511on.ca/map/Cctv/`; `https://api.tfl.gov.uk/Place/Type/JamCam`; `https://cctv.austinmobility.io/image/${encodeURIComponent(cameraId)}.jpg`; `https://cwwp2.dot.ca.gov/`; `https://cwwp2.dot.ca.gov/data/d${district}/cctv/cctvStatusD${String(district).padStart(2,`; `https://data.austintexas.gov/api/views/b4k4-adkb/rows.json?accessType=DOWNLOAD`; `https://data.calgary.ca/resource/k7p9-kppz.json?$limit=500`; `https://data.livetraffic.com/cameras/traffic-cam.json`; `https://its.txdot.gov`; `https://maps.googleapis.com/maps/api/streetview`; `https://ristmikud.tallinn.ee/`; `https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraImages`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraLocations`; `https://tarktee.transpordiamet.ee/images/`; `https://tarktee.transpordiamet.ee/images/…`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: Public municipal webcam data |
| Attribution | "Stadt Warendorf — webcam.warendorf.de" (courtesy) |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified for allowlisted upstream frame/HLS transport, payload/time caps and mixed-content/CORS; do not create open URL proxy. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P32 — **Live Traffic NSW (Transport for NSW)**

**Exact service:** CCTV camera catalog + frames, New South Wales

**Upstream paths/functions:** `server/providers/cctv/constants.js` (DEFAULT_CCTV_SOURCE_FILE, DEFAULT_AUSTIN_ROWS_URL, DEFAULT_AUSTIN_MAX_SOURCES, DEFAULT_CCTV_MAX_SOURCES, CCTV_MAX_SOURCES_CEILING, AUSTIN_DOWNTOWN, TXDOT_ORIGIN, TXDOT_CCTV_STATUS_URL, TXDOT_CCTV_SNAPSHOT_URL, TXDOT_DISTRICTS, DEFAULT_TXDOT_DISTRICTS, DEFAULT_TXDOT_MAX_SOURCES, TXDOT_ANCHORS, TXDOT_DISTRICT_ELEVATION_M, TXDOT_DEFAULT_ELEVATION_M, CALTRANS_CCTV_URL, DEFAULT_CALTRANS_DISTRICTS, DEFAULT_CALTRANS_MAX_SOURCES, CALTRANS_ANCHORS, TFL_JAMCAM_URL, TFL_IMAGE_ORIGIN, DEFAULT_TFL_MAX_SOURCES, LONDON_CENTER, ONTARIO_511_CAMERAS_URL, ONTARIO_511_IMAGE_ORIGIN, DEFAULT_ONTARIO_MAX_SOURCES, ONTARIO_ANCHORS, FINTRAFFIC_STATIONS_URL, FINTRAFFIC_IMAGE_ORIGIN, DIGITRAFFIC_USER, DEFAULT_FINTRAFFIC_MAX_SOURCES, FINTRAFFIC_GROUND_ELEVATION_M, FINLAND_ANCHORS, DRIVEBC_WEBCAMS_URL, DRIVEBC_IMAGE_URL, DEFAULT_DRIVEBC_MAX_SOURCES, DRIVEBC_ANCHORS, DEFAULT_TALLINN_SOURCE_FILE, DEFAULT_TALLINN_MAX_SOURCES, TALLINN_IMAGE_ORIGIN, TALLINN_CENTER, TARKTEE_LOCATIONS_URL, TARKTEE_IMAGES_URL, TARKTEE_IMAGE_ORIGIN, DEFAULT_TARKTEE_MAX_SOURCES, TARKTEE_ANCHORS, DEFAULT_WARENDORF_SOURCE_FILE, WARENDORF_IMAGE_ORIGINS, NSW_CAMERAS_URL, NSW_IMAGE_ORIGIN, DEFAULT_NSW_MAX_SOURCES, SYDNEY_CENTER, NSW_IMAGE_USER_AGENT, NSW_MAX_VIEW_LABEL, DEFAULT_CALGARY_ROWS_URL, CALGARY_IMAGE_ORIGIN, DEFAULT_CALGARY_MAX_SOURCES, CALGARY_DOWNTOWN, CALGARY_MAX_CATALOG_BYTES, DELDOT_CCTV_URL, DEFAULT_DELDOT_MAX_SOURCES, DELDOT_ANCHORS, CCTV_SOURCE_CACHE_MS, CCTV_SOURCE_FETCH_TIMEOUT_MS, CCTV_FRAME_FETCH_TIMEOUT_MS, CCTV_FRAME_MAX_BODY_BYTES, CCTV_MEDIA_FETCH_TIMEOUT_MS, CCTV_MEDIA_IDLE_TIMEOUT_MS, CCTV_MEDIA_MAX_BODY_BYTES), `server/providers/cctv/catalog.js` (createCctvCatalog), `server/providers/cctv/sources.js` (loadAustinSourcesFromOpenData, loadCaltransSourcesFromOpenData, loadTflSourcesFromOpenData, loadOntarioSourcesFromOpenData, loadFintrafficSourcesFromOpenData, driveBcImageCredit, loadDriveBcSourcesFromOpenData, normalizeTxdotDistrictPayload, loadTxdotSourcesFromOpenData, loadTallinnSourcesFromCatalog, parseTarkteeDatexLocations, parseTarkteeDatexImages, loadTarkteeSourcesFromDatex, loadWarendorfSourcesFromCatalog, nswCameraLabel, nswCameraToSource, loadNswSourcesFromOpenData, normalizeCalgaryImageUrl, calgaryCameraId, calgaryCameraName, calgaryCameraToSource, loadCalgarySourcesFromOpenData, loadDelDOTSourcesFromOpenData), `server/providers/cctv.js` (cctvProxy)

**Endpoint evidence:** `http://webcam.warendorf.de/`; `https://511on.ca/api/v2/get/cameras?format=json&lang=en`; `https://511on.ca/map/Cctv/`; `https://api.tfl.gov.uk/Place/Type/JamCam`; `https://cctv.austinmobility.io/image/${encodeURIComponent(cameraId)}.jpg`; `https://cwwp2.dot.ca.gov/`; `https://cwwp2.dot.ca.gov/data/d${district}/cctv/cctvStatusD${String(district).padStart(2,`; `https://data.austintexas.gov/api/views/b4k4-adkb/rows.json?accessType=DOWNLOAD`; `https://data.calgary.ca/resource/k7p9-kppz.json?$limit=500`; `https://data.livetraffic.com/cameras/traffic-cam.json`; `https://its.txdot.gov`; `https://maps.googleapis.com/maps/api/streetview`; `https://ristmikud.tallinn.ee/`; `https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraImages`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraLocations`; `https://tarktee.transpordiamet.ee/images/`; `https://tarktee.transpordiamet.ee/images/…`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: [CC BY 4.0](https://opendata.transport.nsw.gov.au/) — attribution REQUIRED |
| Attribution | "Live Traffic NSW — Transport for NSW" |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified for allowlisted upstream frame/HLS transport, payload/time caps and mixed-content/CORS; do not create open URL proxy. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** [Provider/source documentation](https://opendata.transport.nsw.gov.au/)

## P33 — **Caltrans (cwwp2.dot.ca.gov)**

**Exact service:** CCTV camera catalogs + frames, California districts

**Upstream paths/functions:** `server/providers/cctv/constants.js` (DEFAULT_CCTV_SOURCE_FILE, DEFAULT_AUSTIN_ROWS_URL, DEFAULT_AUSTIN_MAX_SOURCES, DEFAULT_CCTV_MAX_SOURCES, CCTV_MAX_SOURCES_CEILING, AUSTIN_DOWNTOWN, TXDOT_ORIGIN, TXDOT_CCTV_STATUS_URL, TXDOT_CCTV_SNAPSHOT_URL, TXDOT_DISTRICTS, DEFAULT_TXDOT_DISTRICTS, DEFAULT_TXDOT_MAX_SOURCES, TXDOT_ANCHORS, TXDOT_DISTRICT_ELEVATION_M, TXDOT_DEFAULT_ELEVATION_M, CALTRANS_CCTV_URL, DEFAULT_CALTRANS_DISTRICTS, DEFAULT_CALTRANS_MAX_SOURCES, CALTRANS_ANCHORS, TFL_JAMCAM_URL, TFL_IMAGE_ORIGIN, DEFAULT_TFL_MAX_SOURCES, LONDON_CENTER, ONTARIO_511_CAMERAS_URL, ONTARIO_511_IMAGE_ORIGIN, DEFAULT_ONTARIO_MAX_SOURCES, ONTARIO_ANCHORS, FINTRAFFIC_STATIONS_URL, FINTRAFFIC_IMAGE_ORIGIN, DIGITRAFFIC_USER, DEFAULT_FINTRAFFIC_MAX_SOURCES, FINTRAFFIC_GROUND_ELEVATION_M, FINLAND_ANCHORS, DRIVEBC_WEBCAMS_URL, DRIVEBC_IMAGE_URL, DEFAULT_DRIVEBC_MAX_SOURCES, DRIVEBC_ANCHORS, DEFAULT_TALLINN_SOURCE_FILE, DEFAULT_TALLINN_MAX_SOURCES, TALLINN_IMAGE_ORIGIN, TALLINN_CENTER, TARKTEE_LOCATIONS_URL, TARKTEE_IMAGES_URL, TARKTEE_IMAGE_ORIGIN, DEFAULT_TARKTEE_MAX_SOURCES, TARKTEE_ANCHORS, DEFAULT_WARENDORF_SOURCE_FILE, WARENDORF_IMAGE_ORIGINS, NSW_CAMERAS_URL, NSW_IMAGE_ORIGIN, DEFAULT_NSW_MAX_SOURCES, SYDNEY_CENTER, NSW_IMAGE_USER_AGENT, NSW_MAX_VIEW_LABEL, DEFAULT_CALGARY_ROWS_URL, CALGARY_IMAGE_ORIGIN, DEFAULT_CALGARY_MAX_SOURCES, CALGARY_DOWNTOWN, CALGARY_MAX_CATALOG_BYTES, DELDOT_CCTV_URL, DEFAULT_DELDOT_MAX_SOURCES, DELDOT_ANCHORS, CCTV_SOURCE_CACHE_MS, CCTV_SOURCE_FETCH_TIMEOUT_MS, CCTV_FRAME_FETCH_TIMEOUT_MS, CCTV_FRAME_MAX_BODY_BYTES, CCTV_MEDIA_FETCH_TIMEOUT_MS, CCTV_MEDIA_IDLE_TIMEOUT_MS, CCTV_MEDIA_MAX_BODY_BYTES), `server/providers/cctv/catalog.js` (createCctvCatalog), `server/providers/cctv/sources.js` (loadAustinSourcesFromOpenData, loadCaltransSourcesFromOpenData, loadTflSourcesFromOpenData, loadOntarioSourcesFromOpenData, loadFintrafficSourcesFromOpenData, driveBcImageCredit, loadDriveBcSourcesFromOpenData, normalizeTxdotDistrictPayload, loadTxdotSourcesFromOpenData, loadTallinnSourcesFromCatalog, parseTarkteeDatexLocations, parseTarkteeDatexImages, loadTarkteeSourcesFromDatex, loadWarendorfSourcesFromCatalog, nswCameraLabel, nswCameraToSource, loadNswSourcesFromOpenData, normalizeCalgaryImageUrl, calgaryCameraId, calgaryCameraName, calgaryCameraToSource, loadCalgarySourcesFromOpenData, loadDelDOTSourcesFromOpenData), `server/providers/cctv.js` (cctvProxy)

**Endpoint evidence:** `http://webcam.warendorf.de/`; `https://511on.ca/api/v2/get/cameras?format=json&lang=en`; `https://511on.ca/map/Cctv/`; `https://api.tfl.gov.uk/Place/Type/JamCam`; `https://cctv.austinmobility.io/image/${encodeURIComponent(cameraId)}.jpg`; `https://cwwp2.dot.ca.gov/`; `https://cwwp2.dot.ca.gov/data/d${district}/cctv/cctvStatusD${String(district).padStart(2,`; `https://data.austintexas.gov/api/views/b4k4-adkb/rows.json?accessType=DOWNLOAD`; `https://data.calgary.ca/resource/k7p9-kppz.json?$limit=500`; `https://data.livetraffic.com/cameras/traffic-cam.json`; `https://its.txdot.gov`; `https://maps.googleapis.com/maps/api/streetview`; `https://ristmikud.tallinn.ee/`; `https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraImages`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraLocations`; `https://tarktee.transpordiamet.ee/images/`; `https://tarktee.transpordiamet.ee/images/…`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: Public Caltrans traffic camera data |
| Attribution | "Caltrans — cwwp2.dot.ca.gov" (courtesy) |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified for allowlisted upstream frame/HLS transport, payload/time caps and mixed-content/CORS; do not create open URL proxy. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P34 — **DelDOT (video.deldot.gov)**

**Exact service:** CCTV camera catalog (`tmc.deldot.gov/json/videocamera.json`, cached for 15 minutes) + live HTTPS HLS video, Delaware. Keyless

**Upstream paths/functions:** `server/providers/cctv/constants.js` (DEFAULT_CCTV_SOURCE_FILE, DEFAULT_AUSTIN_ROWS_URL, DEFAULT_AUSTIN_MAX_SOURCES, DEFAULT_CCTV_MAX_SOURCES, CCTV_MAX_SOURCES_CEILING, AUSTIN_DOWNTOWN, TXDOT_ORIGIN, TXDOT_CCTV_STATUS_URL, TXDOT_CCTV_SNAPSHOT_URL, TXDOT_DISTRICTS, DEFAULT_TXDOT_DISTRICTS, DEFAULT_TXDOT_MAX_SOURCES, TXDOT_ANCHORS, TXDOT_DISTRICT_ELEVATION_M, TXDOT_DEFAULT_ELEVATION_M, CALTRANS_CCTV_URL, DEFAULT_CALTRANS_DISTRICTS, DEFAULT_CALTRANS_MAX_SOURCES, CALTRANS_ANCHORS, TFL_JAMCAM_URL, TFL_IMAGE_ORIGIN, DEFAULT_TFL_MAX_SOURCES, LONDON_CENTER, ONTARIO_511_CAMERAS_URL, ONTARIO_511_IMAGE_ORIGIN, DEFAULT_ONTARIO_MAX_SOURCES, ONTARIO_ANCHORS, FINTRAFFIC_STATIONS_URL, FINTRAFFIC_IMAGE_ORIGIN, DIGITRAFFIC_USER, DEFAULT_FINTRAFFIC_MAX_SOURCES, FINTRAFFIC_GROUND_ELEVATION_M, FINLAND_ANCHORS, DRIVEBC_WEBCAMS_URL, DRIVEBC_IMAGE_URL, DEFAULT_DRIVEBC_MAX_SOURCES, DRIVEBC_ANCHORS, DEFAULT_TALLINN_SOURCE_FILE, DEFAULT_TALLINN_MAX_SOURCES, TALLINN_IMAGE_ORIGIN, TALLINN_CENTER, TARKTEE_LOCATIONS_URL, TARKTEE_IMAGES_URL, TARKTEE_IMAGE_ORIGIN, DEFAULT_TARKTEE_MAX_SOURCES, TARKTEE_ANCHORS, DEFAULT_WARENDORF_SOURCE_FILE, WARENDORF_IMAGE_ORIGINS, NSW_CAMERAS_URL, NSW_IMAGE_ORIGIN, DEFAULT_NSW_MAX_SOURCES, SYDNEY_CENTER, NSW_IMAGE_USER_AGENT, NSW_MAX_VIEW_LABEL, DEFAULT_CALGARY_ROWS_URL, CALGARY_IMAGE_ORIGIN, DEFAULT_CALGARY_MAX_SOURCES, CALGARY_DOWNTOWN, CALGARY_MAX_CATALOG_BYTES, DELDOT_CCTV_URL, DEFAULT_DELDOT_MAX_SOURCES, DELDOT_ANCHORS, CCTV_SOURCE_CACHE_MS, CCTV_SOURCE_FETCH_TIMEOUT_MS, CCTV_FRAME_FETCH_TIMEOUT_MS, CCTV_FRAME_MAX_BODY_BYTES, CCTV_MEDIA_FETCH_TIMEOUT_MS, CCTV_MEDIA_IDLE_TIMEOUT_MS, CCTV_MEDIA_MAX_BODY_BYTES), `server/providers/cctv/catalog.js` (createCctvCatalog), `server/providers/cctv/sources.js` (loadAustinSourcesFromOpenData, loadCaltransSourcesFromOpenData, loadTflSourcesFromOpenData, loadOntarioSourcesFromOpenData, loadFintrafficSourcesFromOpenData, driveBcImageCredit, loadDriveBcSourcesFromOpenData, normalizeTxdotDistrictPayload, loadTxdotSourcesFromOpenData, loadTallinnSourcesFromCatalog, parseTarkteeDatexLocations, parseTarkteeDatexImages, loadTarkteeSourcesFromDatex, loadWarendorfSourcesFromCatalog, nswCameraLabel, nswCameraToSource, loadNswSourcesFromOpenData, normalizeCalgaryImageUrl, calgaryCameraId, calgaryCameraName, calgaryCameraToSource, loadCalgarySourcesFromOpenData, loadDelDOTSourcesFromOpenData), `server/providers/cctv.js` (cctvProxy)

**Endpoint evidence:** `http://webcam.warendorf.de/`; `https://511on.ca/api/v2/get/cameras?format=json&lang=en`; `https://511on.ca/map/Cctv/`; `https://api.tfl.gov.uk/Place/Type/JamCam`; `https://cctv.austinmobility.io/image/${encodeURIComponent(cameraId)}.jpg`; `https://cwwp2.dot.ca.gov/`; `https://cwwp2.dot.ca.gov/data/d${district}/cctv/cctvStatusD${String(district).padStart(2,`; `https://data.austintexas.gov/api/views/b4k4-adkb/rows.json?accessType=DOWNLOAD`; `https://data.calgary.ca/resource/k7p9-kppz.json?$limit=500`; `https://data.livetraffic.com/cameras/traffic-cam.json`; `https://its.txdot.gov`; `https://maps.googleapis.com/maps/api/streetview`; `https://ristmikud.tallinn.ee/`; `https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraImages`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraLocations`; `https://tarktee.transpordiamet.ee/images/`; `https://tarktee.transpordiamet.ee/images/…`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: Public DelDOT traffic camera streams via the [DelDOT traffic map](https://deldot.gov/map/) |
| Attribution | "DelDOT — Delaware Department of Transportation" (courtesy) |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified for allowlisted upstream frame/HLS transport, payload/time caps and mixed-content/CORS; do not create open URL proxy. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** [Provider/source documentation](https://deldot.gov/map/)

## P35 — **TfL Open Data (JamCams)**

**Exact service:** CCTV camera catalog + frames, London

**Upstream paths/functions:** `server/providers/cctv/constants.js` (DEFAULT_CCTV_SOURCE_FILE, DEFAULT_AUSTIN_ROWS_URL, DEFAULT_AUSTIN_MAX_SOURCES, DEFAULT_CCTV_MAX_SOURCES, CCTV_MAX_SOURCES_CEILING, AUSTIN_DOWNTOWN, TXDOT_ORIGIN, TXDOT_CCTV_STATUS_URL, TXDOT_CCTV_SNAPSHOT_URL, TXDOT_DISTRICTS, DEFAULT_TXDOT_DISTRICTS, DEFAULT_TXDOT_MAX_SOURCES, TXDOT_ANCHORS, TXDOT_DISTRICT_ELEVATION_M, TXDOT_DEFAULT_ELEVATION_M, CALTRANS_CCTV_URL, DEFAULT_CALTRANS_DISTRICTS, DEFAULT_CALTRANS_MAX_SOURCES, CALTRANS_ANCHORS, TFL_JAMCAM_URL, TFL_IMAGE_ORIGIN, DEFAULT_TFL_MAX_SOURCES, LONDON_CENTER, ONTARIO_511_CAMERAS_URL, ONTARIO_511_IMAGE_ORIGIN, DEFAULT_ONTARIO_MAX_SOURCES, ONTARIO_ANCHORS, FINTRAFFIC_STATIONS_URL, FINTRAFFIC_IMAGE_ORIGIN, DIGITRAFFIC_USER, DEFAULT_FINTRAFFIC_MAX_SOURCES, FINTRAFFIC_GROUND_ELEVATION_M, FINLAND_ANCHORS, DRIVEBC_WEBCAMS_URL, DRIVEBC_IMAGE_URL, DEFAULT_DRIVEBC_MAX_SOURCES, DRIVEBC_ANCHORS, DEFAULT_TALLINN_SOURCE_FILE, DEFAULT_TALLINN_MAX_SOURCES, TALLINN_IMAGE_ORIGIN, TALLINN_CENTER, TARKTEE_LOCATIONS_URL, TARKTEE_IMAGES_URL, TARKTEE_IMAGE_ORIGIN, DEFAULT_TARKTEE_MAX_SOURCES, TARKTEE_ANCHORS, DEFAULT_WARENDORF_SOURCE_FILE, WARENDORF_IMAGE_ORIGINS, NSW_CAMERAS_URL, NSW_IMAGE_ORIGIN, DEFAULT_NSW_MAX_SOURCES, SYDNEY_CENTER, NSW_IMAGE_USER_AGENT, NSW_MAX_VIEW_LABEL, DEFAULT_CALGARY_ROWS_URL, CALGARY_IMAGE_ORIGIN, DEFAULT_CALGARY_MAX_SOURCES, CALGARY_DOWNTOWN, CALGARY_MAX_CATALOG_BYTES, DELDOT_CCTV_URL, DEFAULT_DELDOT_MAX_SOURCES, DELDOT_ANCHORS, CCTV_SOURCE_CACHE_MS, CCTV_SOURCE_FETCH_TIMEOUT_MS, CCTV_FRAME_FETCH_TIMEOUT_MS, CCTV_FRAME_MAX_BODY_BYTES, CCTV_MEDIA_FETCH_TIMEOUT_MS, CCTV_MEDIA_IDLE_TIMEOUT_MS, CCTV_MEDIA_MAX_BODY_BYTES), `server/providers/cctv/catalog.js` (createCctvCatalog), `server/providers/cctv/sources.js` (loadAustinSourcesFromOpenData, loadCaltransSourcesFromOpenData, loadTflSourcesFromOpenData, loadOntarioSourcesFromOpenData, loadFintrafficSourcesFromOpenData, driveBcImageCredit, loadDriveBcSourcesFromOpenData, normalizeTxdotDistrictPayload, loadTxdotSourcesFromOpenData, loadTallinnSourcesFromCatalog, parseTarkteeDatexLocations, parseTarkteeDatexImages, loadTarkteeSourcesFromDatex, loadWarendorfSourcesFromCatalog, nswCameraLabel, nswCameraToSource, loadNswSourcesFromOpenData, normalizeCalgaryImageUrl, calgaryCameraId, calgaryCameraName, calgaryCameraToSource, loadCalgarySourcesFromOpenData, loadDelDOTSourcesFromOpenData), `server/providers/cctv.js` (cctvProxy)

**Endpoint evidence:** `http://webcam.warendorf.de/`; `https://511on.ca/api/v2/get/cameras?format=json&lang=en`; `https://511on.ca/map/Cctv/`; `https://api.tfl.gov.uk/Place/Type/JamCam`; `https://cctv.austinmobility.io/image/${encodeURIComponent(cameraId)}.jpg`; `https://cwwp2.dot.ca.gov/`; `https://cwwp2.dot.ca.gov/data/d${district}/cctv/cctvStatusD${String(district).padStart(2,`; `https://data.austintexas.gov/api/views/b4k4-adkb/rows.json?accessType=DOWNLOAD`; `https://data.calgary.ca/resource/k7p9-kppz.json?$limit=500`; `https://data.livetraffic.com/cameras/traffic-cam.json`; `https://its.txdot.gov`; `https://maps.googleapis.com/maps/api/streetview`; `https://ristmikud.tallinn.ee/`; `https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraImages`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraLocations`; `https://tarktee.transpordiamet.ee/images/`; `https://tarktee.transpordiamet.ee/images/…`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: [TfL Open Data terms](https://tfl.gov.uk/info-for/open-data-users/) — attribution REQUIRED |
| Attribution | "Powered by TfL Open Data. Contains OS data © Crown copyright and database rights" |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified for allowlisted upstream frame/HLS transport, payload/time caps and mixed-content/CORS; do not create open URL proxy. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** [Provider/source documentation](https://tfl.gov.uk/info-for/open-data-users/)

## P36 — **Ontario 511**

**Exact service:** CCTV camera catalog + frames, Ontario highways including Kitchener-area routes

**Upstream paths/functions:** `server/providers/cctv/constants.js` (DEFAULT_CCTV_SOURCE_FILE, DEFAULT_AUSTIN_ROWS_URL, DEFAULT_AUSTIN_MAX_SOURCES, DEFAULT_CCTV_MAX_SOURCES, CCTV_MAX_SOURCES_CEILING, AUSTIN_DOWNTOWN, TXDOT_ORIGIN, TXDOT_CCTV_STATUS_URL, TXDOT_CCTV_SNAPSHOT_URL, TXDOT_DISTRICTS, DEFAULT_TXDOT_DISTRICTS, DEFAULT_TXDOT_MAX_SOURCES, TXDOT_ANCHORS, TXDOT_DISTRICT_ELEVATION_M, TXDOT_DEFAULT_ELEVATION_M, CALTRANS_CCTV_URL, DEFAULT_CALTRANS_DISTRICTS, DEFAULT_CALTRANS_MAX_SOURCES, CALTRANS_ANCHORS, TFL_JAMCAM_URL, TFL_IMAGE_ORIGIN, DEFAULT_TFL_MAX_SOURCES, LONDON_CENTER, ONTARIO_511_CAMERAS_URL, ONTARIO_511_IMAGE_ORIGIN, DEFAULT_ONTARIO_MAX_SOURCES, ONTARIO_ANCHORS, FINTRAFFIC_STATIONS_URL, FINTRAFFIC_IMAGE_ORIGIN, DIGITRAFFIC_USER, DEFAULT_FINTRAFFIC_MAX_SOURCES, FINTRAFFIC_GROUND_ELEVATION_M, FINLAND_ANCHORS, DRIVEBC_WEBCAMS_URL, DRIVEBC_IMAGE_URL, DEFAULT_DRIVEBC_MAX_SOURCES, DRIVEBC_ANCHORS, DEFAULT_TALLINN_SOURCE_FILE, DEFAULT_TALLINN_MAX_SOURCES, TALLINN_IMAGE_ORIGIN, TALLINN_CENTER, TARKTEE_LOCATIONS_URL, TARKTEE_IMAGES_URL, TARKTEE_IMAGE_ORIGIN, DEFAULT_TARKTEE_MAX_SOURCES, TARKTEE_ANCHORS, DEFAULT_WARENDORF_SOURCE_FILE, WARENDORF_IMAGE_ORIGINS, NSW_CAMERAS_URL, NSW_IMAGE_ORIGIN, DEFAULT_NSW_MAX_SOURCES, SYDNEY_CENTER, NSW_IMAGE_USER_AGENT, NSW_MAX_VIEW_LABEL, DEFAULT_CALGARY_ROWS_URL, CALGARY_IMAGE_ORIGIN, DEFAULT_CALGARY_MAX_SOURCES, CALGARY_DOWNTOWN, CALGARY_MAX_CATALOG_BYTES, DELDOT_CCTV_URL, DEFAULT_DELDOT_MAX_SOURCES, DELDOT_ANCHORS, CCTV_SOURCE_CACHE_MS, CCTV_SOURCE_FETCH_TIMEOUT_MS, CCTV_FRAME_FETCH_TIMEOUT_MS, CCTV_FRAME_MAX_BODY_BYTES, CCTV_MEDIA_FETCH_TIMEOUT_MS, CCTV_MEDIA_IDLE_TIMEOUT_MS, CCTV_MEDIA_MAX_BODY_BYTES), `server/providers/cctv/catalog.js` (createCctvCatalog), `server/providers/cctv/sources.js` (loadAustinSourcesFromOpenData, loadCaltransSourcesFromOpenData, loadTflSourcesFromOpenData, loadOntarioSourcesFromOpenData, loadFintrafficSourcesFromOpenData, driveBcImageCredit, loadDriveBcSourcesFromOpenData, normalizeTxdotDistrictPayload, loadTxdotSourcesFromOpenData, loadTallinnSourcesFromCatalog, parseTarkteeDatexLocations, parseTarkteeDatexImages, loadTarkteeSourcesFromDatex, loadWarendorfSourcesFromCatalog, nswCameraLabel, nswCameraToSource, loadNswSourcesFromOpenData, normalizeCalgaryImageUrl, calgaryCameraId, calgaryCameraName, calgaryCameraToSource, loadCalgarySourcesFromOpenData, loadDelDOTSourcesFromOpenData), `server/providers/cctv.js` (cctvProxy)

**Endpoint evidence:** `http://webcam.warendorf.de/`; `https://511on.ca/api/v2/get/cameras?format=json&lang=en`; `https://511on.ca/map/Cctv/`; `https://api.tfl.gov.uk/Place/Type/JamCam`; `https://cctv.austinmobility.io/image/${encodeURIComponent(cameraId)}.jpg`; `https://cwwp2.dot.ca.gov/`; `https://cwwp2.dot.ca.gov/data/d${district}/cctv/cctvStatusD${String(district).padStart(2,`; `https://data.austintexas.gov/api/views/b4k4-adkb/rows.json?accessType=DOWNLOAD`; `https://data.calgary.ca/resource/k7p9-kppz.json?$limit=500`; `https://data.livetraffic.com/cameras/traffic-cam.json`; `https://its.txdot.gov`; `https://maps.googleapis.com/maps/api/streetview`; `https://ristmikud.tallinn.ee/`; `https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraImages`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraLocations`; `https://tarktee.transpordiamet.ee/images/`; `https://tarktee.transpordiamet.ee/images/…`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: [Open Government Licence – Ontario](https://www.ontario.ca/page/open-government-licence-ontario) |
| Attribution | "Ontario 511" plus Open Government Licence - Ontario |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified for allowlisted upstream frame/HLS transport, payload/time caps and mixed-content/CORS; do not create open URL proxy. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** [Provider/source documentation](https://www.ontario.ca/page/open-government-licence-ontario)

## P37 — **Fintraffic / Digitraffic (weathercams)**

**Exact service:** CCTV camera catalog + frames, Finland

**Upstream paths/functions:** `server/providers/cctv/constants.js` (DEFAULT_CCTV_SOURCE_FILE, DEFAULT_AUSTIN_ROWS_URL, DEFAULT_AUSTIN_MAX_SOURCES, DEFAULT_CCTV_MAX_SOURCES, CCTV_MAX_SOURCES_CEILING, AUSTIN_DOWNTOWN, TXDOT_ORIGIN, TXDOT_CCTV_STATUS_URL, TXDOT_CCTV_SNAPSHOT_URL, TXDOT_DISTRICTS, DEFAULT_TXDOT_DISTRICTS, DEFAULT_TXDOT_MAX_SOURCES, TXDOT_ANCHORS, TXDOT_DISTRICT_ELEVATION_M, TXDOT_DEFAULT_ELEVATION_M, CALTRANS_CCTV_URL, DEFAULT_CALTRANS_DISTRICTS, DEFAULT_CALTRANS_MAX_SOURCES, CALTRANS_ANCHORS, TFL_JAMCAM_URL, TFL_IMAGE_ORIGIN, DEFAULT_TFL_MAX_SOURCES, LONDON_CENTER, ONTARIO_511_CAMERAS_URL, ONTARIO_511_IMAGE_ORIGIN, DEFAULT_ONTARIO_MAX_SOURCES, ONTARIO_ANCHORS, FINTRAFFIC_STATIONS_URL, FINTRAFFIC_IMAGE_ORIGIN, DIGITRAFFIC_USER, DEFAULT_FINTRAFFIC_MAX_SOURCES, FINTRAFFIC_GROUND_ELEVATION_M, FINLAND_ANCHORS, DRIVEBC_WEBCAMS_URL, DRIVEBC_IMAGE_URL, DEFAULT_DRIVEBC_MAX_SOURCES, DRIVEBC_ANCHORS, DEFAULT_TALLINN_SOURCE_FILE, DEFAULT_TALLINN_MAX_SOURCES, TALLINN_IMAGE_ORIGIN, TALLINN_CENTER, TARKTEE_LOCATIONS_URL, TARKTEE_IMAGES_URL, TARKTEE_IMAGE_ORIGIN, DEFAULT_TARKTEE_MAX_SOURCES, TARKTEE_ANCHORS, DEFAULT_WARENDORF_SOURCE_FILE, WARENDORF_IMAGE_ORIGINS, NSW_CAMERAS_URL, NSW_IMAGE_ORIGIN, DEFAULT_NSW_MAX_SOURCES, SYDNEY_CENTER, NSW_IMAGE_USER_AGENT, NSW_MAX_VIEW_LABEL, DEFAULT_CALGARY_ROWS_URL, CALGARY_IMAGE_ORIGIN, DEFAULT_CALGARY_MAX_SOURCES, CALGARY_DOWNTOWN, CALGARY_MAX_CATALOG_BYTES, DELDOT_CCTV_URL, DEFAULT_DELDOT_MAX_SOURCES, DELDOT_ANCHORS, CCTV_SOURCE_CACHE_MS, CCTV_SOURCE_FETCH_TIMEOUT_MS, CCTV_FRAME_FETCH_TIMEOUT_MS, CCTV_FRAME_MAX_BODY_BYTES, CCTV_MEDIA_FETCH_TIMEOUT_MS, CCTV_MEDIA_IDLE_TIMEOUT_MS, CCTV_MEDIA_MAX_BODY_BYTES), `server/providers/cctv/catalog.js` (createCctvCatalog), `server/providers/cctv/sources.js` (loadAustinSourcesFromOpenData, loadCaltransSourcesFromOpenData, loadTflSourcesFromOpenData, loadOntarioSourcesFromOpenData, loadFintrafficSourcesFromOpenData, driveBcImageCredit, loadDriveBcSourcesFromOpenData, normalizeTxdotDistrictPayload, loadTxdotSourcesFromOpenData, loadTallinnSourcesFromCatalog, parseTarkteeDatexLocations, parseTarkteeDatexImages, loadTarkteeSourcesFromDatex, loadWarendorfSourcesFromCatalog, nswCameraLabel, nswCameraToSource, loadNswSourcesFromOpenData, normalizeCalgaryImageUrl, calgaryCameraId, calgaryCameraName, calgaryCameraToSource, loadCalgarySourcesFromOpenData, loadDelDOTSourcesFromOpenData), `server/providers/cctv.js` (cctvProxy)

**Endpoint evidence:** `http://webcam.warendorf.de/`; `https://511on.ca/api/v2/get/cameras?format=json&lang=en`; `https://511on.ca/map/Cctv/`; `https://api.tfl.gov.uk/Place/Type/JamCam`; `https://cctv.austinmobility.io/image/${encodeURIComponent(cameraId)}.jpg`; `https://cwwp2.dot.ca.gov/`; `https://cwwp2.dot.ca.gov/data/d${district}/cctv/cctvStatusD${String(district).padStart(2,`; `https://data.austintexas.gov/api/views/b4k4-adkb/rows.json?accessType=DOWNLOAD`; `https://data.calgary.ca/resource/k7p9-kppz.json?$limit=500`; `https://data.livetraffic.com/cameras/traffic-cam.json`; `https://its.txdot.gov`; `https://maps.googleapis.com/maps/api/streetview`; `https://ristmikud.tallinn.ee/`; `https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraImages`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraLocations`; `https://tarktee.transpordiamet.ee/images/`; `https://tarktee.transpordiamet.ee/images/…`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: [CC BY 4.0](https://www.digitraffic.fi/en/terms-of-service/) — attribution REQUIRED |
| Attribution | "Fintraffic / digitraffic.fi, license CC BY 4.0" |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified for allowlisted upstream frame/HLS transport, payload/time caps and mixed-content/CORS; do not create open URL proxy. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** [Provider/source documentation](https://www.digitraffic.fi/en/terms-of-service/)

## P38 — **DriveBC** (Government of British Columbia)

**Exact service:** CCTV camera catalog + frames, British Columbia highways

**Upstream paths/functions:** `server/providers/cctv/constants.js` (DEFAULT_CCTV_SOURCE_FILE, DEFAULT_AUSTIN_ROWS_URL, DEFAULT_AUSTIN_MAX_SOURCES, DEFAULT_CCTV_MAX_SOURCES, CCTV_MAX_SOURCES_CEILING, AUSTIN_DOWNTOWN, TXDOT_ORIGIN, TXDOT_CCTV_STATUS_URL, TXDOT_CCTV_SNAPSHOT_URL, TXDOT_DISTRICTS, DEFAULT_TXDOT_DISTRICTS, DEFAULT_TXDOT_MAX_SOURCES, TXDOT_ANCHORS, TXDOT_DISTRICT_ELEVATION_M, TXDOT_DEFAULT_ELEVATION_M, CALTRANS_CCTV_URL, DEFAULT_CALTRANS_DISTRICTS, DEFAULT_CALTRANS_MAX_SOURCES, CALTRANS_ANCHORS, TFL_JAMCAM_URL, TFL_IMAGE_ORIGIN, DEFAULT_TFL_MAX_SOURCES, LONDON_CENTER, ONTARIO_511_CAMERAS_URL, ONTARIO_511_IMAGE_ORIGIN, DEFAULT_ONTARIO_MAX_SOURCES, ONTARIO_ANCHORS, FINTRAFFIC_STATIONS_URL, FINTRAFFIC_IMAGE_ORIGIN, DIGITRAFFIC_USER, DEFAULT_FINTRAFFIC_MAX_SOURCES, FINTRAFFIC_GROUND_ELEVATION_M, FINLAND_ANCHORS, DRIVEBC_WEBCAMS_URL, DRIVEBC_IMAGE_URL, DEFAULT_DRIVEBC_MAX_SOURCES, DRIVEBC_ANCHORS, DEFAULT_TALLINN_SOURCE_FILE, DEFAULT_TALLINN_MAX_SOURCES, TALLINN_IMAGE_ORIGIN, TALLINN_CENTER, TARKTEE_LOCATIONS_URL, TARKTEE_IMAGES_URL, TARKTEE_IMAGE_ORIGIN, DEFAULT_TARKTEE_MAX_SOURCES, TARKTEE_ANCHORS, DEFAULT_WARENDORF_SOURCE_FILE, WARENDORF_IMAGE_ORIGINS, NSW_CAMERAS_URL, NSW_IMAGE_ORIGIN, DEFAULT_NSW_MAX_SOURCES, SYDNEY_CENTER, NSW_IMAGE_USER_AGENT, NSW_MAX_VIEW_LABEL, DEFAULT_CALGARY_ROWS_URL, CALGARY_IMAGE_ORIGIN, DEFAULT_CALGARY_MAX_SOURCES, CALGARY_DOWNTOWN, CALGARY_MAX_CATALOG_BYTES, DELDOT_CCTV_URL, DEFAULT_DELDOT_MAX_SOURCES, DELDOT_ANCHORS, CCTV_SOURCE_CACHE_MS, CCTV_SOURCE_FETCH_TIMEOUT_MS, CCTV_FRAME_FETCH_TIMEOUT_MS, CCTV_FRAME_MAX_BODY_BYTES, CCTV_MEDIA_FETCH_TIMEOUT_MS, CCTV_MEDIA_IDLE_TIMEOUT_MS, CCTV_MEDIA_MAX_BODY_BYTES), `server/providers/cctv/catalog.js` (createCctvCatalog), `server/providers/cctv/sources.js` (loadAustinSourcesFromOpenData, loadCaltransSourcesFromOpenData, loadTflSourcesFromOpenData, loadOntarioSourcesFromOpenData, loadFintrafficSourcesFromOpenData, driveBcImageCredit, loadDriveBcSourcesFromOpenData, normalizeTxdotDistrictPayload, loadTxdotSourcesFromOpenData, loadTallinnSourcesFromCatalog, parseTarkteeDatexLocations, parseTarkteeDatexImages, loadTarkteeSourcesFromDatex, loadWarendorfSourcesFromCatalog, nswCameraLabel, nswCameraToSource, loadNswSourcesFromOpenData, normalizeCalgaryImageUrl, calgaryCameraId, calgaryCameraName, calgaryCameraToSource, loadCalgarySourcesFromOpenData, loadDelDOTSourcesFromOpenData), `server/providers/cctv.js` (cctvProxy)

**Endpoint evidence:** `http://webcam.warendorf.de/`; `https://511on.ca/api/v2/get/cameras?format=json&lang=en`; `https://511on.ca/map/Cctv/`; `https://api.tfl.gov.uk/Place/Type/JamCam`; `https://cctv.austinmobility.io/image/${encodeURIComponent(cameraId)}.jpg`; `https://cwwp2.dot.ca.gov/`; `https://cwwp2.dot.ca.gov/data/d${district}/cctv/cctvStatusD${String(district).padStart(2,`; `https://data.austintexas.gov/api/views/b4k4-adkb/rows.json?accessType=DOWNLOAD`; `https://data.calgary.ca/resource/k7p9-kppz.json?$limit=500`; `https://data.livetraffic.com/cameras/traffic-cam.json`; `https://its.txdot.gov`; `https://maps.googleapis.com/maps/api/streetview`; `https://ristmikud.tallinn.ee/`; `https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraImages`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraLocations`; `https://tarktee.transpordiamet.ee/images/`; `https://tarktee.transpordiamet.ee/images/…`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: [Open Government Licence – British Columbia](https://www2.gov.bc.ca/gov/content/data/open-data/open-government-licence-bc) — attribution REQUIRED |
| Attribution | "DriveBC. Contains information licensed under the Open Government Licence – British Columbia" |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified for allowlisted upstream frame/HLS transport, payload/time caps and mixed-content/CORS; do not create open URL proxy. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** [Provider/source documentation](https://www2.gov.bc.ca/gov/content/data/open-data/open-government-licence-bc)

## P39 — **Open Calgary** (`data.calgary.ca`)

**Exact service:** CCTV camera catalog + frames, Calgary

**Upstream paths/functions:** `server/providers/cctv/constants.js` (DEFAULT_CCTV_SOURCE_FILE, DEFAULT_AUSTIN_ROWS_URL, DEFAULT_AUSTIN_MAX_SOURCES, DEFAULT_CCTV_MAX_SOURCES, CCTV_MAX_SOURCES_CEILING, AUSTIN_DOWNTOWN, TXDOT_ORIGIN, TXDOT_CCTV_STATUS_URL, TXDOT_CCTV_SNAPSHOT_URL, TXDOT_DISTRICTS, DEFAULT_TXDOT_DISTRICTS, DEFAULT_TXDOT_MAX_SOURCES, TXDOT_ANCHORS, TXDOT_DISTRICT_ELEVATION_M, TXDOT_DEFAULT_ELEVATION_M, CALTRANS_CCTV_URL, DEFAULT_CALTRANS_DISTRICTS, DEFAULT_CALTRANS_MAX_SOURCES, CALTRANS_ANCHORS, TFL_JAMCAM_URL, TFL_IMAGE_ORIGIN, DEFAULT_TFL_MAX_SOURCES, LONDON_CENTER, ONTARIO_511_CAMERAS_URL, ONTARIO_511_IMAGE_ORIGIN, DEFAULT_ONTARIO_MAX_SOURCES, ONTARIO_ANCHORS, FINTRAFFIC_STATIONS_URL, FINTRAFFIC_IMAGE_ORIGIN, DIGITRAFFIC_USER, DEFAULT_FINTRAFFIC_MAX_SOURCES, FINTRAFFIC_GROUND_ELEVATION_M, FINLAND_ANCHORS, DRIVEBC_WEBCAMS_URL, DRIVEBC_IMAGE_URL, DEFAULT_DRIVEBC_MAX_SOURCES, DRIVEBC_ANCHORS, DEFAULT_TALLINN_SOURCE_FILE, DEFAULT_TALLINN_MAX_SOURCES, TALLINN_IMAGE_ORIGIN, TALLINN_CENTER, TARKTEE_LOCATIONS_URL, TARKTEE_IMAGES_URL, TARKTEE_IMAGE_ORIGIN, DEFAULT_TARKTEE_MAX_SOURCES, TARKTEE_ANCHORS, DEFAULT_WARENDORF_SOURCE_FILE, WARENDORF_IMAGE_ORIGINS, NSW_CAMERAS_URL, NSW_IMAGE_ORIGIN, DEFAULT_NSW_MAX_SOURCES, SYDNEY_CENTER, NSW_IMAGE_USER_AGENT, NSW_MAX_VIEW_LABEL, DEFAULT_CALGARY_ROWS_URL, CALGARY_IMAGE_ORIGIN, DEFAULT_CALGARY_MAX_SOURCES, CALGARY_DOWNTOWN, CALGARY_MAX_CATALOG_BYTES, DELDOT_CCTV_URL, DEFAULT_DELDOT_MAX_SOURCES, DELDOT_ANCHORS, CCTV_SOURCE_CACHE_MS, CCTV_SOURCE_FETCH_TIMEOUT_MS, CCTV_FRAME_FETCH_TIMEOUT_MS, CCTV_FRAME_MAX_BODY_BYTES, CCTV_MEDIA_FETCH_TIMEOUT_MS, CCTV_MEDIA_IDLE_TIMEOUT_MS, CCTV_MEDIA_MAX_BODY_BYTES), `server/providers/cctv/catalog.js` (createCctvCatalog), `server/providers/cctv/sources.js` (loadAustinSourcesFromOpenData, loadCaltransSourcesFromOpenData, loadTflSourcesFromOpenData, loadOntarioSourcesFromOpenData, loadFintrafficSourcesFromOpenData, driveBcImageCredit, loadDriveBcSourcesFromOpenData, normalizeTxdotDistrictPayload, loadTxdotSourcesFromOpenData, loadTallinnSourcesFromCatalog, parseTarkteeDatexLocations, parseTarkteeDatexImages, loadTarkteeSourcesFromDatex, loadWarendorfSourcesFromCatalog, nswCameraLabel, nswCameraToSource, loadNswSourcesFromOpenData, normalizeCalgaryImageUrl, calgaryCameraId, calgaryCameraName, calgaryCameraToSource, loadCalgarySourcesFromOpenData, loadDelDOTSourcesFromOpenData), `server/providers/cctv.js` (cctvProxy)

**Endpoint evidence:** `http://webcam.warendorf.de/`; `https://511on.ca/api/v2/get/cameras?format=json&lang=en`; `https://511on.ca/map/Cctv/`; `https://api.tfl.gov.uk/Place/Type/JamCam`; `https://cctv.austinmobility.io/image/${encodeURIComponent(cameraId)}.jpg`; `https://cwwp2.dot.ca.gov/`; `https://cwwp2.dot.ca.gov/data/d${district}/cctv/cctvStatusD${String(district).padStart(2,`; `https://data.austintexas.gov/api/views/b4k4-adkb/rows.json?accessType=DOWNLOAD`; `https://data.calgary.ca/resource/k7p9-kppz.json?$limit=500`; `https://data.livetraffic.com/cameras/traffic-cam.json`; `https://its.txdot.gov`; `https://maps.googleapis.com/maps/api/streetview`; `https://ristmikud.tallinn.ee/`; `https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraImages`; `https://tarktee.transpordiamet.ee/api/v1/datex/roadCameraLocations`; `https://tarktee.transpordiamet.ee/images/`; `https://tarktee.transpordiamet.ee/images/…`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: [Open Government Licence – City of Calgary](https://data.calgary.ca/stories/s/Open-Calgary-Terms-of-Use/u45n-7awa) — attribution REQUIRED |
| Attribution | "Contains information licensed under the Open Government Licence – City of Calgary" |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified for allowlisted upstream frame/HLS transport, payload/time caps and mixed-content/CORS; do not create open URL proxy. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** [Provider/source documentation](https://data.calgary.ca/stories/s/Open-Calgary-Terms-of-Use/u45n-7awa)

## P40 — **GBFS (Lyft / BCycle)**

**Exact service:** Bikeshare availability

**Upstream paths/functions:** `server/providers/gbfs.js` (GBFS_MAX_BODY_BYTES, fetchGbfsUpstream, gbfsProxy), `src/layers/bikeshare/source.js` (createBikeshareSource)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: Per-feed (attribution-only) |
| Attribution | Credit the operator (e.g. Austin BCycle) + its `license_url` |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P41 — **MBTA / MassDOT** (cdn.mbta.com)

**Exact service:** Transit layer live vehicles and up to 15 minutes of recently observed positions, Greater Boston

**Upstream paths/functions:** `server/providers/transit.js` (transitProxy), `src/sources/transitService.js` (fetchTransitFeed, createTransitService), `src/data/transitProxy.js` (TRANSIT_PROXY_TTL_MS, TRANSIT_PROXY_STALE_MAX_MS, TRANSIT_PROXY_TIMEOUT_MS, TRANSIT_PROXY_MAX_BODY_BYTES, TRANSIT_MAX_REDIRECTS, TRANSIT_REDIRECT_STATUSES, isTransitRedirectStatus, TRANSIT_ADMISSION_WINDOW_MS, TRANSIT_ADMISSION_MAX_PER_FEED, TRANSIT_ADMISSION_MAX_GLOBAL, TRANSIT_BACKOFF_LADDER_MS, resolveTransitRoute, transitUpstreamHeaders, isAcceptableTransitUpstreamUrl, transitRedirectDecision, nextTransitBackoffMs, TransitFeedShapeError, repairVehicleTimestamps, buildTransitSnapshot, transitCacheState, transitResponseHeaders)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: MBTA / MassDOT open realtime vehicle data, used for the live view and up to fifteen minutes of recently observed positions; published for developer use and not against their use. |
| Attribution | Attribution to MBTA / MassDOT (courtesy text) |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified for allowlisted GTFS transport, agency headers, shared15s cache, stale metadata and quotas; no unnecessary public generic proxy. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P42 — **CapMetro** (data.texas.gov)

**Exact service:** Transit layer live vehicles, Austin TX

**Upstream paths/functions:** `server/providers/transit.js` (transitProxy), `src/sources/transitService.js` (fetchTransitFeed, createTransitService), `src/data/transitProxy.js` (TRANSIT_PROXY_TTL_MS, TRANSIT_PROXY_STALE_MAX_MS, TRANSIT_PROXY_TIMEOUT_MS, TRANSIT_PROXY_MAX_BODY_BYTES, TRANSIT_MAX_REDIRECTS, TRANSIT_REDIRECT_STATUSES, isTransitRedirectStatus, TRANSIT_ADMISSION_WINDOW_MS, TRANSIT_ADMISSION_MAX_PER_FEED, TRANSIT_ADMISSION_MAX_GLOBAL, TRANSIT_BACKOFF_LADDER_MS, resolveTransitRoute, transitUpstreamHeaders, isAcceptableTransitUpstreamUrl, transitRedirectDecision, nextTransitBackoffMs, TransitFeedShapeError, repairVehicleTimestamps, buildTransitSnapshot, transitCacheState, transitResponseHeaders)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: CapMetro open realtime vehicle data, used for the live view; published for developer use and not against their use. |
| Attribution | Attribution to CapMetro (courtesy text) |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified for allowlisted GTFS transport, agency headers, shared15s cache, stale metadata and quotas; no unnecessary public generic proxy. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P43 — **Metro Transit** (Metropolitan Council)

**Exact service:** Transit layer live vehicles, Minneapolis–St Paul

**Upstream paths/functions:** `server/providers/transit.js` (transitProxy), `src/sources/transitService.js` (fetchTransitFeed, createTransitService), `src/data/transitProxy.js` (TRANSIT_PROXY_TTL_MS, TRANSIT_PROXY_STALE_MAX_MS, TRANSIT_PROXY_TIMEOUT_MS, TRANSIT_PROXY_MAX_BODY_BYTES, TRANSIT_MAX_REDIRECTS, TRANSIT_REDIRECT_STATUSES, isTransitRedirectStatus, TRANSIT_ADMISSION_WINDOW_MS, TRANSIT_ADMISSION_MAX_PER_FEED, TRANSIT_ADMISSION_MAX_GLOBAL, TRANSIT_BACKOFF_LADDER_MS, resolveTransitRoute, transitUpstreamHeaders, isAcceptableTransitUpstreamUrl, transitRedirectDecision, nextTransitBackoffMs, TransitFeedShapeError, repairVehicleTimestamps, buildTransitSnapshot, transitCacheState, transitResponseHeaders)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: Metro Transit / Metropolitan Council open realtime vehicle data, used for the live view; published for developer use and not against their use. |
| Attribution | Attribution to Metro Transit / Metropolitan Council (courtesy text) |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified for allowlisted GTFS transport, agency headers, shared15s cache, stale metadata and quotas; no unnecessary public generic proxy. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P44 — **OVapi / Stichting OpenGeo**

**Exact service:** Transit layer live vehicles, Netherlands

**Upstream paths/functions:** `server/providers/transit.js` (transitProxy), `src/sources/transitService.js` (fetchTransitFeed, createTransitService), `src/data/transitProxy.js` (TRANSIT_PROXY_TTL_MS, TRANSIT_PROXY_STALE_MAX_MS, TRANSIT_PROXY_TIMEOUT_MS, TRANSIT_PROXY_MAX_BODY_BYTES, TRANSIT_MAX_REDIRECTS, TRANSIT_REDIRECT_STATUSES, isTransitRedirectStatus, TRANSIT_ADMISSION_WINDOW_MS, TRANSIT_ADMISSION_MAX_PER_FEED, TRANSIT_ADMISSION_MAX_GLOBAL, TRANSIT_BACKOFF_LADDER_MS, resolveTransitRoute, transitUpstreamHeaders, isAcceptableTransitUpstreamUrl, transitRedirectDecision, nextTransitBackoffMs, TransitFeedShapeError, repairVehicleTimestamps, buildTransitSnapshot, transitCacheState, transitResponseHeaders)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: OVapi / Stichting OpenGeo open realtime vehicle data, used for the live view; published for developer use and not against their use. The client sends a User-Agent and conditional requests. |
| Attribution | Attribution to OVapi / Stichting OpenGeo (courtesy text) |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified for allowlisted GTFS transport, agency headers, shared15s cache, stale metadata and quotas; no unnecessary public generic proxy. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P45 — **Entur** (api.entur.io)

**Exact service:** Transit layer live vehicles, Norway

**Upstream paths/functions:** `server/providers/transit.js` (transitProxy), `src/sources/transitService.js` (fetchTransitFeed, createTransitService), `src/data/transitProxy.js` (TRANSIT_PROXY_TTL_MS, TRANSIT_PROXY_STALE_MAX_MS, TRANSIT_PROXY_TIMEOUT_MS, TRANSIT_PROXY_MAX_BODY_BYTES, TRANSIT_MAX_REDIRECTS, TRANSIT_REDIRECT_STATUSES, isTransitRedirectStatus, TRANSIT_ADMISSION_WINDOW_MS, TRANSIT_ADMISSION_MAX_PER_FEED, TRANSIT_ADMISSION_MAX_GLOBAL, TRANSIT_BACKOFF_LADDER_MS, resolveTransitRoute, transitUpstreamHeaders, isAcceptableTransitUpstreamUrl, transitRedirectDecision, nextTransitBackoffMs, TransitFeedShapeError, repairVehicleTimestamps, buildTransitSnapshot, transitCacheState, transitResponseHeaders)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: Entur open realtime vehicle data, used for the live view; published for developer use and not against their use. The client sends the `ET-Client-Name` identifying header. |
| Attribution | Attribution to Entur (courtesy text) |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified for allowlisted GTFS transport, agency headers, shared15s cache, stale metadata and quotas; no unnecessary public generic proxy. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P46 — **TransLink** (Queensland Government)

**Exact service:** Transit layer live vehicles, South East Queensland

**Upstream paths/functions:** `server/providers/transit.js` (transitProxy), `src/sources/transitService.js` (fetchTransitFeed, createTransitService), `src/data/transitProxy.js` (TRANSIT_PROXY_TTL_MS, TRANSIT_PROXY_STALE_MAX_MS, TRANSIT_PROXY_TIMEOUT_MS, TRANSIT_PROXY_MAX_BODY_BYTES, TRANSIT_MAX_REDIRECTS, TRANSIT_REDIRECT_STATUSES, isTransitRedirectStatus, TRANSIT_ADMISSION_WINDOW_MS, TRANSIT_ADMISSION_MAX_PER_FEED, TRANSIT_ADMISSION_MAX_GLOBAL, TRANSIT_BACKOFF_LADDER_MS, resolveTransitRoute, transitUpstreamHeaders, isAcceptableTransitUpstreamUrl, transitRedirectDecision, nextTransitBackoffMs, TransitFeedShapeError, repairVehicleTimestamps, buildTransitSnapshot, transitCacheState, transitResponseHeaders)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: TransLink / Queensland Government open realtime vehicle data, used for the live view; published for developer use and not against their use. |
| Attribution | Attribution to TransLink / Queensland Government (courtesy text) |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified for allowlisted GTFS transport, agency headers, shared15s cache, stale metadata and quotas; no unnecessary public generic proxy. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P47 — **HSL** (realtime.hsl.fi)

**Exact service:** Transit layer live vehicles, Helsinki

**Upstream paths/functions:** `server/providers/transit.js` (transitProxy), `src/sources/transitService.js` (fetchTransitFeed, createTransitService), `src/data/transitProxy.js` (TRANSIT_PROXY_TTL_MS, TRANSIT_PROXY_STALE_MAX_MS, TRANSIT_PROXY_TIMEOUT_MS, TRANSIT_PROXY_MAX_BODY_BYTES, TRANSIT_MAX_REDIRECTS, TRANSIT_REDIRECT_STATUSES, isTransitRedirectStatus, TRANSIT_ADMISSION_WINDOW_MS, TRANSIT_ADMISSION_MAX_PER_FEED, TRANSIT_ADMISSION_MAX_GLOBAL, TRANSIT_BACKOFF_LADDER_MS, resolveTransitRoute, transitUpstreamHeaders, isAcceptableTransitUpstreamUrl, transitRedirectDecision, nextTransitBackoffMs, TransitFeedShapeError, repairVehicleTimestamps, buildTransitSnapshot, transitCacheState, transitResponseHeaders)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: HSL (Helsinki Region Transport) open realtime vehicle data, used for the live view; published for developer use and not against their use. |
| Attribution | Attribution to HSL (Helsinki Region Transport) (courtesy text) |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified for allowlisted GTFS transport, agency headers, shared15s cache, stale metadata and quotas; no unnecessary public generic proxy. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P48 — **Radio Browser**

**Exact service:** Geolocated internet-radio station directory and station-level tags

**Upstream paths/functions:** `server/providers/radio.js` (radioBrowserProxy), `src/sources/radioBrowser.js` (RADIO_UUID_RE, cleanRadioText, isNonGlobalIpv4, publicRadioHttpsUrl, normalizeRadioBrowserStation, publicRadioStation)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: Public-domain directory data under PDDL 1.0; individual broadcaster stream terms apply |
| Attribution | "Radio Browser" plus a link to the selected broadcaster |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P49 — **Re:Earth Terrain** (Mapterhorn)

**Exact service:** Terrain (keyless globe stacks — OSM etc. — + `/api/terrain/heights` ellipsoidal-height lookups)

**Upstream paths/functions:** `server/providers/terrain.js` (terrainHeightsProxy), `src/maps/terrain.js` (KEYLESS_TERRAIN_URL, createWorldTerrain, createKeylessTerrainResource, createKeylessTerrain)

**Endpoint evidence:** `http://internal`; `https://terrain.reearth.land/cesium-mesh/ellipsoid`; `https://terrain.reearth.land/heights.json`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key for mesh/height path. |
| Free / paid | Keyless hosted service; no SLA. |
| Rate limits | UNKNOWN numeric quota; bounded batch/30-day upstream cache is implementation only. |
| Commercial / data rights | Mesh source records CC BY4.0; EGM2008 geoid public-domain claim distinct from terrain datum. |
| Attribution | "Terrain (keyless globe stacks): Re:Earth Terrain / Mapterhorn (CC BY 4.0) / EGM2008 (NGA)" |
| Caching permission | Retain mesh/source attribution, modified-data rights and quality flags; geoid-only fallback is not terrain. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | Flat globe or geoid-only height quality; not substitute terrain truth. |
| Evidence confidence | Primary provider page checked this audit |

**Primary/provenance links:** [Provider/source documentation](https://terrain.reearth.land/)

## P50 — **OSRM on the FOSSGIS routing servers** (`routing.openstreetmap.de`)

**Exact service:** Street-following routes for the Directions layer and voice route annotations, via `/api/route`

**Upstream paths/functions:** `server/providers/places/routes.js` (ROUTE_UPSTREAM_MIN_INTERVAL_MS, ROUTE_UPSTREAM_QUEUE_MAX, _resetRouteUpstreamForTest, _setRouteUpstreamIntervalForTest, _routeInflightCountForTest, installRouteMiddleware), `src/layers/directions/index.js` (DIRECTIONS_STEP_OVERLAY_SOURCE_ID, DIRECTIONS_STEP_OVERLAY_SOURCE_OPTIONS, DIRECTIONS_MODES, DEFAULT_DIRECTIONS_MODE, DIRECTIONS_ROUTE_COLOR, DIRECTIONS_POINTER_OWNER, STEP_ANCHOR_DEADLINE_MS, STEP_ANCHOR_RETRY_MS, STEP_ANCHOR_SLOW_RETRY_MS, STEP_ANCHOR_FAST_ATTEMPTS, FLIGHT_PROGRESS_MS, normalizeDirectionsParams, directionsRowControls, POINTER_TOOL_EXITS, pointerBlockedMessage, stepMarkerIndices, stepMarkerHeightM, stepAnchorDelayMs, directionsStepList, stepIndexAtDistance, directionsStats, directionsStepCopy, createDirectionsStepOverlayEntry, directionsRequestUrl, normalizeRoutePayload, createDirectionsLayer)

**Endpoint evidence:** `https://routing.openstreetmap.de/routed-${profile}`

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | No key in pinned default source; check per-service headers/config. Optional credentials are not implicitly authorized. |
| Free / paid | UNKNOWN deployment-specific fee/quota; pinned documentation claims public/open service. |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: [FOSSGIS routing usage policy](https://routing.openstreetmap.de/about.html): "Display the required attribution and display a link to 'fix the map'", "Use a valid user agent and, if applicable, a correct referrer", "One request per second max", "No scraping, no heavy usage". The full policy is the German [FOSSGIS Nutzungsbedingungen](https://www.fossgis.de/arbeitsgruppen/osm-server/nutzungsbedingungen/); FOSSGIS also states that the server may be embedded in your own pages but "eine gewerbliche Nutzung ist nur mit Einschränkungen erlaubt" (commercial use only with restrictions). Route data derives from OpenStreetMap (ODbL 1.0) |
| Attribution | "Routing: OSRM on the FOSSGIS servers" + a "fix the map" link — shown in the Data attribution popover |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Do not bundle/mirror feed or imagery; resolve account/product/license scope. |
| Browser-direct safety | Only demonstrated for Hub Open-Meteo and served imagery in this audit; all other direct-CORS/credential/deployment assumptions unqualified. |
| FastAPI justification | FastAPI justified if credentials, CORS, aggregate quotas, streaming or hostile payload caps require it; keep source policy, not the Node plugin wholesale. |
| Local source | Local ADS-B/readsb/RTL-SDR exists only for aircraft/radio, not a fallback for this unrelated provider. |
| Fallback | No alternate external provider established for this record; stale/missing states must remain explicit. |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** [Provider/source documentation](https://routing.openstreetmap.de/about.html), [Provider/source documentation](https://www.fossgis.de/arbeitsgruppen/osm-server/nutzungsbedingungen/)

## P51 — **Datacenters** (4,351)

**Exact service:** `datacenters/`

**Upstream paths/functions:** `src/data/infrastructure.js` (createInfrastructureLayers)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | N/A offline dataset |
| Free / paid | N/A dataset |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: **ODbL 1.0** (OpenStreetMap extract) |
| Attribution | © OpenStreetMap contributors (shared credit) |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Dataset-specific rights above; keep provenance/attribution/SA/NC as applicable. |
| Browser-direct safety | N/A offline dataset |
| FastAPI justification | N/A offline local data. |
| Local source | Local dataset source exists; current Hub build excludes upstream local_data. |
| Fallback | N/A local snapshot |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P52 — **Dams** (704)

**Exact service:** `dams/`

**Upstream paths/functions:** `src/data/infrastructure.js` (createInfrastructureLayers)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | N/A offline dataset |
| Free / paid | N/A dataset |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: **ODbL 1.0** (OpenInfraMap / OSM extract) |
| Attribution | © OpenStreetMap contributors (shared credit) + Open Infrastructure Map |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Dataset-specific rights above; keep provenance/attribution/SA/NC as applicable. |
| Browser-direct safety | N/A offline dataset |
| FastAPI justification | N/A offline local data. |
| Local source | Local dataset source exists; current Hub build excludes upstream local_data. |
| Fallback | N/A local snapshot |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P53 — **Military area names** (36,466)

**Exact service:** `osm_military_names/`

**Upstream paths/functions:** `src/data/militaryNames.js` (MILITARY_POINT_CAP, MILITARY_LABEL_CAP, MILITARY_NAMES_TIMEOUT_MS, createMilitaryNamesLoader, loadMilitaryNames, nameMilitaryFragment, militaryNamesInView)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | N/A offline dataset |
| Free / paid | N/A dataset |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: **ODbL 1.0** (OpenStreetMap, via Overture Maps) |
| Attribution | © OpenStreetMap contributors (shared credit) + Overture Maps Foundation |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Dataset-specific rights above; keep provenance/attribution/SA/NC as applicable. |
| Browser-direct safety | N/A offline dataset |
| FastAPI justification | N/A offline local data. |
| Local source | Local dataset source exists; current Hub build excludes upstream local_data. |
| Fallback | N/A local snapshot |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P54 — **TeleGeography Submarine Cable Map** (712 cables + 1,917 landing points)

**Exact service:** `telegeography_submarine_cables/`

**Upstream paths/functions:** `src/layers/submarineCables/bundledSource.js` (createBundledCableSource)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | N/A offline dataset |
| Free / paid | N/A dataset |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: **CC BY-NC-SA 3.0** |
| Attribution | "© TeleGeography — submarinecablemap.com" |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Dataset-specific rights above; keep provenance/attribution/SA/NC as applicable. |
| Browser-direct safety | N/A offline dataset |
| FastAPI justification | N/A offline local data. |
| Local source | Local dataset source exists; current Hub build excludes upstream local_data. |
| Fallback | N/A local snapshot |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P55 — **Natural Earth physical regions** (1,046 land + 292 marine named polygons)

**Exact service:** `natural_earth/`

**Upstream paths/functions:** `src/data/naturalEarthRegions.js` (findNaturalRegion, listRegions, pointInRing, lookupNaturalRegionOutline, naturalRegionAtPoint), `src/data/adminBoundaries.js` (normalizeAdminName, packLoads, decodeRing, pointInRing, polygonsContain, parseAdminQuery, findAdminArea, findAdminAreaAt)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | N/A offline dataset |
| Free / paid | N/A dataset |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: **Public domain** |
| Attribution | "Made with Natural Earth" (courtesy credit — not legally required) |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Dataset-specific rights above; keep provenance/attribution/SA/NC as applicable. |
| Browser-direct safety | N/A offline dataset |
| FastAPI justification | N/A offline local data. |
| Local source | Local dataset source exists; current Hub build excludes upstream local_data. |
| Fallback | N/A local snapshot |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P56 — **DataSF Analysis Neighborhoods** (41 SF neighborhood polygons)

**Exact service:** `neighborhoods/`

**Upstream paths/functions:** `src/data/neighborhoodPolygons.js` (lookupNeighborhoodRing)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | N/A offline dataset |
| Free / paid | N/A dataset |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: **PDDL 1.0** (public domain) |
| Attribution | "City & County of San Francisco — DataSF" (courtesy — not legally required) |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Dataset-specific rights above; keep provenance/attribution/SA/NC as applicable. |
| Browser-direct safety | N/A offline dataset |
| FastAPI justification | N/A offline local data. |
| Local source | Local dataset source exists; current Hub build excludes upstream local_data. |
| Fallback | N/A local snapshot |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P57 — **Natural Earth countries, states and provinces** (260 admin-0/map units + 4,587 admin-1 polygons)

**Exact service:** `natural_earth/`

**Upstream paths/functions:** `src/data/naturalEarthRegions.js` (findNaturalRegion, listRegions, pointInRing, lookupNaturalRegionOutline, naturalRegionAtPoint), `src/data/adminBoundaries.js` (normalizeAdminName, packLoads, decodeRing, pointInRing, polygonsContain, parseAdminQuery, findAdminArea, findAdminAreaAt)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | N/A offline dataset |
| Free / paid | N/A dataset |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: **Public domain** |
| Attribution | "Made with Natural Earth" (courtesy credit — not legally required) |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Dataset-specific rights above; keep provenance/attribution/SA/NC as applicable. |
| Browser-direct safety | N/A offline dataset |
| FastAPI justification | N/A offline local data. |
| Local source | Local dataset source exists; current Hub build excludes upstream local_data. |
| Fallback | N/A local snapshot |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P58 — **US Census Bureau counties** (3,235 county polygons)

**Exact service:** `us_census_counties/`

**Upstream paths/functions:** `src/data/adminBoundaries.js` (normalizeAdminName, packLoads, decodeRing, pointInRing, polygonsContain, parseAdminQuery, findAdminArea, findAdminAreaAt)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | N/A offline dataset |
| Free / paid | N/A dataset |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: **Public domain** |
| Attribution | "U.S. Census Bureau" (courtesy — not legally required) |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Dataset-specific rights above; keep provenance/attribution/SA/NC as applicable. |
| Browser-direct safety | N/A offline dataset |
| FastAPI justification | N/A offline local data. |
| Local source | Local dataset source exists; current Hub build excludes upstream local_data. |
| Fallback | N/A local snapshot |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P59 — **CCTV ground heights** (3,445 cameras)

**Exact service:** `cctv_ground_heights/`

**Upstream paths/functions:** `src/layers/cctv/ground.js` (createGround)

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented.

| Boundary | Finding |
| --- | --- |
| Authentication | N/A offline dataset |
| Free / paid | N/A dataset |
| Rate limits | UNKNOWN published production limit; source code cache/timeout budgets are not provider rights. |
| Commercial / data rights | Upstream claim, not independent legal clearance: Precomputed camera placement heights, aligned to work with Google Photorealistic 3D Tiles (folder README) |
| Attribution | — |
| Caching permission | UNKNOWN separate redistribution/cache permission; data license obligations and service terms must be verified. |
| Redistribution | No blanket grant inferred. Dataset-specific rights above; keep provenance/attribution/SA/NC as applicable. |
| Browser-direct safety | N/A offline dataset |
| FastAPI justification | N/A offline local data. |
| Local source | Local dataset source exists; current Hub build excludes upstream local_data. |
| Fallback | N/A local snapshot |
| Evidence confidence | Pinned source/provenance checked; current provider legal/service terms remain UNKNOWN unless stated. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P60 — Cesium ion / Bing imagery

**Exact service:** Ion World Terrain asset1 and Bing Aerial/Binglabels imagery assets; account token/entitlements.

**Upstream paths/functions:** `src/maps/terrain.js`, `src/maps/imagery.js`

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** runtimes/earth-runtime/core/VisualFoundation.mjs dormant asset branches

| Boundary | Finding |
| --- | --- |
| Authentication | See service/constraints; no credentials were supplied. |
| Free / paid | UNKNOWN selected service/account/hardware entitlement unless noted. |
| Rate limits | Token required; selected account fees/quota unknown; data-source entitlements separate. |
| Commercial / data rights | Token required; selected account fees/quota unknown; data-source entitlements separate. |
| Attribution | Retain source and renderer-supplied credits; resolve product-specific required wording. |
| Caching permission | UNKNOWN unless service policy explicitly permits; no new mirror/bulk retained. |
| Redistribution | No blanket source-MIT permission for data/assets. |
| Browser-direct safety | Not newly qualified; tokens/server policy/SDK and mixed content require separate review. |
| FastAPI justification | Use only where selected service requires credential isolation, CORS, shared budgets or allowlisted validation. Source-MIT does not justify a blanket Node sidecar. |
| Local source | Local only for hardware/receiver records; otherwise none qualified. |
| Fallback | See capability/map/provider chain; never fabricate a replacement source. |
| Evidence confidence | Code path checked; primary constraints separately identified, other rights UNKNOWN. |

**Primary/provenance links:** [Provider/source documentation](https://cesium.com/legal/terms-of-service/)

## P61 — Nominatim public instance

**Exact service:** https://nominatim.openstreetmap.org/search and reverse; shared bounded queue.

**Upstream paths/functions:** `src/sources/nominatim.js`, `server/providers/regional/place.js`

**Endpoint evidence:** `https://nominatim.openstreetmap.org/search`

**Hub path:** Not implemented

| Boundary | Finding |
| --- | --- |
| Authentication | See service/constraints; no credentials were supplied. |
| Free / paid | UNKNOWN selected service/account/hardware entitlement unless noted. |
| Rate limits | Max1request/s aggregate app, identifying UA/Referer, caching; no public autocomplete/bulk query. ODbL data, service policy separate. |
| Commercial / data rights | Max1request/s aggregate app, identifying UA/Referer, caching; no public autocomplete/bulk query. ODbL data, service policy separate. |
| Attribution | Retain source and renderer-supplied credits; resolve product-specific required wording. |
| Caching permission | UNKNOWN unless service policy explicitly permits; no new mirror/bulk retained. |
| Redistribution | No blanket source-MIT permission for data/assets. |
| Browser-direct safety | Not newly qualified; tokens/server policy/SDK and mixed content require separate review. |
| FastAPI justification | Use only where selected service requires credential isolation, CORS, shared budgets or allowlisted validation. Source-MIT does not justify a blanket Node sidecar. |
| Local source | Local only for hardware/receiver records; otherwise none qualified. |
| Fallback | See capability/map/provider chain; never fabricate a replacement source. |
| Evidence confidence | Code path checked; primary constraints separately identified, other rights UNKNOWN. |

**Primary/provenance links:** [Provider/source documentation](https://operations.osmfoundation.org/policies/nominatim/)

## P62 — OSM standard raster tiles

**Exact service:** https://tile.openstreetmap.org/{z}/{x}/{y}.png

**Upstream paths/functions:** `src/maps/imagery.js`

**Endpoint evidence:** `https://tile.openstreetmap.org/{z}/{x}/{y}.png`

**Hub path:** Not implemented

| Boundary | Finding |
| --- | --- |
| Authentication | See service/constraints; no credentials were supplied. |
| Free / paid | UNKNOWN selected service/account/hardware entitlement unless noted. |
| Rate limits | Visible attribution, UA/Referer, cache honors headers (at least7days if unavailable), no bulk download/offline/prefetch; hosted service has no unlimited guarantee. |
| Commercial / data rights | Visible attribution, UA/Referer, cache honors headers (at least7days if unavailable), no bulk download/offline/prefetch; hosted service has no unlimited guarantee. |
| Attribution | Retain source and renderer-supplied credits; resolve product-specific required wording. |
| Caching permission | UNKNOWN unless service policy explicitly permits; no new mirror/bulk retained. |
| Redistribution | No blanket source-MIT permission for data/assets. |
| Browser-direct safety | Not newly qualified; tokens/server policy/SDK and mixed content require separate review. |
| FastAPI justification | Use only where selected service requires credential isolation, CORS, shared budgets or allowlisted validation. Source-MIT does not justify a blanket Node sidecar. |
| Local source | Local only for hardware/receiver records; otherwise none qualified. |
| Fallback | See capability/map/provider chain; never fabricate a replacement source. |
| Evidence confidence | Code path checked; primary constraints separately identified, other rights UNKNOWN. |

**Primary/provenance links:** [Provider/source documentation](https://operations.osmfoundation.org/policies/tiles/)

## P63 — USGS National Map imagery

**Exact service:** https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer

**Upstream paths/functions:** `src/maps/imagery.js`

**Endpoint evidence:** `https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer`

**Hub path:** runtimes/earth-runtime/core/ImageryController.mjs CONUS-only

| Boundary | Finding |
| --- | --- |
| Authentication | See service/constraints; no credentials were supplied. |
| Free / paid | UNKNOWN selected service/account/hardware entitlement unless noted. |
| Rate limits | Hub uses specific CONUS public imagery/credit and zoom limits. Prior qualification is historical; no Alaska/SPOT/global rights inferred. |
| Commercial / data rights | Hub uses specific CONUS public imagery/credit and zoom limits. Prior qualification is historical; no Alaska/SPOT/global rights inferred. |
| Attribution | Retain source and renderer-supplied credits; resolve product-specific required wording. |
| Caching permission | UNKNOWN unless service policy explicitly permits; no new mirror/bulk retained. |
| Redistribution | No blanket source-MIT permission for data/assets. |
| Browser-direct safety | Not newly qualified; tokens/server policy/SDK and mixed content require separate review. |
| FastAPI justification | Use only where selected service requires credential isolation, CORS, shared budgets or allowlisted validation. Source-MIT does not justify a blanket Node sidecar. |
| Local source | Local only for hardware/receiver records; otherwise none qualified. |
| Fallback | See capability/map/provider chain; never fabricate a replacement source. |
| Evidence confidence | Code path checked; primary constraints separately identified, other rights UNKNOWN. |

**Primary/provenance links:** [Provider/source documentation](https://www.usgs.gov/faqs/what-are-terms-uselicensing-map-services-and-data-national-map)

## P64 — Community ALPR tile host

**Exact service:** Hourly US/Canada OSM ALPR vector extract; exact configured base in source.

**Upstream paths/functions:** `src/layers/alpr/source.js`, `src/layers/alpr/tileRecords.js`

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented

| Boundary | Finding |
| --- | --- |
| Authentication | See service/constraints; no credentials were supplied. |
| Free / paid | UNKNOWN selected service/account/hardware entitlement unless noted. |
| Rate limits | Mapped OSM camera sites, not plate access; community-host policy unknown, ODbL applies. |
| Commercial / data rights | Mapped OSM camera sites, not plate access; community-host policy unknown, ODbL applies. |
| Attribution | Retain source and renderer-supplied credits; resolve product-specific required wording. |
| Caching permission | UNKNOWN unless service policy explicitly permits; no new mirror/bulk retained. |
| Redistribution | No blanket source-MIT permission for data/assets. |
| Browser-direct safety | Not newly qualified; tokens/server policy/SDK and mixed content require separate review. |
| FastAPI justification | Use only where selected service requires credential isolation, CORS, shared budgets or allowlisted validation. Source-MIT does not justify a blanket Node sidecar. |
| Local source | Local only for hardware/receiver records; otherwise none qualified. |
| Fallback | See capability/map/provider chain; never fabricate a replacement source. |
| Evidence confidence | Code path checked; primary constraints separately identified, other rights UNKNOWN. |

**Primary/provenance links:** [Provider/source documentation](https://www.openstreetmap.org/copyright)

## P65 — Local readsb / dump1090 / decoder receivers

**Exact service:** Loopback / configured local aircraft JSON merged by local receiver service.

**Upstream paths/functions:** `src/layers/localAdsb/feeds.js`, `src/layers/localAdsb/index.js`

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented

| Boundary | Finding |
| --- | --- |
| Authentication | See service/constraints; no credentials were supplied. |
| Free / paid | UNKNOWN selected service/account/hardware entitlement unless noted. |
| Rate limits | Only trusted local receiver and explicit activation; no production connection or device qualification. |
| Commercial / data rights | Only trusted local receiver and explicit activation; no production connection or device qualification. |
| Attribution | Retain source and renderer-supplied credits; resolve product-specific required wording. |
| Caching permission | UNKNOWN unless service policy explicitly permits; no new mirror/bulk retained. |
| Redistribution | No blanket source-MIT permission for data/assets. |
| Browser-direct safety | Not newly qualified; tokens/server policy/SDK and mixed content require separate review. |
| FastAPI justification | Use only where selected service requires credential isolation, CORS, shared budgets or allowlisted validation. Source-MIT does not justify a blanket Node sidecar. |
| Local source | Local only for hardware/receiver records; otherwise none qualified. |
| Fallback | See capability/map/provider chain; never fabricate a replacement source. |
| Evidence confidence | Code path checked; primary constraints separately identified, other rights UNKNOWN. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P66 — RTL-SDR / WebUSB hardware

**Exact service:** Local SDR signal acquisition and ADS-B decoding; browser Connect permission.

**Upstream paths/functions:** `src/app/layers/localAdsb.js`

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented

| Boundary | Finding |
| --- | --- |
| Authentication | See service/constraints; no credentials were supplied. |
| Free / paid | UNKNOWN selected service/account/hardware entitlement unless noted. |
| Rate limits | Hardware/USB/device authorization required; no paid feed or remote scan performed. |
| Commercial / data rights | Hardware/USB/device authorization required; no paid feed or remote scan performed. |
| Attribution | Retain source and renderer-supplied credits; resolve product-specific required wording. |
| Caching permission | UNKNOWN unless service policy explicitly permits; no new mirror/bulk retained. |
| Redistribution | No blanket source-MIT permission for data/assets. |
| Browser-direct safety | Not newly qualified; tokens/server policy/SDK and mixed content require separate review. |
| FastAPI justification | Use only where selected service requires credential isolation, CORS, shared budgets or allowlisted validation. Source-MIT does not justify a blanket Node sidecar. |
| Local source | Local only for hardware/receiver records; otherwise none qualified. |
| Fallback | See capability/map/provider chain; never fabricate a replacement source. |
| Evidence confidence | Code path checked; primary constraints separately identified, other rights UNKNOWN. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P67 — Cesium starbox / Sun / Moon assets

**Exact service:** Cesium distribution Assets/Textures/SkyBox and standard celestial render components.

**Upstream paths/functions:** `src/app/viewer.js`

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** runtimes/earth-runtime/core/ViewerController.mjs skyBox.show=false

| Boundary | Finding |
| --- | --- |
| Authentication | See service/constraints; no credentials were supplied. |
| Free / paid | UNKNOWN selected service/account/hardware entitlement unless noted. |
| Rate limits | Retain Cesium licenses/third-party notices; visual texture is not a scientifically qualified Gaia catalog. |
| Commercial / data rights | Retain Cesium licenses/third-party notices; visual texture is not a scientifically qualified Gaia catalog. |
| Attribution | Retain source and renderer-supplied credits; resolve product-specific required wording. |
| Caching permission | UNKNOWN unless service policy explicitly permits; no new mirror/bulk retained. |
| Redistribution | No blanket source-MIT permission for data/assets. |
| Browser-direct safety | Not newly qualified; tokens/server policy/SDK and mixed content require separate review. |
| FastAPI justification | Use only where selected service requires credential isolation, CORS, shared budgets or allowlisted validation. Source-MIT does not justify a blanket Node sidecar. |
| Local source | Local only for hardware/receiver records; otherwise none qualified. |
| Fallback | See capability/map/provider chain; never fabricate a replacement source. |
| Evidence confidence | Code path checked; primary constraints separately identified, other rights UNKNOWN. |

**Primary/provenance links:** [Provider/source documentation](https://github.com/CesiumGS/cesium/blob/main/LICENSE.md)

## P68 — Per-model creators / event assets

**Exact service:** Aircraft models and restricted event/media packs resolved by asset URLs.

**Upstream paths/functions:** `src/layers/flights/rendering.js`, `src/data/modelVisualAnchor.js`

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** No upstream models bundled

| Boundary | Finding |
| --- | --- |
| Authentication | See service/constraints; no credentials were supplied. |
| Free / paid | UNKNOWN selected service/account/hardware entitlement unless noted. |
| Rate limits | Per-file provenance unknown until reviewed; exclude rather than infer MIT asset rights. |
| Commercial / data rights | Per-file provenance unknown until reviewed; exclude rather than infer MIT asset rights. |
| Attribution | Retain source and renderer-supplied credits; resolve product-specific required wording. |
| Caching permission | UNKNOWN unless service policy explicitly permits; no new mirror/bulk retained. |
| Redistribution | No blanket source-MIT permission for data/assets. |
| Browser-direct safety | Not newly qualified; tokens/server policy/SDK and mixed content require separate review. |
| FastAPI justification | Use only where selected service requires credential isolation, CORS, shared budgets or allowlisted validation. Source-MIT does not justify a blanket Node sidecar. |
| Local source | Local only for hardware/receiver records; otherwise none qualified. |
| Fallback | See capability/map/provider chain; never fabricate a replacement source. |
| Evidence confidence | Code path checked; primary constraints separately identified, other rights UNKNOWN. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P69 — OpenAI Realtime / HUD optional provider

**Exact service:** Realtime session and optional HUD-summary services.

**Upstream paths/functions:** `server/providers/openai.js`, `src/voice/voiceCost.js`

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented

| Boundary | Finding |
| --- | --- |
| Authentication | See service/constraints; no credentials were supplied. |
| Free / paid | UNKNOWN selected service/account/hardware entitlement unless noted. |
| Rate limits | Paid calls, keys, content/privacy/cost owner approval required; no keys or external paid calls used here. |
| Commercial / data rights | Paid calls, keys, content/privacy/cost owner approval required; no keys or external paid calls used here. |
| Attribution | Retain source and renderer-supplied credits; resolve product-specific required wording. |
| Caching permission | UNKNOWN unless service policy explicitly permits; no new mirror/bulk retained. |
| Redistribution | No blanket source-MIT permission for data/assets. |
| Browser-direct safety | Not newly qualified; tokens/server policy/SDK and mixed content require separate review. |
| FastAPI justification | Use only where selected service requires credential isolation, CORS, shared budgets or allowlisted validation. Source-MIT does not justify a blanket Node sidecar. |
| Local source | Local only for hardware/receiver records; otherwise none qualified. |
| Fallback | See capability/map/provider chain; never fabricate a replacement source. |
| Evidence confidence | Code path checked; primary constraints separately identified, other rights UNKNOWN. |

**Primary/provenance links:** [Provider/source documentation](https://openai.com/policies/services-agreement/)

## P70 — Mapillary current-main

**Exact service:** graph.mapillary.com API / vector coverage and Mapillary JS viewer.

**Upstream paths/functions:** `current:server/providers/mapillary.js`, `current:src/layers/streetLevel/providers/mapillary/source.js`

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented

| Boundary | Finding |
| --- | --- |
| Authentication | See service/constraints; no credentials were supplied. |
| Free / paid | UNKNOWN selected service/account/hardware entitlement unless noted. |
| Rate limits | Current-main-only token/SDK/imagery terms and attribution/privacy unknown; dedicated qualification. |
| Commercial / data rights | Current-main-only token/SDK/imagery terms and attribution/privacy unknown; dedicated qualification. |
| Attribution | Retain source and renderer-supplied credits; resolve product-specific required wording. |
| Caching permission | UNKNOWN unless service policy explicitly permits; no new mirror/bulk retained. |
| Redistribution | No blanket source-MIT permission for data/assets. |
| Browser-direct safety | Not newly qualified; tokens/server policy/SDK and mixed content require separate review. |
| FastAPI justification | Use only where selected service requires credential isolation, CORS, shared budgets or allowlisted validation. Source-MIT does not justify a blanket Node sidecar. |
| Local source | Local only for hardware/receiver records; otherwise none qualified. |
| Fallback | See capability/map/provider chain; never fabricate a replacement source. |
| Evidence confidence | Code path checked; primary constraints separately identified, other rights UNKNOWN. |

**Primary/provenance links:** [Provider/source documentation](https://www.mapillary.com/terms)

## P71 — Vegvesen Norway cameras current-main

**Exact service:** Norwegian road-camera catalog added in current CCTV provider.

**Upstream paths/functions:** `current:server/providers/cctv/constants.js`, `current:server/providers/cctv/catalog.js`

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented

| Boundary | Finding |
| --- | --- |
| Authentication | See service/constraints; no credentials were supplied. |
| Free / paid | UNKNOWN selected service/account/hardware entitlement unless noted. |
| Rate limits | Current DATA_SOURCES adds provider; current service/header/license/limits not freshly cleared. |
| Commercial / data rights | Current DATA_SOURCES adds provider; current service/header/license/limits not freshly cleared. |
| Attribution | Retain source and renderer-supplied credits; resolve product-specific required wording. |
| Caching permission | UNKNOWN unless service policy explicitly permits; no new mirror/bulk retained. |
| Redistribution | No blanket source-MIT permission for data/assets. |
| Browser-direct safety | Not newly qualified; tokens/server policy/SDK and mixed content require separate review. |
| FastAPI justification | Use only where selected service requires credential isolation, CORS, shared budgets or allowlisted validation. Source-MIT does not justify a blanket Node sidecar. |
| Local source | Local only for hardware/receiver records; otherwise none qualified. |
| Fallback | See capability/map/provider chain; never fabricate a replacement source. |
| Evidence confidence | Code path checked; primary constraints separately identified, other rights UNKNOWN. |

**Primary/provenance links:** No independently verified primary grant; provider research required.

## P72 — NASA FIRMS active-fire API

**Exact service:** https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{SOURCE}/world/2

**Upstream paths/functions:** `server/providers/firms.js`, `src/layers/firms/source.js`

**Endpoint evidence:** `https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{SOURCE}/world/2`

**Hub path:** Not implemented

| Boundary | Finding |
| --- | --- |
| Authentication | Free NASA MAP_KEY; server FIRMS_MAP_KEY, never expose it in logs/browser. |
| Free / paid | UNKNOWN selected service/account/hardware entitlement unless noted. |
| Rate limits | Free MAP_KEY; 5000 transactions per10min, large queries can cost multiple transactions. Source uses30min shared cache and24h detection filter; partial-source freshness explicit. Per-product provenance/attribution still required. |
| Commercial / data rights | Free MAP_KEY; 5000 transactions per10min, large queries can cost multiple transactions. Source uses30min shared cache and24h detection filter; partial-source freshness explicit. Per-product provenance/attribution still required. |
| Attribution | Retain source and renderer-supplied credits; resolve product-specific required wording. |
| Caching permission | UNKNOWN unless service policy explicitly permits; no new mirror/bulk retained. |
| Redistribution | No blanket source-MIT permission for data/assets. |
| Browser-direct safety | Not newly qualified; tokens/server policy/SDK and mixed content require separate review. |
| FastAPI justification | Use only where selected service requires credential isolation, CORS, shared budgets or allowlisted validation. Source-MIT does not justify a blanket Node sidecar. |
| Local source | Local only for hardware/receiver records; otherwise none qualified. |
| Fallback | See capability/map/provider chain; never fabricate a replacement source. |
| Evidence confidence | Primary NASA API/map-key pages checked2026-10-08; per-product rights remain separately qualified. |

**Primary/provenance links:** [Provider/source documentation](https://firms.modaps.eosdis.nasa.gov/api/area/)

## P73 — Shinjuku sample-video configuration

**Exact service:** Google public sample video URLs under config/cctv_sources.shinjuku.json.

**Upstream paths/functions:** `config/cctv_sources.shinjuku.json`

**Endpoint evidence:** Endpoint/local dataset registry in the exact paths above; no invented address.

**Hub path:** Not implemented

| Boundary | Finding |
| --- | --- |
| Authentication | See service/constraints; no credentials were supplied. |
| Free / paid | UNKNOWN selected service/account/hardware entitlement unless noted. |
| Rate limits | Demo sample clips are not live CCTV; keep fixture label and resolve sample-video license before distribution. |
| Commercial / data rights | Demo sample clips are not live CCTV; keep fixture label and resolve sample-video license before distribution. |
| Attribution | Retain source and renderer-supplied credits; resolve product-specific required wording. |
| Caching permission | UNKNOWN unless service policy explicitly permits; no new mirror/bulk retained. |
| Redistribution | No blanket source-MIT permission for data/assets. |
| Browser-direct safety | Not newly qualified; tokens/server policy/SDK and mixed content require separate review. |
| FastAPI justification | Use only where selected service requires credential isolation, CORS, shared budgets or allowlisted validation. Source-MIT does not justify a blanket Node sidecar. |
| Local source | Local only for hardware/receiver records; otherwise none qualified. |
| Fallback | See capability/map/provider chain; never fabricate a replacement source. |
| Evidence confidence | Code path checked; primary constraints separately identified, other rights UNKNOWN. |

**Primary/provenance links:** No independently verified primary grant; provider research required.
