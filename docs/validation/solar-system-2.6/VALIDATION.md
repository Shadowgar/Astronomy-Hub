# Solar 2.6 qualification and commands

Loaded context and immutable starting references are in `context.json` and
`PLAN.md`. Existing Solar2.5 source and native-runtime evidence is reused only
where inputs/implementation remain unchanged. This is scoped milestone evidence,
not independent approval of the entire consolidated PR107.

## Local and Docker checks

Commands were run from the recovery worktree unless otherwise stated:

```sh
npm test --prefix frontend
# 97 files, 726 tests passed. Final output: frontend-final.log.
npm run type-check --prefix frontend
# PASS.

docker build --target build -f frontend/Dockerfile.production \
  -t astronomy-hub-solar26-owner:latest .
# PASS. Immutable image/source binding: build-binding.json.

docker start -a pr107-solar26-tests
# Container command: python -m pytest -q -p no:cacheprovider \
#   backend/tests/test_beyond_exploration.py backend/tests/test_mission_exploration.py
# 52 passed, 4 inherited deprecation warnings.

python3 scripts/skydata/test_solar26_observations.py -v
# 10 passed; bounded offline acquisition/normalization negatives.
output/solar26-observation-tools/bin/python scripts/skydata/acquire_solar26_observations.py
# Reproduces the immutable local release. Details: OBSERVATIONS.md.

PYTHONPATH=output/playwright/solar-system-2.4/asset-tools-venv/lib/python3.12/site-packages:. \
  /home/rocco/Astronomy-Hub/.venv/bin/python scripts/skydata/qualify_solar26_context.py
# Six fresh Horizons comparisons; maximum8.638m and2.582e-8km/s.
# UTC/TDB reference maximum42.8microseconds. Details: SCIENCE.md.

git diff --check
# PASS.
```

The test container is a new retained helper with read-only source binds and a
256MiB temporary `/tmp` tmpfs; it does not mutate protected data or volumes.
An initial attempt to run pytest in the read-only preview backend had no writable
temp directory and failed before collection. The helper above corrected the test
environment. Four inherited warnings are1AnyIO BlockingPortal and3HTTPX TestClient
shortcut deprecations; they are reported, not suppressed or represented as fixed.

## Actual hardware browser evidence

Windows Node/Edge commands use the existing local Windows executable, not Linux
SwiftShader. The recorded renderer is NVIDIA GeForce RTX3060 Laptop GPU,
Direct3D11. Portrait390×844 and landscape844×390 are desktop viewport emulation;
desktop is1440×900. They are not physical iPhone evidence.

```sh
'/mnt/c/Program Files/nodejs/node.exe' \
  "$(wslpath -w "$PWD/scripts/validation/verify_solar26_journeys.mjs")" \
  http://localhost:4231 \
  "$(wslpath -w "$PWD/output/playwright/solar-system-2.6/release-journeys")" \
  all "$(wslpath -w "$PWD/data/runtime-packs/heliophysics/release-v1")"

'/mnt/c/Program Files/nodejs/node.exe' \
  "$(wslpath -w "$PWD/scripts/validation/review_solar26_workspace.mjs")" \
  "$(wslpath -w "$PWD/output/playwright/solar-system-2.6/workspace-review-final")" \
  http://localhost:4231

python3 scripts/validation/package_solar26_gallery.py
```

The first four-journey run retained genuine failures: six-digit Python timestamp
padding blocked mission-route admission; a long planetary flyout extended below
the viewport. Both were corrected and independently reviewed. An early A browser
window closed without a diagnosed cause; it is not called a renderer crash.
The next run passed A/B/C and reached Earth in D, then rejected native observer
roundoff because the harness compared numeric strings exactly. The corrected
assertion is independently tested against12 controlled records. It requires
finite nonempty values, latitude/longitude within1e-9degrees, elevation within
1e-4metres and exact UTC. The successful retained run recorded maximum latitude
3.133493464702042e-12degrees, longitude2.8265390028536785e-11degrees, elevation0m.

The retained journeys cover:

- A: source-backed Voyager1 crossing, mission camera roundtrip, mission switching
  without dropping the Beyond origin, and direct1979encounter→2012crossing.
- B: Voyager2 and historical comparison with distinct source epochs; returning
  from an event timeline restores the original comparison UTC/camera.
- C: actual1800-cell IBEX map selection/masking; IMAP pointer/keyboard values and
  real quality gap in three viewports; canceled stale product request; deliberate
  missing-product503; unsupported1000CEplanetary epoch422 with no stale markers.
- D/E:100000AU orbit/recenter in three viewports; original Solar camera; Saturn
  planetary system; native Sky/Earth with shared observer/UTC and serial renderer
  ownership. The four videos contain all five requested journey categories.

There were zero uncaught JavaScript errors. Two deliberate503/422 responses are
negative tests, not service outages. Native Sky emitted58dense-star expected-empty
404s; its unchanged prior qualification is explicitly reused from
`repository-recovery-20261026/owner-acceptance/README.md`. Twenty requests were
canceled with `ERR_ABORTED` during navigation/intent cancellation. This report
does not mislabel those inherited/intentional entries as a spotless network log.

Separate actual fault injection demonstrates pending shader context loss cannot
revive controls, Retry creates one ready renderer, and the retired owner releases
all resources. Actual IMAP pointer red→green proves SVG letterboxing no longer
changes the selected UTC. Before/after evidence and exact non-author reviews are
in `INDEPENDENT_UI_REVIEW.md` and `evidence/workspace-independent-review.json`.

## Performance and remaining qualifications

`PERFORMANCE.md` contains exact CPU/CDP/WebGL commands and retained receipts.
The mission shadow-state fix removes five unprepared shader variants: first-render
CPU418–472ms→24ms; exact Voyager inspection PNG hashes match. All four model
shadow/return journeys and12mission warm cases pass. New Beyond6cases measure
1200orbit frames: GPU median0.367–1.186ms, p95≤1.219ms; RAF p95≤7ms. Geometry buffers
378340bytes are below64MiB. Compositor/driver allocations are separate from that
explicit geometry budget.

Cold Beyond tasks632–650ms and maximum frames430.6–527.8ms remain. Native graphics
context/extension startup is a separate measured cost. This is not a hitch-free,
machine-cold or cross-device performance guarantee. No source/texture quality was
reduced to improve these numbers.

The final commit's hosted Repository integrity, Playwright and CodeQL results
must be recorded on PR107 after push; local checks are not a substitute. Existing
CodeQL/dependency findings and incomplete neutral scans remain release concerns.
Owner visual acceptance, physical iPhone access/testing and a matching qualified
public corresponding-source release remain open. No merge, production deployment,
public tunnel, archive publication or protected-resource deletion is authorized.

## Hosted CodeQL correction follow-up

Initial97c7ba61 passed hosted Repository integrity and Playwright but introduced
CodeQL alerts84–86. `CODEQL.md` records exact traces and dispositions. The bounded
correction has35focused tests plus the full52-test Docker Beyond/mission run,
with the same4inherited warnings. An independent reviewer repeated the tests,
five negative HTTP cases, source comparisons and unchanged-evidence checks.
`codeql-independent-review.json` binds those reviewed bytes. Actual private Docker
context/IBEX/IMAP responses are byte-identical before and after; see
`codeql-docker-api-equivalence.json`. Frontend, data packs and rendering did not
change, so the final actual browser recordings and GPU evidence remain applicable.
Hosted reanalysis and automatic alert closure are reported on PR107 at the final
pushed SHA. No alert suppression or manual dismissal was used.
