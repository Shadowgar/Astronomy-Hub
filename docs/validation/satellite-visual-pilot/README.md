# Fresh visual-satellite pilot

**Limited development preview for owner functional review.** Base draft PR101
`7f5ea4d0c069463852698c836b3cd80a13bd75cf` remains unchanged. Branch
`sky-satellite-visual-pilot-1`. No production promotion, merge or deployment.

[Open Live Sky](http://172.26.23.204:4227/sky-engine) ·
[Actual screenshots and motion video](http://172.26.23.204:4227/evidence/satellite-visual-pilot/gallery/)

## Source admission

**ADMITTED for the bounded isolated visual-GP pilot with attribution.** The
[independent source-rights assessment](SOURCE_RIGHTS.md) uses current
[Space-Track basic-data redistribution terms](https://www.space-track.org/documentation#/odr)
and CelesTrak's documented GP lineage. This is not blanket approval of the mirror
operator or its updater. Its workflow continues after an HTTP404 and overfetches;
that implementation is not adopted. Code/README/other datasets are not relicensed.

| Item | Verified result |
| --- | --- |
| Transport | GitHub connector, base64 committed blob; immutable revision |
| Repository/revision | caelo-works/tle-mirror / `38a142645e7814b538daaf5868b814550e1f0dda` |
| File | `tle/visual.tle`, 25,575 original bytes |
| Original SHA256 | `63c4c833d967c26c2b3d403de42c234ff6b920969639642a3bedce15225406e2` |
| Published manifest SHA256 | `675f8ee1a02dfa915ca996263177cc6962f927ef0ecb3416e0d214a032f20646` |
| Git blob | `9cd799b4c016d0b89e38c32bce15f577271b2c89` |
| Records | 155 unique identities; 155 valid paired checksums; zero malformed/duplicate records |
| Required identities | ISS25544, Hubble20580, Tiangong48274 present |
| Original epochs | 2026-10-20T18:54:34.809696Z through 2026-10-24T07:55:39.758592Z |
| Freshness | All155 within the existing14-day limit on October25; original epochs retained |
| Mirror fetch | Producing Actions run40163310433/job121079195976 logs visual155 at04:50:13.0828324Z |
| Local receipt time | 2026-10-25T06:33:11.804049Z, retained verification time, not an exact wire-start certificate |

The immutable manifest and Git blob verify distributor bytes and traceability.
The commit is unsigned. A first-party CelesTrak ISS text response matched its two
TLE lines; **only ISS was independently cross-checked against official text**.
There is no upstream-signed whole-file attestation. Do not call all155 records
independently authenticated. [Audit](evidence/candidate-audit.json).

## Isolated release and preservation

Profile `visual_satellite_pilot.v1` requires explicit task configuration. The
original full-catalog importer and minimum1000 are unchanged; the155-record file
is rejected by that original gate. The pilot builder independently revalidates
pinned original bytes, full record representations and provenance. A modified
feed plus a newly computed manifest hash cannot authorize changed elements.

Release `visual-pilot-20261025-38a1426` has native-feed SHA256
`9f063125517b9a6cc990159009ec7e46b764dc6dd14afc7a4b44a651e5920185`.
[Manifest](evidence/release-manifest.json). Original TLE strings are unchanged.
Canonical NORAD metadata/aliases fix14 zero-padded lookup failures without
changing their numerical identities or original TLE fields.

The native and backend containers read the **same read-only pilot directory**.
Native HTTP gzip representation, actual native155-object data and API identity
are checked separately. A new origin, new native frames and a fresh backend
process prevent the previous14281-record catalog from being mistaken for this
release. All five public staged artifacts are readable0644.

133 standard magnitudes are retained from the protected native baseline, joined
only by canonical NORAD plus international designator. The remaining22 omit
brightness metadata and retain native default behavior. These are modeled
brightness rules, not measurements or live brightness claims. No tuning of native
photometry, SGP4, native binaries, source pins or5°/7° identification policy.

The original14281-record feed stays at SHA256
`431592eb5ec6db56d79c26792853f3fafe36ddf76c98834d9ddb36ddc0846436`.
The original4226 preview still uses that stale feed. Pilot data is not installed
or promoted there. Rollback is stopping the two pilot containers and returning
to the preserved PR101 preview; no original data replacement needs reversal.

Verification covers107 protected tracked files,9 named data/manifest files,
unchanged Earth/Sky artifacts, read-only mounts and owner checkout/settings.
This is not a byte-for-byte snapshot of every database/volume or other host process.
[Preservation/delivery receipt](evidence/delivery-candidate.json).

## Actual motion, controls and source truth

At the independently checked current UTC, none of the subset's above-horizon
objects were sunlit. Consequently the visible demonstration uses the permitted
**upcoming-pass simulation**, not a June historical fixture:

- NORAD61045, SPACEMOBILE-003, October25 at10:22UTC /06:22EDT.
- Native1× clock during an approximately8-second fixed-camera recording.
- No selected/locked object during wide-field point measurement.
- Separate source-backed angular displacement, target-local on/off point pixels,
  movement relative to stars, automatic native symbol/label pixels and actual FOV.
- Real wheel on1440×900; real CDP touch/pinch input on390×900 and667×390.
- Track/Stop and Live/Paused operate independently; Resume Live returns to actual
  currentUTC. Observer, atmosphere, Night Mode, landscape and FOV are preserved.
- Native photometry defaults apply to this target; its standard magnitude is not
  supplied by the fresh orbital file or matched baseline.

The simulation harness advances the native clock explicitly while the Hub retains
its intentionally fixed-time intent. It does not add a product simulation-play
control or represent that epoch as current LiveUTC. Full application screenshots
are frozen states; the video is the actual native canvas and is explicitly labeled
simulation. [Native proof](evidence/native-proof.json) ·
[Actual video](evidence/fresh-pass-native-1x.webm) · [Decoded video metadata](evidence/video-metadata.json).

Independent Skyfield/SGP4 calculations use the exact same TLE/site/UTC and existing
admitted DE442s. Native and independent angular displacement closely agree.
The approximately62arcsec geometric absolute residual persists even in frozen
samples; an apparent-correction variant is about58arcsec. Timing alone does not
explain it. **No new precision threshold or absolute-position accuracy pass is
invented.** The native math remains unchanged. [Comparison](evidence/independent-motion/REPORT.md)
and [full samples](evidence/independent-motion/comparison.json).

## Scoped corrections and qualification

Exact NORAD selection previously entered generic star/DSO search. Actual Docker
logs showed36.246seconds of cold work blocking other API requests; a feed check
then timed out at30seconds. Exact NORAD queries now use the already configured
TLE lookup before unrelated indexes. Four tests retain RED/GREEN, return original
elements/string identities and never fabricate coordinates/visibility.
A fresh-process exact lookup measured about0.006seconds.
[Cold runtime](evidence/norad-cold-runtime-green.json).

Final UI identifies Limited pilot, includes source attribution in Change time,
and prioritizes Stale/Unavailable correctly. Fresh epochs from rejected provenance
are not presented as qualified data. No unrelated redesign.

- 388 frontend tests across58files; TypeScript pass.
- 19 native presentation/tracking tests pass.
- 108 Docker satellite/source/propagation/NORAD/Gaia tests pass, with4 inherited
  anyio/httpx deprecation warnings. This is not warning-clean qualification.
- Final three-viewport native motion/control proof and focused navigation/source
  checks are recorded with exact source hashes in the evidence receipts.
- Hub host/repeat/pinned-Docker builds must match142files;111 pinned native Sky
  artifact files remain identical to PR101. The single intentional feed override
  is verified against the admitted pilot instead of the preserved old feed.
- Actual navigation observed196 tile404s,14 aborted requests and4 SwiftShader warnings; no page exceptions. Software frame medians were33.4–66.7ms, with83.4–133.3ms p95. These are observations without a physical-device performance pass. [Raw warning/timing summary](evidence/warnings-and-software-timing.json).
- Windows-accessible preview returnsHTTP200. Browser viewports/touch and software
  frame timing remain distinct from physical GPU/device qualification.
- The earlier broad local API run was interrupted after37dots and is not counted
  as a pass; Docker is authoritative. A combined browser/navigation shell later
  ended143 after nativePASS and9/16navigation checkpoints; cause unknown.
  Its receipts are retained, and a standalone bounded navigation check supplies
  the final result. No timeout was increased or unrelated service disturbed.

[Exact commands/results](COMMANDS.md) · [Exact files](FILES_CHANGED.md) ·
[Plan/rulings](PLAN.md) · [Default Mode loaded-context inventory](loaded-documents.json).
Independent exact-HEAD review is recorded in the draft PR conversation after
commit/push. Green tests do not grant owner acceptance.

## Owner review and remaining work

1. Open Live Sky and Change time: inspect155-record coverage, source attribution,
   source freshness and actual clock behavior.
2. Watch the gallery's current-source pass video. Its displayed epoch is a
   simulation of the morning pass, not current observing conditions.
3. Use the linked paused pass view, select61045 and try Focus/Track/Stop;
   time must stay intentionally paused until Resume Live.
4. Return through Earth/Solar, Back/Forward and reload. Review mobile controls.

This pinned subset is not a full catalog and has no automatic refresh updater.
It will age; mixed/stale records must remain disclosed. Six-digit NORAD objects
are not supported by this legacy TLE/native slice. Whole-file first-party
authentication, absolute-position precision, owner acceptance and physical-device
GPU qualification remain limitations. Source gaps/tile failures and software
warnings are recorded separately from application assertions.

Next task after owner review: separately qualify an approved, policy-compliant
ongoing source transport and freshness pipeline. No production promotion, merge,
deployment or X2 expansion is authorized here.
