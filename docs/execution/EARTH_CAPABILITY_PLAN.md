# Earth capability plan — planning reference

## Active C5.7-A owner authorization — 2026-10-08

OD1 — APPROVED FOR B-FIRST REGIONAL RECOVERY. WORLDWIDE OPTION C CONDITIONAL / NOT AUTHORIZED FOR ACQUISITION.

PR #66 merged at `8270e782f73d4df58b16e762cdb4f0031a37ada3`. Single agent,
branch `c5-7-a-aircraft-regional-recovery-1`; only the bounded aircraft package
is authorized. This checkpoint supersedes the older docs-only/no-C5.7 execution
statements below for A only. OD2–OD6 and C5.7-B/C/D/E/C6 remain unapproved.
No merge, production, purchases, new external models/media or worldwide acquisition.
[Qualification and limits](../validation/C5_7_A_AIRCRAFT_RECOVERY_EVIDENCE.md).

Date: 2026-10-08. **Canonical planning reference; NOT blanket execution authorization.**
PROJECT_STATE and LIVE_SESSION_BRIEF control active work. Approved architecture
is [ADR0009](../architecture/decisions/0009-owned-earth-feature-reuse.md).
Original [audit matrix](../audits/GODS_EYE_CAPABILITY_IMPLEMENTATION_RECONCILIATION_2026-10-05.md), [ranked divergence](../audits/GODS_EYE_IMPLEMENTATION_DIVERGENCE_2026-10-05.md),
[export audit](../audits/GODS_EYE_PUBLIC_EXPORT_AUDIT_2026-10-05.md),
[providers](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md) and
[traces](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md) remain immutable
evidence. Original DRAFT input remains historical; this plan is the normal future
Earth planning reference. It links source detail rather than duplicating the matrix.

## Evidence and denominator rules

Runtime baseline `bb28aec7833d154c2f0b3b7fa7470d69a93c84b4`. Audit evidence commit `09495238c2b5aebe358c66f9a09801382758f4f8`.
God's Eye pin `e7707d9a0f34d9fbffc300023c319f95caa5be30` (Sep29UTC), not updated. Upstream comparison snapshot
`95fa816232456a6831172befa2f1b34b9ee73794` (Oct7T22:34:17Z, read Oct8):255
upstream-only reachable commits,0pin-only,435changed files; not a continuously
current guarantee. No candidate-upstream runtime was qualified here.

29pin/30snapshot catalog layers;148pin/157snapshot public entrypoints;67audit
areas=29catalog+33facets/absence/current-only+5helpers. Direct reuse4,wrap1,minimal
ports0,justified14,questionable4,proven unjustified0,superseded-by-Hub0,DO NOT USE3,
UNKNOWN41. Classification is one per audited relationship, while parents/helpers,
risk and provider/hook flags overlap:45provider/data gates are not45prohibitions;
11hook/adapter gates are not all renderer incompatibilities;41unknowns are not41
regressions.23adapted relationships (4critical/5high/5medium/9low) overlap features.
73provider records are not73companies;2,010stage records are static navigation and
curated comparisons, not2,010live tests. Preserve explicit source-stage UNKNOWN/N/A.

Oct7 live evidence: reference12,975accepted global aircraft, visible count/follow
UNKNOWN; Hub aircraft503/zero. Both satellite populations unavailable, owner~5not
verified. Hub point weather200/one ready point; upstream weather visuals not proved.
Initial home height15.62Mm and disabled skybox explain specific source-code display
differences; provider outage is separate. C0–C5.6 bounded qualification is historical,
not rerun by this documentation checkpoint; no global/production readiness claim.

## Historical ledger generator drift

The older runtime-ledger generator reproduces its historical29/38/148 schema but
downgrades three merged C5 layers to PLANNED, carries a changed launch state and
recognizes five direct imports versus seven actual import entrypoints. It is not
current planning authority. Audit inventory and this plan supersede those planning
claims; generator/runtime-ledger repair needs separately authorized work. No script
or renderer input was changed here. This is a documentary uncertainty boundary,
not evidence that the C5 runtime regressed.

Per-record GATED preserves the audit's provider/data flag; it is not a permanent
prohibition. NO AUDIT FLAG means this audit did not assign that flag, not approval
or a grant of data/service/asset rights. Original per-source constraints remain.

## Planning and proof rules

Preserve current scope unless owner approves expansion. Prefer exact reuse/wrap,
generic public hook then minimal port, or specific justified implementation; no
broad adapter rewrite. Stronger altitude/TLE/time/identity/cap contracts remain.
Actual completion must separately prove code/UI/fixtures/live provider/useful
rendering/advertised coverage/accepted behavior. No global aircraft authorization,
small stations catalog called a loading defect, point weather called a weather
map, dormant ion called active terrain, or standard starbox called astronomy data.

