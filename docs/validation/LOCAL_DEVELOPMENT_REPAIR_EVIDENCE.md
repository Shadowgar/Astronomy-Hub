# Local laptop development repair — 2026-10-04

Support evidence, SINGLE AGENT. Laptop WSL/Docker only; no runtime override.
The owner request reprioritizes local repair ahead of another feature or PR #63
merge. This correction branches from the qualified HD head and does not change
that feature branch or authorize its merge. It preserves all renderer source,
science, catalog data, qualified artifacts, editor settings and existing evidence.

## Everyday workflow

From `/home/rocco/Astronomy-Hub`:

```sh
npm run dev:local
npm run dev:local:status
npm run dev:local:logs
```

The command pins project `astronomy-hub`, verifies the currently locked artifact
and source/metadata agreement, starts only Postgres, Redis, backend, Earth and
frontend, then checks frontend/API/Earth/PG/Redis plus served artifact identity.
It never rebuilds Earth application assets. It uses the stable real directory
`data/runtime-artifacts/earth`, ignoring inherited temporary artifact settings.
The installer verifies all bytes before and after staging, locks concurrent helper
invocations, then renames on the same filesystem. A verified current install is
an idempotent no-op even if the original source has vanished. An existing invalid
or different install is preserved and fails closed; stop Earth and explicitly
archive that directory before provisioning a newly qualified release. No automatic
replacement of owner data occurs.

Initial provisioning when the default qualified cache is absent:

```sh
npm run dev:earth:install -- --source /path/to/exact-qualified-artifact
npm run dev:earth:verify
```

There is no automatic download/rebuild/substitution when neither a verified stable
install nor the exact qualified cache exists. The error gives the explicit install
command. For an intentional image refresh after dependency/backend changes:

```sh
npm run dev:local:build
```

This refreshes Docker application images; it does not build another Earth bundle.
`COMPOSE_BAKE=false` is explicit; no Bake crash occurred in this repair. Current
frontend source/config/bridge mounts support HMR without an image build per edit.
Backend retains its existing image lifecycle; backend/dependency edits require
`dev:local:build`. Existing Postgres/Redis containers use `--no-recreate` and are
not renewed even when old Compose labels point to a historical worktree. No `down`
command, data-volume renewal or orphan removal is part of startup.

Native frontend events are default. If native watching fails with ENOSPC on a
future machine, explicitly opt in with `CHOKIDAR_USEPOLLING=1 npm run dev:local`
(or the legacy process-only `dev:wsl`). The legacy process launcher does not
manage Earth; do not run it concurrently on the Docker ports. `frontend/dev`
contains preserved generated evidence, is ignored by Git/Docker, and is now also
excluded from Vite watching. Source files remain watched.

Stellarium reference is an optional `reference` profile. Public Sky uses the
contained `/oras-sky-engine/` artifacts, not its Vue development server. Start it
only for a parity task: `npm run docker:stellarium:up`; stop without removing its
volume: `docker compose -p astronomy-hub stop stellarium-reference`.

Disposable lifecycle: explicitly start the intended qualification project, capture
proof, then stop it. Do not leave completed stacks running or restarting. Helper:

```sh
npm run dev:cleanup:qualification
npm run dev:cleanup:qualification -- --apply
```

The first command previews. Apply only after qualification completes: it stops
exact allowlisted project labels or exact historical standalone names and disables
their restart policies. It retains containers, networks, volumes and files; it
never targets normal frontend/backend/Earth/datastores/reference or WordPress.
The main-labeled historical `oras-phasec-sky-qualification` standalone is an
explicit exception by exact container name, not a broad main-project selection.

## Root causes and measured proof

Normal Earth/backend/datastores were stopped. The required qualified bind source
`data/runtime-artifacts/earth` was absent, so fail-closed Compose refused startup.
The exact artifact still existed in `/var/tmp/oras-renderers`; no rebuild was
needed. Release identity, 512 manifested files plus release.json (11,875,431 bytes),
35 source inputs, health marker, upstream pin, exports and both metadata surfaces
were freshly verified. Qualified digest:

`ca124164577c6ee927a03d6ded6688a6a843f64394f8b83ace6f9ebc5c4f803d`

Three completed frontends each had 662 restarts because Nginx could not resolve
`earth-runtime`. Stopped active containers: workspace qualification 5, PR59
integration 4, PR60 interaction reset 4, Cesium production review 4 (17 total),
plus Stellarium reference. All 20 project containers and four known historical
standalones now have disabled restart policies; exited historical containers,
WordPress environments and unrelated projects remain preserved. None of these
qualification projects is intentionally active for this repair.

