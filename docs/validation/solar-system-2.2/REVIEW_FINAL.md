# Independent final Solar 2.2 review

**No new actionable finding in the scoped pinned diff.** This is a source and
evidence review, not release approval or owner visual acceptance.

- Branch: `recovery/reconcile-20261026`.
- Base: `66fff05108ca7ed7ee0ee1d5137b4b2619c28373`.
- Reviewed head: `39f73b2ff0162d491fcf65b41a0bc038dd608b65`, including preview
  recovery commit `92dc5702`.
- Authority: root/frontend `AGENTS.md`, `CORE_CONTEXT.md`, `LIVE_SESSION_BRIEF.md`,
  the declared `solar_reconstruction` manifest pack, the explicit owner 2.2
  attachment, and `docs/validation/solar-system-2.2/PLAN.md`. No broad document
  scan was used. The owner request supersedes the historical no-2.2 gate.
- Method: requesting-code-review workflow; read-only inspection of the pinned
  application diff, installed Three implementation, focused tests and existing
  receipts. This reviewer did not author the rendering changes. The reviewer did
  author the recovery helper and collision regression; this document does not
  independently approve those. The coordinator reports a separate helper review.

## Findings disposition and final changes

Earlier ranked findings, reproductions and corrections are recorded in
`REVIEW.md`. Their fixes remain present in the reviewed head:

- **P1 camera collision, corrected:** `solarPresentation.ts:31` and `:38` retain
  distance-dependent duration and radial departure, distant transfer, radial
  arrival. The actual controller's swept collision guard remains active. The
  source-backed 72-pair regression covers the eight planet-to-Sun failures and
  inherited Mars↔Jupiter failures; it checks physical clearance, precise endpoints
  and immutable source inputs. It does not establish moving-time visual quality.
- **P2 Eros material integration, corrected:** `SolarScene.ts:235` excludes Eros
  from the shader detail streamer before the pending-position return. Eros keeps
  its existing model/material path. At `:62–63`, source-UV detail installation
  waits for the matching overview geometry, and overview completion installs any
  already-loaded detail. The asynchronous order no longer exposes source-UV detail
  on temporary sphere geometry.
- **P2 transparent composition, corrected in source:**
  `solarRenderPipeline.ts:39–43` gives every quality a linear target followed by
  one OutputPass and then FXAA. The float-target path supports the reviewed ring
  radiance/coverage calculation before output conversion. The RGBA8 fallback's
  clipping limitation is explicit at `:68`; it is not equivalent HDR rendering.
  Efficient now incurs target allocation and two fullscreen passes; its actual
  cost must come from the refreshed GPU measurements.
- **P3 overstated test claim, corrected:** the bloom test describes its checked
  threshold/strength/radius policy, rather than asserting that every ordinary
  surface stays below the threshold.

The final corona reduction in `solarMaterials.ts:77–79` changes bounded amplitudes
and falloff only; it adds no sampling loop, simulation clock or source mutation.
Final pixels still require the matching rebuilt artifact. The expanded overview
search at `solarPresentation.ts:81–95` evaluates camera directions and composition
scores without moving source anchors. It runs on framing requests, not each frame.

The streamer's retiring-generation barrier (`solarTextureStreaming.ts:42`, `:59`,
`:81`) prevents replacement allocation while cancelled uncancellable decode work
still owns its reservation. The asset owner's delayed reservation release agrees
with that barrier. Disposal and generation checks preserve the selected-map owner.

The production emitter (`frontend/vite.config.mjs:185–194`) adds only the explicit
`solar-assets/v2.2` directory, rejects symlinks and retains the 64 MiB per-pack cap.
The checked pack has 25 files, 25,892,787 bytes and no symlinks. This source review
does not substitute for checking the resulting production artifact and served URLs.

The pinned diff has no changes under backend, native runtime/vendor/package trees,
or the Solar Takram/depth, Earth-frame, motion, clock and precision modules. Scene
integration retains their existing ownership; no JPL vectors or physical radii
were changed to obtain a composition or camera result.

## Evidence and limits

Directly executed earlier scoped results are in `REVIEW.md`: 72/72 source journeys,
73 collision tests, 19 camera/resource tests, 23 lighting/frame tests, typecheck and
whitespace checks passed. These are supporting tests, not GPU evidence. This final
pass did not rerun suites or start a browser while the coordinator measured GPU
performance. The coordinator separately reported 599 frontend and seven Docker
checks passing; this review did not independently rerun that bundle.

Read-only final checks used `git rev-parse HEAD`, `git status --short`,
`git diff 66fff05108ca7ed7ee0ee1d5137b4b2619c28373 39f73b2ff0162d491fcf65b41a0bc038dd608b65`,
scoped `git diff --name-only`, `rg`/line-numbered source reads, and asset inventory.
HEAD matched the pinned candidate. Later coordinator documentation and browser
harness work in the working tree was outside this pinned application review.