C5.7 **PROPOSED** A→B→C→D→E, approval/decisions first. C6 approved direction,
provider-specific stages unapproved. Other phases retain complete applicable
scope subject to provider/hook/asset and bounded owner task gates. Each future
capability needs failing reproduction, source contract, fixture+Docker/browser
proof, actual source-age/count/coverage/failure and cleanup/device budgets, final
artifact/input/installed/served identity and owner acceptance. Legal UNKNOWN is a
gate, not a license grant. [Owner decisions](C5_7_EARTH_CORE_RECOVERY_SPEC.md#owner-decision-register)
must record explicit owner choice; proposed defaults are not approval.

## Per-capability planning records

## ais-live-vessels — AIS / live vessels

**Owner-facing purpose:** AIS / live vessels.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** AISStream server WebSocket, snapshot and track source; normalized MMSI contacts; partial retention, first-connect grace, billboard fleet, label budgets, trails and follow camera. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. API key; beta-service and stream rights need owner/provider approval. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## alpr-cameras — Mapped ALPR cameras

**Owner-facing purpose:** Mapped ALPR cameras.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** US/Canada community OSM detail tiles; optional Overpass source; bounded viewport/tile and precision caches, direction wedges, mapped-site metadata, selection and focus. No plate records or operating-status proof. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Community tile-host terms and ODbL/database obligations must be resolved; public mapping is not permission for surveillance data. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## bhote-koshi-2026 — Bhote Koshi historical event reconstruction

**Owner-facing purpose:** Bhote Koshi historical event reconstruction.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Vantor/GeoPera reconstruction with split imagery and authored progress; restricted derived coordinates are compiled source as well as public assets. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** DO NOT USE / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. CC BY-NC 4.0; obtain separate permission before any relevant future use. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** REJECT; Specific noncommercial narrative pack is unrelated to foundational Earth integration. Proposed target: REJECTED.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## bhote-koshi-locator — Bhote Koshi incident locator

**Owner-facing purpose:** Bhote Koshi incident locator.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Regional locator and Nepal boundaries accompanying the historical event pack. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** DO NOT USE / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Mixed-source event terms; not covered solely by MIT. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** REJECT; Event-specific locator, not a general Earth foundation. Proposed target: REJECTED.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## bikeshare — Bikeshare availability

**Owner-facing purpose:** Bikeshare availability.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** GBFS station-information/status source, normalization and viewport selection; 8,000-point budget, station availability styling and selected facts. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Per-feed service and redistribution terms, rather than one GBFS-wide grant. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## cctv — CCTV catalogs / live media / projection

**Owner-facing purpose:** CCTV catalogs / live media / projection.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Provider catalog and health, frame/HLS playback, calibration, approximate heading/coverage/viewshed and projected image geometry; ground sampling, generation queues, selected cards and auto-hop. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Each feed, HLS/media and Street View route has separate rights; precomputed ground-height provenance unresolved. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## directions — Street-following directions

**Owner-facing purpose:** Street-following directions.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** User-set A/B points; car/bike/foot OSRM routes, turn-by-turn steps, source-attributed route geometry and bounded camera flight. Missing route draws no fabricated street route. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Public-instance fair use; identifying client, attribution/fix-map link, quotas or self-hosting. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## earthquakes — Earthquake events

**Owner-facing purpose:** Earthquake events.
**Current Hub / entrypoints:** `createEventAdapter / validEventFeed / normalize_quakes / depthColor`; [`backend/app/services/earth_events.py`](../../backend/app/services/earth_events.py); [`backend/app/routes/earth.py`](../../backend/app/routes/earth.py); [`runtimes/earth-runtime/layers/EventLayers.mjs`](../../runtimes/earth-runtime/layers/EventLayers.mjs); [`runtimes/earth-runtime/layers/eventData.mjs`](../../runtimes/earth-runtime/layers/eventData.mjs); [`runtimes/earth-runtime/layers/PollingLayer.mjs`](../../runtimes/earth-runtime/layers/PollingLayer.mjs); [`runtimes/earth-runtime/core/LayerRegistry.mjs`](../../runtimes/earth-runtime/core/LayerRegistry.mjs); [`runtimes/earth-runtime/core/SelectionStore.mjs`](../../runtimes/earth-runtime/core/SelectionStore.mjs); [`runtimes/earth-runtime/core/CameraController.mjs`](../../runtimes/earth-runtime/core/CameraController.mjs)
**Pinned upstream:** USGS past-day source; magnitude/depth normalization, primitives, event facts, selected cards, focus and event-age semantics. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** HUB IMPLEMENTATION JUSTIFIED / MEDIUM.
**Runtime status / evidence:** Code exists; No reported current defect; this audit did not freshly activate this live feed. **Missing/different from upstream:** Upstream full layer, richer event cards and magnitude-dependent rendering; Hub M2.5+, 500 records, 15-minute feed admission, bounded owned entities. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Existing bounded implementation/helper; no additional live defect proven. Scope/qualification differences retained.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** KEEP CURRENT; C5 explicitly qualified a bounded typed FastAPI feed and Hub-owned event factories; depthColor is reused. Proposed target: C5.7-E regression only; preserve current bounded implementation.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** Future phase/package approval; current justified behavior retained.

## fire-perimeters — Wildfire perimeters

**Owner-facing purpose:** Wildfire perimeters.
**Current Hub / entrypoints:** `createEventAdapter / validEventFeed / normalize_fires / perimeterAnchorDegrees`; [`backend/app/services/earth_events.py`](../../backend/app/services/earth_events.py); [`backend/app/routes/earth.py`](../../backend/app/routes/earth.py); [`runtimes/earth-runtime/layers/EventLayers.mjs`](../../runtimes/earth-runtime/layers/EventLayers.mjs); [`runtimes/earth-runtime/layers/eventData.mjs`](../../runtimes/earth-runtime/layers/eventData.mjs); [`runtimes/earth-runtime/layers/PollingLayer.mjs`](../../runtimes/earth-runtime/layers/PollingLayer.mjs); [`runtimes/earth-runtime/core/LayerRegistry.mjs`](../../runtimes/earth-runtime/core/LayerRegistry.mjs); [`runtimes/earth-runtime/core/SelectionStore.mjs`](../../runtimes/earth-runtime/core/SelectionStore.mjs); [`runtimes/earth-runtime/core/CameraController.mjs`](../../runtimes/earth-runtime/core/CameraController.mjs)
**Pinned upstream:** WFIGS current incident polygon normalization, containment styling and incident cards; InciWeb link checking, source timestamps and footprint selection. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** HUB IMPLEMENTATION JUSTIFIED / MEDIUM.
**Runtime status / evidence:** Code exists; No reported current defect; no fresh live activation in this audit. **Missing/different from upstream:** InciWeb enrichment, containment palette/cards, upstream broader subset. Hub retains holes, max 100 recent generalized polygons, 25,000 total vertices and focus anchors. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Existing bounded implementation/helper; no additional live defect proven. Scope/qualification differences retained.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** KEEP CURRENT; C5 performance, strict polygon contract and bounded public-context scope are documented; perimeterAnchorDegrees is reused. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** Future phase/package approval; current justified behavior retained.

## flights — Civil aircraft acquisition / motion / display

**Owner-facing purpose:** Civil aircraft acquisition / motion / display.
**Current Hub / entrypoints:** `createFlightsAdapter / admitAircraft / entityRenderer / fetch_aircraft`; [`backend/app/routes/earth.py`](../../backend/app/routes/earth.py); [`runtimes/earth-runtime/layers/GodsEyeFlightsAdapter.mjs`](../../runtimes/earth-runtime/layers/GodsEyeFlightsAdapter.mjs); [`runtimes/earth-runtime/layers/data.mjs`](../../runtimes/earth-runtime/layers/data.mjs); [`runtimes/earth-runtime/layers/entities.mjs`](../../runtimes/earth-runtime/layers/entities.mjs); [`runtimes/earth-runtime/layers/PollingLayer.mjs`](../../runtimes/earth-runtime/layers/PollingLayer.mjs); [`runtimes/earth-runtime/core/LayerRegistry.mjs`](../../runtimes/earth-runtime/core/LayerRegistry.mjs); [`runtimes/earth-runtime/core/SelectionStore.mjs`](../../runtimes/earth-runtime/core/SelectionStore.mjs); [`runtimes/earth-runtime/core/CameraController.mjs`](../../runtimes/earth-runtime/core/CameraController.mjs)
**Pinned upstream:** OpenSky worldwide snapshot with observer/view-anchored ADSB.lol fallback; enrichment and track backfill; geometric/barometric/ground policy, delayed motion, LOD/model budgets and follow camera. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** HUB IMPLEMENTATION QUESTIONABLE / CRITICAL.
**Runtime status / evidence:** C5.7-A implements bounded settled-camera100NM coverage, qualified upstream records/ingestion, bracketed delayed motion and glyph/point LOD. [Current fixture qualification and live blocker](../validation/C5_7_A_AIRCRAFT_RECOVERY_EVIDENCE.md). The following remains the historical audit baseline: Code exists; Hub 503 and zero aircraft at 15.62-million-m home height; upstream accepted 12,975 worldwide contacts. Altitude gate independently explains invisible contacts if a feed succeeds. **Missing/different from upstream:** OpenSky and fallback chain, view anchor/250-NM fallback, history/motion interpolation, enrichment, heading/classification, aircraft tracking, global contact display. Aircraft glyph hidden above 2,000,000 m and its point never shown. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Recovery removes the active high-altitude gate and observer lock; source success remains blocked. Historical audit finding: Confirmed code display gate; separate503provider observation; observer coverage intentional; motion/fallback usability incomplete.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. OpenSky research/education versus public/commercial service approval; ADSB.lol ODbL and quota stewardship. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** WRAP UPSTREAM; Phase C2 explicitly bounded one 100-NM observer feed, typed transport and geometric-height truth. Those remain valid safety constraints; Viewer ownership does not justify discarding all fleet display/motion/fallback behavior. Proposed target: C5.7.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#c57-a--aircraft-operational-recovery); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD1 B-first regional package approved by owner 2026-10-08; worldwide Option C acquisition, agreement/accounts/costs/budgets remain unapproved. OD2–OD6 remain unresolved.

## local-adsb — Local ADS-B / RTL-SDR receiver

**Owner-facing purpose:** Local ADS-B / RTL-SDR receiver.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Hardware-local WebUSB receiver ingestion and display; excluded from share/persisted remote layer state. Receiver discovery/server-local snapshots are a separate source boundary. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Requires local hardware and explicit device permission; no hardware was connected. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD1.

## local-dams — Dams infrastructure

**Owner-facing purpose:** Dams infrastructure.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Bundled OSM/OpenInfraMap dam GeoJSON, owned custom data source, adaptive cohort/label budgets and terrain-aware anchors. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. ODbL attribution and derived-database obligations; current build excludes all bundled local_data. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## local-datacenters — Datacenters infrastructure

**Owner-facing purpose:** Datacenters infrastructure.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Bundled OSM datacenters rendered through the generic local-GeoJSON implementation and adaptive LOD/analyst metadata. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. ODbL is compatible with commercial use subject to obligations; not categorically prohibited, but current build excludes bundled data. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## local-firms — FIRMS active-fire detections

**Owner-facing purpose:** FIRMS active-fire detections.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Runtime VIIRS/MODIS trailing-24-hour CSV, sensor merge, source-dated heatmap/anchors and selected facts; no longer a bundled production fire snapshot. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Free MAP_KEY and transaction quota; no credentials supplied. Public data terms do not imply unlimited API service. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## military — Military aircraft

**Owner-facing purpose:** Military aircraft.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** ADSB.lol military feed, military registry and type/airframe handling, stale snapshots/backoff, billboard/models, motion, trails and tracking. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. ODbL plus enrichment/model rights; coverage is reception/classification, not exhaustive military activity. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD1.

## military-awareness — Military-awareness aggregation

**Owner-facing purpose:** Military-awareness aggregation.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Passive aggregate of existing flights/military/vessels/installations; source-dependent history, ranked examples, viewport focus and status. No independent intelligence source. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Inherits dependent rights; source observations must not become fabricated threat assessment. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## military-installations — Mapped military installations

**Owner-facing purpose:** Mapped military installations.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Named Overture/OSM wide-view points plus bounded OpenFreeMap military polygons; optional Overpass and explicit Google Places; sampling, dedupe, label caps and focus. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. ODbL named pack and optional proprietary Places terms; mapped site does not establish activity or completeness. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## radio — Internet radio and local SDR

**Owner-facing purpose:** Internet radio and local SDR.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Geolocated PDDL station directory, bounded health filter/clustering and selected station; browser-direct audio, tuning noise and volume. Local SDR modules are a separate device source. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. PDDL covers directory only. Audio remains broadcaster-owned; one direct stream discloses listener IP and must not be mirrored. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## recent-imagery — Recent imagery / comparison

**Owner-facing purpose:** Recent imagery / comparison.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** NASA CMR paged HLS S30/L30 catalog, VIIRS date candidates, bounded box/cloud ranking; NASA GIBS draping, thumbnail queue, image/basemap/A-B swipe with acquisition dates. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. NASA/sensor-product provenance and service fairness; these recent tiles do not establish globally uniform HD. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN C6; Retained future capability; no feature-specific integration decision has been approved. Proposed target: C6.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C6_GLOBAL_MAPPING_SPEC.md); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD5/OD6.