| Measurement | Before | After |
|---|---:|---:|
| Running / restarting containers | 16 / 3 | 5 / 0 |
| Total retained containers | 49 | 49 |
| Docker memory, single snapshot | 1,492.65 MiB | 361.40 MiB |
| Aggregate Docker CPU, single snapshot | 1.88% | 0.51% |
| WSL RAM used / available (`free -h`, rounded) | 10 / 5.4 GiB | 9.2 / 6.3 GiB |
| WSL free RAM | 1.7 GiB | 3.6 GiB |
| Swap used | 11 MiB | 38 MiB |
| Load averages 1 / 5 / 15 minutes | .66 / .66 / .62 | 1.34 / 5.12 / 3.71 |
| `vmstat` interval CPU idle range, excluding first cumulative row | 88–100% | 85–100% |
| `vmstat` swap-in/out and IO wait | 0 | 0 |
| Frontend CPU, 15s sample, one core | 0% | .067% |
| Root filesystem | 28% used, 694 GB free | No disk-pressure remediation needed |
| Named/anonymous volumes retained | 81 | 81 |
| Build cache / reclaimable | 62.88 / 50.37 GB | 63.16 / 50.95 GB |

Docker memory dropped 1,131.25 MiB (75.8%) while restoring the required normal
services. The stop-only intermediate snapshot was 288.3 MiB Docker memory,
6.5 GiB WSL available RAM. Reference alone used 373.3 MiB; its measured idle CPU
was 0%, so removal is justified by unnecessary resident memory, not a CPU claim.
Final load averages include the deliberately intensive watcher/browser/build
qualification; overall load-average improvement is **not** claimed. Swap increased
slightly during that work; there was no measured active paging. Samples are local
observations, not guarantees of all editor/host latency.

Windows read-only CIM measurement: 34,111,545,344 bytes total RAM, 10,201,684 KiB
free, 16 logical CPUs. WSL: 16 CPUs, about 15.5 GiB visible RAM, 4 GiB swap. No
baseline starvation/paging/CPU saturation justified inspecting or editing
`.wslconfig`, applying sysctl changes, shutting down WSL or restarting Windows.
No Windows or WSL resource settings changed.

Inotify: 524,288 watches, 128 instances, 16,384 queued events. Readable same-UID
processes held 17,464 watches across five instances; VS Code fileWatcher held
16,858. Some other-UID/container processes are not readable, so this is not a
system-wide total. Actual native create/change/delete events and browser HMR
passed; current frontend watcher exhaustion is not supported by the evidence.

Controlled Vite comparison on spare localhost:4273, 15 seconds after watcher
ready and five seconds of settling, same source/config and add/change/delete probe:

| Preserved generated `frontend/dev` watched? | Native CPU, one core | Polling CPU, one core | All 3 events |
|---|---:|---:|---|
| Yes (3.1 GB interrupted build/evidence) | 53.39% | 120.86% | Pass |
| No | 0% | 3.20% | Pass |

The active Docker frontend was already idle/native at baseline; mandatory polling
was a latent problem in the legacy local-process launcher, not proof that it
caused the whole baseline lag. Excluding generated evidence and native default
now make that coding loop measurably cheaper. Probe files/processes were removed;
preserved evidence was not. A timestamp-only CSS event reached real browser HMR
at `/src/features/workspace/workspace.css`, with exactly one ready iframe. File
bytes and original timestamp were restored.

No cache prune was justified by the available 694 GB or CPU/IO measurements.
`docker system df -v` was saved; the small cache growth is from the intentional
local image refresh. No images, build cache or volumes were deleted.

## Local runtime and browser results

First image refresh/startup: 41s; repeat startup: 1s, final metadata-check version
3s; stopped frontend/backend/Earth restart: 4s. Postgres/Redis remained running.
The stable directory was mounted successfully through recreation and restart.
All 81 original volumes remain; Postgres/Redis have the exact same container IDs
and volume mount identities as baseline. No blanket restart/stop of other projects.

Health: backend `/api/v1/health` returns `status: healthy`; Earth health returns
`ORAS Earth runtime ready`; Postgres `pg_isready` and Redis `PING/PONG` pass.
Served `/earth-runtime/release.json` digest and `/runtime-versions.json` Earth
metadata equal the current renderer lock and installed artifact.

