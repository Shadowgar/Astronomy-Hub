# N1 final remediation — PR #75

> Owner update2026-10-16: satellite zoom reveal is rejected. Prior direct-FOV
> checks below are historical supporting evidence and do not qualify actual wheel
> reveal. Active repair: [N1 satellite zoom reveal](../n1-satellite-zoom-reveal/README.md).

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

**Same-route review follow-up.** [Review of delivery head `ea802138`](evidence/review-audit-same-route-finding.json) found that
post-mount query/history synchronization still sent the numeric observer directly.
This bypassed the validated provenance used at initial mount, and its numeric-only
acknowledgment key skipped source-only changes at identical coordinates/height.
`workspaceRuntimeAdapter.ts` now normalizes every query observer with the same
shared rule and compares a validated source-aware key. The initial acknowledgment
uses the latest query through a ref; existing request acknowledgments retain their
actual validated payload source. No new global state or renderer lifecycle is added.

[Same-route native RED](evidence/same-route-browser-red.json) records native Sky changing to the correct coordinates
and 0 m while falsely reporting `provided` instead of `unavailable-zero`, with the
same iframe. [Three hook regressions fail before the fix](evidence/same-route-hook-red.txt); [all seven focused tests](evidence/same-route-hook-green.txt)
pass afterward. The new [same-renderer browser matrix](evidence/observer-history.json)
checks desktop/mobile Sky and Earth: changed coordinates, provided-zero ↔ fallback-zero,
actual Back/Forward, fixed time and round trips. Iframe identity and native
`performance.timeOrigin` remain unchanged during query/history synchronization.
[Mobile Sky](evidence/same-route-sky-390.png) and [desktop Earth](evidence/same-route-earth-1440.png) captures record the resulting views; the mobile Sky badge identifies the zero-height fallback.
Controlled History API entries exercise the actual router; renderer results,
observer calculations and positions are not fabricated. Fresh complete navigation
and elevation matrices qualify the updated Hub build. Native satellite, landscape
and tracked-cancellation records retain their existing qualification against the
unchanged engine/adapter/artifact inputs; they are not relabelled fresh Hub runs.


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

**Promotion identity follow-up.** [Review of `90f2a5bd`](evidence/review-audit-promotion-finding.json)
found a separate metadata inconsistency within correction 3. UI-only promotion
preserved `native_horizon` but reinitialized both native identity flags to true,
contradicting the lock's recorded changed WASM. `record_sky_workspace.py` now carries
WASM identity from reconstruction and preserves explicit vendor identity; older
horizon locks retain their known vendor change. Original upstream-only promotion
remains true/true. No native build or renderer modification is introduced.

Two actual promotion subprocess regressions fail before the fix; all three pass
with the correction. A committed-artifact test also reproduces the false marker.
Qualified UI staging and the existing independently built alternate-source output
produce identical corrected metadata. The metadata-only change is exactly two
booleans and their marker admission row; the Sky payload digest, native binaries,
all rendering assets, Hub JavaScript and public runtime versions remain identical.
[Strict equivalence certificate](evidence/metadata-equivalence.json) checks these
facts against immutable browser-qualified `90f2a5bd`, including all 125 Hub files.
Original eight browser proof records retain their original hashes; they are not
rewritten or relabelled fresh. The final certificate explicitly permits only this
verified metadata delta. A ninth proof records fresh actual native Sky/Earth
admission and same-renderer history at both widths with the corrected metadata.

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
| Complete frontend Vitest tests | 252 passed in 33 files |
| TypeScript | `tsc --noEmit` passed |
| Source-selection / promotion Python tests | 3 + 3 passed |
| Final Sky default/alternate source builds | 564 input rows, 110 identical payload files; native bytes unchanged |
| Independent final Earth reproduction | 512 identical release files |
| Independent Hub reproduction | 125 identical files |
| Docker-served application/admission bytes | PASS for corrected working tree; post-commit check required |
| Elevation Chromium desktop/mobile | 10 cases each, Sky/Earth/return, Back/Forward/reload, plus live time PASS |
| Architecture/reconciliation docs | Both validators PASS |

[Final qualification summary](evidence/qualification-summary.json) binds all nine
browser proof records to the final sources, with the exact metadata-only delta
explicitly certified rather than rewriting original proof hashes. There are zero
page errors across the qualification records.

