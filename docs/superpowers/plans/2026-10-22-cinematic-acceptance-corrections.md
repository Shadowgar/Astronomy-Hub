# Cinematic visual acceptance corrections implementation plan

> **For agentic workers:** Use the executing-plans skill for each bounded domain. The owner has explicitly authorized implementation; no new design decision is required.

**Goal:** Correct demonstrated Earth, Solar and Sky visual defects in draft PR88 while preserving scientific and accepted behavior.

**Architecture:** Hub presentation remains external to native Cesium and contained Stellarium. Solar camera/material changes preserve source vectors. Existing licensed source assets, settings and rollback artifacts remain protected.

**Tech stack:** Existing React/TypeScript, Cesium, Three.js, Stellarium, FastAPI and Playwright; no dependency additions.

**Spec:** Owner final acceptance directive and docs/design/ASTRONOMY_HUB_CINEMATIC_REFERENCE_2026-10-21.md.

## Constraints and review focus

No merge, deployment, paid sources or R4. Preserve #84–#88. Watch close imagery source transitions, non-square viewports, selected Saturn rings, HUD hit targets, source-backed dark sky versus historical epoch, user preferences and serial renderer cleanup. Physical GPU qualification is separate from software Chromium evidence.

## Execution

- [x] Earth: capture global/regional/selected native camera, layer/source/tile/load/resolution/compositing state against original Earth reference; reproduce any application defect with focused failing checks, fix only proven defects in owned runtime paths, then capture matched desktop/mobile results.
- [x] Solar: compare primary reference; reproduce clipping/overlap with projected mesh and HUD bounds across overview/selected/compact screens; correct camera presentation only, retaining all eight planets and Inner/Full source geometry; focused red/green and actual screenshots.
- [x] Sky: audit actual native display/search/constellation/landscape/details, compute dark-sky Sun altitude at declared UTC/observer, compare historical epoch; qualify supported presentation corrections without invented source content or changing accepted preferences.
- [x] Integration: run affected frontend/science/browser navigation/accessibility/lifecycle/responsive checks. Preserve valid historical evidence by explicit source identities; do not relabel it fresh.
- [ ] Delivery: verify reproducible/served artifacts, original assets/pins/data/settings/rollback, curate exact reference/actual gallery and discrepancies. Commit/push existing draft PR88 and independently review final exact HEAD. Stop for owner visual acceptance.

Each domain reports exact source cause, changed files, commands/results and specific unsupported concept effects. Root integrates disjoint edits and schedules browser access serially. New evidence lives under output/cinematic-acceptance; historical packages stay intact.
