# Independent exact-head review

HEAD: a92c741f5a4abbc853387683455aa04c2780ec0e
Baseline: 23806bcaff704b13bcf54eaf898e306e4f51e3af
Branch: r3-a-cinematic-solar-1 / existing draft PR83.

## Finding

P2 — Keep the selected globe center clear of the compact landscape summary.
Location: frontend/src/features/solar/solarPresentation.ts:29–34 (especially the width-only portrait rule and fixed 185px floor).
At actual 540×390, Earth focus projects the unchanged source anchor to [270,185]. The collapsed details card covers x14–526 / y178–244. elementFromPoint(270,185) returns the card, not the canvas. The fresh screenshot visibly shows the card across the middle of Earth. The new composition function therefore does not fulfill the selected-anchor-clear-of-card objective on this already-supported compact size. This is an incomplete framing requirement on an existing compact layout; it is not presented as a new scientific or native-navigation regression.
Repro: open preview at 540×390 / reduced motion / 2026-02-28T00:00:00Z; select Earth from the body rail; inspect selected globe. See earth-540x390.png and browser-proof.json.
Suggested correction: treat narrow landscape separately and coordinate the context-card footprint with optical framing, preserving the source target and previously qualified touch controls. Add actual browser coverage checking the selected anchor hits the canvas at this size; camera-only unit bounds do not catch overlay occlusion.

## Independent checks

Default Mode CORE/LIVE + manifest review pack, 47 named documents loaded. Only explicitly requested refinement/evidence/reference additions. No broad documentation scan.
Source inspection: renderer/materials/quality/optical framing/resource lifetime, workspace state/preferences, CSS, asset provenance and verification scripts/tests.
Original approved primary compared with actual desktop overview/Sun and mobile Earth/Mars screenshots. Owner visual acceptance remains pending; dramatic concept solar structures and dense background are still absent and documented.

Fresh command: node output/solar-refinement/review-a92c741f/browser.mjs
Result: 15 functional groups passed across 1440×900, 390×900, 540×390. Efficient budget preserves all anchors/camera/target, +1day preserves quality/body, real WEBGL_lose_context removes canvas and explicit Retry restores one canvas with quality/body/time, direct globe pointer/touch selection succeeds, no idle renders/page exceptions. The extra framing observation fails at 540×390 as above.
Fresh commands: python3 scripts/validation/verify_cinematic_references.py; python3 scripts/validation/verify_solar_assets.py.
Result: 4 reference PNGs + archive exact; original Earth/Mars and new cloud bytes match manifest; original Mars UV-linked atlas retained.
Independent identity check: committed source hashes match navigation257, refinement163 and compact2 source entries; all61 committed refinement evidence-manifest entries match. All3 existing builds match136 files, artifact7776afd6ebed951aa96eda357636fabe85c8825ffa895169eeb18fd88c3938da. Fresh read-only HTTP comparison: all136 served Hub files match. Protected science/contracts/native artifacts/source pins and original NASA Earth/Mars/reference files show no baseline-to-head changes.
NASA original Blue Marble context and media guidelines were checked live: https://science.nasa.gov/earth/earth-observatory/the-blue-marble-2181/ and https://www.nasa.gov/nasa-brand-center/images-and-media/. Existing historical-cloud disclosure and attribution align with those source descriptions; no live-weather claim was found.

No tracked edits, commit, push, merge, deployment, provider changes or unrelated service actions performed by reviewer. GPU timings/physical devices and full suites were not rerun independently; their source-matched reported evidence was inspected, not relabeled as fresh reviewer passes. SwiftShader limitation remains. Recommend scoped framing correction and re-review of the resulting exact HEAD before owner visual review.
