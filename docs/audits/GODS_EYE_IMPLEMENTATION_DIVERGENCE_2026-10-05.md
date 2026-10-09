# Implemented Earth divergence — ranked audit

Audit completed2026-10-08; live reference2026-10-07. Documentation only. [Canonical matrix](GODS_EYE_CAPABILITY_IMPLEMENTATION_RECONCILIATION_2026-10-05.md) · [exact source/function/30-stage appendix](GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md) · [providers](GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md)

23 adapted relationships, including parent/helper overlap. Four CRITICAL entries plausibly connect to reported symptoms; this does not establish every provider/rendering failure cause. HIGH denotes substantial missing behavior/qualification gate, even where C6 deferral is authorized. No UNJUSTIFIED REWRITE or SUPERSEDED BY BETTER HUB IMPLEMENTATION classification is asserted: temporary typed/bounded scope had evidence, and no full capability replacement superiority was proven.

| Rank | Relationship | Risk | User impact / symptom causality | Reuse ease | Legal/provider gate |
| --- | --- | --- | --- | --- | --- |
| 1 | flights | CRITICAL | Code independently explains display symptom; successful feed reproduction absent. | MEDIUM: public factory/records seams exist; service/selection/asset adapters needed. | OpenSky research/education versus public/commercial service approval; ADSB.lol ODbL and quota stewardship. |
| 2 | satellites | CRITICAL | Population narrowing is code-proven; fresh provider unavailable, owner count unverified. | MEDIUM: public factory/source exist; primitive/camera/service lifecycle and performance need qualification. | Current browser-direct CelesTrak transport is not proven CORS-safe; upstream explicitly uses a proxy. Cached source time, usage cadence and redistribution need qualification. |
| 3 | weather-current | CRITICAL | Point/field expectation mismatch; live point passed, no global weather promise inferred. | LOW for point label/facts/status; HIGH for adding full raster/weather system (separate scope). | Free hosted API noncommercial service only; CC BY 4.0 data is separate from service permission. |
| 4 | background-stars | CRITICAL | Explicit scene disable and reference enabled; direct presentation mechanism. | LOW: standard Cesium scene option, no full-app port or scientific star catalog. | Provider ledger applies; availability is separate from rights. |
| 5 | weather-radar | HIGH | No reported live defect reproduced; scope/behavior difference from source. | HIGH: pinned visual weather factory lacks a dedicated export; clock/raster/transport seams need bounded hook. | Provider ledger applies; availability is separate from rights. |
| 6 | terrain | HIGH | No reported live defect reproduced; scope/behavior difference from source. | MEDIUM: public terrain helpers exist, selected provider entitlement gate. | Ion entitlement or ReEarth CC BY mesh/datum terms, available coverage and service budgets. |
| 7 | terrain-heights | HIGH | No reported live defect reproduced; scope/behavior difference from source. | HIGH: transport/datum/mesh-floor adapter and caching boundary. | Service/datum attribution and no false ellipsoidal-ground claim. |
| 8 | photorealistic-3d | HIGH | No reported live defect reproduced; scope/behavior difference from source. | MEDIUM/HIGH: tileset/map helpers plus provider/memory/credits. | Google billing/ToS/cache/display attribution; ion entitlement does not erase Google data terms. |
| 9 | helper-satellite-source | HIGH | No reported live defect reproduced; scope/behavior difference from source. | LOW/MEDIUM: retain current justified contract or existing unchanged helper; see source boundary. | Provider ledger applies; availability is separate from rights. |
| 10 | earthquakes | MEDIUM | No reported live defect reproduced; scope/behavior difference from source. | LOW/MEDIUM: retain current justified contract or existing unchanged helper; see source boundary. | Provider ledger applies; availability is separate from rights. |
| 11 | fire-perimeters | MEDIUM | No reported live defect reproduced; scope/behavior difference from source. | LOW/MEDIUM: retain current justified contract or existing unchanged helper; see source boundary. | Provider ledger applies; availability is separate from rights. |
| 12 | atmosphere-lighting | MEDIUM | No reported live defect reproduced; scope/behavior difference from source. | LOW/MEDIUM: retain current justified contract or existing unchanged helper; see source boundary. | Provider ledger applies; availability is separate from rights. |
| 13 | basemaps | MEDIUM | No reported live defect reproduced; scope/behavior difference from source. | LOW/MEDIUM: retain current justified contract or existing unchanged helper; see source boundary. | Hosted-provider entitlement/fair use; keyless successful tile is not an unlimited license. |
| 14 | camera-navigation | MEDIUM | No reported live defect reproduced; scope/behavior difference from source. | LOW/MEDIUM: retain current justified contract or existing unchanged helper; see source boundary. | Provider ledger applies; availability is separate from rights. |
| 15 | sun-moon | LOW | No reported live defect reproduced; scope/behavior difference from source. | LOW/MEDIUM: retain current justified contract or existing unchanged helper; see source boundary. | Provider ledger applies; availability is separate from rights. |
| 16 | display-effects | LOW | No reported live defect reproduced; scope/behavior difference from source. | LOW/MEDIUM: retain current justified contract or existing unchanged helper; see source boundary. | Provider ledger applies; availability is separate from rights. |
| 17 | 3d-buildings | LOW | No reported live defect reproduced; scope/behavior difference from source. | LOW/MEDIUM: retain current justified contract or existing unchanged helper; see source boundary. | Specific building dataset license/attribution and tile endpoint/asset approval. |
| 18 | selection-context | LOW | No reported live defect reproduced; scope/behavior difference from source. | LOW/MEDIUM: retain current justified contract or existing unchanged helper; see source boundary. | Provider ledger applies; availability is separate from rights. |
| 19 | lifecycle-rendering | LOW | No reported live defect reproduced; scope/behavior difference from source. | LOW/MEDIUM: retain current justified contract or existing unchanged helper; see source boundary. | Provider ledger applies; availability is separate from rights. |
| 20 | helper-aircraft-normalization | LOW | No reported live defect reproduced; scope/behavior difference from source. | LOW/MEDIUM: retain current justified contract or existing unchanged helper; see source boundary. | Provider ledger applies; availability is separate from rights. |
| 21 | helper-earthquake-depth | LOW | No reported live defect reproduced; scope/behavior difference from source. | LOW/MEDIUM: retain current justified contract or existing unchanged helper; see source boundary. | Provider ledger applies; availability is separate from rights. |
| 22 | helper-fire-anchor | LOW | No reported live defect reproduced; scope/behavior difference from source. | LOW/MEDIUM: retain current justified contract or existing unchanged helper; see source boundary. | Provider ledger applies; availability is separate from rights. |
| 23 | helper-weather-normalization | LOW | No reported live defect reproduced; scope/behavior difference from source. | LOW/MEDIUM: retain current justified contract or existing unchanged helper; see source boundary. | Provider ledger applies; availability is separate from rights. |