Normal endpoint `http://localhost:4173`: Home ready 1,691ms; Earth ready 2,711ms;
return Sky ready 4,686ms. Real live USGS aerial imagery near ORAS reached settled
close detail after 56,145ms (includes 24 user zoom steps and tile loading): 20
successful level-16 responses, no failed imagery diagnostics. Global NASA imagery
and local fallback both ready. One iframe in Home/Earth/final Sky; zero remaining
Earth frames on departure; no page-level JS errors. The public provider's network
and zoom/settling time remain distinct from local shell/Viewer readiness.

Screenshots: `output/playwright/local-repair-global.png` and
`output/playwright/local-repair-hd.png`. Browser uses the installed Chrome through
Playwright CLI. Its first attempt requested an unavailable CLI Chromium revision;
using installed Chrome resolved that tooling mismatch without installing packages.
CLI smoke counts are not represented as a rerun of the untouched 25-case feature
qualification. Existing sparse dense-star HTTP 404s and stale catalog console
warnings are inherited limits, not new page exceptions; broad console cleanliness
is not claimed. Runtime-sensitive visual behavior/science was not changed.

Five-request median HTTP timings (response, not renderer readiness): `/` 2.838ms,
`/earth` 5.614ms, backend health 3.520ms, Earth health 2.447ms. No valid before
Earth-ready timing existed because Earth was unavailable; no fabricated speedup
ratio is assigned to that failed state.

## Exact verification commands and evidence

Raw local evidence: `/var/tmp/oras-local-dev-repair/`. Matched command invocations
and exit statuses are in `before-commands.json` / `after-commands.json`; comparison
JSON, process intervals, watcher logs, full Docker disk inventory, restart logs,
health timings and browser JSON are retained there. First artifact regression run
fails because the new module does not yet exist; subsequent focused tests pass.
A first watcher sample included startup scan; final reported samples wait for
watcher ready. A diagnostic initially hit `/proc` IO permission for a container PID;
CPU sampling uses readable stat fields and does not claim unavailable IO deltas.

```sh
git status --short
git branch --show-current
git rev-parse HEAD
sha256sum .vscode/settings.json
gh pr view 63 --json state,headRefOid,baseRefName,url
uptime
nproc
free -h
swapon --show
df -h
df -h /
docker stats --no-stream --format '{{json .}}'
docker system df
docker system df -v
docker ps -a --format '{{json .}}'
ps -eo pid,ppid,comm,pcpu,pmem,rss,etime --sort=-pcpu
ps -eo pid,ppid,comm,pcpu,pmem,rss,etime --sort=-rss
sysctl fs.inotify.max_user_watches fs.inotify.max_user_instances fs.inotify.max_queued_events
vmstat 1 6
python3 -m unittest discover -s tests -p 'test_local_*.py'
python3 scripts/runtime/earth_artifact.py verify --source /var/tmp/oras-renderers/owned-earth-ca124164577c6ee927a03d6ded6688a6a843f64394f8b83ace6f9ebc5c4f803d
python3 scripts/runtime/earth_artifact.py install
python3 scripts/runtime/record_runtime_versions.py data/runtime-artifacts/earth
bash -n scripts/dev-local-stack.sh scripts/dev-wsl-stack.sh
npm run dev:local:build
npm run dev:local
npm run dev:cleanup:qualification
npm run dev:cleanup:qualification -- --apply
docker compose -p astronomy-hub -f docker-compose.yml -f docker-compose.dev.yml config --quiet
docker compose -p astronomy-hub config --services
docker compose -p astronomy-hub -f docker-compose.yml -f docker-compose.dev.yml stop frontend backend earth-runtime
docker compose -p astronomy-hub ps
curl -fsS http://localhost:4173/api/v1/health
curl -fsS http://localhost:4173/earth-runtime/health
npm --prefix frontend run typecheck
npm --prefix frontend run test -- tests/workspaceRuntimeAdapter.test.ts tests/runtimeProbeService.test.ts
npm --prefix frontend run build
python3 scripts/validation/validate_architecture_docs.py
.venv/bin/python -m pytest tests/validation/test_architecture_manifest.py -q
git diff --check
```

Playwright invocation recipe (actual run-code bodies retained in evidence):

```sh
bash /home/rocco/.codex/skills/playwright/scripts/playwright_cli.sh --session local-repair open http://localhost:4173 --browser chrome
bash /home/rocco/.codex/skills/playwright/scripts/playwright_cli.sh --session local-repair run-code "$(cat /var/tmp/oras-local-dev-repair/browser-smoke.js)"
python3 /var/tmp/oras-local-dev-repair/watch-compare.py
python3 /var/tmp/oras-local-dev-repair/watch-compare-narrow.py
```