## rocket-launches — Launch missions / replay

**Owner-facing purpose:** Launch missions / replay.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Launch Library 2 metadata, pads, authored ascent replay and optional CelesTrak active-catalog orbit association; replay and live orbit are distinct, shared satellite source. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Prior C5 LL2 403 is historical. This audit did not re-query LL2; access/quota/terms and replay provenance need qualification. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** PROVIDER RESEARCH REQUIRED; Retained future capability; no feature-specific integration decision has been approved. Proposed target: BLOCKED.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD2.

## satellites — Satellite populations / propagation / tracking

**Owner-facing purpose:** Satellite populations / propagation / tracking.
**Current Hub / entrypoints:** `createSatellitesAdapter / tleRecords / entityRenderer`; [`runtimes/earth-runtime/layers/GodsEyeSatellitesAdapter.mjs`](../../runtimes/earth-runtime/layers/GodsEyeSatellitesAdapter.mjs); [`runtimes/earth-runtime/layers/data.mjs`](../../runtimes/earth-runtime/layers/data.mjs); [`runtimes/earth-runtime/layers/entities.mjs`](../../runtimes/earth-runtime/layers/entities.mjs); [`runtimes/earth-runtime/layers/PollingLayer.mjs`](../../runtimes/earth-runtime/layers/PollingLayer.mjs); [`runtimes/earth-runtime/core/LayerRegistry.mjs`](../../runtimes/earth-runtime/core/LayerRegistry.mjs); [`runtimes/earth-runtime/core/SelectionStore.mjs`](../../runtimes/earth-runtime/core/SelectionStore.mjs); [`runtimes/earth-runtime/core/CameraController.mjs`](../../runtimes/earth-runtime/core/CameraController.mjs)
**Pinned upstream:** Six core CelesTrak groups plus optional Starlink dense catalog, NORAD dedupe, cached satellite.js records, wall-clock SGP4, PointPrimitiveCollection, orbit rings, ISS labels/follow, chunked dense load. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** HUB IMPLEMENTATION QUESTIONABLE / CRITICAL.
**Runtime status / evidence:** Code exists; Owner historical ~5 is compatible with the reduced stations-only catalog; fresh Hub and reference both unavailable/zero, so fresh global population is unknown. **Missing/different from upstream:** Five core groups plus dense opt-in, category styles, NORAD multi-group dedupe, persistent satrec, 1-second propagation and per-frame tracked updates, orbit rings and partial/stale catalog state. Hard cap 100; 15-second position updates. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Intentional stations-only/cap/15s scope, not proven missing objects; unavailable live population; larger-group/LOD/tracking qualification required.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Current browser-direct CelesTrak transport is not proven CORS-safe; upstream explicitly uses a proxy. Cached source time, usage cadence and redistribution need qualification. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** WRAP UPSTREAM; Stations-only was explicit temporary C2 scope. No evidence proves a permanent performance requirement or architecture prohibition on broader populations. Strict checksum, finite position and seven-day epoch admission remain justified. Proposed target: C5.7.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#c57-b--satellite-population-and-tracking-correctness); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD2.

## telegeography-submarine-cables — Submarine cables / landing points

**Owner-facing purpose:** Submarine cables / landing points.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Bundled cable and landing-point source, route geometry, label budgets, source metadata, selection/focus and cancellation. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. CC BY-NC-SA 3.0 bundled snapshot; owner must resolve noncommercial fit or obtain a separate license/source. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** OWNER DECISION REQUIRED; Retained future capability; no feature-specific integration decision has been approved. Proposed target: BLOCKED.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## traffic — Traffic roads / live congestion / simulated dots

**Owner-facing purpose:** Traffic roads / live congestion / simulated dots.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** OSM/OpenFreeMap roads plus optional TomTom flow vector tiles, viewport/tile cache and quotas; animated dots and heat-lines. Without live flow, simulated traffic is explicitly labeled. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. TomTom key/billing/quota/cache rules; never present simulated dots as observed vehicles. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## transit — Live public transit / recent positions

**Owner-facing purpose:** Live public transit / recent positions.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Allowlisted GTFS-RT feeds, bounded server transport and protobuf/JSON normalization, source timestamps, delayed motion, 15-minute observed trails, billboard fleets and selected facts. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Per-agency license/service terms; data ages and retention limits remain distinct from generic GTFS format. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## weather-cyclones — Cyclone advisories / tracks / cones