## 1. flights — CRITICAL

**Classification:** HUB IMPLEMENTATION QUESTIONABLE. **Current symptom:** Hub 503 and zero aircraft at 15.62-million-m home height; upstream accepted 12,975 worldwide contacts. Altitude gate independently explains invisible contacts if a feed succeeds.

**Exact upstream paths/functions:** `createController` in [`src/layers/flights/controller.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/controller.js); `createEnrichment` in [`src/layers/flights/enrichment.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/enrichment.js); `createEvidence` in [`src/layers/flights/evidence.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/evidence.js); `createCivilFlightLayer` in [`src/layers/flights/index.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/index.js); `createIngestion` in [`src/layers/flights/ingestion.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/ingestion.js); `createFlightFeed` in [`src/layers/flights/ingestion.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/ingestion.js); `createLifecycle` in [`src/layers/flights/lifecycle.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/lifecycle.js). Full modules: [`src/layers/flights/controller.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/controller.js); [`src/layers/flights/enrichment.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/enrichment.js); [`src/layers/flights/evidence.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/evidence.js); [`src/layers/flights/index.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/index.js); [`src/layers/flights/ingestion.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/ingestion.js); [`src/layers/flights/lifecycle.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/lifecycle.js); [`src/layers/flights/modelSpec.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/modelSpec.js); [`src/layers/flights/motion.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/motion.js); [`src/layers/flights/policy.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/policy.js); [`src/layers/flights/queries.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/queries.js); [`src/layers/flights/recordPolicy.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/recordPolicy.js); [`src/layers/flights/records.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/records.js); [`src/layers/flights/rendering.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/rendering.js); [`src/layers/flights/snapshotRenderer.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/snapshotRenderer.js); [`src/layers/flights/state.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/state.js); [`src/layers/flights/tracking.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/flights/tracking.js); [`server/providers/aircraft/opensky.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/server/providers/aircraft/opensky.js); [`server/providers/aircraft/enrichment.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/server/providers/aircraft/enrichment.js); [`server/providers/aircraft/tracks.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/server/providers/aircraft/tracks.js); [`src/sources/live/standalone.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/sources/live/standalone.js); [`src/data/adsbLolFallback.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/data/adsbLolFallback.js); [`src/sources/live/aircraft.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/sources/live/aircraft.js)

**Exact Hub paths:** [`backend/app/routes/earth.py`](../../backend/app/routes/earth.py); [`runtimes/earth-runtime/layers/GodsEyeFlightsAdapter.mjs`](../../runtimes/earth-runtime/layers/GodsEyeFlightsAdapter.mjs); [`runtimes/earth-runtime/layers/data.mjs`](../../runtimes/earth-runtime/layers/data.mjs); [`runtimes/earth-runtime/layers/entities.mjs`](../../runtimes/earth-runtime/layers/entities.mjs); [`runtimes/earth-runtime/layers/PollingLayer.mjs`](../../runtimes/earth-runtime/layers/PollingLayer.mjs); [`runtimes/earth-runtime/core/LayerRegistry.mjs`](../../runtimes/earth-runtime/core/LayerRegistry.mjs); [`runtimes/earth-runtime/core/SelectionStore.mjs`](../../runtimes/earth-runtime/core/SelectionStore.mjs); [`runtimes/earth-runtime/core/CameraController.mjs`](../../runtimes/earth-runtime/core/CameraController.mjs)

**Lost behavior:** OpenSky and fallback chain, view anchor/250-NM fallback, history/motion interpolation, enrichment, heading/classification, aircraft tracking, global contact display. Aircraft glyph hidden above 2,000,000 m and its point never shown.

**Documented reason and validity:** Phase C2 explicitly bounded one 100-NM observer feed, typed transport and geometric-height truth. Those remain valid safety constraints; Viewer ownership does not justify discarding all fleet display/motion/fallback behavior.

**Preferred remediation:** Wrap createCivilFlightLayer or FlightRecords/ingestion/motion primitives with explicit Hub source/services/lifecycle; restore far-view glyph/count and bounded follow. Preserve typed geometric truth and payload caps. **Phase:** C5.7.

**Provider/asset boundary:** OpenSky research/education versus public/commercial service approval; ADSB.lol ODbL and quota stewardship.

## 2. satellites — CRITICAL

**Classification:** HUB IMPLEMENTATION QUESTIONABLE. **Current symptom:** Owner historical ~5 is compatible with the reduced stations-only catalog; fresh Hub and reference both unavailable/zero, so fresh global population is unknown.

**Exact upstream paths/functions:** `createCatalog` in [`src/layers/satellites/catalog.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/catalog.js); `createControls` in [`src/layers/satellites/controls.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/controls.js); `createSatellitesLayer` in [`src/layers/satellites/index.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/index.js); `createIngestion` in [`src/layers/satellites/ingestion.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/ingestion.js); `createInteraction` in [`src/layers/satellites/interaction.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/interaction.js); `createLabels` in [`src/layers/satellites/labels.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/labels.js); `createIssOverlayEntry` in [`src/layers/satellites/labels.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/labels.js). Full modules: [`src/layers/satellites/catalog.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/catalog.js); [`src/layers/satellites/controls.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/controls.js); [`src/layers/satellites/index.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/index.js); [`src/layers/satellites/ingestion.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/ingestion.js); [`src/layers/satellites/interaction.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/interaction.js); [`src/layers/satellites/labels.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/labels.js); [`src/layers/satellites/lifecycle.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/lifecycle.js); [`src/layers/satellites/orbits.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/orbits.js); [`src/layers/satellites/policy.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/policy.js); [`src/layers/satellites/records.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/records.js); [`src/layers/satellites/rendering.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/rendering.js); [`src/layers/satellites/source.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/source.js); [`src/layers/satellites/state.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/state.js); [`src/layers/satellites/tracking.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/tracking.js); [`server/providers/space/celestrak.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/server/providers/space/celestrak.js); [`src/data/spaceProviderRequests.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/data/spaceProviderRequests.js)

