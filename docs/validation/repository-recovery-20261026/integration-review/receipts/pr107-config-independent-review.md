# Independent review: PR107 Planet delivery/science configuration correction

Reviewed the uncommitted diff against `56f5645aac51d0d4bf16508dd85fba77e76db43c` in `/home/rocco/Astronomy-Hub/.worktrees/repository-recovery-20261026`, branch `recovery/reconcile-20261026`. Read-only reviewer: no edits to repository, application, data, Git or containers. Separate focus-disposal changes visible in status were excluded from this assignment.

## Verdict

No new actionable P0/P1/P2 finding in the six reviewed configuration/test files. The correction connects existing qualified Moon and planetary science inputs to canonical dev/production delivery without changing renderer source, artifact/source pins, data or science logic. Source/config review and Compose model tests pass. Docker HTTP/browser qualification is owned by the parent run and not claimed by this review.

Reviewed files:

- `docker-compose.yml`
- `docker-compose.prod.yml`
- `frontend/vite.config.mjs`
- `frontend/nginx.conf`
- `integrations/planet-runtime/nginx.conf` (new)
- `tests/validation/test_planet_deployment.py` (new, final corrected `.get(..., False)` version)

## Identity, boundaries and failure behavior

The separate `planet-runtime` nginx service serves `/runtime/index.html` at `/planet-runtime/`; its asset prefix rewrites to the qualified artifact root and uses `try_files $uri =404`. It does not serve the Hub index on a missing JS/source-manifest path. `/planet-data/` aliases only its dedicated read-only lunar-surface directory. Other service routes return404. Standard nginx URI normalization and fixed alias/root paths do not introduce an application-controlled filesystem destination. nginx.conf SHA256: `9ccd7606bddb2c24240ac698d2bf0c03a0fea18466b7a39b768f2284eac7f155`.

Both Compose variants bind the planet artifact at `/runtime` and lunar surface at `/planet-data` read-only with explicit `bind.create_host_path: false`; the nginx configuration file uses the same guarded bind. Missing host source directories fail service creation rather than silently creating empty scientific/artifact directories. Existing directory contents are not automatically qualified by this flag; artifact/data installation and hashes remain necessary deployment prerequisites. The service only exposes8878 internally, using the already established frontend nginx image family rather than embedding science data in a new image.

The new backend variables match actual loader contracts exactly: `ORAS_LUNAR_ORIENTATION_DIR=/runtime/oras-lunar-orientation` (`backend/app/services/planet_view.py:25-26`) and `ORAS_PLANETARY_SYSTEMS_DIR=/runtime/oras-planetary-systems` (`backend/app/services/horizons_systems.py:22-23`). Both point to separate read-only binds with host-path creation disabled, in both dev and production. Existing source hashes, finite coverage, center/frame validation and controlled unavailable behavior remain in the backend loaders; this patch does not substitute data or infer positions.

Moon source contract remains `/planet-data/moon-wac.png`, center301, LROC source pixel conversion. Read-only SHA256 of the existing qualified source at `r4-a-planet-view-1/data/runtime-packs/lunar-surface/release/moon-wac.png` is `218ddb0ed75af907dd0d8c6a1e5a41a6628a9654803a0b88fa352b17ca90c3d8`, equal to `runtimes/planet-runtime/moon-source-manifest.json.runtime_sha256`.

Dev Vite proxies both `/planet-runtime/` and `/planet-data/` to `ORAS_PLANET_PROXY_TARGET`, configured as `http://planet-runtime:8878`. This applies to both dev and preview because both use the existing `apiProxy` object. Production frontend nginx forwards the same two prefixes intact to `planet-runtime:8878`. These prefix matches precede the generic Hub SPA route. Unknown runtime resources reach the delivery service's404 rather than nested Hub HTML.

Shared Cesium remains `/earth-runtime/cesium/`: `runtimes/planet-runtime/vite.config.mjs` explicitly defines that base, existing `runtimes/earth-runtime/nginx.conf` serves Earth-prefixed static files from its retained artifact, and existing frontend Earth proxy remains unchanged. The patch does not put Cesium assets in the planet directory or rebuild/change Earth to deliver Moon. `git diff --name-only HEAD -- runtimes integrations/renderers.lock.json frontend/public/runtime-versions.json` produced no paths at review time.

The nginx healthcheck verifies the planet entry HTML is present, not complete renderer/data identity or downstream Earth Cesium availability. That limited health meaning is acceptable for this delivery service; it must not be described as end-to-end science/browser qualification.

## Independent verification

```text
python3 -B -m unittest discover -s tests/validation -p test_planet_deployment.py -v
sha256sum integrations/planet-runtime/nginx.conf
sha256sum /home/rocco/Astronomy-Hub/.worktrees/r4-a-planet-view-1/data/runtime-packs/lunar-surface/release/moon-wac.png
git diff --check
git diff --name-only HEAD -- runtimes integrations/renderers.lock.json frontend/public/runtime-versions.json
```

Final unittest output:2 tests run, `OK`; both Compose configurations parsed through the Docker Compose CLI without creating services. Hashes above. Whitespace check exit0; renderer/source-pin diff empty. The first test invocation, before the parent correction landed, reported4 subtest errors because Compose omits false `create_host_path` fields from normalized JSON. Source YAML already explicitly specified false. The final tests correctly interpret omitted normalized false; no missing-bind runtime issue is inferred from those initial KeyErrors. Both initial and final results were reported to parent.

Remaining runtime requirements for parent: isolated actual nginx service startup/config syntax; `/planet-runtime/` HTML and referenced bundle/source manifest identity; unknown runtime/data404 rather than Hub HTML; PNG bytes/hash; shared `/earth-runtime/cesium/` asset response; endpoint/backend science source availability; absence/missing source behavior as feasible. A public rollout, runtime rebuild, production Compose replacement, provider qualification and release acceptance are outside this independent source/config review.

Loaded context: same declared Default review context and explicitly authorized recovery/licensing documents as `/tmp/pr107-data-source-review.md`; this follow-up required no additional governing docs. Repository files changed by reviewer: none. Commit/push/PR operations: none. Recommended next task: retain parent Docker validation results beside this review and qualify the exact final combined correction head before any integration decision.