**Owner-facing purpose:** Cyclone advisories / tracks / cones.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** NHC/CPHC current storms plus official MapServer geometry, advisory-time validation, matching coherent tracks/cones, labels, selection and selected focus. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. NWS disclaimer, advisory date and basin coverage; forecasts are not current measured footprints. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD3.

## weather-lightning — Lightning density imagery

**Owner-facing purpose:** Lightning density imagery.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Separate lightning weather product, bounded observed-history clock and imagery/tile renderer; 15-minute accumulated Level-5 density, not raw strike locations. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. NOAA Level-5 distribution permitted with description/attribution; raw Vaisala detection rights are different. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD3.

## weather-radar — Observed weather radar

**Owner-facing purpose:** Observed weather radar.
**Current Hub / entrypoints:** `createEventAdapter / validRadarFeed / normalize_radar`; [`backend/app/services/earth_events.py`](../../backend/app/services/earth_events.py); [`backend/app/routes/earth.py`](../../backend/app/routes/earth.py); [`runtimes/earth-runtime/layers/EventLayers.mjs`](../../runtimes/earth-runtime/layers/EventLayers.mjs); [`runtimes/earth-runtime/layers/eventData.mjs`](../../runtimes/earth-runtime/layers/eventData.mjs); [`runtimes/earth-runtime/layers/PollingLayer.mjs`](../../runtimes/earth-runtime/layers/PollingLayer.mjs); [`runtimes/earth-runtime/core/LayerRegistry.mjs`](../../runtimes/earth-runtime/core/LayerRegistry.mjs); [`runtimes/earth-runtime/core/SelectionStore.mjs`](../../runtimes/earth-runtime/core/SelectionStore.mjs); [`runtimes/earth-runtime/core/CameraController.mjs`](../../runtimes/earth-runtime/core/CameraController.mjs)
**Pinned upstream:** Separate NOAA CONUS radar manifest/history, tile/image renderer with generation/crossfade/mosaic budgets, observed clock, opacity/playback UI and failure retention. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** HUB IMPLEMENTATION JUSTIFIED / HIGH.
**Runtime status / evidence:** Code exists; Hub point Weather is a separate toggle; reference radar HTTP responses succeeded but screenshot/status reported unavailable frames. No new Hub radar visual qualification here. **Missing/different from upstream:** Observed history/playback, tiled close detail, crossfade/shared weather clock, coverage controls and full upstream legend. Hub 2048x1024 latest-only CONUS image and coverage-centre marker. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Existing bounded implementation/helper; no additional live defect proven. Scope/qualification differences retained.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** KEEP CURRENT; C5 explicitly chose a bounded current snapshot, source-time lease and strict fixed endpoint instead of an arbitrary time/tile proxy. Current scope is valid but does not equal upstream weather parity. Proposed target: C5.7.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#c57-c--weather-usability); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD3.

## weather-satellite — Weather satellite / regional-global cloud imagery

**Owner-facing purpose:** Weather satellite / regional-global cloud imagery.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** NOAA GOES regional cloud image plus global LWIR product; clouds-only/full-IR controls, observed frame history and coverage-aware rendering. Global LWIR is not a validated cloud mask. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Observed timestamp and product-specific regional/global coverage; imagery interpretation must stay explicit. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD2.

## wind — Wind forecast field / animated flow

**Owner-facing purpose:** Wind forecast field / animated flow.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** NOAA GFS or ECMWF IFS 10-m U/V GRIB range reads; server decode/resample and validated binary grid; bounded GPU flow/canvas fallback, forecast valid/issue times, units, pause and scalar overlays. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. ECMWF CC BY 4.0 plus disclaimer, NOAA courtesy credit; server decoder/provider quotas and grid timing must qualify. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD3.

## weather-current — Modeled point weather

**Owner-facing purpose:** Modeled point weather.
**Current Hub / entrypoints:** `createWeatherAdapter / weatherPayloadValid / normalizeRegionalWeather`; [`runtimes/earth-runtime/layers/GodsEyeWeatherAdapter.mjs`](../../runtimes/earth-runtime/layers/GodsEyeWeatherAdapter.mjs); [`runtimes/earth-runtime/layers/data.mjs`](../../runtimes/earth-runtime/layers/data.mjs); [`runtimes/earth-runtime/layers/entities.mjs`](../../runtimes/earth-runtime/layers/entities.mjs); [`runtimes/earth-runtime/layers/PollingLayer.mjs`](../../runtimes/earth-runtime/layers/PollingLayer.mjs); [`runtimes/earth-runtime/core/LayerRegistry.mjs`](../../runtimes/earth-runtime/core/LayerRegistry.mjs); [`runtimes/earth-runtime/core/SelectionStore.mjs`](../../runtimes/earth-runtime/core/SelectionStore.mjs); [`runtimes/earth-runtime/core/CameraController.mjs`](../../runtimes/earth-runtime/core/CameraController.mjs)
**Pinned upstream:** Open-Meteo current point normalization; upstream cockpit regional briefing and location-specific visual weather effect, not one global Weather layer. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** HUB IMPLEMENTATION QUESTIONABLE / CRITICAL.
**Runtime status / evidence:** Code exists; Fresh Open-Meteo 200, one live point at ORAS; owner reported little visible effect. The current implementation invokes no globe weather field; the report itself is not a field-level usability test. **Missing/different from upstream:** Upstream cockpit weather fields/effects and independent visible weather products. Hub requests four current variables, renders a 16px point, displays temperature/cloud/valid time but omits requested wind from facts. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Point conditions live success; generic-control usability/scope gap, not proof broken acquisition or global map.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Free hosted API noncommercial service only; CC BY 4.0 data is separate from service permission. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** FIX CURRENT IMPLEMENTATION; C2 deliberately admitted modeled current conditions only. Honest point data is valid; generic Weather discoverability and absent field meaning do not fulfill visual-weather expectations. Proposed target: C5.7.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#c57-c--weather-usability); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD3.

## weather-cloud-coverage — Cloud-cover value and cockpit cloud effects

**Owner-facing purpose:** Cloud-cover value and cockpit cloud effects.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Source-backed point cloud-cover percentage, WMO condition family and bounded cockpit-local presentation; unavailable/expired data suppress effects. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Service/license and modeled-vs-observed truth; scene effects are presentational. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN F ASTRONOMY EXTENSIONS; Hub has point cloudCoverPct under weather-current; no separate cloud field or astronomy seeing model. Validate science before observing-quality claims. Proposed target: F Astronomy extensions.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD3.

## weather-precipitation — Precipitation condition / radar distinction

**Owner-facing purpose:** Precipitation condition / radar distinction.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Point precipitation can bound cockpit rain/snow presentation; radar is observed reflectivity. No separate pinned global accumulated-rain layer was found. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Model value and radar product rights/time semantics; no fabricated precipitation. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Do not invent an upstream precipitation renderer or interpret reflectivity as rainfall accumulation. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD3.

## weather-temperature-pressure — Temperature / pressure scalar overlays

**Owner-facing purpose:** Temperature / pressure scalar overlays.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Wind options select companion forecast 2-m temperature or mean-sea-level pressure; K→C and Pa→hPa normalization; unavailable companion preserves valid wind. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Same forecast-product/time/attribution gates as wind. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD3.

## weather-clock — Observed weather clock / playback