**Exact Hub paths:** [`runtimes/earth-runtime/layers/GodsEyeSatellitesAdapter.mjs`](../../runtimes/earth-runtime/layers/GodsEyeSatellitesAdapter.mjs); [`runtimes/earth-runtime/layers/data.mjs`](../../runtimes/earth-runtime/layers/data.mjs); [`runtimes/earth-runtime/layers/entities.mjs`](../../runtimes/earth-runtime/layers/entities.mjs); [`runtimes/earth-runtime/layers/PollingLayer.mjs`](../../runtimes/earth-runtime/layers/PollingLayer.mjs); [`runtimes/earth-runtime/core/LayerRegistry.mjs`](../../runtimes/earth-runtime/core/LayerRegistry.mjs); [`runtimes/earth-runtime/core/SelectionStore.mjs`](../../runtimes/earth-runtime/core/SelectionStore.mjs); [`runtimes/earth-runtime/core/CameraController.mjs`](../../runtimes/earth-runtime/core/CameraController.mjs)

**Lost behavior:** Five core groups plus dense opt-in, category styles, NORAD multi-group dedupe, persistent satrec, 1-second propagation and per-frame tracked updates, orbit rings and partial/stale catalog state. Hard cap 100; 15-second position updates.

**Documented reason and validity:** Stations-only was explicit temporary C2 scope. No evidence proves a permanent performance requirement or architecture prohibition on broader populations. Strict checksum, finite position and seven-day epoch admission remain justified.

**Preferred remediation:** Wrap bounded core catalog/SGP4/render/follow with shared allowlisted transport and per-frame tracked propagation. Preserve strict TLE checks/epochs; qualify dense independently. **Phase:** C5.7.

**Provider/asset boundary:** Current browser-direct CelesTrak transport is not proven CORS-safe; upstream explicitly uses a proxy. Cached source time, usage cadence and redistribution need qualification.

## 3. weather-current — CRITICAL

**Classification:** HUB IMPLEMENTATION QUESTIONABLE. **Current symptom:** Fresh Open-Meteo 200, one live point at ORAS; owner sees little visual change because no globe weather field is invoked.

**Exact upstream paths/functions:** `normalizeRegionalPlace` in [`src/data/regionalModel.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/data/regionalModel.js); `normalizeRegionalArticles` in [`src/data/regionalModel.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/data/regionalModel.js); `normalizeRegionalWeather` in [`src/data/regionalModel.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/data/regionalModel.js); `install` in [`server/providers/regional/weather-effects.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/server/providers/regional/weather-effects.js); `initializeRenderer` in [`src/cockpitCloudEffects.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/cockpitCloudEffects.js); `initCockpitCloudEffects` in [`src/cockpitCloudEffects.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/cockpitCloudEffects.js). Full modules: [`src/data/regionalModel.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/data/regionalModel.js); [`server/providers/regional/weather-effects.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/server/providers/regional/weather-effects.js); [`src/cockpitCloudEffects.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/cockpitCloudEffects.js)

**Exact Hub paths:** [`runtimes/earth-runtime/layers/GodsEyeWeatherAdapter.mjs`](../../runtimes/earth-runtime/layers/GodsEyeWeatherAdapter.mjs); [`runtimes/earth-runtime/layers/data.mjs`](../../runtimes/earth-runtime/layers/data.mjs); [`runtimes/earth-runtime/layers/entities.mjs`](../../runtimes/earth-runtime/layers/entities.mjs); [`runtimes/earth-runtime/layers/PollingLayer.mjs`](../../runtimes/earth-runtime/layers/PollingLayer.mjs); [`runtimes/earth-runtime/core/LayerRegistry.mjs`](../../runtimes/earth-runtime/core/LayerRegistry.mjs); [`runtimes/earth-runtime/core/SelectionStore.mjs`](../../runtimes/earth-runtime/core/SelectionStore.mjs); [`runtimes/earth-runtime/core/CameraController.mjs`](../../runtimes/earth-runtime/core/CameraController.mjs)

**Lost behavior:** Upstream cockpit weather fields/effects and independent visible weather products. Hub requests four current variables, renders a 16px point, displays temperature/cloud/valid time but omits requested wind from facts.

**Documented reason and validity:** C2 deliberately admitted modeled current conditions only. Honest point data is valid; generic Weather discoverability and absent field meaning do not fulfill visual-weather expectations.

**Preferred remediation:** Clarify modeled observer-point scope and source-age status; expose requested wind facts and findable point/focus. Review distinct weather products separately rather than pretending point data is a field. **Phase:** C5.7.

**Provider/asset boundary:** Free hosted API noncommercial service only; CC BY 4.0 data is separate from service permission.

## 4. background-stars — CRITICAL

**Classification:** HUB IMPLEMENTATION QUESTIONABLE. **Current symptom:** Owner black void matches explicit source setting; reference skybox is enabled.

**Exact upstream paths/functions:** `installTrackpadPinchZoom` in [`src/app/viewer.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/viewer.js); `createApplicationViewer` in [`src/app/viewer.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/viewer.js). Full modules: [`src/app/viewer.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/viewer.js)

**Exact Hub paths:** [`runtimes/earth-runtime/core/ViewerController.mjs`](../../runtimes/earth-runtime/core/ViewerController.mjs)

**Lost behavior:** Hub explicitly sets viewer.scene.skyBox.show=false, revealing #03070B background.

**Documented reason and validity:** No documented technical/provider/product reason found for disabling the standard skybox. Viewer ownership remains valid.

**Preferred remediation:** Qualify standard Cesium skybox configuration on owned Viewer. Keep scientific catalog/time work in F; document product decision rather than rewrite sky math. **Phase:** C5.7.

**Provider/asset boundary:** Provider ledger applies; availability is separate from rights.

## 5. weather-radar — HIGH

**Classification:** HUB IMPLEMENTATION JUSTIFIED. **Current symptom:** Hub point Weather is a separate toggle; reference radar HTTP responses succeeded but screenshot/status reported unavailable frames. No new Hub radar visual qualification here.

