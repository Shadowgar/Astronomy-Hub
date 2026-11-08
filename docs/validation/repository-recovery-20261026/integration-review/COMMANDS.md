# Integration review commands and outcomes

Workdir `.worktrees/repository-recovery-20261026` unless stated. Source review
used `git diff 9a03d8260a529f5858c5c3298cbb9d32b721daeb..HEAD`, `git show`,
`rg`, `nl`, scoped reads and JSON/tar/SHA comparisons. Independent reports retain
their own exact commands and limitations. No broad historical suites rerun.

## Identity and remote evidence

```sh
git status --short
git branch --show-current
git rev-parse HEAD
git ls-remote origin refs/heads/main refs/heads/recovery/reconcile-20261026
git merge-base HEAD origin/main
git rev-list --count origin/main..HEAD
gh api --paginate repos/Shadowgar/Astronomy-Hub/dependabot/alerts
gh api 'repos/Shadowgar/Astronomy-Hub/code-scanning/alerts?ref=refs/pull/107/head&per_page=100'
gh api 'repos/Shadowgar/Astronomy-Hub/code-scanning/analyses?ref=refs/pull/107/head&per_page=20'
gh api repos/Shadowgar/Astronomy-Hub/code-scanning/alerts/79/instances
gh api repos/Shadowgar/Astronomy-Hub/commits/56f5645aac51d0d4bf16508dd85fba77e76db43c/check-runs
gh api --paginate repos/Shadowgar/Astronomy-Hub/pulls/73/comments
gh api /advisories/GHSA-cg2g-xh64-v4q7
gh api /advisories/GHSA-jjmj-jmhj-qwj2
gh api /advisories/GHSA-3jp5-5f8r-q2wg
```

Initial status clean; branch recovery/reconcile-20261026; head56f5645a; remote
main9a03d826; merge-base main;125 ahead. Initial sandbox DNS/auth/Docker socket
access failed; approved read-only network/socket calls succeeded. GitHub connector
also fetched PR107 metadata/comments/review threads and PR73 threads. Exact-head
checks show source/CodeQL success, GitGuardian neutral. Generic Playwright sample
and skipped draft CodeRabbit are excluded from application/independent proof.

## Dependency evidence (read-only, no installs)

```sh
(cd frontend && npm audit --json)
(cd integrations/sky-overlay/apps/web-frontend && npm audit --json)
(cd frontend && npm audit --omit=dev --json)
(cd integrations/sky-overlay/apps/web-frontend && npm audit --omit=dev --json)
```

All exit1 because advisories remain. Counts: Hub12 / Sky156; omit-dev Hub4 /
Sky5. Compressed JSON and200 per-alert maintenance dispositions retained.
Package flags were cross-checked with actual bundle/call sites; Lodash is not
declared unreachable merely because its lock row says dev.

## Red/green and final focused checks

```sh
node /tmp/pr107-planet-routing-repro.mjs "$PWD"
python3 -B -m unittest discover -s tests/validation -p test_planet_deployment.py -v
cd frontend
npm test -- --run tests/workspaceRuntimeAdapter.test.ts tests/viewNavigation.test.ts tests/planetContracts.test.ts tests/planetarySystems.test.ts tests/solarVisitState.test.ts tests/workspaceTime.test.tsx tests/observerProvenance.test.ts tests/orasRuntimeSpaFallback.test.js
npm run typecheck
npm run build -- --outDir ../output/integration-review/hub
```

Routing red failed missing Moon proxy; green succeeds. Compose red2 failures/
2errors (missing source env/service); final2 tests pass across both Compose
variants. Intermediate Compose JSON false-property harness errors are explained
in review README. The test removes only the private `.env` requirement using a
temporary Compose override; it never starts services. The first parent invocation
used frontend cwd incorrectly and failed to locate the test directory; it was
rerun from root. Time-cache red12pass/2fail, owning green14pass, independent six
supplemental harness cases pass. Final frontend73pass/8files; typecheck exit0;
Hub build exit0 with existing chunk warning. Source/test-only followup additions
do not change the browser-tested application bundle.

## Disposable Docker proof

```sh
docker compose ps
docker ps -a --format '{{.Names}} {{.Status}}'
docker run --rm --network none --read-only --entrypoint nginx astronomy-hub-earth-runtime -v
python3 /tmp/pr107-integration-review/docker_check.py
python3 /tmp/pr107-integration-review/science_tests.py
```