Focused proof: 14/14 Python tooling tests, 21/21 frontend tests (2 files), typecheck,
build, shell syntax, Compose config, strict artifact and served metadata checks,
real browser smoke and HMR pass. Architecture verification passes: 185 manifest path entries, 8 task packs,
37 checkpoint documents, 97 relative links, 8 ADRs. Manifest negative checks
pass 6 tests / 14 subtests. No backend science/full feature suite required
or run for this environment correction.

## Requested 36-point handoff

1. Initial Git: `earth-hd-mapping-1` at `a9f3e207235d42399d37d8c51b18103f6edcbb87`; only unstaged owner `.vscode/settings.json`.
2. Earth failure: missing required stable bind source while dependent normal services were stopped.
3. Exact qualified artifact located at the requested `/var/tmp/oras-renderers/owned-earth-<digest>`; not rebuilt.
4. Digest `ca124164577c6ee927a03d6ded6688a6a843f64394f8b83ace6f9ebc5c4f803d` freshly verified against all files/source/metadata.
5. Stable real directory `/home/rocco/Astronomy-Hub/data/runtime-artifacts/earth`; no volatile symlink.
6. `npm run dev:local`; explicit install/build/status/logs and optional cleanup/reference commands above.
7. Before: 19 active Docker containers (16 running, 3 restarting), exact inventory in before-inspect.json.
8. Stopped 17 running/restarting completed qualification containers plus reference; exited containers retained; exact identities in stopped-qualification.json.
9. After: only normal frontend/backend/Earth/Postgres/Redis running; 49 total containers retained.
10. Restart loops: 3 → 0; each stale frontend had 662 restarts.
11. Reference stopped/profile optional: unnecessary to public runtime, 373.3 MiB resident memory, 0% interval CPU.
12. Baseline CPU/load: 16 cores, load .66/.66/.62, sampled idle 88–100%, Docker snapshot 1.88%.
13. Final CPU/load: sampled idle 85–100%, Docker .51%, load 1.34/5.12/3.71 affected by proof workloads; no whole-host load improvement claim.
14. Baseline WSL: used 10 GiB, available 5.4 GiB (rounded).
15. Final WSL: used 9.2 GiB, available 6.3 GiB.
16. Baseline swap: 11 MiB / 4 GiB.
17. Final swap: 38 MiB / 4 GiB; no measured swap-in/out.
18. Docker memory: 1,492.65 → 361.40 MiB; 1,131.25 MiB / 75.8% reduction.
19. Disk/cache: 694 GB free; 62.88 → 63.16 GB cache; no prune/data deletion justified.
20. Watcher: active Docker already native/idle; legacy mandatory polling plus generated 3.1 GB build gave expensive controlled local reproduction.
21. Inotify: 524288/128/16384; 17,464 readable same-UID watches; actual native proof passed, no exhaustion evidence.
22. Optimization: generated `frontend/dev` ignored by watcher; native default, explicit polling fallback; HMR preserved.
23. WSL config: host/WSL resource measurements showed no baseline starvation; `.wslconfig` inspection was not warranted by the conditional gate.
24. `.wslconfig`/sysctl/Windows changes: none; no shutdown/reboot.
25. Backend healthy; Postgres/Redis ready with original data identities.
26. Earth ready; exact served release/Hub metadata agree with lock.
27. `/earth` runs actual owned Cesium Viewer, not just its shell.
28. Browser Home/Earth/HD/global/Sky→Earth→Sky/single renderer passes on localhost:4173.
29. Page exceptions: 0; inherited sparse star-tile resource 404s remain disclosed.
30. Startup/readiness: initial refresh 41s, repeat 1–3s, stopped service restart 4s; browser and response timings above; unavailable before state has no readiness number.
31. Exact changed-file inventory below; owner/editor/runtime/catalog files excluded.
32. Focused local `dev-wsl-performance-repair-1` correction commit; exact resulting SHA reported in final Git handoff. No push/new PR/merge.
33. All 81 volumes retained, same Postgres/Redis containers/mounts; no datastore wipe, artifact/evidence deletion or WordPress changes.
34. No SSH, target-host contact, deployment, Cloudflare or oras.org mutation. GitHub read-only PR lookup and approved public imagery GETs only.
35. Remaining: large VS Code/Pylance resident processes (about 2.05/1.82 GiB Pylance/extension host), inherited sky catalog gaps, provider/network close-zoom settling; subjective Windows/editor latency not proven eliminated.
36. Next: owner exercises `npm run dev:local`, confirms editor responsiveness and reviews this isolated tooling diff before deciding PR #63; no next feature/review/merge started here.

