# Native satellite restoration — work in progress; owner acceptance BLOCKED

Historical initial recovery checkpoint. The current owner-authorized continuation
and actual Docker/browser evidence are in the [P0 report](../repository-recovery-20261026/p0-native-satellites/README.md). The earlier private-preview access/freshness limitations below describe that older checkpoint.

The owner rejects the satellite observing Passes/simulation-centric approach.
The original requirement is simple: in ordinary Sky View, unselected satellites
appear and move using the normal contained Stellarium renderer, without opening
Passes or playing a simulation. Zoom may add identification. Preserve selection
and optional tracking. Do not copy the test-harness flow into the product.

## Recovery dependency choice

This branch is based on draft PR #101, **not** on PRs #102–#104. It retains
PR #101's useful native Track/Stop and Live/Paused status correction, while
leaving out the limited 155-object pilot and its Passes/simulation UI entirely.
Those PRs are preserved, not rewritten, merged or closed. PS1–PS3, R4 Moon,
Earth, Solar, native source pins, glass, settings and protected data stay in the
prior parent chain.

## Implemented in the recovery candidate

- Restored Stellarium's native wide-FOV satellite *hint visibility preference*
  instead of the Hub overriding it to false. Close FOV retains its previously
  qualified magnitude-offset enhancement, without selected-only -30 override.
  This changes native indicator eligibility, not satellite ephemerides or
  whether a faint object qualifies as a photometric moving point. It MUST NOT
  be counted as proof of owner-visible moving points.
- Added an isolated first-party acquisition/staging script, one official
  CelesTrak active-GP request maximum, strict 8 MiB cap, no redirects/retries,
  original-source digest, exact-checksum and NORAD rejection, 14-day filter,
  full-admission minimum 1,000 and unmodified existing release builder. The
  output is **not** installed anywhere, and source/build provenance remains
  visible. Five local offline parser tests qualify initial constraints.
- An unscheduled, branch-specific GitHub Actions candidate job can generate a
  source artifact through an official reachable transport without accessing
  the owner's blocked Windows/WSL connection. Job success and data freshness
  are NOT assumed. No automatic updater or production activation.

## Remaining acceptance gates (not waived)

1. First-party acquisition must succeed and satisfy the native full-catalog
   admission criteria. If it fails, the connection/source remains blocked.
2. In the owner's **real** task-only WSL preview, mount the resulting candidate
   read-only in BOTH native Sky data and backend, verifying exact hashes
   and that caches/processes read the new release. Preserve the original legacy
   catalog unchanged. Prove actual current epoch and source ages.
3. Compare pristine original Stellarium with the Hub using identical observer,
   time, catalog, native FOV and satellite preferences.
4. Open **ordinary** /sky-engine without date=; do not open Passes, select,
   track or play a simulation. Where a source-qualified satellite is physically
   eligible, show its changing native projected point against fixed stars;
   if no satellite is eligible in a random view, use a QUALIFIED upcoming epoch
   and distinguish a frozen scene from current Live.
5. Verify native wide points and identifiers separately, real wheel/pinch,
   Live UTC, observer, sky/night appearance, camera, actual device responsiveness
   and navigation. Capture owner-visible proof on Windows GPU, not SwiftShader
   alone. Resolve any genuine engine/rendering regression before acceptance.
6. Keep the pass-simulation work out of the default user experience, with no
   broken links or misrepresented release status.
7. Only after owner confirms normal satellite use: perform a separately
   owner-authorized bottom-up stacked PR integration/merge qualification and
   return to the canonical R4 / Discovery & Knowledge roadmap. No automatic
   merge, closure, release, deployment or unrelated X2 expansion.

## Honest status

Pure native presentation and offline staging tests can pass, but this does
not mean the original problem is fixed. This chat has GitHub file access and
isolated local execution; it **cannot operate the owner's private WSL preview
or mount catalog bytes there**. Do not claim a successful Live demonstration
until the actual owner runtime is tested.
