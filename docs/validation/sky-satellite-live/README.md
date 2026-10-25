# Native Sky satellite repair

**Draft for owner functional review. Historical rendering and controls qualified;
current Live orbital accuracy blocked by stale source data. No merge/deployment.**

Branch `sky-satellite-live-repair-1`, stacked on draft PR95 at
`9ee6d85982edb3db276490706a82af83538e5e8d`. PR93–95 remain preserved.
The owner directive is October24,2026; final resumed qualification is October25.

[Root-cause matrix](ROOT_CAUSES.md) · [commands](COMMANDS.md) ·
[exact changed files](FILES_CHANGED.md) · [loaded context](loaded-documents.json) ·
[plan](PLAN.md). Default Mode: frontend_change, backend_change, validation, review,
debug. The initial59-document inventory is historical to PR95; this supporting
README adds one document to those packs. No full docs scan or new roadmap phase.

## What changed

- Hub Track/Stop tracking now operate Stellarium's native satellite lock. A newly
  selected satellite cannot inherit a different satellite's camera lock. Native
  time, observer, photometry and SGP4 stay unchanged. Standalone lock semantics
  are preserved.
- Frozen scenes say **Paused** and offer **Resume Live**. **Tracking** remains
  independent. Compact **Stale data/Unavailable** status and current-UTC NORAD TLE
  age appear through the existing time interface, including mobile.
- Native user hints-off and offset changes survive embedded policy changes and
  immediate release. The established5°entry/7°exit and minimum close offset4
  remain unchanged; wide native points are never replaced by decorative markers.
- Feed status distinguishes mounted/parsed data, validated release provenance,
  and per-record freshness. A missing manifest no longer means the native feed
  is absent. An alternate configured file cannot borrow another release's metadata.

The ordinary no-date Sky already advanced native UTC at1×. Fixed-date PS3 previews
and Solar/system/Moon returns intentionally pause at the supplied source epoch.
No spontaneous time freeze or native propagation defect was reproduced; those
contracts were preserved rather than rewritten.

## Source gate

Actual protected native data:14,281 distinct checksum-valid records,0 malformed,
0 currently fresh. Elements span May16–June5,2026. No adjacent release manifest,
provider/acquisition provenance or release identifier is available. Data bytes and
mounts are unchanged. Current status correctly reports mounted/degraded/stale;
the existing candidate service rejects elements older than14days.

Two bounded CelesTrak acquisition attempts, October24 and25 (twenty hours apart,
with an environment restart between), each timed out after120s without status or
bytes. Both had an8MiB cap, redirects disabled, no internal retries and no promotion.
No further acquisition attempt is planned in this repair. See the
[catalog audit](evidence/source-audit/REPORT.md) and
[resumed receipt](evidence/source-audit/refresh-attempt-resume-20261025.json).

**An advancing Live clock or a moving stale-element prediction does not establish
an actual satellite's position today.** Owner real-time orbital acceptance requires
fresh source acquisition and a separately qualified staged release. TLE-format
coverage also excludes unsupported six-digit identities; no completeness claim.

## Qualification

| Check | Result and limits |
|---|---|
| Runtime unit/contract tests |114passed; includes native tracking, preference restoration, standalone behavior, FOV, time/observer and lifecycle |
| Frontend tests / TypeScript |384tests across58files passed; type-check exit0 |
| Docker satellite source/propagation/release tests |39passed,3existing anyio/httpx deprecation warnings; warning-clean gate remains open |
| Source/promotion tests |6passed |
| Actual point/symbol/motion controls |Desktop1440×900, portrait390×900, landscape667×390; native historical control, real wheel/pinch and pointer/touch; final details below |
| Navigation/recovery |22/22 checkpoints passed on final Sky build; actual Sky/Earth/Solar/system/Moon, Back/Forward/reload, hints-off, one active heavy surface |
| Independent science comparison |Six samples, two real NORAD objects, exact mounted TLE/observer; native and Skyfield historical trajectories move consistently. Apparent/geometric residual19.326–26.834arcsec is measured, not an invented precision threshold |
| Reproducible builds |Sky UI repeat110payloadfiles equal; Hub host/repeat/pinnedDocker142files equal. Native engine not rebuilt |
| Served identity |142Hubfiles and111Skyfiles match admitted bytes; final committed proof is attached to the PR review record |
| Windows preview |HTTP200 via WSL address; owner browser/device acceptance remains separate |

[Final navigation report](evidence/time-audit/navigation-finish/REPORT.md) records
22 checkpoints and source hashes. Its initial predecessor failed to start Sky;
underlying cause remains unknown. A separate harness stopped after30wheel packets
at7.1°;33packets reached4.79388° in the corrected bounded run. No timeout was
increased. The failed artifacts remain retained, never relabeled as passes.

Navigation is **not warning-clean**:59missing survey/star tiles,17aborted requests,
4SwiftShader ReadPixels warnings. Zero pageerrors/non-OK bridge records. Software
rAF sample median33.4ms/p95 50.1ms; it is not a physical GPU benchmark. All12checked
prior frames detached;8destroy commands/4successful reply envelopes were observed,
not proof that every teardown acknowledgement or driver allocation was captured.

