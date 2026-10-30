# Independent integration review — PR #107

**Verdict: BLOCKED — missing external/device/source qualifications.**

Reviewed requested head `56f5645aac51d0d4bf16508dd85fba77e76db43c` against
main `9a03d8260a529f5858c5c3298cbb9d32b721daeb`: 125 commits, 2,991 changed
files. Both remote tips were freshly verified before work. Repairs stay on
`recovery/reconcile-20261026`; the publishing PR receipt identifies the final
commit containing this report. No new branch/PR, merge, deployment, branch deletion,
production-data replacement or named-volume operation occurred.

Three genuine integration findings were reproduced and repaired below. Each
correction has separate review by an agent who did not author it. That closes
these corrections, not independent approval of all accumulated product work.
No P0 was substantiated in the reviewed scope.

## Ranked findings and corrections

### F1 — P1: canonical Moon delivery was absent — REPAIRED

Original locations: `frontend/src/features/planet/PlanetFrame.tsx:27` requests
`/planet-runtime/`; original `frontend/vite.config.mjs:18-24` and
`frontend/nginx.conf:7` route only Earth; both Compose frontend service definitions
omit a Planet artifact/imagery delivery service. The Hub build emits no Planet
runtime or lunar bulk data. Therefore canonical startup returns Hub SPA HTML
inside the Moon frame instead of the independent renderer, followed by the
30-second readiness failure. The custom recovery preview's `/planet/` and
`/planet-data/` aliases masked the gap.

Reproduction: `node receipts/pr107-planet-routing-repro.mjs "$PWD"` against the
requested head failed `canonical Vite must serve or proxy the new Moon renderer`:
125 emitted assets, zero Planet assets, no Planet proxies or production routes.
This was an actual configuration omission, not a claim inferred from CI.

Correction: `frontend/vite.config.mjs:20-24`, `frontend/nginx.conf:8-9`, both
Compose `planet-runtime` services and `integrations/planet-runtime/nginx.conf:1-18`
now deliver the already qualified separate artifact and imagery through an
independent static nginx service. Source/artifact/data directories are read-only
binds with host-path creation disabled. Unknown assets fail 404. Earth source,
its artifact/SDK URL, native Sky and renderer lifetime ownership are unchanged.
No bulk data enters an image. Configure `ORAS_PLANET_ARTIFACT_DIR` and
`ORAS_LUNAR_SURFACE_HOST_DIR` to existing qualified releases; absent sources
fail service creation rather than create empty host directories.

Proof: original routing repro now passes; canonical Compose tests pass; eight
actual Docker HTTP assertions pass, including Moon PNG delivery, runtime
manifest and shared Earth Cesium CSS, plus two missing-file 404s. The on-disk
PNG SHA independently matches its source manifest. Existing
source-bound desktop eight-group and portrait seven-group Solar/Earth-system/
native-Moon browser journeys pass. Independent config reviews and final CI/test
addendum found no actionable issue. See receipts.

### F2 — P2: canonical backend omitted lunar/Horizons source mounts — REPAIRED

Locations: `backend/app/services/planet_view.py:25-26`,
`backend/app/services/horizons_systems.py:22-23`, original
`docker-compose.yml:6-21` / `docker-compose.prod.yml:6-17` backend definitions.
`backend/Dockerfile:3-8` correctly excludes bulk data; relative loader defaults
therefore point below absent `/app/data`. Only the custom preview supplied the
needed mounts. Moon requests return unavailable and the five outer-system
catalog entries remain unavailable despite qualified host packs.

Reproduction: direct services with canonical absent relative sources returned
`Qualified local lunar orientation is unavailable` and
`Qualified finite Horizons source pack is unavailable`; Earth alone was
qualified. Pointing the same process at preserved packs produced Moon center301,
Mars center499 and all six qualified catalog entries. Compose regressions failed
both variants for the absent environment/mount contracts.

Correction: both backend service definitions now set
`ORAS_LUNAR_ORIENTATION_DIR=/runtime/oras-lunar-orientation` and
`ORAS_PLANETARY_SYSTEMS_DIR=/runtime/oras-planetary-systems`, backed by explicit
read-only fail-closed binds. Host selectors are
`ORAS_LUNAR_ORIENTATION_HOST_DIR` and `ORAS_PLANETARY_SYSTEMS_HOST_DIR`; defaults
are the respective `data/runtime-packs/*/release` directories. Existing source
hash, parent-center and finite-coverage validation remains authoritative.