**Exact upstream paths/functions:** `createWeatherClock` in [`src/layers/weather/clock.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/weather/clock.js); `createWeatherLayer` in [`src/layers/weather/index.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/weather/index.js); `init` in [`src/layers/weather/index.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/weather/index.js); `createRasterTileProvider` in [`src/layers/weather/rasterTiles.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/weather/rasterTiles.js); `createGlobeRendering` in [`src/layers/weather/rendering.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/weather/rendering.js); `createWeatherRendering` in [`src/layers/weather/rendering.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/weather/rendering.js); `createShellSurface` in [`src/layers/weather/shellRendering.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/weather/shellRendering.js). Full modules: [`src/layers/weather/clock.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/weather/clock.js); [`src/layers/weather/imageryHost.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/weather/imageryHost.js); [`src/layers/weather/imageryOrder.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/weather/imageryOrder.js); [`src/layers/weather/index.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/weather/index.js); [`src/layers/weather/infraredAlpha.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/weather/infraredAlpha.js); [`src/layers/weather/infraredImage.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/weather/infraredImage.js); [`src/layers/weather/rasterTiles.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/weather/rasterTiles.js); [`src/layers/weather/rendering.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/weather/rendering.js); [`src/layers/weather/shellRendering.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/weather/shellRendering.js); [`src/layers/weather/source.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/weather/source.js); [`server/providers/weather.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/server/providers/weather.js); [`src/ui/weatherPanel.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/ui/weatherPanel.js)

**Exact Hub paths:** [`backend/app/services/earth_events.py`](../../backend/app/services/earth_events.py); [`backend/app/routes/earth.py`](../../backend/app/routes/earth.py); [`runtimes/earth-runtime/layers/EventLayers.mjs`](../../runtimes/earth-runtime/layers/EventLayers.mjs); [`runtimes/earth-runtime/layers/eventData.mjs`](../../runtimes/earth-runtime/layers/eventData.mjs); [`runtimes/earth-runtime/layers/PollingLayer.mjs`](../../runtimes/earth-runtime/layers/PollingLayer.mjs); [`runtimes/earth-runtime/core/LayerRegistry.mjs`](../../runtimes/earth-runtime/core/LayerRegistry.mjs); [`runtimes/earth-runtime/core/SelectionStore.mjs`](../../runtimes/earth-runtime/core/SelectionStore.mjs); [`runtimes/earth-runtime/core/CameraController.mjs`](../../runtimes/earth-runtime/core/CameraController.mjs)

**Lost behavior:** Observed history/playback, tiled close detail, crossfade/shared weather clock, coverage controls and full upstream legend. Hub 2048x1024 latest-only CONUS image and coverage-centre marker.

**Documented reason and validity:** C5 explicitly chose a bounded current snapshot, source-time lease and strict fixed endpoint instead of an arbitrary time/tile proxy. Current scope is valid but does not equal upstream weather parity.

**Preferred remediation:** Keep current snapshot contract while documenting its scope; investigate generic export/hook for source/clock/render modules before separately expanding historical/tiled weather. **Phase:** C5.7.

**Provider/asset boundary:** Provider ledger applies; availability is separate from rights.

## 6. terrain — HIGH

**Classification:** HUB IMPLEMENTATION JUSTIFIED. **Current symptom:** Hub Earth currently has no qualified real-terrain deployment.

**Exact upstream paths/functions:** `createWorldTerrain` in [`src/maps/terrain.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/terrain.js); `createKeylessTerrainResource` in [`src/maps/terrain.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/terrain.js); `createKeylessTerrain` in [`src/maps/terrain.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/terrain.js); `createDefaultMapSources` in [`src/maps/defaultSources.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/defaultSources.js). Full modules: [`src/maps/terrain.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/terrain.js); [`src/maps/defaultSources.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/defaultSources.js); [`src/maps/controller.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/controller.js)

**Exact Hub paths:** [`runtimes/earth-runtime/core/VisualFoundation.mjs`](../../runtimes/earth-runtime/core/VisualFoundation.mjs); [`runtimes/earth-runtime/core/ViewerController.mjs`](../../runtimes/earth-runtime/core/ViewerController.mjs)

**Lost behavior:** Active real terrain and ReEarth route. Default Hub EllipsoidTerrainProvider; qualified Ion branch exists but no configured provider proves active terrain.

**Documented reason and validity:** C6 remains gated; dormant artifact-attested provider options are not production/active qualification.

**Preferred remediation:** Wrap createWorldTerrain/createKeylessTerrain behind owned VisualFoundation and selected credit/availability/configuration contract. **Phase:** C6.

**Provider/asset boundary:** Ion entitlement or ReEarth CC BY mesh/datum terms, available coverage and service budgets.

## 7. terrain-heights — HIGH

**Classification:** HUB IMPLEMENTATION JUSTIFIED. **Current symptom:** Potential grounded-aircraft/camera limitations, not directly proven as a current defect.

**Exact upstream paths/functions:** `createTerrainHeights` in [`src/services/terrainHeights.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/services/terrainHeights.js); `createGroundFloor` in [`src/services/groundFloor.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/services/groundFloor.js); `createMeshFloorSampler` in [`src/services/meshFloorSampler.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/services/meshFloorSampler.js); `loadDiskOnce` in [`server/providers/terrain.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/server/providers/terrain.js); `parseTerrainPoints` in [`src/data/terrainHeightsProxy.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/data/terrainHeightsProxy.js). Full modules: [`src/services/terrainHeights.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/services/terrainHeights.js); [`src/services/groundFloor.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/services/groundFloor.js); [`src/services/meshFloorSampler.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/services/meshFloorSampler.js); [`server/providers/terrain.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/server/providers/terrain.js); [`src/data/terrainHeightsProxy.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/data/terrainHeightsProxy.js)

**Exact Hub paths:** [`runtimes/earth-runtime/core/CameraController.mjs`](../../runtimes/earth-runtime/core/CameraController.mjs); [`runtimes/earth-runtime/core/VisualFoundation.mjs`](../../runtimes/earth-runtime/core/VisualFoundation.mjs)

**Lost behavior:** Terrain batch service/groundFloor, mesh floor resolution and provenance; Hub camera uses globe.getHeight or 0 fallback without a terrain-height service.

**Documented reason and validity:** C6 grounding depends on real terrain/provider qualification. Do not copy a geoid fallback as terrain evidence.

**Preferred remediation:** Adapt createTerrainHeights/groundFloor/mesh floor behind bounded datum-aware service; expose unavailable/geoid-only quality without inventing terrain. **Phase:** C6.

**Provider/asset boundary:** Service/datum attribution and no false ellipsoidal-ground claim.

## 8. photorealistic-3d — HIGH

**Classification:** HUB IMPLEMENTATION JUSTIFIED. **Current symptom:** Reference unavailable without credentials; Hub no active photoreal tiles.