| Actual Docker-served Chromium check | Result |
| --- | --- |
| Complete navigation journeys | 22 desktop + 22 mobile groups PASS; peak one renderer per workspace |
| Same-renderer observer/history | Four mode/width variants PASS; seven updates each, native acknowledgments, stable iframe/time origin, round trips |
| Elevation provenance | 10 cases per width PASS; nine canonical cases include Back/Forward, all include return/reload; restored bare-URL/unbound-claim case and live-time journeys PASS |
| Native satellite presentation | 15 scenes per width PASS; source-default/overlay comparison, points/motion, 20°/5°/6°/7°/120°, native selection, NORAD details, Focus/native locking, remount/reload |
| Tracked snapshots/cancellation | Four cycles per width PASS; real historical ISS provider/SGP4/Cesium, one held handoff response each, complete drainage, committed viewer destruction, peak one |
| Accepted Pennsylvania landscape | 22 scenes per width PASS; 15 asset responses match hashes, 360° seam, day/night, controls, standalone; zero landscape failures and no active zero circle |

The navigation driver’s historical non-ORAS zero-fallback disclaimer describes its
unknown-height New York scenario; supplied heights and restored zero are qualified
separately by the elevation matrix. It does not claim all non-ORAS heights are zero.

[Desktop navigation](evidence/journeys-desktop.json) retains **631** resource
failures/cancellations; [mobile](evidence/journeys-mobile.json) retains **818**.
These include astronomy data, existing map/provider resources and deliberate
navigation interruption. Related classes appear in historical evidence, but that
is not a fresh baseline or proof of each failure’s cause. No generic network-failure
count is inferred for drivers that did not collect one (summary fields are null).
No new landscape URL fails. This correction does not qualify those data/providers.

An additional [failed navigation attempt](evidence/same-route-desktop-disposal-attempt.json)
observed one Earth removal with `disposed:false` and no recorded destroy result at
the Host's existing one-second deadline. Its cause is unproven. It is retained
separately and excluded from qualification; the complete unchanged navigation
driver then passed on desktop and mobile in isolation with the same disposal
assertions and deadlines.
Passing final runs establish those tested journeys, not a bound on disposal under
arbitrary software-rendering load.


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

## Delivery and original review resolutions

Implementation commit: [`b7b5da90b34f33124084cf73e36ee7c2644575f0`](https://github.com/Shadowgar/Astronomy-Hub/commit/b7b5da90b34f33124084cf73e36ee7c2644575f0),
pushed to the existing branch/PR #75. [Committed browser-input certificate](evidence/committed-browser-implementation.json)
and [Docker-served identity](evidence/served-implementation.json) both PASS, with no
working-tree runtime changes at that delivery. Report-only head `ea802138` retains
those runtime inputs. The same-route follow-up changes Hub observer
synchronization and rebuilds Hub JavaScript; native Sky/Earth bundles are unchanged.
The final metadata follow-up preserves those application bytes. Its exact final
commit, pushed PR identity, all nine committed-input/equivalence certificates,
served-byte verification and additional P2 resolution receipt are recorded together
in the preview `evidence/remediation/final-delivery.json` and final owner handoff.
These receipts are produced after committing/pushing, not inferred from this draft.

All three original P2s were answered and resolved **after** that verification.
[Resolution receipts](evidence/review-thread-resolutions.json):

| Finding | Verified original-thread response |
| --- | --- |
| Observational snapshots | [resolved response](https://github.com/Shadowgar/Astronomy-Hub/pull/75#discussion_r4291451670) |
| Elevation provenance | [resolved response](https://github.com/Shadowgar/Astronomy-Hub/pull/75#discussion_r4291451875) |
| Explicit attestation source | [resolved response](https://github.com/Shadowgar/Astronomy-Hub/pull/75#discussion_r4291452011) |

[Implementation-head review audit](evidence/review-audit-implementation.json):
Codex code review **COMPLETED WITH NO FINDINGS** on `b7b5da90`; all enumerated
threads are resolved. CodeRabbit reports SUCCESS but its issue comment explicitly
says review was skipped for this non-default stacked base; GitGuardian reports
NEUTRAL. Our three COMMENTED thread replies are not independent approval. No
separate security review or full-provider qualification is claimed. That subsequent report-only head `ea802138` did receive the additional same-route
P2 described above; the earlier no-findings result does not apply to it. `90f2a5bd` resolved that
provenance finding, then received the distinct promotion-identity finding above. Both
follow-ups are qualified in this report, with response/resolution and exact final-head
review receipts recorded after committed-input and served-byte verification at
`http://127.0.0.1:4202/evidence/remediation/final-delivery.json`. Final-head reviews
and all threads are rechecked before handoff; a pending or unresolved review is
never treated as readiness.

Owner acceptance applies to scrolling `301f9eb3` and scenery `53ac7478` only.
Implementation-source commits in verification metadata, including the legacy
`acceptedNavigationSourceCommit` field, identify source history and do not grant
owner acceptance to this remediation. Satellite appearance and entire N1 remain
pending owner acceptance; all three PRs remain open and unmerged.

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
| Final Hub JavaScript `index-C5XU8tgl.js` | `afdd44d4c4fd3f6a34782eb1d9c79b7eeeb9742fc8fe9add8eaf3341be94f4bc` |
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
