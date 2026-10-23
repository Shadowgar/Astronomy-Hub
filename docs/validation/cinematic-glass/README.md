# Cinematic glass correction — owner visual acceptance pending

Owner2026-10-23 rejects PR90 visual appearance. Existing functional/scientific
qualification is retained; no owner acceptance is inferred. Branch
`cinematic-glass-1`, base `4fa9ffd8a8a216ed9a313e4f4929d2bc336ff7f8`.
No changes to PR88–90. No merge, production deployment, paid provider or R4.

Default Mode: CORE/LIVE, manifest frontend/validation/review/docs pack union listed
in [loaded documents](loaded-documents.txt). Additional inputs are owner-specified
original PNGs, Adaptive Explorer gallery and PR88–90 evidence. No full-doc scan.
Current directive supersedes prior delivery/stop text for G1/G2/V1 only.

[Implementation plan](PLAN.md). Shared source `runtimes/shared/glass.css` defines
standard floating/raised/dialog materials, reduced transparency, unsupported-filter
fallback and forced colors. Hub mappings resolve legacy fills. Native Sky imports
the exact same source inside its document; scene/math stay native. Explicit reduced
transparency is persisted independently in `oras.glass.opaque.v1` and native frames
observe its storage event. Night Mode remains red and intentionally opaque.

Important discovered defect: optimizer retained only a prefixed filter from the
first Hub declaration order. Chromium kept the legacy22px blur. Corrected order
keeps the standard property; actual computed `blur(16px) saturate(1.45)` is asserted.
This is a built-browser finding, not a token-name or property-presence claim.

[Earth scene assessment](EARTH_SCENE.md): existing Cesium Sun/atmosphere are already
source-correct; no supported missing switch justified a renderer change. Static
source resolution, cloud/nightlight/terrain absence remain. No new Earth rendering
improvement is claimed. Sky existing native brightness, Milky Way and DSS controls
remain available; no invented astronomical layout or extra catalog is introduced.

## Working candidate and qualification

Windows preview: [Solar](http://172.26.23.204:4221/solar-system),
[Earth](http://172.26.23.204:4221/earth),
[Sky](http://172.26.23.204:4221/sky-engine?date=2026-08-13T04:00:00Z).
[Original/reference/before/after gallery](http://172.26.23.204:4221/evidence/cinematic-glass/gallery/index.html).
Development loopback uses127.0.0.1:4221. This private WSL preview uses readonly
Docker application/data mounts and existing qualified Earth/backend. Baseline4220
and PR88–90 remain unchanged. This is not a production deployment.

[Exact commands](COMMANDS.md), [material/scene fidelity gaps](FIDELITY.md),
[source/protection/build identities](evidence/delivery.json),
[browser captures](evidence/browser.json), [accessibility](evidence/accessibility.json),
[actual compositing](evidence/raster-evidence.json),
[desktop/mobile cross-mode](evidence/integration.json), [recovery](evidence/recovery.json),
[all changed paths](FILES_CHANGED.txt). Technical review remains separate from
owner visual acceptance. Exact-head result is recorded in the draft PR/handoff.

337 frontend tests/52files, TypeScript and252 native/Earth tests passed. Native UI
repeat110files and protected4native/vendor files verified; Hub repeat136files.
Actual source/served identity verifies111Sky,136Hub,514Earth files. Original
references, assets, source pins, Solar scene/math/controllers, native panorama and
satellite/navigation inputs remain preserved. No backend/science source change.
No database/volume byte snapshot or zero-background-write claim is made. Owner
checkout's pre-existing settings change is untouched.

Actual browser coverage comprises18 baseline/candidate viewport-mode states at
1440×900,390×900,667×390 with native selection, collapsed/expanded panels, controls
and transparency variants. The failed records are preserved. Completed captures
were reused across narrow Night/portrait/chooser fixes where their active CSS
conditions remained unchanged; they are not relabeled fresh final-head captures.
The affected cases and new fallback states were rerun after correction. Working
preview/source/served identity is verified independently against the final source.

Five additional accessibility groups cover keyboard focus, persistence, OS media,
Night/forced-color fallback and44px hit targets. Ten new desktop/mobile integration
groups preserve camera/time/observer/history and real mouse/emulated touch. Four
new recovery groups exercise observing toggles, genuine wheel handoff and actual
Solar WebGL loss/retry/disposal. These do not repeat stalled full N1 suites.

Compositing diagnostics show actual pixel changes with the material filter disabled
and with opaque fill, over a real rendered bright Earth globe. These variants are
explicitly labeled diagnostic CSS changes, not owner-facing default screenshots.
Read-only stdlib PNG analysis adds no dependency and does not alter any image.
This is evidence of raster composition, not a visual similarity score.

## Performance scope and stop gate

Browser GPU reports SwiftShader; touch is emulated. Short24-tick **Hub RAF** samples
have median~16.7ms for Solar/Earth and33–67ms for Sky; these are not Earth native
FPS or camera latency. Fresh integration retains native Sky reported FPS, GPU and
heap. E1 measured slow native Earth input/two-RAF acquisition remains historical,
not a new improvement claim. Bounded16px material regions replace22px legacy
filters; no perpetual decorative render loop or full-screen shader is introduced.
No physical GPU/compositor-cost benchmark or all-scenes contrast certification.
Native/software renderer costs and owner hardware acceptance remain limitations.

The owner will judge actual luminance, translucency, depth and cinematic fidelity.
No merge, deployment, paid source/account or R4. Next task: owner visual acceptance
of this working three-mode candidate, then any specifically identified refinement.