**Exact upstream paths/functions:** `loadPhotorealisticTileset` in [`src/maps/google3d.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/google3d.js); `createGoogleDirectTileset` in [`src/maps/google3d.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/google3d.js); `createGoogleIonTileset` in [`src/maps/google3d.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/google3d.js); `createDefaultMapSources` in [`src/maps/defaultSources.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/defaultSources.js). Full modules: [`src/maps/google3d.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/google3d.js); [`src/maps/controller.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/controller.js); [`src/maps/defaultSources.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/defaultSources.js)

**Exact Hub paths:** [`runtimes/earth-runtime/core/VisualFoundation.mjs`](../../runtimes/earth-runtime/core/VisualFoundation.mjs); [`runtimes/earth-runtime/core/displayConfig.mjs`](../../runtimes/earth-runtime/core/displayConfig.mjs)

**Lost behavior:** No attested configured photoreal provider; dormant ion asset path is not live visual qualification.

**Documented reason and validity:** C6 provider/billing/security/coverage gate; keep Hub Viewer and wrap map/tileset helpers instead of full application.

**Preferred remediation:** Wrap loadPhotorealisticTileset/map switch with provider rights, generation cancellation, credits and bounded GPU cache; no full-app import. **Phase:** C6.

**Provider/asset boundary:** Google billing/ToS/cache/display attribution; ion entitlement does not erase Google data terms.

## 9. helper-satellite-source — HIGH

**Classification:** WRAP. **Current symptom:** Fresh satellites unavailable in both environments.

**Exact upstream paths/functions:** `createSatelliteSource` in [`src/layers/satellites/source.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/source.js). Full modules: [`src/layers/satellites/source.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/satellites/source.js); [`src/data/spaceProviderRequests.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/data/spaceProviderRequests.js)

**Exact Hub paths:** [`runtimes/earth-runtime/layers/GodsEyeSatellitesAdapter.mjs`](../../runtimes/earth-runtime/layers/GodsEyeSatellitesAdapter.mjs)

**Lost behavior:** Transport ignores group requested by source. No upstream cache/header/stale transport; parent populations also reduced.

**Documented reason and validity:** Fetch seam is appropriate; stations narrowing is temporary C2 scope, browser CORS assumption is not proven.

**Preferred remediation:** Keep source seam, pass requested allowed group instead of stations-only replacement; carry STALE-ERROR/source-age metadata through qualified shared transport. **Phase:** C5.7.

**Provider/asset boundary:** Provider ledger applies; availability is separate from rights.

## 10. earthquakes — MEDIUM

**Classification:** HUB IMPLEMENTATION JUSTIFIED. **Current symptom:** No reported current defect; this audit did not freshly activate this live feed.

**Exact upstream paths/functions:** `createEarthquakesLayer` in [`src/layers/earthquakes/index.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/earthquakes/index.js); `init` in [`src/layers/earthquakes/index.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/earthquakes/index.js); `createEarthquakeOverlayEntry` in [`src/layers/earthquakes/model.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/earthquakes/model.js); `normalizeEarthquakeSnapshot` in [`src/layers/earthquakes/records.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/earthquakes/records.js); `createUsgsEarthquakeSource` in [`src/layers/earthquakes/source.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/earthquakes/source.js); `createApplicationEarthquakes` in [`src/app/layers/earthquakes.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/layers/earthquakes.js). Full modules: [`src/layers/earthquakes/index.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/earthquakes/index.js); [`src/layers/earthquakes/model.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/earthquakes/model.js); [`src/layers/earthquakes/records.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/earthquakes/records.js); [`src/layers/earthquakes/source.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/earthquakes/source.js); [`src/app/layers/earthquakes.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/layers/earthquakes.js)

**Exact Hub paths:** [`backend/app/services/earth_events.py`](../../backend/app/services/earth_events.py); [`backend/app/routes/earth.py`](../../backend/app/routes/earth.py); [`runtimes/earth-runtime/layers/EventLayers.mjs`](../../runtimes/earth-runtime/layers/EventLayers.mjs); [`runtimes/earth-runtime/layers/eventData.mjs`](../../runtimes/earth-runtime/layers/eventData.mjs); [`runtimes/earth-runtime/layers/PollingLayer.mjs`](../../runtimes/earth-runtime/layers/PollingLayer.mjs); [`runtimes/earth-runtime/core/LayerRegistry.mjs`](../../runtimes/earth-runtime/core/LayerRegistry.mjs); [`runtimes/earth-runtime/core/SelectionStore.mjs`](../../runtimes/earth-runtime/core/SelectionStore.mjs); [`runtimes/earth-runtime/core/CameraController.mjs`](../../runtimes/earth-runtime/core/CameraController.mjs)

**Lost behavior:** Upstream full layer, richer event cards and magnitude-dependent rendering; Hub M2.5+, 500 records, 15-minute feed admission, bounded owned entities.

**Documented reason and validity:** C5 explicitly qualified a bounded typed FastAPI feed and Hub-owned event factories; depthColor is reused.

**Preferred remediation:** Keep the qualified Hub-owned/typed contract and reused helper; consider the listed upstream behavior only through a separately approved bounded adapter. KEEP CURRENT **Phase:** C5.7.

**Provider/asset boundary:** Provider ledger applies; availability is separate from rights.

## 11. fire-perimeters — MEDIUM

**Classification:** HUB IMPLEMENTATION JUSTIFIED. **Current symptom:** No reported current defect; no fresh live activation in this audit.

**Exact upstream paths/functions:** `normalizeName` in [`src/layers/perimeters/inciweb.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/perimeters/inciweb.js); `createInciwebPublicationSource` in [`src/layers/perimeters/inciweb.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/perimeters/inciweb.js); `createInciwebIndexSource` in [`src/layers/perimeters/inciweb.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/perimeters/inciweb.js); `createFirePerimetersLayer` in [`src/layers/perimeters/index.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/perimeters/index.js); `installClickHandler` in [`src/layers/perimeters/index.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/perimeters/index.js); `init` in [`src/layers/perimeters/index.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/perimeters/index.js); `normalizePolygons` in [`src/layers/perimeters/records.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/perimeters/records.js). Full modules: [`src/layers/perimeters/cards.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/perimeters/cards.js); [`src/layers/perimeters/inciweb.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/perimeters/inciweb.js); [`src/layers/perimeters/index.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/perimeters/index.js); [`src/layers/perimeters/records.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/perimeters/records.js); [`src/layers/perimeters/source.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/perimeters/source.js); [`src/app/layers/perimeters.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/layers/perimeters.js)