Native hints-off is respected within a runtime and during presentation release.
A completely new native runtime restores its default; persistent satellite-hint
preferences are not implemented. This limitation is explicit rather than claimed
as preserved cross-remount persistence. Existing saved product settings were not reset.

## Final native point and symbol evidence

Final-build actual Chromium runs at the required three viewports passed all five
control groups each. Native historical epoch2026-06-04T02:58Z, NORAD43689(Metop C),
ORAS observer. Real wheel/pinch, native pointer/touch selection, Paused Track,
Resume Live camera-follow and Stop tracking were asserted. FOV text agrees with
native FOV. Time/observer/atmosphere/night/landscape are recorded unchanged by
selection/tracking. The independent historical1× motion phase uses no camera lock.

Point pixels are isolated by temporarily hiding native satellites at the same frozen
instant. A6px mask around the native ICRF→VIEW projected target excludes unrelated
points; before/after coordinates and causal pixel deltas are retained. Native
central glyph green pixels are counted separately from its label. No coordinates,
brightness or orbit values are injected. Source, served marker and screenshots bind
these observations to the final candidate. [Proof](evidence/native-motion-qualified.json).

|Viewport|Real input|Angular movement|Point movement|Glyph / label pixels|Actual FOV indicator|Result|
|---|---|---|---|---|---|---|
|1440x900|wheel|2.3185°|13.114px|14 / 142|FOV 4.8°|PASS|
|390x900|pinch|2.3152°|4.667px|57 / 137|FOV 2.7°|PASS|
|667x390|pinch|2.3143°|4.668px|50 / 135|FOV 2.7°|PASS|

[Desktop wide](screenshots/1440x900-wide.png) ·
[Desktop automatic identification](screenshots/1440x900-automatic-close-full.png) ·
[Portrait automatic identification](screenshots/390x900-automatic-close-full.png) ·
[Short-landscape automatic identification](screenshots/667x390-automatic-close-full.png).
[Before point](screenshots/1440x900-wide-before-on.png) and
[after point](screenshots/1440x900-wide-after-on.png) are original128px captures
with unchanged camera, not a fabricated animation. Their matched off captures and
exact native projection/UTC are in the proof. Current Live portions test time and
camera mechanics only; the old TLE cannot qualify today's orbital accuracy.

Fresh final-build status checks passed all three viewports: Paused freezes UTC,
Resume Live keeps the same frame and advances UTC, Track/Stop preserve Live,
and an Unavailable response fixture does not freeze the clock. Badges remain visible
without horizontal overflow. [Status proof](evidence/status-qualified.json) ·
[Desktop tracking](screenshots/status-tracking-live-1440x900.png) ·
[Portrait tracking](screenshots/status-tracking-live-390x900.png) ·
[Landscape source details](screenshots/status-details-667x390.png).

## Preservation and review

[Preservation receipt](evidence/source-audit/preservation.json):107protected tracked files
match PR95, seven scientific-data hashes match admission, Earth513files/52inputs
verify unchanged. PS1–PS3/natural-moon data, R4 Moon, Solar positions/materials,
Earth, source pins, native JS/WASM, panorama, shared glass and observer configuration
remain protected. No package/dependency, production, database or volume mutation.
The old-stack running receipt is dated October24; after the environment restart,
only the two task preview containers were started. Mount identities remain preserved.
Owner `.vscode/settings.json` was already dirty; its present hash is recorded,
without claiming an unavailable initial byte snapshot or a database-byte backup.

Sky artifact `c8edee7e59ec889c07abb8f5fd870dc3d4b8d724aca151ec464f372531793dbf`.
Earth artifact `bba92a4790578f33fe2cb128c9aa6d13a9578574eddd5c147cff4162d7b36e97`.
Marker native-identical flags refer to the historical upstream comparison anchor;
this task preserves the already-qualified PR95 native binaries byte for byte.

Independent candidate review findings were reproduced and corrected with retained
RED/GREEN: configured-file provenance binding, selection/lock ownership, standalone
lock isolation, and immediate external preference restoration. Independent review
of the final exact HEAD is recorded in the PR conversation after commit/push.

## Owner preview and procedure

[Open Sky preview](http://172.26.23.204:4226/sky-engine) · [Actual screenshot gallery](http://172.26.23.204:4226/evidence/sky-satellite-live/gallery/).
Windows HTTP200 verified after the resumed environment restart.
No-date Sky shows Live and Stale data. Change time explains the source age. A
historical June4,2026 scene is deliberately Paused; Resume Live returns to now.

1. Open the historical demonstration and use the screenshots/recorded native target
   to inspect wide native points and close automatic identification.
2. Select a real NORAD satellite; Track/Stop tracking should operate independently
   of Paused/Live. Focus remains native. Selection must not change night settings.
3. Return through Earth/Solar/Moon and use Back/Forward. Review the explicit time state.
4. Treat all current stale-element positions as unqualified predictions. Final
   current-orbit acceptance follows fresh-source qualification, not this historical proof.

Physical-device performance and owner functional acceptance remain open. Next task:
restore approved source availability, stage and qualify fresh elements without
replacing protected data silently, then complete current Live orbital acceptance.
