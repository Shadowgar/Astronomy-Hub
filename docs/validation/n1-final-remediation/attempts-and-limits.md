# Attempts and evidence boundaries

All paths below are under local ignored `output/n1/remediation/`. Failed and
interrupted attempts are retained; none is counted as a qualified PASS.

- `snapshot-red.txt` and final `snapshot-complete-red.txt`: exact old bridge/controller
  interrupts tracking/flight and wheel motion. Initial cancellation fix broke the
  ordinary explicit reset contract (`snapshot-first-green-reset-contract.txt`,
  13/14); corrected by an explicit bridge-only preserveMotion option.
- `source-red.txt`: baseline ignores invalid source override; it reaches missing build
  inputs, while two new shared-selector tests fail because the helper does not yet
  exist. Corrected real default/alternate builds and negative cases are separate.
- `elevation-browser-red.txt` / `p2-elevation-reproduction.json`: actual old-browser
  false provenance. `elevation-adapter-red.txt`: exact old plugin accepts false zero
  at 123 m. `elevation-site-precedence-red.txt`: first new Earth rule overwrote a
  provided height at ORAS; precedence corrected before final builds.
- `elevation-restored-zero-red.txt`, `elevation-unbound-claim-red.txt`,
  `elevation-native-bare-zero-red-complete.txt`: final review found bare/restored
  provided-zero provenance and absent-coordinate (0,0) coercion. Explicit matching
  URL coordinates now bind missing-height fallback and URL claims. These fixes are
  within correction 2. Prior 148/247 unit and browser qualification is archived in
  `pre-bare-zero-qualification/`; final 150/248 tests and new browser records supersede
  it. The old helper fixture used a fallback claim without coordinates; its final
  fixture explicitly supplies the matching location, while a separate assertion
  rejects unbound claims. `runtime-sandbox-spawn-attempt.txt` retains sandbox EPERM;
  the authorized subprocess-capable run passes all 150 tests.
- `satellites-mobile-focus-readiness-attempt/`: mobile native Focus is checked after
  a fixed 1.5-second sleep and sees a null lock. Final driver uses native touch on
  Focus and waits for the actual native lock within the existing 12-second command
  deadline, retaining real bridge/failure diagnostics; no runtime condition is faked.
- `satellites-native-instant-focus-red/`: waiting for the actual native lock
  still fails at 12 seconds despite `{ok:true}` Focus. Source inspection confirms
  pinned `core_lookat(0)` resets the lock set by `core_point_and_lock`. This is a
  genuine native/API integration edge, not a readiness delay. The adapter keeps
  the native API and uses a one-microsecond positive duration for embedded
  reduced-motion satellites, avoiding the reset and keeping native reference
  ownership. No C/WASM changes. Focused RED/GREEN and final real native captures
  qualify it. Earlier completed navigation/elevation runs are retained under
  `pre-instant-focus-qualification/`; final artifact-bound reruns supersede them.
- `satellite-native-precision-red.txt`: exact 5° native JSON reports slightly above
  5°, so initial entry gate failed. Tiny degree tolerance covers serialization only.
- `satellite-selection-red.txt`: native TLE selection lacks Hub identity fields;
  the adapter now derives NORAD identity from the existing native source record.
- `satellites-faint-target-attempt/`: an overly early/faint-target point assertion
  fails in baseline and corrected renders. `satellites-discovery-timing-attempt/`:
  even a native-computed bright pass is checked before native discovery. Native
  source inspection establishes 32-object-per-frame discovery. The final driver
  waits a full traversal. No brightness, source positions or propagation is altered.
  `point-render-difference.json` records actual pixels removed by native visibility.
- `satellites-mobile-sheet-attempt/`: native touch selection correctly opens details
  automatically; the driver wrongly requests an absent launcher. Corrected driver
  uses the already-open sheet. Earlier desktop PASS precedes this driver-only fix;
  final source-bound two-width run supersedes that supporting result.
- `snapshots-layer-label-attempt/`, `snapshots-diagnostic-name-attempt/`,
  `snapshots-driver-revision-attempt/`: incorrect new-driver accessible label/API name
  and interrupted revisions. Use existing `Satellites · stations` and
  `orasEarthVisibleTargets`; no product API was added. Initial status text marked an
  interrupted revision although its first process had already failed its selector;
  the raw run log is authoritative.
- `snapshots-held-screenshot-attempt/`, `snapshots-cancel-actionability-attempt/`:
  browser screenshot/pointer-stability waits exceed the real four-second held
  snapshot deadline. Final cancellation uses actual supported Escape input and
  records screenshots after cancellation; the deadline and product behavior stay
  unchanged. `snapshots-auto-hide-attempt/`, `snapshots-auto-hide-retry-attempt/`,
  `snapshots-pointer-actionability-attempt/` retain visibility/focus/pointer attempts
  and failure DOM/screenshots. Final layer controls use visible keyboard activation;
  actual native object selection remains pointer/touch input.
- `snapshots-overlapping-read-attempt/`: an exact-one held-response wait stalls
  while Explore and handoff can both have real snapshot reads in flight. Final
  driver waits for Explore’s actual populated response before holding the handoff,
  still requires exactly one held handoff response, and verifies zero remaining
  responses after cancellation. No product change or relaxed drainage assertion.
- A literal before/after Docker mount-array comparison failed because enumeration
  order differed. Comparison by destination proves all seven bindings identical
  and read-only; raw arrays and `mount-preservation.json` retain that distinction.
- `served-sandbox-network-attempt.txt`: local socket denied by sandbox; reissued
  with approved local-preview access and passed. Desktop navigation startup also
  encountered an automatic approval-review timeout before process creation; the
  tool-authorized single retry succeeded. Neither is a product failure.
- Earlier combined long browser run ended 143; separated runs retain their own
  fresh results. Intermediate unit/build logs describe their own inputs, not the
  final qualification counts or artifact IDs.

The live CelesTrak Earth attempt is recorded independently. Unavailable or loading
status never becomes a live-provider pass through a historical fixture. Historical
Earth uses unchanged mounted ISS TLE lines through the real production provider
parser, satellite.js SGP4 and Cesium renderer with controlled browser Date. No fake
entities or satellite positions are injected. Historical Sky uses the native
mounted catalog, native photometry, observer math and SGP4. Neither qualifies current
orbits or provider/catalog completeness. Existing data is stale for the owner date.

Pinned native 3D painter hooks are weak no-ops and inspected satellites have no
`can_orbit` flag. No proprietary-model or 3D rendering claim is made. Renderer,
observation/calculation, asset and satellite model code remains unchanged.
Software Chromium and emulated touch do not prove physical-device performance.
Owner visual acceptance and final N1 acceptance remain separate gates.