**Owner-facing purpose:** Observed weather clock / playback.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Shared weather-history clock keeps latest and historical observation timestamps distinct from wind forecast valid time and wall-clock aircraft/satellites. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Hub current snapshot temporal contracts intentionally omit weather-history playback; do not bind live feeds to the Hub astronomy clock. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD3.

## background-stars — Basic Cesium star background

**Owner-facing purpose:** Basic Cesium star background.
**Current Hub / entrypoints:** `ViewerController (skyBox.show=false)`; [`runtimes/earth-runtime/core/ViewerController.mjs`](../../runtimes/earth-runtime/core/ViewerController.mjs)
**Pinned upstream:** Standard Cesium Viewer skybox is left enabled; no custom Gods Eye scientific star catalog. Reference skyBox.show=true. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** HUB IMPLEMENTATION QUESTIONABLE / CRITICAL.
**Runtime status / evidence:** Code exists; Owner black void matches explicit source setting; reference skybox is enabled. **Missing/different from upstream:** Hub explicitly sets viewer.scene.skyBox.show=false, revealing #03070B background. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Confirmed explicit disabled standard skybox; visual presentation difference, not missing scientific catalog.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN C5.7; No documented technical/provider/product reason found for disabling the standard skybox. Viewer ownership remains valid. Proposed target: C5.7.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#c57-d--earth-space-background); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD4/OD6.

## sun-moon — Cesium Sun / Moon / scientific sky distinction

**Owner-facing purpose:** Cesium Sun / Moon / scientific sky distinction.
**Current Hub / entrypoints:** `ViewerController / EarthRuntime`; [`runtimes/earth-runtime/core/ViewerController.mjs`](../../runtimes/earth-runtime/core/ViewerController.mjs); [`runtimes/earth-runtime/core/EarthRuntime.mjs`](../../runtimes/earth-runtime/core/EarthRuntime.mjs)
**Pinned upstream:** Standard Cesium Sun/Moon remain enabled in the fresh reference; engine math and Viewer clock supply visual celestial behavior. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** HUB IMPLEMENTATION JUSTIFIED / LOW.
**Runtime status / evidence:** Code exists; No reported separate Sun/Moon defect; astronomical accuracy not newly qualified. **Missing/different from upstream:** No bespoke astronomical background/time contract. Standard Sun/Moon are not explicitly disabled by Hub. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Existing bounded implementation/helper; no additional live defect proven. Scope/qualification differences retained.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN F ASTRONOMY EXTENSIONS; Keep Cesium math engine-owned; Hub has LIVE_ONLY feed contracts and separate astronomy engine. Proposed target: F Astronomy extensions.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** Future phase/package approval; current justified behavior retained.

## atmosphere-lighting — Atmosphere / fog / lighting / HDR / shadows

**Owner-facing purpose:** Atmosphere / fog / lighting / HDR / shadows.
**Current Hub / entrypoints:** `ViewerController`; [`runtimes/earth-runtime/core/ViewerController.mjs`](../../runtimes/earth-runtime/core/ViewerController.mjs)
**Pinned upstream:** Explicit sky-atmosphere intensity/saturation/brightness and Apple model-atmosphere workaround; remaining Sun/Moon/fog/HDR/shadow defaults are Cesium unless scene/style modules override. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** HUB IMPLEMENTATION JUSTIFIED / MEDIUM.
**Runtime status / evidence:** Code exists; Black void is skybox setting, not evidence all atmosphere disabled. **Missing/different from upstream:** Upstream intensity shifts and Apple model shader workaround; Hub enables ground/Sun lighting, fog density 0.0002 and default sky atmosphere, uses request-render and resolution cap. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Existing bounded implementation/helper; no additional live defect proven. Scope/qualification differences retained.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN C6; Owned request-render/performance style is documented; physical Apple/Metal compatibility remains unqualified, relevant before future model/3D use. Proposed target: C6.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C6_GLOBAL_MAPPING_SPEC.md); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD5/OD6.

## display-effects — Visual presets / postprocessing / bloom / night vision

**Owner-facing purpose:** Visual presets / postprocessing / bloom / night vision.
**Current Hub / entrypoints:** `ViewerController / admitDisplayConfig`; [`runtimes/earth-runtime/core/ViewerController.mjs`](../../runtimes/earth-runtime/core/ViewerController.mjs); [`runtimes/earth-runtime/core/displayConfig.mjs`](../../runtimes/earth-runtime/core/displayConfig.mjs)
**Pinned upstream:** VisualEffects, bloom and style managers select normal, sensor/CRT/stylized presentation and adjust shaders; cosmetic sensor HUD does not prove physical sensor data. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** HUB IMPLEMENTATION JUSTIFIED / LOW.
**Runtime status / evidence:** Code exists; No effects controls implemented; source hooks useful after rights/render qualification. **Missing/different from upstream:** Upstream effects and tuning UI not implemented; current Hub has simple normal Earth presentation. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Existing bounded implementation/helper; no additional live defect proven. Scope/qualification differences retained.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN C6; Bounded C2/C6 scope, accessible product shell and truthful science do not require fictional intelligence presentation. Proposed target: C6.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C6_GLOBAL_MAPPING_SPEC.md); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD5/OD6.

## terrain — Real terrain providers

**Owner-facing purpose:** Real terrain providers.
**Current Hub / entrypoints:** `VisualFoundation / ViewerController`; [`runtimes/earth-runtime/core/VisualFoundation.mjs`](../../runtimes/earth-runtime/core/VisualFoundation.mjs); [`runtimes/earth-runtime/core/ViewerController.mjs`](../../runtimes/earth-runtime/core/ViewerController.mjs)
**Pinned upstream:** Ion World Terrain with credentials or keyless ReEarth ellipsoidal quantized mesh; fallback flat terrain, cancellation and provider switch lifetime. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** HUB IMPLEMENTATION JUSTIFIED / HIGH.
**Runtime status / evidence:** Code exists; Hub Earth currently has no qualified real-terrain deployment. **Missing/different from upstream:** Active real terrain and ReEarth route. Default Hub EllipsoidTerrainProvider; qualified Ion branch exists but no configured provider proves active terrain. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Bounded current/dormant/ellipsoid scope; global terrain/3D qualification absent, not implied by optional code.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Ion entitlement or ReEarth CC BY mesh/datum terms, available coverage and service budgets. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN C6; C6 remains gated; dormant artifact-attested provider options are not production/active qualification. Proposed target: C6.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C6_GLOBAL_MAPPING_SPEC.md); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD5/OD6.

## terrain-heights — Terrain / mesh floor / altitude sampling

**Owner-facing purpose:** Terrain / mesh floor / altitude sampling.
**Current Hub / entrypoints:** `CameraController / VisualFoundation`; [`runtimes/earth-runtime/core/CameraController.mjs`](../../runtimes/earth-runtime/core/CameraController.mjs); [`runtimes/earth-runtime/core/VisualFoundation.mjs`](../../runtimes/earth-runtime/core/VisualFoundation.mjs)
**Pinned upstream:** Bounded cache/batching, datum-aware ellipsoidal samples and geoid-only degraded fallback; optional photoreal mesh floor sampling informs entity/camera placement. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** HUB IMPLEMENTATION JUSTIFIED / HIGH.
**Runtime status / evidence:** Code exists; Potential grounded-aircraft/camera limitations, not directly proven as a current defect. **Missing/different from upstream:** Terrain batch service/groundFloor, mesh floor resolution and provenance; Hub camera uses globe.getHeight or 0 fallback without a terrain-height service. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Bounded current/dormant/ellipsoid scope; global terrain/3D qualification absent, not implied by optional code.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Service/datum attribution and no false ellipsoidal-ground claim. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** WRAP UPSTREAM; C6 grounding depends on real terrain/provider qualification. Do not copy a geoid fallback as terrain evidence. Proposed target: C6.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C6_GLOBAL_MAPPING_SPEC.md); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD5/OD6.

