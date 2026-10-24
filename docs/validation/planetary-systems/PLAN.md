# Planetary systems implementation plan

Owner directive: 2026-10-24, hierarchical planetary systems and moon orbits.
Execution detail under the existing MASTER_PLAN; not a competing roadmap.

Goal: Solar → parent-centered planetary system → selected satellite → qualified
Planet View, with real time-dependent geometry and reversible navigation.
Base: PR92 c510759ba78c011679c2479a2fa9f48bf260afce. Preserve that branch.

Architecture: existing Three renderer owns local-system geometry/camera; FastAPI
owns source evaluation, UTC/TDB and explicit body-center contracts. Reuse approved
Solar materials/assets and lunar Cesium destination. One heavy renderer at a time.
A common system manifest, sample contract and scene support all admitted systems.
PS1 first qualifies Earth399/Moon301 using mounted DE442s. PS2 separately admits
other systems only from qualified official sources. PS3 qualifies integration.
No paid providers, upstream patches, unapproved bulk downloads, merge or deployment.

## PS1

- [x] Load manifest context, inspect existing navigation/science and record preservation.
- [x] Add backend system manifest and source-derived position/velocity samples, source
  coverage and unavailable states. Test Earth399 vs barycenter3, Moon301 subtraction,
  units/frame/time, two independent epochs, interpolation error and boundaries.
- [x] Add validated frontend system contracts, bounded time interpolation and hierarchy
  bookmark/return contracts. Test malformed/stale samples, coverage and origin guards.
- [x] Replace standalone Moon button with reusable parent flyouts. Desktop pointer and
  keyboard access, Escape focus restore; mobile parent entry and accessible moon list.
- [x] Add parent-system route and owned Three scene with Earth/Moon, original Earth
  material, source orbit, source Sun direction, distance/scale disclosures, physical
  alternative, pick/focus/orbit/zoom and controlled camera approach.
- [x] Add pause/resume/speed/epoch controls using source time samples; freeze/pause on
  unavailable data. Never animate an independent decorative orbit.
- [x] Preserve Solar departure camera; selected Moon approaches existing native globe,
  returns to Earth System camera/epoch, then Solar. Retain old bookmarks/history.
- [x] Qualify actual desktop/portrait/landscape paths, simulation, rapid navigation,
  keyboard/touch/reduced motion, failed sources/WebGL recovery and renderer cleanup.
- [x] Reproduce builds, verify served artifacts/protected originals, update canonical
  authority and evidence, commit/push draft on PR92 and independently review exact HEAD.

## PS2

- [x] Inspect official small SPK and Horizons options and source-derived identity/radius
  metadata. Record availability matrix; never use system barycenters as centers.
- [x] Admit bounded major-moon subsets only with parent-center/time/frame/coverage and
  independent comparison evidence; unavailable states for gaps. Reuse PS1 renderer.
- [x] Qualify science, source failure, motion, camera and browser screenshots for each
  admitted system. Separate stacked draft, exact-head review and preservation receipts.

## PS3

- [x] Qualify cross-system rapid switching/history/time/selection/lifecycle, accessibility,
  responsive glass composition and actual measured browser performance.
- [ ] Final draft package, exact SHAs, preview/screenshot/source evidence and remaining
  limits. Stop for owner functional/visual review; retain future lunar terrain work.

## Review focus

1. Planetary barycenter cannot pass physical parent identity validation.
2. Out-of-order requests must not revive previous epoch/system or disposed renderers.
3. Native Moon return must preserve current system and original Solar bookmarks.
4. Playback must stop at source coverage instead of extrapolating or silently resetting.
5. Flyout pointer corridor, focus/Escape and short landscape must preserve interaction.
