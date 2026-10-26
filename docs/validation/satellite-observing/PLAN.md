# Satellite observing implementation plan

Owner directive 2026-10-26; base draft PR102 d2909a52d3f747c555ca87eff112bab83c064779.
Work branch sky-satellite-observing-1. No merge, production deployment, source
promotion or unattended acquisition. Existing pilot and original catalog stay read-only.

## Design and boundaries

A compact Next Passes surface belongs to Sky's existing observing tools. It uses
current observer context and a bounded 24-hour window, with an explicit UTC start
for historical or upcoming simulations. Opening the panel does not change time.
Results distinguish geometric horizon crossings, sunlight, dark-sky opportunity,
and unavailable apparent brightness/weather. Neither altitude nor standard
magnitude establishes naked-eye visibility. The bounded API uses admitted source
records and the existing validated local DE442s/Skyfield pipeline.

Watch explicitly pauses at a qualified watch instant and points the native camera;
the point is unselected and untracked. Play Simulation starts native time at 1x.
Pause freezes actual native UTC; restart returns to the chosen watch start; Live
returns to actual UTC. No decorative motion or browser-computed orbital positions.
Simulation is labeled persistently with UTC and speed, independent of tracking.
Reload and handoff must not autoplay. FOV/observer/native display preferences remain.

The existing external adapter setLive(bool) already controls native 0/1x clock.
Extend the authenticated bridge around that supported capability, avoiding a
native engine/plugin rebuild or photometry change. A separate command reports
simulation state; native time supplies displayed timestamps. URL time updates
must not reset playback during selection synchronization.

Alternatives rejected: a standalone tracker (duplicates native rendering); polling
orbital coordinates into a dot (violates native propagation); silently interpreting
Paused as playback (misrepresents astronomical intent). User explicitly requested
integration and preserved UX, so no new design-direction approval is needed.

## Tasks / verification

- [ ] Add bounded pass service/API and RED/GREEN source/epoch/conditions tests.
- [ ] Add authenticated simulation contract + native adapter tests, then controls.
- [ ] Integrate Next Passes and watch flow with keyboard/mobile glass surfaces.
- [ ] Investigate absolute position residual separately without native math edits.
- [ ] Write separately reviewable first-party refresh proposal, no activation.
- [ ] Run affected frontend/backend/runtime tests, typecheck and reproducible builds.
- [ ] Launch only new read-only task preview, verify source/served/preserved bytes.
- [ ] Record ordinary-UI desktop/mobile/short-landscape journey, native point pixels,
  timestamps, zoom identification, tracking, Live return, navigation and cleanup.
- [ ] Reconcile evidence and governance, commit/push bounded draft(s), exact-head review.

Review focus: stale/unvalidated source; observation epoch outside freshness;
late async replies after observer/time/navigation changes; frozen time unexpectedly
resuming; selecting/tracking while playback is running; mobile panel occlusion;
missing Sun kernel/unknown brightness; apparent vs geometric coordinate truth.

Existing historical tests remain historical, not repeated as new acceptance.
Physical GPU acceptance is distinct from software rendering. Any incomplete gate
must be reported explicitly; green tests do not grant owner acceptance.