## basemaps — Global imagery / base-map switching

**Owner-facing purpose:** Global imagery / base-map switching.
**Current Hub / entrypoints:** `ImageryController / boundImageryRequests / VisualFoundation`; [`runtimes/earth-runtime/core/ImageryController.mjs`](../../runtimes/earth-runtime/core/ImageryController.mjs); [`runtimes/earth-runtime/core/imageryRequests.mjs`](../../runtimes/earth-runtime/core/imageryRequests.mjs); [`runtimes/earth-runtime/core/VisualFoundation.mjs`](../../runtimes/earth-runtime/core/VisualFoundation.mjs)
**Pinned upstream:** Five selectable stacks: Google3D, Bing Aerial, Bing Labels, Esri World Imagery and OSM. MapSourceController switches asynchronously with generations/cache/credits and keyless fallback. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** HUB IMPLEMENTATION JUSTIFIED / MEDIUM.
**Runtime status / evidence:** Code exists; Reference keyless Esri has local detail; Hub public imagery is regional HD, not uniform global HD. **Missing/different from upstream:** Provider stack tray/global HD. Hub qualified CONUS USGS with GIBS/NaturalEarth coarse globe fallback and bounded requests. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Bounded current/dormant/ellipsoid scope; global terrain/3D qualification absent, not implied by optional code.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Hosted-provider entitlement/fair use; keyless successful tile is not an unlimited license. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN C6; HD qualification deliberately chose public source/coverage bounds. Global imagery account/licensing and scale remain owner decision. Proposed target: C6.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C6_GLOBAL_MAPPING_SPEC.md); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD5/OD6.

## photorealistic-3d — Photorealistic 3D tiles

**Owner-facing purpose:** Photorealistic 3D tiles.
**Current Hub / entrypoints:** `VisualFoundation / admitDisplayConfig`; [`runtimes/earth-runtime/core/VisualFoundation.mjs`](../../runtimes/earth-runtime/core/VisualFoundation.mjs); [`runtimes/earth-runtime/core/displayConfig.mjs`](../../runtimes/earth-runtime/core/displayConfig.mjs)
**Pinned upstream:** BYOK Google direct or ion-hosted Google3D, startup-route selection, tile credits and fallback; photoreal mesh provides ground while globe terrain is mode-dependent. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** HUB IMPLEMENTATION JUSTIFIED / HIGH.
**Runtime status / evidence:** Code exists; Reference unavailable without credentials; Hub no active photoreal tiles. **Missing/different from upstream:** No attested configured photoreal provider; dormant ion asset path is not live visual qualification. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Bounded current/dormant/ellipsoid scope; global terrain/3D qualification absent, not implied by optional code.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Google billing/ToS/cache/display attribution; ion entitlement does not erase Google data terms. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** WRAP UPSTREAM; C6 provider/billing/security/coverage gate; keep Hub Viewer and wrap map/tileset helpers instead of full application. Proposed target: C6.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C6_GLOBAL_MAPPING_SPEC.md); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD5/OD6.

## 3d-buildings — Dedicated 3D buildings

**Owner-facing purpose:** Dedicated 3D buildings.
**Current Hub / entrypoints:** `VisualFoundation`; [`runtimes/earth-runtime/core/VisualFoundation.mjs`](../../runtimes/earth-runtime/core/VisualFoundation.mjs)
**Pinned upstream:** Photoreal tiles contain built structures. No dedicated pinned OSM-buildings factory was found; do not invent one. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** HUB IMPLEMENTATION JUSTIFIED / LOW.
**Runtime status / evidence:** Code exists; Optional code is dormant, not implemented active capability. **Missing/different from upstream:** No active configured buildings asset; upstream dedicated helper absent. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Bounded current/dormant/ellipsoid scope; global terrain/3D qualification absent, not implied by optional code.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Specific building dataset license/attribution and tile endpoint/asset approval. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN C6; C6 may justify standard Cesium/approved ion buildings directly; full upstream app supplies no magic missing building hook. Proposed target: C6.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C6_GLOBAL_MAPPING_SPEC.md); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD5/OD6.

## labels-geocoding — Map labels / places / geocoding

**Owner-facing purpose:** Map labels / places / geocoding.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Label imagery plus named-place chain Google Geocoding→Photon→Nominatim, coordinates/presets and bounded request coalescing; Google context/nearby places separate. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Google terms/billing; Nominatim one-request-per-second app-wide and no public autocomplete; ODbL/Photon fair use. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** WRAP UPSTREAM; Retained future capability; no feature-specific integration decision has been approved. Proposed target: C6.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C6_GLOBAL_MAPPING_SPEC.md); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD5/OD6.

## annotations — Annotations / region resolution

**Owner-facing purpose:** Annotations / region resolution.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Annotation engine resolves source-backed administrative/natural/nearby/place geometries; renderer-owned data source and screen/terrain hybrid labels. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Mixed geodata licenses, source truth, bounding and asset manifests; no upstream bundled dataset import by default. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## drawing — Pointer drawing / line / polygon / ellipse

**Owner-facing purpose:** Pointer drawing / line / polygon / ellipse.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** initDrawTool owns pointer arbitration, vertices, shape previews, region/height settlement and cleanup against caller-owned Viewer/annotations. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** PORT UPSTREAM MINIMALLY; Package exposes full app tools composition but not a dedicated pinned draw-tool subpath; investigate generic bounded export rather than copy whole app. Proposed target: G Immersive UX.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** Future phase/package approval; current justified behavior retained.

## measurement — Standalone measurement tools (absent)

**Owner-facing purpose:** Standalone measurement tools (absent).
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Drawing geometry and directions distance exist; no dedicated pinned measurement tool registration/export found. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** OWNER DECISION REQUIRED; Absence is explicit. Do not count directions distance as a fully implemented measuring instrument. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** Future phase/package approval; current justified behavior retained.

## search — Layer/object search

**Owner-facing purpose:** Layer/object search.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Place and layer-query search combines coordinate/preset/geocoder/layer capabilities and freshness-aware identity; no renderer-independent science replacement. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** WRAP UPSTREAM; Hub astronomy canonical identities remain Hub-owned; optional Earth contact search can wrap pure search/layer APIs. Proposed target: C6.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C6_GLOBAL_MAPPING_SPEC.md); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD5/OD6.

## scenes-director — Scenes / director / replay / data packs

**Owner-facing purpose:** Scenes / director / replay / data packs.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Versioned scene documents and authored shots, cancelable camera/layer playback, clock/seek, bounded pack validation/import, project export and scene-share bundles. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Each authored pack retains source rights; exclude historical restricted bundles and fabricated telemetry. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** WRAP UPSTREAM; Retained future capability; no feature-specific integration decision has been approved. Proposed target: G Immersive UX.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## tracking-cockpit — Cockpit / follow / instruments / local info

**Owner-facing purpose:** Cockpit / follow / instruments / local info.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Follow camera/first-person cockpit with subject framing, display portals, local point-weather/news, instruments and source-dependent track actions. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Dependent data/model rights and presentational cockpit semantics; no physical-flight instrumentation certification. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** WRAP UPSTREAM; Current Hub CameraController tracks satellites only; do not import upstream product chrome or duplicate Hub universal state. Proposed target: G Immersive UX.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## share-export — Share state / project export / screenshot