Proof: normalized Compose models pass both source-bind checks; actual Docker
Moon and Mars APIs return 200 with the expected source identities. The four
owning Docker science/API modules pass 65 tests, with seven dependency
deprecation warnings. This is not the separate strict warning-clean R4 gate.
The separate backend and config reviewers concurred on cause/correction.

### F3 — P2: failed temporal work poisoned later observer synchronization — REPAIRED

Location: `frontend/src/features/workspace/workspaceRuntimeAdapter.ts:56-72`.
The date/Live-key cache retained a failed time-command promise. Even after an
explicit time editor retry succeeded, subsequent same-client observer/selection
URL synchronization awaited that old failed result and returned early. Product
URL/observer intent could disagree with native scientific scene state.

Reproduction: actual adapter hook tests inject an unsuccessful acknowledgement
or thrown bridge failure, retry the same UTC, then change observer coordinates.
Both new cases failed before correction: 12 pass / 2 fail, with no observer
command. This is fault-injection proof, not a claimed observed native outage.

Correction: `workspaceRuntimeAdapter.ts:61-63` invalidates only unsuccessful
current-client/current-work temporal cache entries. Pending/successful work
remains shared, preserving the rule that selection-only changes do not reset
time. No native clock/propagation/math change.

Proof: owning file 14/14; final focused eight-file frontend bundle 73/73;
typecheck/build pass. A separate reviewer also exercised six independent
observer+selection, successful fixed/Live, stale-date and stale-client cases;
all passed. No surviving bypass/regression found in that correction.

## Dense-star 404 disposition — NOT an integration blocker

The visual-default magnitude4.8 profile has 1,668 stars in 590/768 order3 cells;
178 cells intentionally have no tile. The builder writes occupied cells only
(`scripts/skydata/build_oras_dense_star_tiles.py:406-423`). All 74 distinct saved
404 URLs name absent, undeclared cells, e.g. `Norder3/Dir0/Npix39.eph`.
All 2,126 declared files across three profiles match path/size/SHA. Installed
validator passes all three profiles. Native HiPS accepts404 and skips absent
tiles; this is not missing manifest data, a wrong mount or a fatal loader.
Builder, profile manager and native stars source are byte-identical to main.
Impact: empty-cell requests and console/network noise; no lost catalog star
demonstrated. Broader depth/performance is not qualified by this result. No
renderer, photometry, tile data or global error suppression was changed.

## Dependencies and security — factual disposition, no clean-security claim

Live registry refresh reproduces Hub12 advisories (1critical/5high/6moderate) and
Sky156 (12critical/55high/76moderate/13low). `--omit=dev` leaves Hub4 and Sky5.
GitHub has 200 open dependency alerts: 24 Hub, 88 Sky npm, 88 Sky yarn; duplicate
lockfile alerts are not 200 distinct exploits. Full per-alert maintenance
dispositions and raw audits are retained compressed. None was dismissed remotely
and no dependency upgrades were attempted in this bounded integration review.

| Surface | Reachability assessment / remaining limit |
| --- | --- |
| Sky critical EJS, form-data/request, loader-utils, json-schema, proxy-addr, shell-quote, websocket-driver families | Legacy build/dev-server paths. Production serves static bundles with nginx; reviewed builds consume trusted source. No demonstrated corresponding production server entrypoint. Development-server exposure remains a maintenance risk. |
| Vite/Vitest, PostCSS/source maps, browserslist and related tools | Build/dev/test-only in canonical production. No untrusted source/build input route found; do not expose development servers as a public production boundary. |
| DOMPurify3.4.11 | Present through Cesium. Primary critical advisory GHSA-cg2g-xh64-v4q7 requires nondefault template/DOM-return modes and attached shadow-root processing. Observed Credit use is `sanitize(string)` without those modes/hooks. Other audited DOMPurify advisories likewise concern nondefault options/hooks not found here. No matching exploit sink demonstrated; upgrade debt remains. |
| protobufjs | Cesium uses generated binary decoding; advisory proto/text-format parser entrypoints are not an application upload/input path. Not proof that all binary decoders are generally safe. |
| React Router | Client SPA, no SSR error hydration; destinations use fixed local prefixes and validated return helpers. No open-redirect/XSS sink established from the reviewed navigation inputs. |
| Vue2/Vuetify/Moment and bundled Lodash | Templates/presets/translations are source-owned; locale fixed `en`; no user template compiler, untrusted preset, VDatePicker input or object locale-name path found. Lodash is actually bundled despite a dev lock flag; native/store-owned paths were inspected. Vue2 EOL and old library maintenance remain. |

