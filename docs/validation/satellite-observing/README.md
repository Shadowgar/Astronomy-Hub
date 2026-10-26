# Satellite observing and native pass simulation

Implementation branch `sky-satellite-observing-1`, stacked on draft PR102
`d2909a52d3f747c555ca87eff112bab83c064779`. **Owner functional review pending.**
No merge, production deployment, source promotion or unattended updater.

[Open Sky preview](http://172.26.23.204:4228/sky-engine) ·
[Actual journey gallery](http://172.26.23.204:4228/evidence/satellite-observing/gallery/)

## Ordinary observing flow

1. Open **Passes** in Sky's observing tools. Opening it preserves current time.
2. Inspect the next 24 hours for your observer, or choose an explicit UTC window.
3. Choose **Watch simulation** on a potential optical opportunity. This explicitly
   pauses at the qualified watch sample and approximately centers its direction,
   retaining FOV, observer, landscape, atmosphere and Night Mode.
4. Choose **Play Simulation**. The actual native clock advances at 1×; the unselected,
   untracked native light point moves. Pause, restart and Live remain separate.
5. Zoom normally to reveal native identification; select and optionally Track.
   Stop tracking or Deselect returns to fixed-camera observation without changing time.
6. **Return to Live UTC** returns to actual now. Reload never auto-plays a simulation.

Simulation uses the existing contained adapter and native clock/SGP4, not an
independent animated point. UTC displayed in the simulation controls comes from
native state. Selection-only URL synchronization does not reset playback.
Cross-mode handoffs retain a frozen simulated epoch instead of calling it Live.
Pass-list reopening does not change the deliberate clock intent.

## Scientific scope and limitations

The immutable 155-record pilot remains `visual_satellite_pilot.v1`, feed SHA256
`9f063125517b9a6cc990159009ec7e46b764dc6dd14afc7a4b44a651e5920185`.
Backend/native use the same read-only directory from PR102. The original 14,281-record feed
and minimum 1,000 full-catalog importer are unchanged. No acquisition occurred.
Only the prior ISS record had first-party text cross-check; the whole mirror
file is not independently authenticated. [Original source rights](../satellite-visual-pilot/SOURCE_RIGHTS.md).

Passes use the existing Skyfield/SGP4 and validated mounted DE442s, never network
kernel downloads. Rise/set are geometric 0° horizon crossings; window-clipped
endpoints are labeled Window start/end. Peak is the highest culmination within
the returned interval. Potential optical opportunity requires a sampled sunlit
point at altitude≥10° and Sun altitude≤−6°; this is **not naked-eye visibility**.
The 15-second optical-condition sample grid can miss shorter opportunities.
Brightness, clouds and local obstructions remain unknown; retained standard
magnitudes are not apparent magnitude predictions or live measurements.
The artistic Pennsylvania ridge is never a scientific horizon mask.

TLE age is recomputed at the requested window and maximum absolute age across
each pass; any pass exceeding the existing 14-day limit is excluded. Future or
historical scene UTC is explicit. Current feed freshness is reported separately.
155 records / 24 hours / 40 returned passes, one computation worker, bounded cache and
request rate are explicit limits. Potential optical opportunities sort first;
truncation is disclosed. There is no all-satellite or all-pass completeness claim.
Missing provenance, changed bytes, missing ephemeris, stale epochs and propagation
failure are handled without invented positions. [Backend evidence](evidence/backend/RESULTS.md).

The persistent ~62 arcsec residual is now causally localized: native TEME conversion,
observer UTC/UT1 handling and relative light-time conventions. Pinned-source
reconstruction matches 24 retained captures within 0.007–0.050 arcsec, while raw
SGP4 agrees within 3.8 mm. This is one same-TLE comparison, not an absolute accuracy
acceptance. **No native math correction or invented passing tolerance.**
[Detailed investigation](evidence/accuracy/REPORT.md). Its inputs are retained
historical captures, not a repeated or relabeled new browser campaign.

A first-party refresh pipeline is separately reviewable in [draft PR #103](https://github.com/Shadowgar/Astronomy-Hub/pull/103), commit `e5efd5ca2ecfc3344b57f4262023157f1e7d1763`. Independent documentation review found no actionable P1/P2 issues. It is not
implemented, activated or approved by this observing feature. The snapshot ages.

## Qualification

[Plan](PLAN.md) · [Commands](COMMANDS.md) · [Exact files](FILES_CHANGED.md) ·
[Context inventory and read scope](CONTEXT.md).

- 415 frontend tests in 60 files; TypeScript passes.
- 27 focused runtime protocol/presentation/tracking/simulation tests pass.
- 85 Docker backend tests pass with verified container exit0;316 existing dependency
  deprecations remain (313Skyfield/NumPy,3Starlette/httpx). Not warning-clean.
- Host/repeat/pinned-Docker builds are identical;143 served files match.
 111 native Sky artifact files remain unchanged. Original scientific files/settings
 and read-only mounts are independently checked by the delivery verifier.
- Ordinary final UI journeys pass: desktop 1440×900: 39 assertions, portrait 390×900: 36,
  short landscape 667×390: 36. Source unchanged; actual full-page recordings and native
  point/identification pixels retained. [Browser results and media](BROWSER.md).
- Independent review reproduced two async races; both were fixed with 19 focused
  regressions. Final immutable-head review and delivery receipt are published in
  the draft PR conversation and task preview evidence after committing.


At the widest 120° portrait-phone view, the selected test satellite did not produce sufficient measurable point pixels. An ordinary pinch to 60° retains point-only presentation and produces measurable native motion. No photometry or pixel threshold was relaxed.

The final desktop software RAF median/p95 was116.7/216.6ms: this is slow software-rendering evidence, not a performance acceptance.

Actual Chromium software rendering and touch/viewport emulation are distinct
from physical GPU/device or owner acceptance. Dense-star tile404s and Vite chunk
warnings remain recorded. No unrelated resource management or timeout inflation.

Initial qualification found and corrected the API microsecond/bridge millisecond
boundary and overlapping selected-drawer tracking target during simulation.
Dedicated simulation actions now keep native tracking reachable. Independent review also reproduced delayed selection/time and Watch/observer races. The corrections preserve newer intent, invalidate obsolete continuations after each acknowledgement, verify the native observer and refresh camera state before pointing; 19 deterministic regressions pass. [Race evidence](evidence/review/intent-RESULTS.md). Retained failed
runs remain failures, and the final results bind the actual source bytes.

## Preservation and rollback

No native JS/WASM/photometry, source pins, accepted landscape, Earth/planet/Moon
rendering, database schema, provider rights, paid source or dependency changed.
The external authenticated adapter gains simulation intent; this is distinct from
the unchanged native artifact. Preview4228 is task-only and read-only; rollback is
stopping its two task containers and returning to the preserved PR102 worktree.
Existing previews were already stopped at task start; they were not restarted.
No claim of a full database/volume byte snapshot is made.

Remaining gate: owner functional review of the actual recording and application.
A separately authorized upstream science correction should predefine frame/time
reference cases and tolerances before altering native positional math.