**Exact Hub paths:** [`backend/app/services/earth_events.py`](../../backend/app/services/earth_events.py); [`backend/app/routes/earth.py`](../../backend/app/routes/earth.py); [`runtimes/earth-runtime/layers/EventLayers.mjs`](../../runtimes/earth-runtime/layers/EventLayers.mjs); [`runtimes/earth-runtime/layers/eventData.mjs`](../../runtimes/earth-runtime/layers/eventData.mjs); [`runtimes/earth-runtime/layers/PollingLayer.mjs`](../../runtimes/earth-runtime/layers/PollingLayer.mjs); [`runtimes/earth-runtime/core/LayerRegistry.mjs`](../../runtimes/earth-runtime/core/LayerRegistry.mjs); [`runtimes/earth-runtime/core/SelectionStore.mjs`](../../runtimes/earth-runtime/core/SelectionStore.mjs); [`runtimes/earth-runtime/core/CameraController.mjs`](../../runtimes/earth-runtime/core/CameraController.mjs)

**Lost behavior:** InciWeb enrichment, containment palette/cards, upstream broader subset. Hub retains holes, max 100 recent generalized polygons, 25,000 total vertices and focus anchors.

**Documented reason and validity:** C5 performance, strict polygon contract and bounded public-context scope are documented; perimeterAnchorDegrees is reused.

**Preferred remediation:** Keep the qualified Hub-owned/typed contract and reused helper; consider the listed upstream behavior only through a separately approved bounded adapter. KEEP CURRENT **Phase:** Later Earth capability phase.

**Provider/asset boundary:** Provider ledger applies; availability is separate from rights.

## 12. atmosphere-lighting — MEDIUM

**Classification:** HUB IMPLEMENTATION JUSTIFIED. **Current symptom:** Black void is skybox setting, not evidence all atmosphere disabled.

**Exact upstream paths/functions:** `installTrackpadPinchZoom` in [`src/app/viewer.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/viewer.js); `createApplicationViewer` in [`src/app/viewer.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/viewer.js); `createApplicationScene` in [`src/app/scene.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/scene.js). Full modules: [`src/app/viewer.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/viewer.js); [`src/app/atmosphereCompat.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/atmosphereCompat.js); [`src/app/scene.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/scene.js)

**Exact Hub paths:** [`runtimes/earth-runtime/core/ViewerController.mjs`](../../runtimes/earth-runtime/core/ViewerController.mjs)

**Lost behavior:** Upstream intensity shifts and Apple model shader workaround; Hub enables ground/Sun lighting, fog density 0.0002 and default sky atmosphere, uses request-render and resolution cap.

**Documented reason and validity:** Owned request-render/performance style is documented; physical Apple/Metal compatibility remains unqualified, relevant before future model/3D use.

**Preferred remediation:** Keep the qualified Hub-owned/typed contract and reused helper; consider the listed upstream behavior only through a separately approved bounded adapter. ADD IN C6 **Phase:** C6.

**Provider/asset boundary:** Provider ledger applies; availability is separate from rights.

## 13. basemaps — MEDIUM

**Classification:** HUB IMPLEMENTATION JUSTIFIED. **Current symptom:** Reference keyless Esri has local detail; Hub public imagery is regional HD, not uniform global HD.

**Exact upstream paths/functions:** `createOsmImagery` in [`src/maps/imagery.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/imagery.js); `createEsriImagery` in [`src/maps/imagery.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/imagery.js); `createIonImagery` in [`src/maps/imagery.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/imagery.js); `createDefaultMapSources` in [`src/maps/defaultSources.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/defaultSources.js). Full modules: [`src/maps/catalog.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/catalog.js); [`src/maps/imagery.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/imagery.js); [`src/maps/controller.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/controller.js); [`src/maps/defaultSources.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/defaultSources.js)

**Exact Hub paths:** [`runtimes/earth-runtime/core/ImageryController.mjs`](../../runtimes/earth-runtime/core/ImageryController.mjs); [`runtimes/earth-runtime/core/imageryRequests.mjs`](../../runtimes/earth-runtime/core/imageryRequests.mjs); [`runtimes/earth-runtime/core/VisualFoundation.mjs`](../../runtimes/earth-runtime/core/VisualFoundation.mjs)

**Lost behavior:** Provider stack tray/global HD. Hub qualified CONUS USGS with GIBS/NaturalEarth coarse globe fallback and bounded requests.

**Documented reason and validity:** HD qualification deliberately chose public source/coverage bounds. Global imagery account/licensing and scale remain owner decision.

**Preferred remediation:** Keep the qualified Hub-owned/typed contract and reused helper; consider the listed upstream behavior only through a separately approved bounded adapter. ADD IN C6 **Phase:** C6.

**Provider/asset boundary:** Hosted-provider entitlement/fair use; keyless successful tile is not an unlimited license.

## 14. camera-navigation — MEDIUM

**Classification:** HUB IMPLEMENTATION JUSTIFIED. **Current symptom:** Post-merge real Sky canvas wheel passed; that does not qualify arbitrary Earth pinch/terrain routes.

**Exact upstream paths/functions:** `createRouteFlight` in [`src/cameraVerbs.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/cameraVerbs.js); `initCameraVerbs` in [`src/cameraVerbs.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/cameraVerbs.js); `installTrackpadPinchZoom` in [`src/app/viewer.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/viewer.js); `createApplicationViewer` in [`src/app/viewer.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/viewer.js). Full modules: [`src/ui/navigationController.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/ui/navigationController.js); [`src/cameraVerbs.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/cameraVerbs.js); [`src/app/viewer.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/viewer.js)

**Exact Hub paths:** [`runtimes/earth-runtime/core/CameraController.mjs`](../../runtimes/earth-runtime/core/CameraController.mjs)

**Lost behavior:** Upstream route flight/cockpit ownership and Ctrl-wheel relay; Hub own wheel, keyboard interruption, focus, stopTracking and bounds.

**Documented reason and validity:** Hub bridge/canonical selection/one-renderer state require owned control. No current Earth wheel failure established; Sky wheel regression was separately fixed.

**Preferred remediation:** Keep the qualified Hub-owned/typed contract and reused helper; consider the listed upstream behavior only through a separately approved bounded adapter. KEEP CURRENT **Phase:** C5.7.

**Provider/asset boundary:** Provider ledger applies; availability is separate from rights.

## 15. sun-moon — LOW

**Classification:** HUB IMPLEMENTATION JUSTIFIED. **Current symptom:** No reported separate Sun/Moon defect; astronomical accuracy not newly qualified.

**Exact upstream paths/functions:** `installTrackpadPinchZoom` in [`src/app/viewer.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/viewer.js); `createApplicationViewer` in [`src/app/viewer.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/viewer.js); `createApplicationScene` in [`src/app/scene.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/scene.js). Full modules: [`src/app/viewer.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/viewer.js); [`src/app/scene.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/scene.js)