Editor settings SHA remains
`6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0`, unstaged.
Fresh GitHub lookup found PR #63 OPEN at the original a9f3e207 head. No previous
feature qualification counts were reused as current tooling test results.

## Loaded context

No broad `/docs` scan. Mandatory core/live plus manifest `debug`, `docs_change`,
`planning`, `validation`, and configuration-relevant `frontend_change` pack union.
Unchanged documents previously loaded in this session were reused; current
core/live/manifest/validation/state/stack and task-specific evidence were reread.
The newly written support report is registered in the applicable manifest packs.
Root/current runtime authority supersedes inherited FE8.5/BabylonJS assumptions
in frontend AGENTS; only watcher configuration changed under frontend.
No documents outside that pack union were loaded. AGENTS and skill files are
operating instructions, not extra project-context documents.

```text
docs/context/CORE_CONTEXT.md
docs/context/LIVE_SESSION_BRIEF.md
docs/validation/SYSTEM_VALIDATION_SPEC.md
docs/architecture/UNIFIED_UNIVERSE_ARCHITECTURE.md
docs/architecture/ARCHITECTURE_OVERVIEW.md
docs/architecture/ENGINE_SPEC.md
docs/architecture/OBJECT_MODEL.md
docs/architecture/DATA_CONTRACTS.md
docs/validation/LOCAL_DEVELOPMENT_REPAIR_EVIDENCE.md
docs/execution/PROJECT_STATE.md
docs/features/FEATURE_EXECUTION_MODEL.md
docs/features/FEATURE_CATALOG.md
docs/features/FEATURE_ACCEPTANCE.md
docs/features/FEATURE_TRACKER.md
docs/runtime/FAILURE_PATTERNS.md
docs/design/UNIFIED_WORKSPACE_DESIGN_SPEC.md
docs/DOCUMENT_INDEX.md
docs/DOC_INVENTORY.md
docs/studies/GODS_EYE_SWE_COMPATIBILITY_STUDY.md
docs/validation/UNIFIED_RUNTIME_COMPATIBILITY_EVIDENCE.md
docs/validation/CESIUM_EARTH_PHASE_C_EVIDENCE.md
docs/validation/EARTH_CAPABILITY_EXPANSION_EVIDENCE.md
docs/validation/EARTH_HD_MAPPING_EVIDENCE.md
docs/architecture/ENGINE_CATALOG.md
docs/architecture/INGESTION_STRATEGY.md
docs/execution/MASTER_PLAN.md
docs/README.md
docs/MASTER_PLAN.md
docs/product/PRODUCT_VISION.md
docs/architecture/STACK_OVERVIEW.md
docs/ASTRONOMY_HUB_DIAGRAM.md
docs/architecture/decisions/0001-universal-application-state.md
docs/architecture/decisions/0002-swe-sky-renderer.md
docs/architecture/decisions/0003-gods-eye-earth-runtime.md
docs/architecture/decisions/0004-additive-earth-extensions.md
docs/architecture/decisions/0005-cesium-planetary-direction.md
docs/architecture/decisions/0006-controlled-renderer-handoffs.md
docs/architecture/decisions/0007-immutable-upstream-source.md
docs/architecture/decisions/0008-provider-licensing-boundaries.md
docs/architecture/TONIGHT_CONTRACT.md
docs/validation/UNIFIED_WORKSPACE_IMPLEMENTATION_EVIDENCE.md
```

## Changed files

```text
docker-compose.yml
docker-compose.dev.yml
package.json
scripts/dev-local-stack.sh
scripts/dev-wsl-stack.sh
scripts/cleanup-qualification.py
scripts/runtime/earth_artifact.py
scripts/runtime/record_runtime_versions.py
frontend/vite.config.mjs
tests/test_local_earth_artifact.py
tests/test_local_dev_cleanup.py
docs/context/CONTEXT_MANIFEST.yaml
docs/context/LIVE_SESSION_BRIEF.md
docs/execution/PROJECT_STATE.md
docs/DOCUMENT_INDEX.md
docs/DOC_INVENTORY.md
docs/validation/LOCAL_DEVELOPMENT_REPAIR_EVIDENCE.md
```