Primary advisory descriptions were fetched for DOMPurify, Router and Vuetify;
their prerequisite checks are evidence, not an assertion that registry severity
is incorrect. This is scoped reachability triage, not an exhaustive security
scan, dependency upgrade qualification, or certification of every provider.
Python runtime requirements and existing warnings were inspected; there is no
fresh all-ecosystem/SBOM/image vulnerability clearance in this review.

Exact-head CodeQL has four successful analyses, no analysis errors: Python
2030054928, JS/TS2030060990, C/C++2030054065, Actions2030052803.
PR107 alerts75–79 and all five corresponding threads are genuinely fixed/resolved.
The route/service fixed public errors and removal of shared workflow caches/manual
trigger were inspected, not inferred from thread status. Alert79's original
detection SHA in instance metadata is historical; current PR instance is fixed.

There are still 31 open inherited CodeQL alerts visible for the PR ref. Many are
test/tool substring checks, legacy workflow-permission findings, compiled vendor
utilities and inherited generic public-error paths. The critical mirror-process
alert uses fixed executable/script, supported-class allowlist and argv without a
shell; no shell-injection path was substantiated. These alerts are retained in
the receipt, not silently cleared by green aggregate CodeQL. Public deployment
security hardening/remaining baseline-risk acceptance is separate.

## GitHub review findings

All five PR107 threads are resolved and their underlying fixes verified above.
PR73 has 12 historical prototype threads; nine remain administratively unresolved.
The current source addresses their causes:

| Finding | Current source evidence |
| --- | --- |
| Prototype XSS / inherited URL mode keys | `reference.js:37-40`, fixed-literal `readMode` |
| Preview proof could hash a different checkout | `verify.mjs:29-44`, served SHA preflight/binding |
| Selection lost on Back / selection lost by opening a tool | `reference.js:114,121,216-232`, independent selection/panel restoration |
| Explore cancellation focus | `reference.js:123-130`, preserve connected outer modal invoker |
| Unavailable nested-dialog focus | `reference.js:196`, pass immediate button |
| Panel launcher overwritten by nested dialog | Separate `panelTrigger` / `modalTrigger`, lines45,82,127 |
| Restored panel used wrong launcher | `reference.js:229-230`, actual `[data-panel]` launcher |
| Advanced disclosure touch target | `reference.css:83`, explicit44px minimum |
| Escape moved focus when nothing open | `reference.js:201`, existing-panel guard |
| Replaced launcher stayed aria-expanded | `reference.js:80`, collapse previous expanded controls |
| Stale proof claimed current source | `evidence/browser-proof.json:72-73`, explicitly historical attribution; no relabeling old captures |

Fresh temporary-copy verification passes26checks/0failures/0script errors,
including served-source binding and the reviewed interaction regressions;
its historical committed gallery is preserved. These are design-reference
findings, not evidence that every corresponding application interaction is
qualified. No unrelated historical PR thread was closed as part of this task.
CodeRabbit skipped the draft; the generic hosted Playwright sample visits
playwright.dev and remains excluded from application evidence.

## Open source/build and acceptance gates — not waived

The existing source-offer audit and recovery gate still block release/integration
acceptance. This is an existing required qualification, not a newly discovered
runtime exploit or a legal determination of combined-work scope.

* Local source candidate: 10,577,239bytes, SHA256
  `7b25bd4f6a975cddaf6004dc796489df703d1fda424f63434760a1fff2a3f18b`.
  858 files; 565/567 attested source inputs present/hash-matching. Two excluded
  entries are regenerable native JS/WASM outputs. Do not repeat the old claim
  that native source reconstruction is wholly absent. Cached native/Vue
  reconstruction matching110 application files is valid retained evidence.
* `frontend/src/features/workspace/AboutLicenses.tsx:3,18` and
  `frontend/public/licenses/README.txt:1` still link a mutable historical N1
  branch/ZIP. No public immutable current artifact-matched archive/hash is bound
  into the release manifest/runtime marker. The local ignored tar is not a
  published corresponding-source offer.
* Native standalone/embedded app has no verified prominent source offer; full
  AGPL text and data-credit links alone do not satisfy the recorded interactive
  offer gate. Anonymous HTTPS retrieval, keyboard/touch/screen-reader access and
  actual served artifact pairing remain untested.