**Owner-facing purpose:** Share state / project export / screenshot.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Versioned URL state including layer options and camera; restore generations/cancellation; SceneDirector JSON project/run export. preserveDrawingBuffer enables capture but is not itself a qualified screenshot/export product. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Imagery screenshots and data-pack redistribution retain each provider/asset terms. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** WRAP UPSTREAM; Use bounded codecs/documents where they match Hub contracts; portable cross-engine selection must stay Hub-owned. Proposed target: G Immersive UX.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## camera-navigation — Earth camera / wheel / focus / cancellation

**Owner-facing purpose:** Earth camera / wheel / focus / cancellation.
**Current Hub / entrypoints:** `CameraController`; [`runtimes/earth-runtime/core/CameraController.mjs`](../../runtimes/earth-runtime/core/CameraController.mjs)
**Pinned upstream:** Cancelable navigation owner, terrain-aware routes and camera verbs; public installTrackpadPinchZoom helper disposes bindings. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** HUB IMPLEMENTATION JUSTIFIED / MEDIUM.
**Runtime status / evidence:** Code exists; Post-merge real Sky canvas wheel passed; that does not qualify arbitrary Earth pinch/terrain routes. **Missing/different from upstream:** Upstream route flight/cockpit ownership and Ctrl-wheel relay; Hub own wheel, keyboard interruption, focus, stopTracking and bounds. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Existing bounded implementation/helper; no additional live defect proven. Scope/qualification differences retained.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** KEEP CURRENT; Hub bridge/canonical selection/one-renderer state require owned control. No current Earth wheel failure established; Sky wheel regression was separately fixed. Proposed target: C5.7-E regression only; preserve current bounded implementation.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** Future phase/package approval; current justified behavior retained.

## selection-context — Selection / source facts / canonical intent

**Owner-facing purpose:** Selection / source facts / canonical intent.
**Current Hub / entrypoints:** `SelectionStore / RuntimeBridge / validateMessage / useWorkspaceRuntime`; [`runtimes/earth-runtime/core/SelectionStore.mjs`](../../runtimes/earth-runtime/core/SelectionStore.mjs); [`runtimes/earth-runtime/core/RuntimeBridge.mjs`](../../runtimes/earth-runtime/core/RuntimeBridge.mjs); [`packages/runtime-protocol/index.mjs`](../../packages/runtime-protocol/index.mjs); [`frontend/src/features/workspace/workspaceRuntimeAdapter.ts`](../../frontend/src/features/workspace/workspaceRuntimeAdapter.ts)
**Pinned upstream:** Upstream renderer-local selected/tracked entity contexts and active-source lifecycle; metadata synchronizes layer cards and voice/search. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** HUB IMPLEMENTATION JUSTIFIED / LOW.
**Runtime status / evidence:** Code exists; No current defect proven; source unavailable preserves explicitly last-known selected facts. **Missing/different from upstream:** Upstream application context store deliberately not used as universal state. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Existing bounded implementation/helper; no additional live defect proven. Scope/qualification differences retained.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** KEEP CURRENT; Hub canonical string identities, bounded DTO bridge and owned product state are architectural requirements. Proposed target: C5.7-E regression only; preserve current bounded implementation.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** Future phase/package approval; current justified behavior retained.

## lifecycle-rendering — Viewer lifetime / layer cleanup / renderer isolation

**Owner-facing purpose:** Viewer lifetime / layer cleanup / renderer isolation.
**Current Hub / entrypoints:** `RuntimeLifecycle / LayerRegistry / EarthRuntime / RuntimeBridge`; [`runtimes/earth-runtime/core/RuntimeLifecycle.mjs`](../../runtimes/earth-runtime/core/RuntimeLifecycle.mjs); [`runtimes/earth-runtime/core/LayerRegistry.mjs`](../../runtimes/earth-runtime/core/LayerRegistry.mjs); [`runtimes/earth-runtime/core/EarthRuntime.mjs`](../../runtimes/earth-runtime/core/EarthRuntime.mjs); [`runtimes/earth-runtime/core/RuntimeBridge.mjs`](../../runtimes/earth-runtime/core/RuntimeBridge.mjs); [`packages/runtime-protocol/index.mjs`](../../packages/runtime-protocol/index.mjs)
**Pinned upstream:** Application AbortSignal/disposer stack, LayerLifecycle enable/disable/destroy and resource cleanup; scene remains standalone app-owned upstream. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** HUB IMPLEMENTATION JUSTIFIED / LOW.
**Runtime status / evidence:** Code exists; Fresh Sky→Earth→Sky smoke passed with one active renderer and no relevant page exceptions. **Missing/different from upstream:** Entire app composition/chrome/source singletons are excluded. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Existing bounded implementation/helper; no additional live defect proven. Scope/qualification differences retained.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** KEEP CURRENT; Current authority explicitly requires Hub-owned Viewer, source containment and active-only iframe lifetime. This is justified, not an excuse to rewrite bounded feature modules. Proposed target: C5.7-E regression only; preserve current bounded implementation.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** Future phase/package approval; current justified behavior retained.

## regional-news — Regional briefing / headlines

**Owner-facing purpose:** Regional briefing / headlines.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Location cell, public-domain physical-region resolution, Google News RSS primary and GDELT fallback; source-labelled locality matches, not verified incidents. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Google News personal/noncommercial terms; linked publisher copyright; approve/disallow or replace source explicitly. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** OWNER DECISION REQUIRED; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## voice-ai — Voice / AI actions / cost tracking

**Owner-facing purpose:** Voice / AI actions / cost tracking.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Optional paid realtime provider, typed action schemas, session/abort/cost controls and UI feedback; app-specific commands/data sources. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** DO NOT USE / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Owner-authorized provider/cost/model/session policy required; no paid credentials or calls used. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** OWNER DECISION REQUIRED; Do not create a competing Hub AI product or initiate paid provider work under this audit. Proposed target: BLOCKED.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## geographical-outlines — Geographic / administrative outlines

**Owner-facing purpose:** Geographic / administrative outlines.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Offline licensed polygons plus bounded provider-backed admin outline resolution, point-in-ring and simplified renderer geometry. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Public-domain packs may be useful but current artifact forbids bundled upstream local_data; use owned ingestion/manifest, not arbitrary bundle bypass. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** ADD IN LATER EARTH PHASE; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## asset-models — Aircraft / event / 3D model assets

**Owner-facing purpose:** Aircraft / event / 3D model assets.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Model type selection, visual anchor, distance/proximity LOD and terrain-ground alignment; assets resolved separately from JS code. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Per-asset license/provenance must be manifested; MIT source does not license model payloads. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** PROVIDER RESEARCH REQUIRED; Retained future capability; no feature-specific integration decision has been approved. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD6 plus a future bounded scope/provider decision.

## street-level-current — Current-main Mapillary street-level imagery

**Owner-facing purpose:** Current-main Mapillary street-level imagery.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Absent at pin; current main adds provider-neutral street-level/Mapillary source, renderer, panel and server subpaths. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: GATED. Token, SDK/imagery terms, credits, privacy and full upstream-update qualification required; no provider calls made. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** PROVIDER RESEARCH REQUIRED; Retained future capability; no feature-specific integration decision has been approved. Proposed target: C6.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C6_GLOBAL_MAPPING_SPEC.md); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD5/OD6.

## immersive-ar — AR / fullscreen / immersive presentation