**Exact Hub paths:** [`runtimes/earth-runtime/core/ViewerController.mjs`](../../runtimes/earth-runtime/core/ViewerController.mjs); [`runtimes/earth-runtime/core/EarthRuntime.mjs`](../../runtimes/earth-runtime/core/EarthRuntime.mjs)

**Lost behavior:** No bespoke astronomical background/time contract. Standard Sun/Moon are not explicitly disabled by Hub.

**Documented reason and validity:** Keep Cesium math engine-owned; Hub has LIVE_ONLY feed contracts and separate astronomy engine.

**Preferred remediation:** Keep the qualified Hub-owned/typed contract and reused helper; consider the listed upstream behavior only through a separately approved bounded adapter. ADD IN F ASTRONOMY EXTENSIONS **Phase:** F Astronomy extensions.

**Provider/asset boundary:** Provider ledger applies; availability is separate from rights.

## 16. display-effects — LOW

**Classification:** HUB IMPLEMENTATION JUSTIFIED. **Current symptom:** No effects controls implemented; source hooks useful after rights/render qualification.

**Exact upstream paths/functions:** `initStyles` in [`src/ui/visualEffects.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/ui/visualEffects.js); `initPostProcess` in [`src/ui/visualEffects.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/ui/visualEffects.js). Full modules: [`src/ui/effects.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/ui/effects.js); [`src/ui/visualEffects.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/ui/visualEffects.js); [`src/bloom.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/bloom.js); [`src/ui/styles.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/ui/styles.js); [`src/ui/visualSettings.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/ui/visualSettings.js)

**Exact Hub paths:** [`runtimes/earth-runtime/core/ViewerController.mjs`](../../runtimes/earth-runtime/core/ViewerController.mjs); [`runtimes/earth-runtime/core/displayConfig.mjs`](../../runtimes/earth-runtime/core/displayConfig.mjs)

**Lost behavior:** Upstream effects and tuning UI not implemented; current Hub has simple normal Earth presentation.

**Documented reason and validity:** Bounded C2/C6 scope, accessible product shell and truthful science do not require fictional intelligence presentation.

**Preferred remediation:** Keep the qualified Hub-owned/typed contract and reused helper; consider the listed upstream behavior only through a separately approved bounded adapter. ADD IN C6 **Phase:** C6.

**Provider/asset boundary:** Provider ledger applies; availability is separate from rights.

## 17. 3d-buildings — LOW

**Classification:** HUB IMPLEMENTATION JUSTIFIED. **Current symptom:** Optional code is dormant, not implemented active capability.

**Exact upstream paths/functions:** `loadPhotorealisticTileset` in [`src/maps/google3d.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/google3d.js); `createGoogleDirectTileset` in [`src/maps/google3d.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/google3d.js); `createGoogleIonTileset` in [`src/maps/google3d.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/google3d.js). Full modules: [`src/maps/google3d.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/maps/google3d.js)

**Exact Hub paths:** [`runtimes/earth-runtime/core/VisualFoundation.mjs`](../../runtimes/earth-runtime/core/VisualFoundation.mjs)

**Lost behavior:** No active configured buildings asset; upstream dedicated helper absent.

**Documented reason and validity:** C6 may justify standard Cesium/approved ion buildings directly; full upstream app supplies no magic missing building hook.

**Preferred remediation:** Keep the qualified Hub-owned/typed contract and reused helper; consider the listed upstream behavior only through a separately approved bounded adapter. ADD IN C6 **Phase:** C6.

**Provider/asset boundary:** Specific building dataset license/attribution and tile endpoint/asset approval.

## 18. selection-context — LOW

**Classification:** HUB IMPLEMENTATION JUSTIFIED. **Current symptom:** No current defect proven; source unavailable preserves explicitly last-known selected facts.

**Exact upstream paths/functions:** `createStore` in [`src/data/contextStore.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/data/contextStore.js). Full modules: [`src/data/contextStore.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/data/contextStore.js); [`src/ui/navigationController.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/ui/navigationController.js)

**Exact Hub paths:** [`runtimes/earth-runtime/core/SelectionStore.mjs`](../../runtimes/earth-runtime/core/SelectionStore.mjs); [`runtimes/earth-runtime/core/RuntimeBridge.mjs`](../../runtimes/earth-runtime/core/RuntimeBridge.mjs); [`packages/runtime-protocol/index.mjs`](../../packages/runtime-protocol/index.mjs); [`frontend/src/features/workspace/workspaceRuntimeAdapter.ts`](../../frontend/src/features/workspace/workspaceRuntimeAdapter.ts)

**Lost behavior:** Upstream application context store deliberately not used as universal state.

**Documented reason and validity:** Hub canonical string identities, bounded DTO bridge and owned product state are architectural requirements.

**Preferred remediation:** Keep the qualified Hub-owned/typed contract and reused helper; consider the listed upstream behavior only through a separately approved bounded adapter. KEEP CURRENT **Phase:** C5.7.

**Provider/asset boundary:** Provider ledger applies; availability is separate from rights.

## 19. lifecycle-rendering — LOW

**Classification:** HUB IMPLEMENTATION JUSTIFIED. **Current symptom:** Fresh Sky→Earth→Sky smoke passed with one active renderer and no relevant page exceptions.

**Exact upstream paths/functions:** `createApplication` in [`src/app/application.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/application.js); `initialize` in [`src/app/application.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/application.js); `createLayerCatalog` in [`src/app/catalog.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/catalog.js); `createApplicationScene` in [`src/app/scene.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/scene.js). Full modules: [`src/app/application.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/application.js); [`src/data/lifecycle.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/data/lifecycle.js); [`src/app/catalog.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/catalog.js); [`src/app/scene.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/app/scene.js)

**Exact Hub paths:** [`runtimes/earth-runtime/core/RuntimeLifecycle.mjs`](../../runtimes/earth-runtime/core/RuntimeLifecycle.mjs); [`runtimes/earth-runtime/core/LayerRegistry.mjs`](../../runtimes/earth-runtime/core/LayerRegistry.mjs); [`runtimes/earth-runtime/core/EarthRuntime.mjs`](../../runtimes/earth-runtime/core/EarthRuntime.mjs); [`runtimes/earth-runtime/core/RuntimeBridge.mjs`](../../runtimes/earth-runtime/core/RuntimeBridge.mjs); [`packages/runtime-protocol/index.mjs`](../../packages/runtime-protocol/index.mjs)