* Archive-only reconstruction is not executable as documented: only seven Hub
  build-context files are present; the scripts require missing29 overlay inputs,
  adapter/material/site/artwork context, Git anchor checkout, native builder
  Dockerfile/acquisition, exact local image and preinstalled node_modules.
  `scripts/runtime/build_sky_horizon.sh:7-22`, `sky_source.py:5-15`,
  `apply_sky_overlay.py:6-8`, `integrate_sky_bridge.py:7-35` expose those prerequisites.
  No adapted direct-from-prepatched-tree/fresh dependency recipe is qualified.
* Separately served bridge/protocol source inclusion and combined-work boundary
  need explicit source/license review. Code licenses do not license provider
  imagery/data redistribution. Current third-party provider/media permissions,
  notices/no-warranty presentation and release source manifest remain gated.
* Actual Windows GPU/physical-mobile qualification and later Earth/Solar/shared
  UX owner acceptance remain missing. Prior N1 acceptance is preserved. No broad
  endurance/leak, full provider readiness or strict warning-clean R4 acceptance
  is claimed by these focused checks.

Correction required before owner acceptance: finish a build-matched source
package with usable fresh reconstruction instructions, determine covered source
inputs, publish under separately authorized release work, add/qualify a visible
offer, verify anonymous retrieval/hash and actual-served identity, and obtain
the recorded device/owner qualifications. A cosmetic link change to another
incomplete archive would not close these gates. No publication/deployment was
attempted during this independent review.

## Validation, preservation and limits

Exact substantive commands, failures and receipts: [COMMANDS.md](COMMANDS.md).

* Frontend focused:73 pass /8files; typecheck exit0; production Hub build exit0,
  existing >500kB warning retained. Earlier narrow run selected only2 existing
  filenames/21tests; not represented as the final73-test bundle.
* Compose contracts:2 pass, covering both variants. Original red had2 missing-env
  failures and2 missing-service errors. An intermediate harness wrongly expected
  an explicit false property in Compose JSON; corrected to its normalized form.
* Docker owning science/API:65 pass /7 dependency warnings. Initial collection
  failure lacked fixture mounts; retained separately. Host test hangs were
  interrupted and are not passing evidence.
* Docker HTTP:6 successful endpoint/source checks +2 deliberate404 checks.
  Desktop8 and portrait7 actual browser journey groups pass; actual native body,
  epoch, camera/selection return, hierarchy Back/Forward and destroy ack checked.
  SwiftShader/touch emulation is not physical acceptance.
* Existing cached Sky qualification, satellite28 API tests, completed native
  point/touch work and preserved recovery suites are reused only for unchanged
  source/payloads, not rerun or promoted to current Live/physical proof.
* Initial Docker automatic-network pool exhaustion, null IPAM handling, internal
  port-publication failure and unused inherited CDN DNS startup failure are
  retained as setup failures. Final tests use the existing private internal IP,
  installed nginx1.27.5 and backend image, with unused CDN name loopback-mapped;
  they do not qualify that CDN or fresh image/dependency acquisition.
* Automatic approval rejected attaching the disposable gateway to the shared
  bridge because it broadened network access. That action was not performed.
  Safe direct private-IP checks completed without changing network exposure.
* All143 pre-existing container IDs/states/start times/images and90 volume names
  match before/after. Four task containers and their internal network were
  removed. Owner settings and legacy catalog match prior preservation hashes.
  No renderer source/pin/generated Sky payload, native WASM, source release,
  database/volume or original worktree was altered.

This is a bounded independent integration review of actual cumulative
application/configuration changes, with source/artifact reconstruction evidence
reused for unchanged generated/native material. It is not a line-by-line security
audit of2,991 files, scientific validation at every epoch, owner visual approval,
production readiness or a release authorization.

Default Mode; no runtime override. [Loaded context ledger](LOADED_CONTEXT.txt)
records repository/scoped instructions, review pack and explicitly requested
recovery/licensing evidence. Historical pack evidence was consulted for current
constraints and relevant sections, not broadly requalified. No full `/docs`
content scan or extra governing pack was used. Older R3-only/no-R4 directions
were surfaced as superseded by current CORE/LIVE/recovery and this explicit
review assignment; permanent renderer/science/validation rules remain.

Recommended next task: owner-directed source/build qualification and named
device/product acceptance gates, then exact-final-head integration decision.
Do not start another product phase, merge or deploy from this report.
