# N1 final remediation — PR #75

Default Mode, single agent, branch `n1-sky-earth-navigation-1`, existing
[PR #75](https://github.com/Shadowgar/Astronomy-Hub/pull/75) → #74 → #73.
[Context ledger](loaded-documents.txt) lists the manifest's frontend/docs/validation/review
packs and the two explicitly relevant prior evidence documents. No broad docs scan
or additional governing documents. [Implementation plan](plan.md).

The owner accepts scrolling at `301f9eb3ddfd21a22ad04378bf09ee45c59e8adc`, the original
Pennsylvania landscape at `53ac74785f5bd0531d5556b5d1c4b622b3f2b0b7`, and the Adaptive
Explorer visual direction. These corrections preserve those designs. Satellite
presentation remains **PENDING OWNER VISUAL ACCEPTANCE** and entire N1 remains
**PENDING FINAL OWNER ACCEPTANCE**. PR #75 is **OPEN AND UNMERGED**. Preview:
<http://127.0.0.1:4202/sky-engine>. No merge, deployment, R2/R3, new provider,
dependency, astronomy catalog change, paid asset or provider spending.

Pinned source inspected: `src/modules/satellites.c`, `src/core.c`, `src/obj.c`,
`src/painter.c`, `src/js/pre.js`, `src/js/obj.js`, `src/js/canvas.js`, the existing
landscape implementation and upstream/frontend overlay `App.vue`. Astronomy Hub
changes are exhaustively listed in [changed-files.txt](changed-files.txt).

## Corrections and before/after evidence

**Observational navigation snapshots.** `RuntimeBridge.getNavigationState` previously
called `camera.interrupt`, stopping tracking and cancelling native flights before
committed departure. Cancellation also called a gate reset that cancelled wheel
animation. Snapshot acquisition now reads only; the bridge's cancellation resets
navigation intent with `preserveMotion:true`. Ordinary camera reset retains its
existing cancel behavior. Committed destruction still owns interruption, tracking
release, native flight cancellation and listener cleanup. No global restoration
system, gain/damping/anchoring/animation/handoff-threshold change.

Exact baseline bridge/controller versus current sources: `snapshot-complete-red.txt`
**0/3**, `snapshot-complete-green.txt` **3/3**. These exercise eight cancellation
cycles with tracking/pose, ongoing wheel animation, genuine controller native-flight
completion callbacks and destruction drainage. They are deterministic host-model
regressions, separately identified from browser tracking evidence.

**Honest elevation provenance.** The Hub used a raw URL enum to override native
provenance, Sky accepted a nonzero unavailable-zero claim, and Earth discarded known
provided height when reading its surface target. One shared pure rule now checks
actual observer coordinates/height against the established site. ORAS requires both
site location and height; unavailable-zero requires actual zero and identified
fallback; other supplied heights are provided. A provided zero remains provided, including restoration on a bare URL. Missing
elevation is a fallback only for an explicit matching URL location; unbound URL
claims cannot relabel a restored observer. Standalone absent/blank coordinates
are not coerced into a (0,0) provenance claim.
Hub normalizes the incoming observer intent and badge, Sky binds provenance to its
actual observer, and Earth preserves known height only at the same geographic target.
New unknown targets still report explicit zero fallback. Camera altitude is never
used as observer elevation. A supplied 123 m at ORAS coordinates remains 123 m,
provided, rather than being replaced by site height.

`p2-elevation-reproduction.json` records the old actual-browser false claims.
`elevation-adapter-red.txt` is **3/4** against the exact old plugin; shared-rule,
frontend/protocol, native-adapter and same-target regressions now pass. The
`elevation-restored-zero-red.txt`, `elevation-unbound-claim-red.txt` and
`elevation-native-bare-zero-red-complete.txt` retain the final restored-zero
edge regressions and subsequent GREEN. `elevation-site-precedence-red.txt` retains the discovered provided-height
precedence failure and its corrected GREEN result.

**Consistent source attestation.** The builder selected `ORAS_SKY_SOURCE_REPO` while
the attester archived a fixed path. Shared `sky_source.py` now selects/validates the
same checkout root and immutable HEAD before output creation. The build passes its
explicit selected path into attestation; native re-attestation uses the recorded
path. Default behavior remains the existing checkout. The compilation input is the
immutable Git archive plus recorded overlay and the existing sole horizon patch;
working-tree dirt is not silently compiled. Native and UI source inventories are
verified, including unexpected frontend public inputs. Wrong/missing paths, wrong
HEAD, unapproved pin, modified compiled source and unexpected UI input fail closed.

`source-red.txt` retains the ignored bad-path reproduction; three final Python tests
pass. Genuine default and independent alternate Git checkouts completed full offline
native/UI builds, followed by matching final UI rebuilds and fresh attestations.
`native-reproduction-qualified.json` records 564 input rows, identical 110 UI payload
files and identical native JS/WASM. Failed input attempts preserve the prior
attestation unchanged; no new successful attestation is issued. No native exception
was used for UI promotion, whose existing WASM/vendor byte guards passed.

**Native satellite presentation.** The owner's reported large startup glyphs are
explained by native `src/modules/satellites.c`: fixed 24 px hints use magnitude gates,
with no FOV condition. The pinned standalone source starts with hint offset 0; the
existing ORAS overlay raises it to 2. The actual standalone comparison uses this same pinned native binary with its
source-default offset 0, then overlay offset 2; it is not a claim of a fresh
complete upstream-product UI build. Thus native settings also expose bright
hints, and the overlay exposes more faint hints. This is a contained presentation
policy, not an asserted native propagation or photometry defect.

The adapter uses only supported `satellites.hints_visible` and `hints_mag_offset`.
Unselected wide views suppress hints/names while native photometric points remain.
Identification enters at **5° FOV** and exits at **7°**, retaining the previous state
between them; this confines 24 px symbols to a close observing view and avoids
flicker. Native JSON rounding at exactly 5° is tolerated by 1e-8 degree. A selected
wide satellite retains native selected identification, using the native selected
magnitude-gate exemption and a -30 offset to suppress other hints. Close views
restore the existing offset. Clearing selection, remount and disposal restore
appropriate native settings. Standalone behavior remains unchanged.

Native selection JSON lacks canonical Hub identity fields. A bounded fallback
exposes the existing source's actual NORAD as string with the existing `Satellite
TLE (local)` namespace, native model/name and a freshness caveat. No production
objects are manually registered. Selection, Focus, lock, SGP4 positions, native
photometry, time and observer math remain native. Six presentation tests plus the
native identity fixture cover thresholds, selected handling, upstream initialization,
release, disabled hints and native JSON precision; exact old-plugin identity RED
and corrected GREEN are retained.

Real reduced-motion mobile qualification also exposed a pinned native Focus
edge: `core_point_and_lock` sets its target lock, then `core_lookat(0)` resets that
same target struct and clears the lock. A successful Focus acknowledgment thus
left no native lock even after 12 seconds. This is actual WASM/browser RED,
separate from provider availability. The contained adapter keeps native
`pointAndLock` and uses a **one-microsecond positive native duration** only for
embedded, reduced-motion satellites. It completes before a display frame, retains
native pointing and reference ownership, and avoids the zero-duration reset.
Ordinary Focus, stars/planets, standalone defaults and Earth animation stay on their
existing paths. No position calculation or C/WASM modification is introduced.
[Native browser RED](evidence/satellite-instant-focus-browser-red.json), the exact
[pre-fix adapter](evidence/adapter-before-instant-focus.js.txt), focused host-model
RED/GREEN and final native lock/motion captures document this correction.

The pinned open-source renderer's `src/painter.c` model hooks are weak/no-op;
`can_orbit` is absent for the inspected ISS/HST records. Existing absence is preserved;
no 3D model visualization or parity with a proprietary renderer is claimed.

## Qualification evidence

Raw logs, source-bound browser proof JSON, screenshots and failed attempts reside
under local ignored `output/n1/remediation/`. The Docker preview exposes them at
`http://127.0.0.1:4202/evidence/remediation/`. Small qualification summaries and
selected screenshots are retained with this report. Browser evidence records
pre-commit HEAD plus exact corrected working-tree input hashes; post-commit served
identity must match those hashes. Historical results are never relabelled current.

| Check | Result |
| --- | --- |
| Complete runtime/Earth Node tests | 150 passed; 0 failed/skipped |
| Complete frontend Vitest tests | 248 passed in 33 files |
| TypeScript | `tsc --noEmit` passed |
| Source-selection Python tests | 3 passed |
| Final Sky default/alternate source builds | 564 input rows, 110 identical payload files; native bytes unchanged |
| Independent final Earth reproduction | 512 identical release files |
| Independent Hub reproduction | 125 identical files |
| Docker-served application/admission bytes | PASS for corrected working tree; post-commit check required |
| Elevation Chromium desktop/mobile | 10 cases each, Sky/Earth/return, Back/Forward/reload, plus live time PASS |
| Architecture/reconciliation docs | Both validators PASS |

[Final qualification summary](evidence/qualification-summary.json) binds all seven
browser proof records to the final sources/admission metadata. There are zero
page errors across the qualification records.

| Actual Docker-served Chromium check | Result |
| --- | --- |
| Complete navigation journeys | 22 desktop + 22 mobile groups PASS; peak one renderer per workspace |
| Elevation provenance | 10 cases per width PASS; nine canonical cases include Back/Forward, all include return/reload; restored bare-URL/unbound-claim case and live-time journeys PASS |
| Native satellite presentation | 15 scenes per width PASS; source-default/overlay comparison, points/motion, 20°/5°/6°/7°/120°, native selection, NORAD details, Focus/native locking, remount/reload |
| Tracked snapshots/cancellation | Four cycles per width PASS; real historical ISS provider/SGP4/Cesium, one held handoff response each, complete drainage, committed viewer destruction, peak one |
| Accepted Pennsylvania landscape | 22 scenes per width PASS; 15 asset responses match hashes, 360° seam, day/night, controls, standalone; zero landscape failures and no active zero circle |

The navigation driver’s historical non-ORAS zero-fallback disclaimer describes its
unknown-height New York scenario; supplied heights and restored zero are qualified
separately by the elevation matrix. It does not claim all non-ORAS heights are zero.

[Desktop navigation](evidence/journeys-desktop.json) retains **563** resource
failures/cancellations; [mobile](evidence/journeys-mobile.json) retains **744**.
These include astronomy data, existing map/provider resources and deliberate
navigation interruption. Related classes appear in historical evidence, but that
is not a fresh baseline or proof of each failure’s cause. No generic network-failure
count is inferred for drivers that did not collect one (summary fields are null).
No new landscape URL fails. This correction does not qualify those data/providers.

Selected actual captures: [native overlay before](evidence/standalone-overlay-offset-2-1440.png),
[desktop wide point](evidence/wide-point-1440.png),
[mobile wide point](evidence/wide-point-390.png),
[desktop selected close](evidence/selected-close-1440.png),
[mobile selected close](evidence/selected-close-390.png),
[desktop tracked cancellation](evidence/historical-fixture-cancelled-3-1440.png),
[mobile tracked cancellation](evidence/historical-fixture-cancelled-3-390.png),
[accepted landscape day](evidence/day-yaw-0-1440.png), and
[accepted landscape night](evidence/night-yaw-0-390.png).
All other scenes and raw browser records remain under the preview evidence URL.

Original-thread publication/resolution follows only after commit, push and exact
committed-source/served-byte verification; its final receipt is recorded below.

## Source and generated artifact identities

Complete input/output records: [artifact identities](evidence/artifact-identities.json),
[default attestation](evidence/attestation-qualified-default.json),
[alternate attestation](evidence/attestation-qualified-alternate.json),
[build reproduction](evidence/native-reproduction-qualified.json), and
[negative input qualification](evidence/negative-source-qualified.json).
The historical native-horizon metadata retains its original closure; fresh final
build attestations above describe this correction's actual UI/native input closure.

| Identity | SHA-256 |
| --- | --- |
| Final Sky application | `d293874321c60bd3bd154c5a1696037d72d9a1f35c2415c6141d62fab6224d57` |
| Final Earth application | `834fa48f8bc7cb0489c6c14be42a49c5fb6f9c224a6be9968e3c724ae152494c` |
| Native WASM, unchanged | `d62afde16d3695adc1f33401a51fa715cfa7618e8a5a1b82f5cbbd40f1fad942` |
| Native JS, unchanged | `0310d4b3cb55a4b26713071269cb6032a169fbdf9435f8c7cf4a4a02716a9eb7` |
| Final native/UI source-input closure | `94aaa2e730f2fab8609a2bc913d0d15846841137e158a32c861f0fd4e56b2d19` |

The pinned native source remains `023e3b26babf7ffddf45f39293230b14cfe96993`;
Earth source remains `e7707d9a0f34d9fbffc300023c319f95caa5be30`, Cesium 1.138.0.
Builds use the existing dependency trees and pinned offline images; no independent
package reinstall or new dependency is claimed. [Exact commands](commands.txt),
[changed paths](changed-files.txt), and [attempt boundaries](attempts-and-limits.md)
accompany the raw evidence.

## Preservation and limitations

`preservation.json` verifies 64 unchanged asset/overlay/patch paths against accepted
53ac7478, all 111 matching Sky rollback files and all 512 Earth rollback files,
owner VS Code settings and the mounted TLE hash. The controller differs only in
approved reset/observer-context lines; all accepted animation math remains exact.
All earlier rollback directories remain available. The full pre-change matching
Sky/Hub/Earth/admission bundle is `output/n1/remediation/rollback/`; restore it as a
matched bundle, not individual chunks or only a lock file.

The original illustrative Pennsylvania panorama, native HiPS tiles, landscape
source/patch, standalone landscapes and original artwork are unchanged. Artistic
ridge heights never become scientific horizon measurements. Existing mounted data
remains read-only; no catalog/TLE regeneration, dependency change or provider addition.

The existing local preview and backend had stopped. Only those containers were
restarted. The mounted TLE is double gzip and the preview lacked the outer
`Content-Encoding: gzip` header, causing native parsing to fail. The ignored local
nginx config was backed up and corrected for that exact asset, tested and reloaded.
No data bytes changed. Native now parses 14,281 records, latest epoch 2026-06-05;
this is stale for the owner date. Historical source-backed browser scenarios do
not qualify live provider completeness or current orbit accuracy. Extrapolation
warnings and existing astronomy/map request failures remain separate limitations.

The satellite driver initially checked pixels before native discovery completed.
Pinned native rendering discovers only 32 satellites per frame; a full traversal
of 14,281 records is needed for an unselected target. Failed faint-target and
premature-discovery attempts are retained separately. A real pixel difference
with native satellite visibility toggled confirms the unchanged photometric point;
the final driver waits the native traversal without injected positions, selection
or brightness. The tracking driver separately retains selector/diagnostic-name,
mobile-sheet, auto-hide/actionability and held-screenshot deadline attempts. Its
final controls use the supported keyboard path; native satellite object selection
uses real pointer/touch input. Test-driver failures are not reported as runtime fixes. Chromium software rendering and emulated mobile input do not prove
physical-device performance or owner visual acceptance.

Recommended next task: final owner testing of the four corrections at the preview,
then explicit acceptance/merge review. No merge or next-phase authorization is inferred.