**Lost behavior:** Entire app composition/chrome/source singletons are excluded.

**Documented reason and validity:** Current authority explicitly requires Hub-owned Viewer, source containment and active-only iframe lifetime. This is justified, not an excuse to rewrite bounded feature modules.

**Preferred remediation:** Keep the qualified Hub-owned/typed contract and reused helper; consider the listed upstream behavior only through a separately approved bounded adapter. KEEP CURRENT **Phase:** C5.7.

**Provider/asset boundary:** Provider ledger applies; availability is separate from rights.

## 20. helper-aircraft-normalization — LOW

**Classification:** REUSE EXACTLY. **Current symptom:** Reuse alone does not guarantee provider or display parity.

**Exact upstream paths/functions:** `normalizeAdsbLolAircraftState` in [`src/data/adsbLolFallback.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/data/adsbLolFallback.js); `normalizeAdsbLolPointResponse` in [`src/data/adsbLolFallback.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/data/adsbLolFallback.js); `normalizeOpenSkyAircraft` in [`src/sources/live/aircraft.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/sources/live/aircraft.js); `normalizeReadsbAircraft` in [`src/sources/live/aircraft.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/sources/live/aircraft.js); `normalizeAircraftTrack` in [`src/sources/live/aircraft.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/sources/live/aircraft.js). Full modules: [`src/data/adsbLolFallback.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/data/adsbLolFallback.js); [`src/sources/live/aircraft.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/sources/live/aircraft.js)

**Exact Hub paths:** [`runtimes/earth-runtime/layers/GodsEyeFlightsAdapter.mjs`](../../runtimes/earth-runtime/layers/GodsEyeFlightsAdapter.mjs)

**Lost behavior:** No helper rewrite. Parent transport/filter/display losses remain in flights.

**Documented reason and validity:** Direct imports verified in source and qualified module-policy.

**Preferred remediation:** Keep the qualified Hub-owned/typed contract and reused helper; consider the listed upstream behavior only through a separately approved bounded adapter. KEEP CURRENT **Phase:** C5.7.

**Provider/asset boundary:** Provider ledger applies; availability is separate from rights.

## 21. helper-earthquake-depth — LOW

**Classification:** REUSE EXACTLY. **Current symptom:** No helper defect found.

**Exact upstream paths/functions:** `createEarthquakeOverlayEntry` in [`src/layers/earthquakes/model.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/earthquakes/model.js); `createEarthquakesLayer` in [`src/layers/earthquakes/index.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/earthquakes/index.js); `init` in [`src/layers/earthquakes/index.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/earthquakes/index.js). Full modules: [`src/layers/earthquakes/model.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/earthquakes/model.js); [`src/layers/earthquakes/index.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/earthquakes/index.js)

**Exact Hub paths:** [`runtimes/earth-runtime/layers/EventLayers.mjs`](../../runtimes/earth-runtime/layers/EventLayers.mjs)

**Lost behavior:** No helper loss; parent event layer differs.

**Documented reason and validity:** Public exported helper retained.

**Preferred remediation:** Keep the qualified Hub-owned/typed contract and reused helper; consider the listed upstream behavior only through a separately approved bounded adapter. KEEP CURRENT **Phase:** C5.7.

**Provider/asset boundary:** Provider ledger applies; availability is separate from rights.

## 22. helper-fire-anchor — LOW

**Classification:** REUSE EXACTLY. **Current symptom:** No helper defect found.

**Exact upstream paths/functions:** `normalizePolygons` in [`src/layers/perimeters/records.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/perimeters/records.js); `normalizeFirePerimeterSnapshot` in [`src/layers/perimeters/records.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/perimeters/records.js); `createFirePerimetersLayer` in [`src/layers/perimeters/index.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/perimeters/index.js); `installClickHandler` in [`src/layers/perimeters/index.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/perimeters/index.js); `init` in [`src/layers/perimeters/index.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/perimeters/index.js). Full modules: [`src/layers/perimeters/records.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/perimeters/records.js); [`src/layers/perimeters/cards.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/perimeters/cards.js); [`src/layers/perimeters/index.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/layers/perimeters/index.js)

**Exact Hub paths:** [`runtimes/earth-runtime/layers/EventLayers.mjs`](../../runtimes/earth-runtime/layers/EventLayers.mjs)

**Lost behavior:** No helper loss; focus anchor is not claimed incident location.

**Documented reason and validity:** Public helper preserves geometry behavior.

**Preferred remediation:** Keep the qualified Hub-owned/typed contract and reused helper; consider the listed upstream behavior only through a separately approved bounded adapter. KEEP CURRENT **Phase:** Later Earth capability phase.

**Provider/asset boundary:** Provider ledger applies; availability is separate from rights.

## 23. helper-weather-normalization — LOW

**Classification:** REUSE EXACTLY. **Current symptom:** Fresh modeled point rendered successfully.

**Exact upstream paths/functions:** `normalizeRegionalPlace` in [`src/data/regionalModel.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/data/regionalModel.js); `normalizeRegionalArticles` in [`src/data/regionalModel.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/data/regionalModel.js); `normalizeRegionalWeather` in [`src/data/regionalModel.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/data/regionalModel.js). Full modules: [`src/data/regionalModel.js`](https://github.com/bilawalsidhu/gods-eye-view/blob/e7707d9a0f34d9fbffc300023c319f95caa5be30/src/data/regionalModel.js)

**Exact Hub paths:** [`runtimes/earth-runtime/layers/GodsEyeWeatherAdapter.mjs`](../../runtimes/earth-runtime/layers/GodsEyeWeatherAdapter.mjs)

**Lost behavior:** No helper rewrite; request subset and facts differ.

**Documented reason and validity:** Source normalized UTC, unknown values retained as unavailable.

**Preferred remediation:** Keep the qualified Hub-owned/typed contract and reused helper; consider the listed upstream behavior only through a separately approved bounded adapter. KEEP CURRENT **Phase:** C5.7.

**Provider/asset boundary:** Provider ledger applies; availability is separate from rights.

## Boundaries on this ranking

The four critical items are not permission to remove payload caps, strict geometric-height/TLE/source-time contracts, rendering ownership, lifecycle control or canonical identity. Last-known/stale fallback can be retained only with explicit source time/status. Provider502/503 does not prove renderer failure; current empty point feeds do not prove loss of all metadata. Weather history/playback and global HD remain separate phased scope. New current-main hooks are candidates, not drop-in upgrades.