The existing `output/playwright/solar-system-2.2/journeys/proof.json` reports three
Windows runs (desktop, portrait, landscape), nine checks each, PASS with empty
error/network-failure arrays. It includes forward/reverse time, Eros, Saturn-moon
return, resize and context recovery. This reviewer read that receipt and inspected
the desktop overview and backlit Saturn images; the reviewer did not rerun the
browser or watch every recording. Those images must not qualify a later corona
build without the coordinator's artifact-identity evidence.

Remaining gates: final Docker artifact and served-pack identity, matched final
Windows GPU images/recordings, measured quality/fallback cost, hosted CI, and owner
visual acceptance. Physical iPhone remains unqualified. Keep PR107 draft and
unmerged. Recommended next task is completing and reconciling those runtime
receipts against the exact candidate before the owner review.

This review adds only this document; no application edit, commit or push was made.

## Final supplied-image inspection

Independently inspected all 14 requested final captures: the three `after-*-overview`
images; `after-jupiter`, `close-jupiter`, `after-saturn`, `saturn-oblique`,
`saturn-backlit`, `after-mars`, `earth-detailed`, `earth-near-horizon`, `close-sun`,
`390x844-earth` and `844x390-saturn`. Compared seven corresponding before images
and both original references. No obvious new UV wrap seam, geometric clipping,
transparency ordering failure or gross gradient banding was visible at these image
scales. Mars shows the clearest gain: its old rectangular texture discontinuities
are absent and terrain features are readable. Saturn's ring zones are more legible;
the desktop overview puts the Sun clear of the lower controls with a restrained
halo. Jupiter retains detail, but its matched before/after difference is subtle.
Earth's close-view source-composite/cloud boundaries also occur in the before
imagery; the near-horizon capture retains a continuous atmospheric gradient.

Limits remain visible: portrait inner planets cluster tightly; Saturn's source
texture is soft, its shadow hard-edged, and backlit bands nearly white; the Sun
remains an illustrative granular white disk. The mobile selected bodies stay clear
of panels, while the short landscape detail card requires scrolling. These images
are substantially sparser than the original references and do not prove reference
parity. The supplied final corona is visibly contained, superseding the earlier
image limitation above, but screenshot inspection cannot establish HDR clipping,
temporal stability or performance. No browser, GPU measurement or test was run for
this visual review; artifact attribution and performance measurements remain the
coordinator's evidence. This assessment is not owner acceptance.

## Independent final private-gallery browser check

Windows Edge 156.0.4314.50 reported the NVIDIA RTX 3060 Laptop GPU through
ANGLE/D3D11 on the actual Solar canvas. At desktop 1440×900 and portrait 390×844,
the private 2.2 gallery loaded all 40 images and all three videos; each video
completed two real decoded seeks. The first screenshot exposed a minor horizontal
overflow at the unbroken source SHA: the test initially compared against configured
viewport width rather than the content width after the Windows scrollbar. That
result was explicitly marked failed and retained. The coordinator added SHA word
wrapping; the corrected recheck passed with scrollWidth/clientWidth exactly
1425/1425 and 375/375. No page errors, console errors or HTTP error responses occurred.

All five original routes separately passed on the current application: Solar
overview, Earth selection, Saturn selection, Apollo 17 with visible terrain and
the preserved 2.1.1 gallery with 22/22 images. The served application entry was
`assets/index-agNIZtaD.js`, SHA-256
`361400c4e7ee6fd4e98507e24b498093db04882fad6ef19a0d881132f793acde`.
Sixteen screenshots of the browser's native video player cover 4–24 seconds,
including 8/12/18/24 seconds and the recorded return timestamp 19.136 seconds.
The recording clock has an offset from page performance.now; the matching saved
`desktop-return.png` confirms the completed overview separately. Ordered frame
inspection found no obvious surface penetration or camera inversion. Bodies remain
point-sized during much of transfer and grow rapidly near arrival; these sparse
samples do not certify smoothness or negate the separately measured cold-travel hitch.

Commands: Windows Node ran `scripts/validation/verify_solar22_gallery.mjs` once
in full, then with `http://localhost:4231 --gallery-only` after the correction;
both browser processes closed. Evidence is in `output/solar2.2/gallery/`: final
`receipt.json`, explicitly failed `receipt-before-gallery-wrap-fix.json` containing
the successful route/video checks, the retained before screenshot, and final
gallery/video frames. Browser/GPU ownership was released. No application/runtime
edit, commit or push was made by this reviewer.

Independent receipt review also verified the benchmark hashes, all nine paired
table rows, six mobile cases, sample counts and memory/startup limits against the
compressed receipt. A P3 reporting overstatement was corrected: the harness
records console errors and HTTP error responses, not an independent inventory of
every failed transport request. No blocking discrepancy was found.