Both scripts and exact Docker argument arrays are in receipts. nginx reports
1.27.5; installed backend digest00e343c5943a. These are existing images, not a
fresh image-acquisition proof. Initial script attempts failed because automatic
network pools were exhausted, some IPAM Config entries were null, the inherited
unused CDN hostname could not resolve inside an internal-only network, and
internal-only networking did not publish the requested host port. No production
failure is inferred from these test-environment conditions.

Created only task internal network with verified nonoverlapping
`--internal --subnet 10.254.107.0/28` and four task containers. The test gateway
was recreated with `--add-host stellarium.sfo2.cdn.digitaloceanspaces.com:127.0.0.1`
so the unused inherited proxy name could resolve without outbound access.
All application/data/config binds were read-only. CDN requests were not tested.
An attempted shared-bridge connection was automatically rejected and was not run.
Safe direct host access to the existing private IP succeeded without changing
network exposure. Final HTTP assertion invocation:

```sh
python3 - <<'PY'
import pathlib,json,urllib.request,time
O=pathlib.Path('/tmp/pr107-integration-review')
s=(O/'docker_check.py').read_text().replace('http://127.0.0.1:4236','http://10.254.107.5')
exec(s[s.index('result=[]'):])
PY
```

Six200 checks and two deliberate404 checks pass. Moon API center301/frame31009;
Mars system center499. PNG4,256,691bytes. Disk PNG SHA matches source manifest.
Science-test script mounts the complete fixture tree, sources and science packs
read-only in a separate `--network none --read-only --tmpfs /tmp` container:

```sh
python3 -m pytest backend/tests/test_planet_view.py backend/tests/test_planetary_systems.py backend/tests/test_horizons_systems.py backend/tests/test_solar_exploration.py -q -p no:cacheprovider
```

Final65passed/7warnings/7.87s. An earlier in-container attempt failed collection
because `/app/tests/fixtures` was absent; raw failure retained. Host tests hung
after21cases and were interrupted by reviewer; they are not counted as passes.

## Actual browser checks

```sh
PS_URL=http://10.254.107.5 PS_VIEWPORT=1440x900 PS_OUT=output/playwright/integration-review/earth-native node scripts/validation/verify_ps3_earth_native.mjs
PS_URL=http://10.254.107.5 PS_VIEWPORT=390x900 PS_OUT=output/playwright/integration-review/mobile-native node scripts/validation/verify_ps3_earth_native.mjs
python3 /tmp/pr107-integration-review/check_prototype.py
```

Desktop8groups and portrait7groups PASS, source/script/served entry hashes stable.
Lossless screenshots remain ignored under output/playwright/integration-review;
structured receipts are committed. No physical-device/GPU acceptance claimed.
Prototype check runs the unchanged current verifier and seven source files in a
temporary directory. Initial run lacked19 gallery PNG fixtures:24checks passed,
2fixture/binding checks failed; no success ledger written. After copying existing
gallery fixtures into that temporary directory, rerun records actual current
interaction results separately from historical committed captures. The current
run does not overwrite source or the historical repository proof ledger.

## Data, source and preservation

```sh
/home/rocco/Astronomy-Hub/.venv/bin/python -B scripts/skydata/validate_oras_dense_star_tiles.py /home/rocco/Astronomy-Hub/.worktrees/integration-main-20261005/data/runtime-packs/dense-star-tiles
node --test tests/runtime/sky-artifact.test.mjs
sha256sum output/recovery/sky-source-candidate.tar.gz
git diff --name-only 56f5645a -- runtimes integrations/renderers.lock.json frontend/public
git diff --check
git status --short
git log --oneline -5
```

Dense3profiles pass; Sky artifact1/1; archive SHA matches recorded candidate;
renderer/pin/generated public diff empty. Independent Python checks verify every
declared dense tile path/size/SHA and all74 recorded404s, plus source tar inputs.
Owner settings/legacy catalog SHA match prior preservation receipt.

```sh
docker rm -f pr107-review-gateway pr107-review-planet pr107-review-earth pr107-review-backend
docker network rm pr107-integration-review
```

Only newly created task resources removed, no `-v` volume deletion. Before/after
snapshot comparison:143 existing containers identical in ID/state/start/image;
90 volume names identical. No original container restarted. Git commit/push and
final remote-head verification are recorded in the PR107 publishing receipt;
no merge/deploy/delete/protection action is authorized by those commands.
