# Independent Sky and ORAS Earth runtimes

The React Hub owns shell and serial runtime intent/session lifetime. SWE owns its
scene/math. `earth-runtime` owns its Cesium Viewer and layer/UI lifecycle; God's
Eye is an immutable external feature dependency, never the application.

## Source and builds

God's Eye pin: `e7707d9a0f34d9fbffc300023c319f95caa5be30`; Node 24.14.0 image
is digest-pinned in `scripts/runtime/build_owned_earth.sh`. Its npm lock resolves
Cesium 1.138.0, satellite.js 6.0.2 and Vite 6.4.3. Public package exports only;
build rejects app/startup/local_data/model/event imports. External source remains
clean; dependency installation affects ignored node_modules only. Earth inputs,
artifact files/hashes and selected exports are recorded in external `release.json`.
No bulk artifact is committed or baked into an image.

```bash
scripts/runtime/build_owned_earth.sh
python3 scripts/runtime/record_runtime_versions.py /var/tmp/oras-cesium/earth-candidate
ORAS_EARTH_ARTIFACT_DIR=/var/tmp/oras-cesium/earth-candidate COMPOSE_BAKE=false docker compose up -d --build frontend backend earth-runtime
```

Use an immutable artifact directory named by its verified SHA for qualification
and deployment. Metadata recording verifies every artifact file and aggregate.
The host rejects Earth provenance that differs from the lock. Public route
`/earth`, standalone `/earth-runtime/`; static service exposes only runtime files,
with no upstream provider aliases. FastAPI aircraft endpoint remains `/api/earth/aircraft`.

Both development and production Compose define the static Earth service. Production
uses the repository-root frontend build, with shared lock/protocol/adapter inputs.
Without the artifact variable, backend-only and standalone Sky commands still parse.
Starting Earth requires an existing mounted directory (`create_host_path: false`),
so missing artifacts fail rather than becoming empty generated directories.
For a separately authorized remote deployment, provision the verified immutable
artifact externally first and pass its absolute remote path as
`ORAS_EARTH_ARTIFACT_DIR` to `scripts/deploy-remote-prod.sh`; the script checks
presence before deployment mutations and preserves the path in `.env.prod`.
No remote deployment was executed during this qualification.

Sky reconstruction uses `build_current_sky.sh` against a recorded comparison
anchor plus 26 hash-checked overlay inputs. Historical import SHA is unknown.
It preserves ORAS native science patches. The Emscripten builder identity must
match the lock; native WASM was reproduced byte-identically. A separate clean
reconstruction is required before any Sky promotion; the script never promotes.
For the bridge shell, run `integrate_sky_bridge.py` on the external reconstruction
then repeat the pinned Node web build, record/hash and run exact-link/native proof.
Sky entry/plugin stays outside vendor ownership; `orasRuntime` is its qualified
Vue plugin name (upstream loader requires word characters).

## Earth layer boundary

Definitions own stable id/title/category/capabilities/attribution and lazy `load`.
Instances implement initialize(context), enable, disable, optional update, destroy.
Selection is viewer-native and metadata-only in ORAS UI. Context contains only
Earth-local Viewer, camera, observer/time readers, selection, attribution, provider
status and an abort signal. No layer creates a Viewer or app singleton.
`LayerRegistry` cancels stale lazy activations; `PollingLayer` owns one request and
one completion-scheduled timer. Disable aborts/clears; destroy is idempotent.
Provider readiness is independent of shell/Viewer readiness. Rendering unknown
altitude/epoch/coordinates is forbidden. No historical live-feed simulation.

## Current provider and license boundary

- Aircraft: bounded FastAPI adsb.lol 100-nautical-mile transport, coarse-point
  success/failure cache, 2 MB limit, typed field subset; exported upstream
  normalization. Render only fresh, valid identity/position/geometric-altitude rows.
  Source API is ODbL 1.0; endpoint and produced view retain notice/source access.
  No local persistent database/repackaged dataset is distributed.
- Satellites: browser CORS-safe CelesTrak stations using exported source/URL helpers;
  checksum/identity/epoch guards and satellite.js SGP4 wall-clock visualization.
  Seven-day TLE admission bound; explicit epoch and independent Earth visualization,
  no claim of ORAS authority, cross-engine consistency or historical simulation.
- Weather: browser CORS-safe Open-Meteo point conditions, upstream regional
  normalization guarded against null coercion; modeled conditions, timestamp
  and LIVE_ONLY label. Free API is non-commercial; data CC BY 4.0. Commercial
  deployment needs a separately qualified endpoint/account; no credentials shipped.

Primary terms: [adsb.lol API](https://www.adsb.lol/docs/open-data/api/),
[Open-Meteo](https://open-meteo.com/en/terms),
[CelesTrak](https://celestrak.org/NORAD/elements/).
Code MIT does not license data/provider/assets. No bundled God's Eye datasets,
models/events or restricted dynamic JSON. God’s Eye MIT and dependency notices
ship in the artifact. Packaged Natural Earth imagery is public domain; Cesium
Apache notices and logo/assets remain. Ellipsoid terrain is explicit, not measured.
No Node provider service is used.

Capability ledger: `integrations/gods-eye-capabilities.json`, regenerated from the
pinned catalog and all 148 exports with `generate_capability_ledger.py`. Full
feature families remain planned or blocked, rather than being deleted. UI-heavy
controllers require adapters/hooks; only clean helpers are imported now.

## Isolation and cleanup

Protocol 1.0 uses validated parent/source/origin/nonce/generation handshake then
MessageChannel; port commands/results preserve the session and bounded DTO schema.
Same origin grants no implicit message trust. Hub state persists only bounded
serializable intent, never ports/renderer objects. Earth time is controlled;
feeds remain LIVE_ONLY. No Date monkeypatch.

Desktop and mobile are serial: graceful destroy, invalidate/close, remove frame,
then mount the next. Earth aborts polling, disposes layers/entities/listeners,
selection, tracking, camera work, attribution, Viewer and bridge. Pending imports
cannot activate after disable/destroy. Document removal is final fail-safe cleanup.
Failed runtime can retry without provider success. No prewarm, cross-engine ISS
handoff, planets or astronomy-specific extension phase in this foundation.
