# PR107 bounded backend/API review

Reviewed branch `recovery/reconcile-20261026`, exact HEAD `56f5645aac51d0d4bf16508dd85fba77e76db43c`, against main `9a03d8260a529f5858c5c3298cbb9d32b721daeb`. Initial and final `git status --short` and `git diff --check` produced no output. No repository files were modified by this reviewer; no commit, push, PR, container start, deployment or source-data mutation occurred.

## Context

Default Mode under explicit independent recovery review assignment. Root/backend AGENTS; CORE_CONTEXT, LIVE_SESSION_BRIEF and CONTEXT_MANIFEST; YAML-enumerated review-pack indexes18–35: SYSTEM_VALIDATION_SPEC, UNIFIED_UNIVERSE_ARCHITECTURE, GODS_EYE_SWE_COMPATIBILITY_STUDY, UNIFIED_RUNTIME_COMPATIBILITY_EVIDENCE, CESIUM_EARTH_PHASE_C_EVIDENCE, EARTH_CAPABILITY_EXPANSION_EVIDENCE, EARTH_HD_MAPPING_EVIDENCE, LOCAL_DEVELOPMENT_REPAIR_EVIDENCE, UNIFIED_WORKSPACE_IMPLEMENTATION_EVIDENCE, ARCHITECTURE_OVERVIEW, ENGINE_SPEC, ENGINE_CATALOG, STACK_OVERVIEW, OBJECT_MODEL, DATA_CONTRACTS, TONIGHT_CONTRACT, PROJECT_STATE, FEATURE_EXECUTION_MODEL. Current requirements and relevant bounded sections were loaded; long historical evidence documents were sampled, not independently requalified. Explicit recovery README and p0-satellite-usability README and their command/preview receipts were consulted. No broad /docs scan. Other pack portions are assigned to parent/other reviewer. Stale R3-A-only text is superseded by the explicit review scope; no future work is activated.

## Finding B1 — P2: canonical backend deployment omits new science sources

Location: `backend/app/main.py:130-131` introduces Planet View/system routers; source defaults at `backend/app/services/planet_view.py:25-26` and `backend/app/services/horizons_systems.py:22-23` resolve below `/app/data`. `backend/Dockerfile:3-8` copies backend/scripts/site config only. Neither backend environment/mount list in docker-compose.yml:6-19 nor docker-compose.prod.yml:6-17 configures or mounts lunar-orientation or planetary-systems releases. Thus building/running the documented canonical Compose runtime makes qualified Moon and outer-system requests unavailable, despite source packs existing on the host. The custom recovery preview supplies these missing mounts/env vars separately (receipts/preview-receipt.json), masking the deployment contract gap.

Direct read-only service proof (Python process cwd changed to /tmp, equivalent to image lacking relative data directory; existing DE442s source retained through absolute env):

```
Moon EphemerisUnavailableError Qualified local lunar orientation is unavailable
Mars system EphemerisUnavailableError Qualified finite Horizons source pack is unavailable
catalog [('earth', 'qualified'), ('mars', 'unavailable'), ('jupiter', 'unavailable'), ('saturn', 'unavailable'), ('uranus', 'unavailable'), ('neptune', 'unavailable')]
```

Then setting ORAS_LUNAR_ORIENTATION_DIR to the preserved qualified pack and ORAS_PLANETARY_SYSTEMS_DIR to the candidate's source-backed pack in that same process yielded:

```
mounted Moon 301
mounted Mars system Mars center (499)
mounted catalog [('earth', 'qualified'), ('mars', 'qualified'), ('jupiter', 'qualified'), ('saturn', 'qualified'), ('uranus', 'qualified'), ('neptune', 'qualified')]
```

Correction: add read-only fail-closed binds and corresponding env paths for both source releases to both canonical Compose backends; preserve external packs and avoid image baking. Suggested ORAS_LUNAR_ORIENTATION_HOST_DIR default ./data/runtime-packs/lunar-orientation/release -> /runtime/oras-lunar-orientation; ORAS_PLANETARY_SYSTEMS_HOST_DIR default ./data/runtime-packs/planetary-systems/release -> /runtime/oras-planetary-systems. Set service env variables to these container targets. Parent owns combined runtime/config correction; frontend Moon routing is reviewed separately.

## Reviewed behavior without additional substantiated P0/P1/P2 findings

Inspected all backend/app changes and owning tests, plus .github/workflows/repository-integrity.yml and native-satellite-recovery.yml. Solar positions disclose physical centers versus system barycenters, ICRF/heliocentric origin, geometric corrections and source/shape/orientation limits. Earth/Moon vectors use399/301; outer-system moon packs use actual parent centers; Horizons time conversion and inward millisecond coverage stay distinct from DE442s. Existing satellite release/parser exception boundaries use fixed public reasons. Repository-integrity workflow no longer has npm cache or workflow_dispatch; native recovery remains isolated with read-only contents permission. No schema migration or persistent-store modification is in the backend diff. This is a bounded review, not a security certification or scientific acceptance of every epoch.

## Commands and results

- `git rev-parse HEAD`, `git status --short`, `git diff --check`: expected SHA; clean status/whitespace.
- `python3` + yaml.safe_load enumerated tasks.review.load (plain `python` is absent, exit127).
- `git diff 9a03d8260a529f5858c5c3298cbb9d32b721daeb..HEAD -- backend ...`: inspected actual cumulative backend/API source diff and workflows.
- `/home/rocco/Astronomy-Hub/.venv/bin/python -m pytest backend/tests/test_solar_exploration.py backend/tests/test_planetary_systems.py backend/tests/test_horizons_systems.py backend/tests/test_earth_search.py backend/tests/test_satellite_feed_api.py -q -p no:cacheprovider --basetemp=/tmp/pr107-backend-pytest`, with PYTHONDONTWRITEBYTECODE=1 and absolute DE442s env: printed21 successful dots, then hung at first TestClient route; interrupted own session, exit130. No complete-suite pass claimed.
- Separate host ASGITransport API probe: logged request.start only and hung; interrupted own session, exit130. No API response result claimed.
- Existing task-container read-only Docker probe: sandbox socket denied; approved elevated retry reported container54fcc7... not running. No container started or restarted.
- Direct service missing/configured-source script described above: exit0, output retained above. Qualified source values produced Moon301 and Mars499.

Parent will run appropriate Docker checks in a new disposable test container. Relevant suites: test_planet_view.py, test_planetary_systems.py, test_horizons_systems.py, test_solar_exploration.py; security ownership test_satellite_feed_api.py and test_satellite_tle_release_pipeline.py. No browser/physical-device qualification was attempted by this reviewer; previous source-matched satellite renderer evidence is intentionally reused only as historical evidence, not rerun.

Recommended next task: surgical canonical deployment-contract correction and red/green config tests, then focused Docker science/API proof. Existing owner/device, advisory, source-offer and build-completeness gates remain independently open. No blanket approval.