**Owner-facing purpose:** AR / fullscreen / immersive presentation.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Standalone immersive display controls and AR-related UI affordance. UI presence does not prove physical-device AR compatibility. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** OWNER DECISION REQUIRED; Hub owns immersive product shell; this audit did not physically qualify AR or authorize an AR dependency. Proposed target: G Immersive UX.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** Future phase/package approval; current justified behavior retained.

## tools-current — Current-main query tools / MCP / globe panel

**Owner-facing purpose:** Current-main query tools / MCP / globe panel.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** Absent as public bounded tool catalog at pin; current main separates typed source queries from voice/MCP/globe-panel surfaces, source freshness/limits and provider-neutral services. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** OWNER DECISION REQUIRED; Potential bounded API patterns; do not substitute these tools for canonical FastAPI astronomy contracts or start a competing Hub AI service. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** Future phase/package approval; current justified behavior retained.

## view-current — Current-main portable Earth view codec

**Owner-facing purpose:** Current-main portable Earth view codec.
**Current Hub / entrypoints:** `NOT IMPLEMENTED`; No Hub feature source/control.
**Pinned upstream:** New pure createView/viewToParams/viewFromParams/viewUrl functions for camera, style, map, annotations and follow; this export is a state codec, not a Viewer constructor. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** UNKNOWN / N/A — no adapted implementation.
**Runtime status / evidence:** Omitted/not implemented in Hub; upstream availability or explicit absence is not runtime qualification. No corresponding Hub control. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Deferred/absent/unknown; not a regression or automatic feature authorization.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** WRAP UPSTREAM; Useful adapter candidate; Hub universal state/selection remains authoritative, validate codec rounding/clamping and version semantics before reuse. Proposed target: G Immersive UX.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** Future phase/package approval; current justified behavior retained.

## helper-aircraft-normalization — Reused aircraft normalization helpers

**Owner-facing purpose:** Reused aircraft normalization helpers.
**Current Hub / entrypoints:** `createFlightsAdapter (upstream normalizeAdsbLolPointResponse / normalizeOpenSkyAircraft)`; [`runtimes/earth-runtime/layers/GodsEyeFlightsAdapter.mjs`](../../runtimes/earth-runtime/layers/GodsEyeFlightsAdapter.mjs)
**Pinned upstream:** normalizeAdsbLolPointResponse and normalizeOpenSkyAircraft directly imported/executed unchanged. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** REUSE EXACTLY / LOW.
**Runtime status / evidence:** Code exists; Reuse alone does not guarantee provider or display parity. **Missing/different from upstream:** No helper rewrite. Parent transport/filter/display losses remain in flights. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Existing bounded implementation/helper; no additional live defect proven. Scope/qualification differences retained.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** KEEP CURRENT; Direct imports verified in source and qualified module-policy. Proposed target: C5.7.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#c57-a--aircraft-operational-recovery); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD1.

## helper-earthquake-depth — Reused earthquake depth color

**Owner-facing purpose:** Reused earthquake depth color.
**Current Hub / entrypoints:** `createEventAdapter (upstream depthColor)`; [`runtimes/earth-runtime/layers/EventLayers.mjs`](../../runtimes/earth-runtime/layers/EventLayers.mjs)
**Pinned upstream:** depthColor is imported and used unchanged; Hub handles unknown depth explicitly. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** REUSE EXACTLY / LOW.
**Runtime status / evidence:** Code exists; No helper defect found. **Missing/different from upstream:** No helper loss; parent event layer differs. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Existing bounded implementation/helper; no additional live defect proven. Scope/qualification differences retained.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** KEEP CURRENT; Public exported helper retained. Proposed target: C5.7.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** Future phase/package approval; current justified behavior retained.

## helper-fire-anchor — Reused perimeter focus anchor

**Owner-facing purpose:** Reused perimeter focus anchor.
**Current Hub / entrypoints:** `createEventAdapter (upstream perimeterAnchorDegrees)`; [`runtimes/earth-runtime/layers/EventLayers.mjs`](../../runtimes/earth-runtime/layers/EventLayers.mjs)
**Pinned upstream:** perimeterAnchorDegrees directly imported and used unchanged for the geometric focus anchor. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** REUSE EXACTLY / LOW.
**Runtime status / evidence:** Code exists; No helper defect found. **Missing/different from upstream:** No helper loss; focus anchor is not claimed incident location. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Existing bounded implementation/helper; no additional live defect proven. Scope/qualification differences retained.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** KEEP CURRENT; Public helper preserves geometry behavior. Proposed target: Later Earth capability phase.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#common-work-package-contract); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** Future phase/package approval; current justified behavior retained.

## helper-satellite-source — Wrapped satellite acquisition helper

**Owner-facing purpose:** Wrapped satellite acquisition helper.
**Current Hub / entrypoints:** `createSatellitesAdapter (upstream createSatelliteSource / celestrakTleUrl)`; [`runtimes/earth-runtime/layers/GodsEyeSatellitesAdapter.mjs`](../../runtimes/earth-runtime/layers/GodsEyeSatellitesAdapter.mjs)
**Pinned upstream:** createSatelliteSource and celestrakTleUrl reused; injected fetchImpl replaces transport and force-selects stations. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** WRAP / HIGH.
**Runtime status / evidence:** Code exists; Fresh satellites unavailable in both environments. **Missing/different from upstream:** Transport ignores group requested by source. No upstream cache/header/stale transport; parent populations also reduced. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Existing bounded implementation/helper; no additional live defect proven. Scope/qualification differences retained.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** WRAP UPSTREAM; Fetch seam is appropriate; stations narrowing is temporary C2 scope, browser CORS assumption is not proven. Proposed target: C5.7.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#c57-b--satellite-population-and-tracking-correctness); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** OD2.

## helper-weather-normalization — Reused point-weather normalization

**Owner-facing purpose:** Reused point-weather normalization.
**Current Hub / entrypoints:** `createWeatherAdapter (upstream normalizeRegionalWeather / weatherCodeLabel)`; [`runtimes/earth-runtime/layers/GodsEyeWeatherAdapter.mjs`](../../runtimes/earth-runtime/layers/GodsEyeWeatherAdapter.mjs)
**Pinned upstream:** normalizeRegionalWeather and weatherCodeLabel directly imported and executed unchanged. [Exact modules/functions/stages](../audits/GODS_EYE_IMPLEMENTATION_TRACES_2026-10-05.md).
**Current relationship / risk:** REUSE EXACTLY / LOW.
**Runtime status / evidence:** Code exists; Fresh modeled point rendered successfully. **Missing/different from upstream:** No helper rewrite; request subset and facts differ. [Dated observations and qualification](../audits/GODS_EYE_AUDIT_VALIDATION_HANDOFF_2026-10-05.md).
**Bug versus scope versus unverified:** Existing bounded implementation/helper; no additional live defect proven. Scope/qualification differences retained.
**Provider/credential/license/distribution:** Audit provider/data gate: NO AUDIT FLAG. Provider ledger applies; availability is separate from rights. [Per-source constraints](../audits/GODS_EYE_PROVIDER_FORENSICS_2026-10-05.md); source code MIT is separate.
**Remediation pattern / phase:** KEEP CURRENT; Source normalized UTC, unknown values retained as unavailable. Proposed target: C5.7.
**Acceptance required:** [Applicable package/common source/error/cleanup/artifact gates](C5_7_EARTH_CORE_RECOVERY_SPEC.md#c57-c--weather-usability); known fixture counts plus actual useful rendering/source success/coverage when applicable. For deferred/absent capability, create its own owner-approved bounded spec first; shared gates do not authorize it.
**Unresolved owner decision:** Future phase/package approval; current justified behavior retained.
